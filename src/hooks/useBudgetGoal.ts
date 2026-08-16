import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BudgetAlertStatus, SmartBudgetAlertConfig } from '../types';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const STORAGE_BUDGET_KEY = 'monthly_budget_goal';
const STORAGE_WARNING_KEY = 'budget_warning_threshold';
const STORAGE_CRITICAL_KEY = 'budget_critical_threshold';
const STORAGE_NOTIF_KEY = 'budget_alert_notifications';

const DEFAULT_BUDGET = 50000;
const DEFAULT_WARNING = 80;
const DEFAULT_CRITICAL = 100;
const DEFAULT_NOTIFICATIONS = true;

export function useBudgetGoal() {
  const [budgetGoal, setBudgetGoal] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_BUDGET_KEY);
    return saved ? Number(saved) : DEFAULT_BUDGET;
  });

  const [warningThreshold, setWarningThreshold] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_WARNING_KEY);
    return saved ? Number(saved) : DEFAULT_WARNING;
  });

  const [criticalThreshold, setCriticalThreshold] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_CRITICAL_KEY);
    return saved ? Number(saved) : DEFAULT_CRITICAL;
  });

  const [enableNotifications, setEnableNotifications] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_NOTIF_KEY);
    return saved !== null ? saved === 'true' : DEFAULT_NOTIFICATIONS;
  });

  const { user } = useAuth();
  const lastNotifiedStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchBudgetSettings = async () => {
      try {
        // First check app config
        const configRef = doc(db, 'config', 'app');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          const data = configSnap.data();
          if (data.monthlyBudgetGoal !== undefined) {
            const b = Number(data.monthlyBudgetGoal);
            if (!isNaN(b) && b > 0) {
              setBudgetGoal(b);
              localStorage.setItem(STORAGE_BUDGET_KEY, b.toString());
            }
          }
          if (data.budgetWarningThreshold !== undefined) {
            const w = Number(data.budgetWarningThreshold);
            if (!isNaN(w) && w > 0) {
              setWarningThreshold(w);
              localStorage.setItem(STORAGE_WARNING_KEY, w.toString());
            }
          }
          if (data.budgetCriticalThreshold !== undefined) {
            const c = Number(data.budgetCriticalThreshold);
            if (!isNaN(c) && c > 0) {
              setCriticalThreshold(c);
              localStorage.setItem(STORAGE_CRITICAL_KEY, c.toString());
            }
          }
          if (data.budgetAlertNotifications !== undefined) {
            const n = Boolean(data.budgetAlertNotifications);
            setEnableNotifications(n);
            localStorage.setItem(STORAGE_NOTIF_KEY, n.toString());
          }
          return;
        }

        // Fallback check user doc
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.monthlyBudgetGoal) {
              setBudgetGoal(Number(data.monthlyBudgetGoal));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching smart budget settings from Firestore:', err);
      }
    };

    fetchBudgetSettings();
  }, [user]);

  const updateBudget = async (newGoal: number) => {
    if (isNaN(newGoal) || newGoal <= 0) return;
    setBudgetGoal(newGoal);
    localStorage.setItem(STORAGE_BUDGET_KEY, newGoal.toString());

    try {
      const configRef = doc(db, 'config', 'app');
      await setDoc(configRef, { monthlyBudgetGoal: newGoal }, { merge: true });

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { monthlyBudgetGoal: newGoal }).catch(() => {});
      }
    } catch (err) {
      console.error('Error saving budget goal to Firestore:', err);
    }
  };

  const updateThresholds = async (
    newWarning: number,
    newCritical: number,
    newEnableNotifs: boolean = true
  ) => {
    setWarningThreshold(newWarning);
    setCriticalThreshold(newCritical);
    setEnableNotifications(newEnableNotifs);

    localStorage.setItem(STORAGE_WARNING_KEY, newWarning.toString());
    localStorage.setItem(STORAGE_CRITICAL_KEY, newCritical.toString());
    localStorage.setItem(STORAGE_NOTIF_KEY, newEnableNotifs.toString());

    try {
      const configRef = doc(db, 'config', 'app');
      await setDoc(
        configRef,
        {
          budgetWarningThreshold: newWarning,
          budgetCriticalThreshold: newCritical,
          budgetAlertNotifications: newEnableNotifs
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error saving budget thresholds to Firestore:', err);
    }
  };

  // Evaluate budget status
  const evaluateBudgetStatus = useCallback(
    (monthExpense: number): {
      status: BudgetAlertStatus;
      percentage: number;
      remaining: number;
      overBy: number;
      isWarning: boolean;
      isCritical: boolean;
      isNormal: boolean;
    } => {
      const percentage = budgetGoal > 0 ? (monthExpense / budgetGoal) * 100 : 0;
      const roundedPercent = Math.round(percentage);
      const remaining = Math.max(0, budgetGoal - monthExpense);
      const overBy = Math.max(0, monthExpense - budgetGoal);

      let status: BudgetAlertStatus = 'normal';
      if (percentage >= criticalThreshold) {
        status = 'critical';
      } else if (percentage >= warningThreshold) {
        status = 'warning';
      }

      return {
        status,
        percentage: roundedPercent,
        remaining,
        overBy,
        isWarning: status === 'warning',
        isCritical: status === 'critical',
        isNormal: status === 'normal'
      };
    },
    [budgetGoal, warningThreshold, criticalThreshold]
  );

  // Send in-app notification if status enters warning or critical (with session deduplication)
  const checkAndNotifyBudgetAlert = useCallback(
    (monthExpense: number) => {
      if (!enableNotifications || budgetGoal <= 0) return;

      const { status, percentage, overBy, remaining } = evaluateBudgetStatus(monthExpense);
      if (status === 'normal') return;

      const currentMonthKey = format(new Date(), 'yyyy-MM');
      const sessionKey = `budget_alert_${currentMonthKey}_${status}`;
      const alreadyNotifiedInSession = sessionStorage.getItem(sessionKey);

      if (alreadyNotifiedInSession || lastNotifiedStatusRef.current === status) {
        return;
      }

      lastNotifiedStatusRef.current = status;
      sessionStorage.setItem(sessionKey, 'true');

      if (status === 'critical') {
        toast.error(`🚨 [Critical Budget Alert] รายจ่ายเดือนนี้เกินงบประมาณแล้ว! ใช้ไป ${percentage}% (เกินงบ ฿${overBy.toLocaleString()})`, {
          duration: 7000,
          style: {
            borderRadius: '16px',
            fontWeight: 700,
            fontSize: '13px'
          }
        });
      } else if (status === 'warning') {
        toast(`⚠️ [Warning Budget Alert] รายจ่ายเดือนนี้เข้าใกล้ขีดจำกัดงบประมาณแล้ว ใช้ไป ${percentage}% (เหลือ ฿${remaining.toLocaleString()})`, {
          icon: '⚠️',
          duration: 6000,
          style: {
            borderRadius: '16px',
            fontWeight: 700,
            fontSize: '13px'
          }
        });
      }
    },
    [enableNotifications, budgetGoal, evaluateBudgetStatus]
  );

  return {
    budgetGoal,
    warningThreshold,
    criticalThreshold,
    enableNotifications,
    updateBudget,
    updateThresholds,
    evaluateBudgetStatus,
    checkAndNotifyBudgetAlert
  };
}
