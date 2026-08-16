import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc, deleteField, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer } from '../types';
import { useAuth } from './useAuth';

// Removes undefined values recursively from objects for Firestore
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

// Prepares update data for Firestore by mapping undefined properties to deleteField()
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

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'customers'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Customer[];

      setCustomers(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching customers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const now = new Date().toISOString();
      const cleanedData = removeUndefinedFields({
        ...customer,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid
      });

      const docRef = await addDoc(collection(db, 'customers'), cleanedData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<void> => {
    try {
      const now = new Date().toISOString();
      const cleanedUpdates = prepareUpdateData({
        ...updates,
        updatedAt: now
      });

      await updateDoc(doc(db, 'customers', id), cleanedUpdates);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  /**
   * Helper to find or create customer to prevent duplicates during order creation
   */
  const findOrCreateCustomer = async (customerData: Partial<Customer>): Promise<string> => {
    if (!customerData.name || !customerData.name.trim()) return '';

    const nameToMatch = customerData.name.trim().toLowerCase();
    const phoneToMatch = customerData.phoneNumber?.trim();
    const taxIdToMatch = customerData.customerTaxId?.trim();

    // Check existing match
    const existing = customers.find(c => {
      if (taxIdToMatch && c.customerTaxId?.trim() === taxIdToMatch) return true;
      if (phoneToMatch && c.phoneNumber?.trim() === phoneToMatch) return true;
      if (c.name.trim().toLowerCase() === nameToMatch) return true;
      return false;
    });

    if (existing && existing.id) {
      // Optionally update details if provided
      const updates: Partial<Customer> = {};
      if (customerData.customerTaxId && !existing.customerTaxId) updates.customerTaxId = customerData.customerTaxId;
      if (customerData.customerBranch && !existing.customerBranch) updates.customerBranch = customerData.customerBranch;
      if (customerData.customerAddress && !existing.customerAddress) updates.customerAddress = customerData.customerAddress;
      if (customerData.district && !existing.district) updates.district = customerData.district;
      if (customerData.province && !existing.province) updates.province = customerData.province;
      if (customerData.zipcode && !existing.zipcode) updates.zipcode = customerData.zipcode;
      if (customerData.email && !existing.email) updates.email = customerData.email;
      if (customerData.phoneNumber && !existing.phoneNumber) updates.phoneNumber = customerData.phoneNumber;

      if (Object.keys(updates).length > 0) {
        await updateCustomer(existing.id, updates);
      }
      return existing.id;
    } else {
      // Create new customer
      return await addCustomer({
        name: customerData.name.trim(),
        phoneNumber: customerData.phoneNumber || '',
        email: customerData.email || '',
        customerTaxId: customerData.customerTaxId || '',
        customerBranch: customerData.customerBranch || 'สำนักงานใหญ่',
        customerAddress: customerData.customerAddress || '',
        district: customerData.district || '',
        province: customerData.province || 'กรุงเทพมหานคร',
        zipcode: customerData.zipcode || '',
        note: customerData.note || ''
      });
    }
  };

  const deleteAllCustomers = async () => {
    try {
      const batch = writeBatch(db);
      customers.forEach((c) => {
        if (c.id) {
          batch.delete(doc(db, 'customers', c.id));
        }
      });
      await batch.commit();
    } catch (error) {
      console.error("Error deleting all customers:", error);
      throw error;
    }
  };

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    findOrCreateCustomer,
    deleteAllCustomers
  };
}
