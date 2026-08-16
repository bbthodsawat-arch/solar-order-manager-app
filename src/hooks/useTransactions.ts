import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc, deleteField, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Transaction } from '../types';
import { useAuth } from './useAuth';
import { logAuditEvent } from '../lib/auditLogger';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from 'react-hot-toast';
import { dbManager } from '../lib/dbManager';
import { getSupabase } from '../lib/supabase';

// Recursively removes undefined values from objects
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

// Prepares update data for Firestore by mapping undefined top-level properties to deleteField()
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

export function useTransactions() {
  const [firestoreTransactions, setFirestoreTransactions] = useState<Transaction[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('offline_transactions_queue');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse offline transactions queue:', e);
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isOnline = useNetworkStatus();
  const isSyncingRef = useRef(false);
  const lastQuotaExhaustedRef = useRef<number>(0);

  useEffect(() => {
    if (!user) {
      setFirestoreTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        hasPendingWrites: doc.metadata.hasPendingWrites
      })) as Transaction[];
      
      setFirestoreTransactions(txs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      handleFirestoreError(error, OperationType.LIST, 'transactions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Merge local offline queue with Firestore live transactions
  const transactions = useMemo(() => {
    const merged = [...offlineQueue, ...firestoreTransactions];
    // Sort all transactions by date descending
    return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [firestoreTransactions, offlineQueue]);

  // Function to sync offline queued transactions back to Firestore
  const syncOfflineQueue = async () => {
    if (!isOnline || !user || isSyncingRef.current) return;
    
    let currentQueue: Transaction[] = [];
    try {
      const saved = localStorage.getItem('offline_transactions_queue');
      currentQueue = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error reading offline queue for sync:', e);
      return;
    }

    if (currentQueue.length === 0) return;

    isSyncingRef.current = true;
    const toastId = toast.loading(`📡 ตรวจพบข้อมูลออฟไลน์ค้างซิงค์! กำลังอัปโหลด ${currentQueue.length} รายการขึ้นระบบคลาวด์...`, {
      style: {
        borderRadius: '16px',
        fontSize: '13px',
        fontWeight: '700',
      }
    });
    
    const remaining: Transaction[] = [];
    let successCount = 0;

    for (let i = 0; i < currentQueue.length; i++) {
      const tx = currentQueue[i];
      try {
        const { id, hasPendingWrites, ...cleanTx } = tx;
        const cleanedData = removeUndefinedFields({
          ...cleanTx,
          createdAt: cleanTx.createdAt || new Date().toISOString(),
          createdBy: cleanTx.createdBy || user.uid
        });

        const docRef = await addDoc(collection(db, 'transactions'), cleanedData);

        // Log audit event for this transaction sync
        await logAuditEvent({
          action: 'TRANSACTION_CREATE',
          category: 'transaction',
          targetId: docRef.id,
          targetName: `${cleanTx.detail || cleanTx.category} (฿${cleanTx.amount?.toLocaleString()})`,
          details: `[ออฟไลน์ซิงก์สำเร็จ] กู้คืนและบันทึกรายการ ${cleanTx.type === 'income' ? 'รายรับ' : 'รายจ่าย'} หมวดหมู่ [${cleanTx.category}] รายละเอียด: "${cleanTx.detail || '-'}" จำนวน ฿${cleanTx.amount?.toLocaleString()}`,
          newData: cleanedData,
        });

        successCount++;
      } catch (error: any) {
        console.warn("Error syncing offline transaction to Firebase:", error);
        remaining.push(tx);
        // If quota limit reached, break early and set backoff to prevent hammering the write stream
        if (error?.code === 'resource-exhausted' || error?.message?.includes('quota') || error?.message?.includes('Quota') || error?.message?.includes('exhausted')) {
          remaining.push(...currentQueue.slice(i + 1));
          lastQuotaExhaustedRef.current = Date.now() + 5 * 60 * 1000;
          break;
        }
      }
    }

    try {
      localStorage.setItem('offline_transactions_queue', JSON.stringify(remaining));
      setOfflineQueue(remaining);
    } catch (e) {
      console.error('Error saving updated queue to localStorage:', e);
    }

    isSyncingRef.current = false;

    if (successCount > 0) {
      toast.success(`⚡ ซิงค์ข้อมูลธุรกรรมออฟไลน์สำเร็จ ${successCount} รายการเรียบร้อยแล้ว!`, {
        id: toastId,
        duration: 4000,
        style: {
          borderRadius: '16px',
          fontSize: '13px',
          fontWeight: '700',
        }
      });
    } else {
      toast.dismiss(toastId);
    }
  };

  // Run sync whenever user goes online, with quota backoff guard
  useEffect(() => {
    if (isOnline && user && offlineQueue.length > 0) {
      if (Date.now() > lastQuotaExhaustedRef.current) {
        syncOfflineQueue();
      }
    }
  }, [isOnline, user, offlineQueue.length]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!user) return;

    const tempId = `offline_queued_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const cleanedData = removeUndefinedFields({
      ...transaction,
      createdAt: new Date().toISOString(),
      createdBy: user.uid
    });

    // Helper to queue offline if network is down or request fails
    const queueOffline = () => {
      const offlineTx: Transaction = {
        id: tempId,
        ...cleanedData,
        hasPendingWrites: true
      };

      const updatedQueue = [...offlineQueue, offlineTx];
      setOfflineQueue(updatedQueue);
      try {
        localStorage.setItem('offline_transactions_queue', JSON.stringify(updatedQueue));
      } catch (e) {
        console.error('Failed to write transaction queue to localStorage:', e);
      }

      toast.success('💾 จัดเก็บออฟไลน์เรียบร้อย! รายการจะซิงค์ขึ้นระบบคลาวด์อัตโนมัติเมื่ออินเทอร์เน็ตพร้อมใช้งาน', {
        icon: '📡',
        duration: 5000,
        style: {
          borderRadius: '16px',
          fontSize: '13px',
          fontWeight: '700',
        }
      });

      return tempId;
    };

    const activeProvider = dbManager.getActualProvider();

    if (!isOnline || activeProvider === 'local') {
      return queueOffline();
    }

    if (activeProvider === 'supabase') {
      try {
        const client = getSupabase();
        if (client) {
          const supabaseData = {
            id: tempId,
            type: cleanedData.type,
            amount: cleanedData.amount,
            title: cleanedData.detail || cleanedData.category,
            category: cleanedData.category,
            date: cleanedData.date,
            payment_method: cleanedData.paymentMethod,
            customer_id: cleanedData.saleOrderDetails?.customerId || null,
            customer_name: cleanedData.saleOrderDetails?.customerName || null,
            notes: cleanedData.notes,
            created_at: cleanedData.createdAt,
          };
          const { error } = await client.from('transactions').insert([supabaseData]);
          if (error) throw error;

          await logAuditEvent({
            action: 'TRANSACTION_CREATE',
            category: 'transaction',
            targetId: tempId,
            targetName: `${transaction.detail || transaction.category} (฿${transaction.amount?.toLocaleString()})`,
            details: `[Supabase Active] สร้างรายการ ${transaction.type === 'income' ? 'รายรับ' : 'รายจ่าย'} หมวดหมู่ [${transaction.category}] บน Supabase`,
            newData: cleanedData,
          });

          return tempId;
        }
      } catch (err) {
        console.warn('Failed to insert into Supabase, fallback to local queue:', err);
        return queueOffline();
      }
    }
    
    try {
      const docRef = await addDoc(collection(db, 'transactions'), cleanedData);

      // Audit Log
      await logAuditEvent({
        action: 'TRANSACTION_CREATE',
        category: 'transaction',
        targetId: docRef.id,
        targetName: `${transaction.detail || transaction.category} (฿${transaction.amount?.toLocaleString()})`,
        details: `สร้างรายการ ${transaction.type === 'income' ? 'รายรับ' : 'รายจ่าย'} หมวดหมู่ [${transaction.category}] รายละเอียด: "${transaction.detail || '-'}" จำนวน ฿${transaction.amount?.toLocaleString()}`,
        newData: cleanedData,
      });

      return docRef.id;
    } catch (error) {
      console.error("Error adding transaction to Firestore, fallback to local queue:", error);
      return queueOffline();
    }
  };

  const deleteTransaction = async (id: string) => {
    if (id.startsWith('offline_queued_')) {
      const remaining = offlineQueue.filter(t => t.id !== id);
      setOfflineQueue(remaining);
      try {
        localStorage.setItem('offline_transactions_queue', JSON.stringify(remaining));
      } catch (e) {
        console.error('Failed to update localStorage queue:', e);
      }
      toast.success('ลบรายการที่ค้างคิวออฟไลน์เรียบร้อยแล้ว');
      return;
    }

    const activeProvider = dbManager.getActualProvider();
    if (activeProvider === 'supabase') {
      try {
        const client = getSupabase();
        if (client) {
          const { error } = await client.from('transactions').delete().eq('id', id);
          if (error) throw error;
        }
      } catch (err) {
        console.error("Error deleting from Supabase:", err);
      }
    }

    try {
      const existingTx = transactions.find((t) => t.id === id);
      if (activeProvider === 'firebase') {
        await deleteDoc(doc(db, 'transactions', id));
      }

      // Audit Log
      await logAuditEvent({
        action: 'TRANSACTION_DELETE',
        category: 'transaction',
        targetId: id,
        targetName: existingTx ? `${existingTx.detail || existingTx.category} (฿${existingTx.amount?.toLocaleString()})` : id,
        details: `ลบรายการธุรกรรม ${existingTx?.type === 'income' ? 'รายรับ' : 'รายจ่าย'}: "${existingTx?.detail || existingTx?.category || id}" ยอดเงิน ฿${existingTx?.amount?.toLocaleString() || 0}`,
        previousData: existingTx || null,
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'createdBy'>>) => {
    if (id.startsWith('offline_queued_')) {
      const updated = offlineQueue.map(t => t.id === id ? { ...t, ...updates } : t);
      setOfflineQueue(updated);
      try {
        localStorage.setItem('offline_transactions_queue', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update localStorage queue:', e);
      }
      toast.success('แก้ไขรายการในคิวออฟไลน์เรียบร้อยแล้ว');
      return;
    }

    const activeProvider = dbManager.getActualProvider();
    if (activeProvider === 'supabase') {
      try {
        const client = getSupabase();
        if (client) {
          const supabaseUpdates: Record<string, any> = {};
          if (updates.type !== undefined) supabaseUpdates.type = updates.type;
          if (updates.amount !== undefined) supabaseUpdates.amount = updates.amount;
          if (updates.category !== undefined) supabaseUpdates.category = updates.category;
          if (updates.detail !== undefined) supabaseUpdates.title = updates.detail;
          if (updates.date !== undefined) supabaseUpdates.date = updates.date;
          if (updates.paymentMethod !== undefined) supabaseUpdates.payment_method = updates.paymentMethod;
          if (updates.saleOrderDetails !== undefined) {
            if (updates.saleOrderDetails.customerId !== undefined) supabaseUpdates.customer_id = updates.saleOrderDetails.customerId;
            if (updates.saleOrderDetails.customerName !== undefined) supabaseUpdates.customer_name = updates.saleOrderDetails.customerName;
          }
          if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;

          const { error } = await client.from('transactions').update(supabaseUpdates).eq('id', id);
          if (error) throw error;
        }
      } catch (err) {
        console.error("Error updating Supabase transaction:", err);
      }
    }

    try {
      const existingTx = transactions.find((t) => t.id === id);
      const cleanedUpdates = prepareUpdateData(updates);
      
      if (activeProvider === 'firebase') {
        await updateDoc(doc(db, 'transactions', id), cleanedUpdates);
      }

      // Audit Log
      await logAuditEvent({
        action: 'TRANSACTION_UPDATE',
        category: 'transaction',
        targetId: id,
        targetName: existingTx ? `${existingTx.detail || existingTx.category} (฿${existingTx.amount?.toLocaleString()})` : id,
        details: `แก้ไขข้อมูลรายการธุรกรรม "${existingTx?.detail || existingTx?.category || id}"`,
        previousData: existingTx || null,
        newData: updates,
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  };

  const restoreTransaction = async (id: string, data: Transaction) => {
    try {
      const { id: _, ...rest } = data;
      const cleanedData = removeUndefinedFields(rest);
      await setDoc(doc(db, 'transactions', id), cleanedData);

      // Audit Log
      await logAuditEvent({
        action: 'TRANSACTION_RESTORE',
        category: 'transaction',
        targetId: id,
        targetName: `${data.detail || data.category} (฿${data.amount?.toLocaleString()})`,
        details: `กู้คืนรายการธุรกรรมที่ถูกลบไปแล้ว: "${data.detail || data.category}" ยอดเงิน ฿${data.amount?.toLocaleString()}`,
        newData: data,
      });
    } catch (error) {
      console.error("Error restoring transaction:", error);
      throw error;
    }
  };

  const deleteAllTransactions = async () => {
    try {
      const count = transactions.length;
      const batch = writeBatch(db);
      transactions.forEach((tx) => {
        if (tx.id && !tx.id.startsWith('offline_queued_')) {
          batch.delete(doc(db, 'transactions', tx.id));
        }
      });
      await batch.commit();

      // Also clear offline queue
      setOfflineQueue([]);
      try {
        localStorage.removeItem('offline_transactions_queue');
      } catch (e) {
        console.error('Failed to clear localStorage offline queue:', e);
      }

      // Audit Log
      await logAuditEvent({
        action: 'TRANSACTION_BATCH_DELETE',
        category: 'transaction',
        targetId: 'ALL',
        targetName: `ล้างข้อมูลธุรกรรมทั้งหมด ${count} รายการ`,
        details: `ลบรายการธุรกรรมทั้งหมดในระบบจำนวน ${count} รายการ (รวมถึงออฟไลน์คิว)`,
      });
    } catch (error) {
      console.error("Error deleting all transactions:", error);
      throw error;
    }
  };

  const pendingCount = transactions.filter(t => t.hasPendingWrites || t.id?.startsWith('offline_queued_')).length;

  return { transactions, loading, pendingCount, addTransaction, deleteTransaction, updateTransaction, restoreTransaction, deleteAllTransactions };
}
