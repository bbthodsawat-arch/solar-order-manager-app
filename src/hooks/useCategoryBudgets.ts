import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

const STORAGE_KEY = 'category_monthly_budgets_config';

export const DEFAULT_CATEGORY_BUDGETS: Record<string, number> = {
  'สั่งซื้ออุปกรณ์ประกอบชุด': 80000,
  'ค่าโฆษณา': 20000,
  'ค่าอาหาร': 12000,
  'ค่าเครื่องดื่ม เหล้า/เบียร์': 5000,
  'ค่าเดินทาง': 15000,
  'ค่าคอมมิชชั่น': 25000,
  'ค่าจ้างช่างรายวัน': 35000,
  'แม่บ้านรายวัน': 8000,
  'ค่าจ้างแอดมิน': 18000,
  'ค่าใช้จ่ายอื่นๆ': 15000,
};

export function useCategoryBudgets() {
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_CATEGORY_BUDGETS, ...parsed };
        }
      }
    } catch (e) {
      console.error('Error loading local category budgets:', e);
    }
    return DEFAULT_CATEGORY_BUDGETS;
  });

  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load from Firestore
  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const docRef = doc(db, 'config', 'category_budgets');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.budgets && typeof data.budgets === 'object') {
            const merged = { ...DEFAULT_CATEGORY_BUDGETS, ...data.budgets };
            setCategoryBudgets(merged);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          }
        }
      } catch (err) {
        console.error('Error fetching category budgets from Firestore:', err);
        handleFirestoreError(err, OperationType.GET, 'config/category_budgets');
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, [user]);

  // Update a single category limit
  const updateCategoryBudget = useCallback(async (categoryName: string, limit: number) => {
    const safeLimit = Math.max(0, isNaN(limit) ? 0 : limit);
    
    setCategoryBudgets(prev => {
      const updated = { ...prev, [categoryName]: safeLimit };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    try {
      const docRef = doc(db, 'config', 'category_budgets');
      await setDoc(docRef, {
        budgets: {
          ...categoryBudgets,
          [categoryName]: safeLimit
        },
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'system'
      }, { merge: true });
    } catch (err) {
      console.error('Failed to sync category budget to Firestore:', err);
    }
  }, [categoryBudgets, user]);

  // Bulk update
  const updateAllCategoryBudgets = useCallback(async (newBudgets: Record<string, number>) => {
    const cleaned: Record<string, number> = {};
    Object.entries(newBudgets).forEach(([cat, val]) => {
      cleaned[cat] = Math.max(0, isNaN(val) ? 0 : val);
    });

    setCategoryBudgets(cleaned);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));

    try {
      const docRef = doc(db, 'config', 'category_budgets');
      await setDoc(docRef, {
        budgets: cleaned,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'system'
      }, { merge: true });
      toast.success('บันทึกงบประมาณรายหมวดหมู่เรียบร้อยแล้ว');
    } catch (err) {
      console.error('Failed to bulk sync category budgets:', err);
      toast.error('เกิดข้อผิดพลาดในการบันทึกลงฐานข้อมูล');
    }
  }, [user]);

  // Reset to default
  const resetCategoryBudgets = useCallback(async () => {
    setCategoryBudgets(DEFAULT_CATEGORY_BUDGETS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORY_BUDGETS));

    try {
      const docRef = doc(db, 'config', 'category_budgets');
      await setDoc(docRef, {
        budgets: DEFAULT_CATEGORY_BUDGETS,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast.success('รีเซ็ตงบประมาณเป็นค่าเริ่มต้นแล้ว');
    } catch (err) {
      console.error('Error resetting category budgets:', err);
    }
  }, []);

  return {
    categoryBudgets,
    loading,
    updateCategoryBudget,
    updateAllCategoryBudgets,
    resetCategoryBudgets
  };
}
