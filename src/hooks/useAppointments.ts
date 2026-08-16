import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InstallationAppointment } from '../types';
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

export function useAppointments() {
  const [appointments, setAppointments] = useState<InstallationAppointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'appointments'),
      orderBy('appointmentDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as InstallationAppointment[];

      setAppointments(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching appointments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addAppointment = async (data: Omit<InstallationAppointment, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const now = new Date().toISOString();
      const cleanedData = removeUndefinedFields({
        ...data,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid
      });

      const docRef = await addDoc(collection(db, 'appointments'), cleanedData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding appointment:', error);
      throw error;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<InstallationAppointment>): Promise<void> => {
    try {
      const now = new Date().toISOString();
      const cleanedUpdates = prepareUpdateData({
        ...updates,
        updatedAt: now
      });

      await updateDoc(doc(db, 'appointments', id), cleanedUpdates);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'appointments', id));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  };

  return {
    appointments,
    loading,
    addAppointment,
    updateAppointment,
    deleteAppointment
  };
}
