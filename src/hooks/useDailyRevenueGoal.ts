import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

const STORAGE_KEY = 'daily_revenue_goal';
const DEFAULT_GOAL = 50000;

export function useDailyRevenueGoal() {
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : DEFAULT_GOAL;
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        // First check app config
        const configRef = doc(db, 'config', 'app');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists() && configSnap.data().dailyRevenueGoal !== undefined) {
          const cloudGoal = Number(configSnap.data().dailyRevenueGoal);
          if (!isNaN(cloudGoal) && cloudGoal > 0) {
            setDailyGoal(cloudGoal);
            localStorage.setItem(STORAGE_KEY, cloudGoal.toString());
            return;
          }
        }

        // Fallback to user doc if any
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().dailyRevenueGoal) {
            const userGoal = Number(userSnap.data().dailyRevenueGoal);
            setDailyGoal(userGoal);
            localStorage.setItem(STORAGE_KEY, userGoal.toString());
          }
        }
      } catch (err) {
        console.error('Error fetching daily revenue goal from Firestore:', err);
        handleFirestoreError(err, OperationType.GET, 'config/app');
      }
    };

    fetchGoal();
  }, [user]);

  const updateDailyGoal = async (newGoal: number) => {
    if (isNaN(newGoal) || newGoal <= 0) return;

    setDailyGoal(newGoal);
    localStorage.setItem(STORAGE_KEY, newGoal.toString());

    try {
      // Save to config/app
      const configRef = doc(db, 'config', 'app');
      await setDoc(configRef, { dailyRevenueGoal: newGoal }, { merge: true });

      // Also save to user doc if logged in
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          dailyRevenueGoal: newGoal
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Error saving daily revenue goal to Firestore:', err);
    }
  };

  return { dailyGoal, updateDailyGoal };
}
