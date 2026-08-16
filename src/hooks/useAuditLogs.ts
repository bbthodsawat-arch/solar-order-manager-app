import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuditLogEntry, AuditCategory } from '../types';
import { useAuth } from './useAuth';

export function useAuditLogs(categoryFilter: string = 'all', maxLogs: number = 200) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const logsRef = collection(db, 'audit_logs');
      let q = query(logsRef, orderBy('timestamp', 'desc'), limit(maxLogs));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedLogs: AuditLogEntry[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as AuditLogEntry[];

          setLogs(fetchedLogs);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Audit log query subscription error:', err);
          setError('ไม่สามารถดึงข้อมูล Audit Log ได้ (อาจต้องการสิทธิ์ผู้ดูแลระบบ)');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Error in useAuditLogs:', err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการโหลด Audit Log');
      setLoading(false);
    }
  }, [user, maxLogs]);

  // Derived filtered logs
  const filteredLogs = logs.filter((log) => {
    if (categoryFilter === 'all') return true;
    return log.category === categoryFilter;
  });

  // Calculate high level stats
  const stats = {
    total: logs.length,
    deletions: logs.filter((l) => l.action.includes('DELETE')).length,
    userChanges: logs.filter((l) => l.category === 'user').length,
    transactionChanges: logs.filter((l) => l.category === 'transaction').length,
    settingsChanges: logs.filter((l) => l.category === 'settings').length,
  };

  return { logs: filteredLogs, rawLogs: logs, loading, error, stats };
}
