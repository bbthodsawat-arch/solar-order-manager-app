import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { RecurringTransaction, Transaction } from '../types';
import { useAuth } from './useAuth';
import { 
  parseISO, getDate, getMonth, getYear, getDaysInMonth, 
  getDay, isToday, startOfDay, endOfDay, startOfWeek, endOfWeek, 
  addDays, isAfter, isBefore, format 
} from 'date-fns';

export interface OccurrenceItem {
  id?: string;
  templateId: string;
  title: string;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  amount: number;
  date: Date;
  dateStr: string;
  interval: 'daily' | 'weekly' | 'monthly';
  detail?: string;
}

export function useRecurringTransactions() {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setRecurringTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'recurring_transactions')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          interval: data.interval || 'monthly',
          dayOfMonth: data.dayOfMonth ?? 1,
          dayOfWeek: data.dayOfWeek ?? 1, // 0 = Sun, 1 = Mon ...
          isActive: data.isActive !== false,
          ...data
        } as RecurringTransaction;
      });

      // Sort items: active first, then by title
      items.sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return (a.title || '').localeCompare(b.title || '');
      });
      
      setRecurringTransactions(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching recurring transactions:", error);
      handleFirestoreError(error, OperationType.LIST, 'recurring_transactions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addRecurring = async (item: Omit<RecurringTransaction, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'recurring_transactions'), {
        ...item,
        interval: item.interval || 'monthly',
        dayOfMonth: Number(item.dayOfMonth || 1),
        dayOfWeek: Number(item.dayOfWeek ?? 1),
        isActive: item.isActive !== false,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        updatedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding recurring transaction:", error);
      throw error;
    }
  };

  const updateRecurring = async (id: string, updates: Partial<RecurringTransaction>) => {
    try {
      await updateDoc(doc(db, 'recurring_transactions', id), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating recurring transaction:", error);
      throw error;
    }
  };

  const deleteRecurring = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'recurring_transactions', id));
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
      throw error;
    }
  };

  /**
   * Calculate next due date for a recurring template
   */
  const getNextDueDate = (item: RecurringTransaction, fromDate: Date = new Date()): Date => {
    const today = startOfDay(fromDate);
    const interval = item.interval || 'monthly';

    if (interval === 'daily') {
      return today;
    }

    if (interval === 'weekly') {
      const targetDay = item.dayOfWeek ?? 1; // 0=Sun, 1=Mon, ..., 6=Sat
      const currentDay = getDay(today);
      let diff = targetDay - currentDay;
      if (diff < 0) {
        diff += 7;
      }
      return addDays(today, diff);
    }

    // Monthly
    const targetDayOfMonth = item.dayOfMonth || 1;
    const currentDayOfMonth = getDate(today);
    const currentMonthDays = getDaysInMonth(today);
    const validTargetDay = Math.min(targetDayOfMonth, currentMonthDays);

    if (currentDayOfMonth <= validTargetDay) {
      const target = new Date(today);
      target.setDate(validTargetDay);
      return startOfDay(target);
    } else {
      // Next month
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const nextMonthDays = getDaysInMonth(nextMonth);
      const nextTargetDay = Math.min(targetDayOfMonth, nextMonthDays);
      nextMonth.setDate(nextTargetDay);
      return startOfDay(nextMonth);
    }
  };

  /**
   * Calculate all scheduled occurrences of active recurring transactions over next N days
   */
  const getUpcomingOccurrences = (daysAhead: number = 30, fromDate: Date = new Date()): OccurrenceItem[] => {
    const today = startOfDay(fromDate);
    const endDate = addDays(today, daysAhead);
    const occurrences: OccurrenceItem[] = [];

    const activeItems = recurringTransactions.filter(item => item.isActive);

    for (let d = 0; d < daysAhead; d++) {
      const checkDate = addDays(today, d);
      const dayNum = getDate(checkDate);
      const dayOfWeekNum = getDay(checkDate); // 0-6

      activeItems.forEach(item => {
        const interval = item.interval || 'monthly';
        let isMatch = false;

        if (interval === 'daily') {
          isMatch = true;
        } else if (interval === 'weekly') {
          isMatch = (item.dayOfWeek ?? 1) === dayOfWeekNum;
        } else if (interval === 'monthly') {
          const maxDays = getDaysInMonth(checkDate);
          const targetDay = Math.min(item.dayOfMonth || 1, maxDays);
          isMatch = targetDay === dayNum;
        }

        // Check date bounds if item has startDate or endDate
        if (isMatch && item.startDate) {
          const start = startOfDay(parseISO(item.startDate));
          if (isBefore(checkDate, start)) isMatch = false;
        }
        if (isMatch && item.endDate) {
          const end = startOfDay(parseISO(item.endDate));
          if (isAfter(checkDate, end)) isMatch = false;
        }

        if (isMatch) {
          occurrences.push({
            templateId: item.id || '',
            title: item.title,
            type: item.type,
            category: item.category,
            subcategory: item.subcategory,
            amount: Number(item.amount) || 0,
            date: checkDate,
            dateStr: format(checkDate, 'yyyy-MM-dd'),
            interval,
            detail: item.detail
          });
        }
      });
    }

    return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  /**
   * Helper function to find which active recurring items are DUE and have NOT been added yet
   */
  const getDueRecurringItems = (transactions: Transaction[], dismissedIds: string[] = []) => {
    const now = new Date();
    const today = startOfDay(now);
    const currentYear = getYear(now);
    const currentMonth = getMonth(now);
    const todayDayOfMonth = getDate(now);
    const todayDayOfWeek = getDay(now);

    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    return recurringTransactions.filter(item => {
      if (!item.isActive || !item.id) return false;
      if (dismissedIds.includes(item.id)) return false;

      const interval = item.interval || 'monthly';

      if (interval === 'daily') {
        // Check if a transaction for this template exists TODAY
        const recordedToday = transactions.some(tx => {
          if (!tx.date) return false;
          const txDate = parseISO(tx.date);
          if (!isToday(txDate)) return false;
          if (tx.recurringId === item.id) return true;
          return tx.category === item.category && tx.type === item.type && (tx.detail?.includes(item.title) || item.title?.includes(tx.detail));
        });
        return !recordedToday;
      }

      if (interval === 'weekly') {
        const targetDayOfWeek = item.dayOfWeek ?? 1;
        // Suggest if today is on or within 2 days after target day
        const dayDiff = (todayDayOfWeek - targetDayOfWeek + 7) % 7;
        const isDueWindow = dayDiff <= 2; // due on the day or 1-2 days following

        if (!isDueWindow) return false;

        // Check if already added during THIS WEEK
        const recordedThisWeek = transactions.some(tx => {
          if (!tx.date) return false;
          const txDate = parseISO(tx.date);
          const isThisWeek = txDate >= weekStart && txDate <= weekEnd;
          if (!isThisWeek) return false;
          if (tx.recurringId === item.id) return true;
          return tx.category === item.category && tx.type === item.type && (tx.detail?.includes(item.title) || item.title?.includes(tx.detail));
        });

        return !recordedThisWeek;
      }

      // Monthly
      const maxDays = getDaysInMonth(now);
      const targetDay = Math.min(item.dayOfMonth || 1, maxDays);
      const isDueWindow = todayDayOfMonth >= targetDay - 3; // within 3 days prior or anytime during/after

      if (!isDueWindow) return false;

      // Check if a transaction exists for this recurring rule in THIS MONTH
      const recordedThisMonth = transactions.some(tx => {
        if (!tx.date) return false;
        const txDate = parseISO(tx.date);
        const isSameMonth = getYear(txDate) === currentYear && getMonth(txDate) === currentMonth;
        if (!isSameMonth) return false;

        if (tx.recurringId && tx.recurringId === item.id) return true;
        const isSameCategory = tx.category === item.category;
        const isSameType = tx.type === item.type;
        const matchesDetail = item.title && (tx.detail?.includes(item.title) || item.title?.includes(tx.detail));
        return isSameCategory && isSameType && matchesDetail;
      });

      return !recordedThisMonth;
    });
  };

  return {
    recurringTransactions,
    loading,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    getNextDueDate,
    getUpcomingOccurrences,
    getDueRecurringItems
  };
}

