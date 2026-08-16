import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WarrantyCard } from '../types';
import { useAuth } from './useAuth';

function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => removeUndefinedFields(item)) as unknown as T;

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = typeof value === 'object' && value !== null ? removeUndefinedFields(value) : value;
    }
  }
  return cleaned as T;
}

function prepareUpdateData(updates: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      cleaned[key] = deleteField();
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = removeUndefinedFields(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export function useWarranties() {
  const [warranties, setWarranties] = useState<WarrantyCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setWarranties([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'warranties'),
      orderBy('installationDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as WarrantyCard[];

      setWarranties(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching warranties:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addWarranty = async (data: Omit<WarrantyCard, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const now = new Date().toISOString();
      const cleanedData = removeUndefinedFields({
        ...data,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid
      });

      const docRef = await addDoc(collection(db, 'warranties'), cleanedData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding warranty:', error);
      throw error;
    }
  };

  const updateWarranty = async (id: string, updates: Partial<WarrantyCard>): Promise<void> => {
    try {
      const now = new Date().toISOString();
      const cleanedUpdates = prepareUpdateData({
        ...updates,
        updatedAt: now
      });

      await updateDoc(doc(db, 'warranties', id), cleanedUpdates);
    } catch (error) {
      console.error('Error updating warranty:', error);
      throw error;
    }
  };

  const deleteWarranty = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'warranties', id));
    } catch (error) {
      console.error('Error deleting warranty:', error);
      throw error;
    }
  };

  return {
    warranties,
    loading,
    addWarranty,
    updateWarranty,
    deleteWarranty
  };
}
