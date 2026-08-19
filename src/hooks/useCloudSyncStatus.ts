import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocsFromServer, limit, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { useNetworkStatus } from './useNetworkStatus';
import { logAuditEvent } from '../lib/auditLogger';
import toast from 'react-hot-toast';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount?: number;
  timestamp?: Date;
}

export interface SyncInfo {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  pendingCount: number;
  isOnline: boolean;
  fromCache: boolean;
  isSyncing: boolean;
  syncFrequency: 'real_time' | 'interval' | 'manual';
  setSyncFrequency: (freq: 'real_time' | 'interval' | 'manual') => void;
  forceSync: () => Promise<SyncResult>;
  triggerReassuranceToast: () => void;
}

let forceSyncPromise: Promise<SyncResult> | null = null;

function readOfflineQueueCount(): number {
  try {
    const saved = localStorage.getItem('offline_transactions_queue');
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function useCloudSyncStatus(): SyncInfo {
  const { user } = useAuth();
  const isOnline = useNetworkStatus();

  const [syncFrequency, setSyncFrequencyState] = useState<'real_time' | 'interval' | 'manual'>(() => {
    const saved = localStorage.getItem('solar_app_sync_frequency');
    return saved === 'interval' || saved === 'manual' ? saved : 'real_time';
  });

  const setSyncFrequency = (freq: 'real_time' | 'interval' | 'manual') => {
    localStorage.setItem('solar_app_sync_frequency', freq);
    setSyncFrequencyState(freq);
    window.dispatchEvent(new CustomEvent('solar_app_sync_frequency_changed', { detail: freq }));
    const message = freq === 'real_time'
      ? 'เปลี่ยนเป็นซิงค์ข้อมูลเรียลไทม์ (แนะนำ)'
      : freq === 'interval'
        ? 'เปลี่ยนเป็นซิงค์ตามรอบ (ทุก 5 นาที) เพื่อประหยัดพลังงาน'
        : 'เปลี่ยนเป็นซิงค์แบบแมนนวล (ประหยัดอินเทอร์เน็ตสูงสุด)';
    toast.success(message, { id: 'sync-freq-toast', icon: freq === 'real_time' ? '⚡' : freq === 'interval' ? '🔋' : '📥', style: { borderRadius: '16px', fontSize: '13px', fontWeight: '700' } });
  };

  const [status, setStatus] = useState<SyncStatus>('synced');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    const saved = localStorage.getItem('solar_app_last_sync_time');
    return saved ? new Date(saved) : new Date();
  });
  const [pendingCount, setPendingCount] = useState(() => readOfflineQueueCount());
  const [fromCache] = useState(false);
  const prevOnlineRef = useRef(isOnline);

  // Keep the indicator lightweight: transaction data is already subscribed to by
  // useTransactions. Do not open a second full transactions listener just to
  // count pending writes; the local offline queue is enough for the indicator.
  useEffect(() => {
    setPendingCount(readOfflineQueueCount());
    setStatus(!isOnline ? 'offline' : readOfflineQueueCount() > 0 ? 'syncing' : 'synced');
  }, [user, isOnline]);

  useEffect(() => {
    const handleQueueChanged = () => {
      const count = readOfflineQueueCount();
      setPendingCount(count);
      if (isOnline) setStatus(count > 0 ? 'syncing' : 'synced');
    };
    window.addEventListener('storage', handleQueueChanged);
    window.addEventListener('solar_offline_queue_changed', handleQueueChanged);
    return () => {
      window.removeEventListener('storage', handleQueueChanged);
      window.removeEventListener('solar_offline_queue_changed', handleQueueChanged);
    };
  }, [isOnline]);

  useEffect(() => {
    if (prevOnlineRef.current !== isOnline) {
      if (!isOnline) {
        toast.error('ขาดการเชื่อมต่ออินเทอร์เน็ต! แอปเข้าสู่โหมดออฟไลน์และจัดเก็บข้อมูลลงเครื่องแทนอัตโนมัติ', { id: 'network-offline-alert', duration: 5000, icon: '📡' });
      } else if (readOfflineQueueCount() > 0) {
        toast.success('เชื่อมต่ออินเทอร์เน็ตสำเร็จ! กำลังซิงค์ข้อมูลที่ค้างอยู่ขึ้นคลาวด์ระบบ...', { id: 'network-online-alert', duration: 4000, icon: '⚡' });
      }
      prevOnlineRef.current = isOnline;
    }
  }, [isOnline]);

  useEffect(() => {
    if (syncFrequency !== 'interval' || !isOnline || !user) return;
    const intervalId = window.setInterval(() => {
      void forceSync();
    }, 300000);
    return () => window.clearInterval(intervalId);
  }, [syncFrequency, isOnline, user]);

  const forceSync = async (): Promise<SyncResult> => {
    if (forceSyncPromise) return forceSyncPromise;
    if (!isOnline) {
      toast.error('ไม่สามารถซิงค์ข้อมูลได้เนื่องจากอยู่ในโหมดออฟไลน์ กรุณาเชื่อมต่ออินเทอร์เน็ต', { id: 'force-sync-offline-error', duration: 4000, icon: '📡' });
      return { success: false, message: 'offline' };
    }
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนทำการซิงค์ข้อมูล', { id: 'force-sync-no-user', duration: 3000 });
      return { success: false, message: 'no_user' };
    }

    forceSyncPromise = (async () => {
      setIsSyncing(true);
      setStatus('syncing');
      const toastId = 'cloud-force-sync';
      toast.loading('กำลังซิงค์ข้อมูลและตรวจสอบสถานะคลาวด์ล่าสุด...', { id: toastId, style: { borderRadius: '16px', fontSize: '13px', fontWeight: '700' } });
      try {
        let syncedOfflineCount = 0;
        let rawQueue: any[] = [];
        try {
          const saved = localStorage.getItem('offline_transactions_queue');
          rawQueue = saved ? JSON.parse(saved) : [];
        } catch {
          rawQueue = [];
        }

        if (Array.isArray(rawQueue) && rawQueue.length > 0) {
          const remaining: any[] = [];
          for (let i = 0; i < rawQueue.length; i++) {
            const tx = rawQueue[i];
            try {
              const { id, hasPendingWrites, ...cleanTx } = tx;
              const cleanedData = { ...cleanTx, createdAt: cleanTx.createdAt || new Date().toISOString(), createdBy: cleanTx.createdBy || user.uid };
              const docRef = await addDoc(collection(db, 'transactions'), cleanedData);
              try {
                await logAuditEvent({
                  action: 'TRANSACTION_CREATE', category: 'transaction', targetId: docRef.id,
                  targetName: `${cleanTx.detail || cleanTx.category} (฿${cleanTx.amount?.toLocaleString()})`,
                  details: `[บังคับซิงก์สำเร็จ] ส่งรายการธุรกรรม ${cleanTx.type === 'income' ? 'รายรับ' : 'รายจ่าย'} หมวดหมู่ [${cleanTx.category}] ยอด ฿${cleanTx.amount?.toLocaleString()} ขึ้นคลาวด์`,
                  newData: cleanedData,
                });
              } catch (auditError) {
                console.error('Force sync audit log failed after transaction write:', auditError);
              }
              syncedOfflineCount++;
            } catch (itemErr: any) {
              console.warn('Failed to sync item in queue:', itemErr);
              remaining.push(tx, ...rawQueue.slice(i + 1));
              break;
            }
          }
          localStorage.setItem('offline_transactions_queue', JSON.stringify(remaining));
          window.dispatchEvent(new Event('solar_offline_queue_changed'));
        }

        // One small server roundtrip only when a user explicitly/periodically asks
        // for a sync check. Never keep a second realtime listener open.
        try {
          await getDocsFromServer(query(collection(db, 'transactions'), limit(1)));
        } catch (serverErr) {
          console.warn('Cloud sync server roundtrip:', serverErr);
        }

        const now = new Date();
        setLastSyncedAt(now);
        localStorage.setItem('solar_app_last_sync_time', now.toISOString());
        setPendingCount(readOfflineQueueCount());
        setStatus('synced');
        setIsSyncing(false);

        if (syncedOfflineCount > 0) {
          toast.success(`⚡ ซิงค์ข้อมูลสมบูรณ์! อัปโหลดรายการออฟไลน์ ${syncedOfflineCount} รายการ`, { id: toastId, duration: 4000, icon: '☁️' });
        } else {
          toast.success('☁️ ซิงค์ข้อมูลกับคลาวด์สำเร็จ', { id: toastId, duration: 3000, icon: '✅' });
        }
        return { success: true, message: 'synced', syncedCount: syncedOfflineCount, timestamp: now };
      } catch (err: any) {
        console.error('Force sync failed:', err);
        setStatus('error');
        setIsSyncing(false);
        toast.error('เกิดข้อผิดพลาดในการซิงค์ข้อมูลกับคลาวด์ กรุณาลองใหม่อีกครั้ง', { id: toastId, duration: 4000 });
        return { success: false, message: err?.message || 'unknown_error' };
      }
    })().finally(() => {
      forceSyncPromise = null;
    });

    return forceSyncPromise;
  };

  const triggerReassuranceToast = () => {
    const timeString = lastSyncedAt ? `${lastSyncedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.` : 'เมื่อสักครู่';
    if (!isOnline) {
      toast('ระบบอยู่ในโหมดออฟไลน์ ข้อมูลถูกบันทึกลงในเครื่อง และจะซิงค์ขึ้นคลาวด์อัตโนมัติเมื่อเชื่อมต่อเน็ต', { id: 'cloud-offline-info', duration: 4000, icon: '📡' });
      return;
    }
    if (pendingCount > 0 || status === 'syncing' || isSyncing) {
      toast('กำลังซิงค์ข้อมูลกับคลาวด์ระบบ...', { id: 'cloud-syncing-info', duration: 3000, icon: '⏳' });
      return;
    }
    toast.success(`ข้อมูลทั้งหมดปลอดภัย! ซิงค์กับ Firebase Cloud เรียบร้อยล่าสุดเวลา ${timeString}`, { id: 'cloud-reassurance-info', duration: 4500, icon: '🛡️' });
  };

  return {
    status: !isOnline ? 'offline' : (isSyncing ? 'syncing' : status),
    lastSyncedAt,
    pendingCount,
    isOnline,
    fromCache,
    isSyncing,
    syncFrequency,
    setSyncFrequency,
    forceSync,
    triggerReassuranceToast,
  };
}
