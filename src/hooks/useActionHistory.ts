import { useState, useEffect, useCallback } from 'react';
import { ActionRecord, Transaction } from '../types';
import { toast } from 'react-hot-toast';

const HISTORY_KEY = 'solar_app_action_history';

export function useActionHistory(
  addTransaction: (tx: any) => Promise<any>,
  deleteTransaction: (id: string) => Promise<void>,
  updateTransaction: (id: string, updates: any) => Promise<void>,
  restoreTransaction: (id: string, data: any) => Promise<void>
) {
  const [history, setHistory] = useState<ActionRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const saveHistory = useCallback((newHistory: ActionRecord[]) => {
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  }, []);

  const addAction = useCallback((action: Omit<ActionRecord, 'id' | 'timestamp'>) => {
    const record: ActionRecord = {
      ...action,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };
    
    setHistory(prev => {
      const updated = [record, ...prev].slice(0, 5);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const undoAction = async (actionId: string) => {
    const action = history.find(h => h.id === actionId);
    if (!action) return;

    try {
      switch (action.type) {
        case 'CREATE':
          if (action.transactionId) {
            await deleteTransaction(action.transactionId);
            toast.success('Undo: ลบรายการที่เพิ่งสร้างแล้ว');
          }
          break;
        case 'UPDATE':
          if (action.transactionId && action.previousData) {
            await updateTransaction(action.transactionId, action.previousData);
            toast.success('Undo: ย้อนกลับการแก้ไขรายการแล้ว');
          }
          break;
        case 'DELETE':
          if (action.transactionId && action.previousData) {
            await restoreTransaction(action.transactionId, action.previousData);
            toast.success('Undo: กู้คืนรายการที่ลบแล้ว');
          }
          break;
        case 'BATCH_DELETE':
          if (action.transactions) {
            await Promise.all(action.transactions.map(tx => restoreTransaction(tx.id!, tx)));
            toast.success(`Undo: กู้คืน ${action.transactions.length} รายการที่ลบแล้ว`);
          }
          break;
        case 'BATCH_UPDATE':
          if (action.transactions && action.previousData) {
            // previousData would be a map of txId -> previousState
            await Promise.all(
              action.transactions.map(tx => 
                updateTransaction(tx.id!, action.previousData[tx.id!])
              )
            );
            toast.success(`Undo: ย้อนกลับการอัปเดต ${action.transactions.length} รายการแล้ว`);
          }
          break;
      }

      // Remove from history after undo
      const newHistory = history.filter(h => h.id !== actionId);
      saveHistory(newHistory);
    } catch (error) {
      console.error('Undo failed', error);
      toast.error('ไม่สามารถย้อนกลับการกระทำได้');
    }
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  return { history, addAction, undoAction, clearHistory };
}
