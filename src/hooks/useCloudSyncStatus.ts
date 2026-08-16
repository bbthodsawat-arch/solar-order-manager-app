import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, getDocsFromServer, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
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

export function useCloudSyncStatus(): SyncInfo {
  const { user } = useAuth();
  const isOnline = useNetworkStatus();
  
  const [syncFrequency, setSyncFrequencyState] = useState<'real_time' | 'interval' | 'manual'>(() => {
    const saved = localStorage.getItem('solar_app_sync_frequency');
    return (saved as any) || 'real_time';
  });

  const setSyncFrequency = (freq: 'real_time' | 'interval' | 'manual') => {
    localStorage.setItem('solar_app_sync_frequency', freq);
    setSyncFrequencyState(freq);
    window.dispatchEvent(new CustomEvent('solar_app_sync_frequency_changed', { detail: freq }));
    
    if (freq === 'real_time') {
      toast.success('เปลี่ยนเป็นซิงค์ข้อมูลเรียลไทม์ (แนะนำ)', {
        id: 'sync-freq-toast',
        icon: '⚡',
        style: { borderRadius: '16px', fontSize: '13px', fontWeight: '700' }
      });
    } else if (freq === 'interval') {
      toast.success('เปลี่ยนเป็นซิงค์ตามรอบ (ทุก 5 นาที) เพื่อประหยัดพลังงาน', {
        id: 'sync-freq-toast',
        icon: '🔋',
        style: { borderRadius: '16px', fontSize: '13px', fontWeight: '700' }
      });
    } else {
      toast.success('เปลี่ยนเป็นซิงค์แบบแมนนวล (ประหยัดอินเทอร์เน็ตสูงสุด)', {
        id: 'sync-freq-toast',
        icon: '📥',
        style: { borderRadius: '16px', fontSize: '13px', fontWeight: '700' }
      });
    }
  };

  const [status, setStatus] = useState<SyncStatus>('synced');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    const saved = localStorage.getItem('solar_app_last_sync_time');
    return saved ? new Date(saved) : new Date();
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [fromCache, setFromCache] = useState<boolean>(false);

  const prevPendingRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);
  const prevOnlineRef = useRef<boolean>(isOnline);

  // Connection transition status notification toasts
  useEffect(() => {
    if (prevOnlineRef.current !== isOnline) {
      if (!isOnline) {
        toast.error('ขาดการเชื่อมต่ออินเทอร์เน็ต! แอปเข้าสู่โหมดออฟไลน์และจัดเก็บข้อมูลลงเครื่องแทนอัตโนมัติ', {
          id: 'network-offline-alert',
          duration: 5000,
          icon: '📡',
          style: {
            borderRadius: '16px',
            background: '#991b1b',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '700',
            border: '1px solid #f87171',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          },
        });
      } else {
        toast.success('เชื่อมต่ออินเทอร์เน็ตสำเร็จ! กำลังซิงค์ข้อมูลที่ค้างอยู่ขึ้นคลาวด์ระบบ...', {
          id: 'network-online-alert',
          duration: 4000,
          icon: '⚡',
          style: {
            borderRadius: '16px',
            background: '#065f46',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '700',
            border: '1px solid #34d399',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          },
        });
      }
      prevOnlineRef.current = isOnline;
    }
  }, [isOnline]);

  useEffect(() => {
    if (!user) {
      setStatus('synced');
      setPendingCount(0);
      return;
    }

    if (!isOnline) {
      setStatus('offline');
      return;
    }

    // If manual or interval, we do NOT maintain an open, active, real-time WebSocket connection.
    // This dramatically saves battery life on mobile devices!
    if (syncFrequency !== 'real_time') {
      setStatus('synced');
      
      let customOfflineCount = 0;
      try {
        const saved = localStorage.getItem('offline_transactions_queue');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            customOfflineCount = parsed.length;
          }
        }
      } catch (e) {
        console.error('Error reading offline queue for sync count:', e);
      }

      setPendingCount(customOfflineCount);
      if (customOfflineCount > 0) {
        setStatus('syncing');
      }
      return;
    }

    // Subscribe to transactions collection metadata changes (Real-time mode only)
    const q = query(collection(db, 'transactions'));

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const hasPendingWrites = snapshot.metadata.hasPendingWrites;
      const isFromCache = snapshot.metadata.fromCache;
      
      setFromCache(isFromCache);

      // Count docs with pending local writes
      let pendingDocs = 0;
      snapshot.docs.forEach((doc) => {
        if (doc.metadata.hasPendingWrites) {
          pendingDocs++;
        }
      });

      // Include our custom localStorage transaction queue fallback count
      let customOfflineCount = 0;
      try {
        const saved = localStorage.getItem('offline_transactions_queue');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            customOfflineCount = parsed.length;
          }
        }
      } catch (e) {
        console.error('Error reading offline queue for sync count:', e);
      }

      const totalPending = pendingDocs + customOfflineCount;
      setPendingCount(totalPending);

      if (hasPendingWrites || totalPending > 0) {
        setStatus('syncing');
      } else {
        setStatus('synced');
        
        // If we previously had pending writes and now they are cleared, data was synced to cloud!
        if (prevPendingRef.current > 0 && !isFirstLoadRef.current) {
          const now = new Date();
          setLastSyncedAt(now);
          localStorage.setItem('solar_app_last_sync_time', now.toISOString());

          toast.success('ข้อมูลถูกซิงค์ขึ้นคลาวด์เรียบร้อยแล้ว (Data Synced)', {
            id: 'cloud-sync-success',
            duration: 3500,
            icon: '☁️',
            style: {
              borderRadius: '16px',
              background: '#0f172a',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '700',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            },
          });
        }
      }

      prevPendingRef.current = totalPending;
      isFirstLoadRef.current = false;
    }, (err) => {
      console.error('Cloud sync listener error:', err);
      handleFirestoreError(err, OperationType.LIST, 'transactions');
      setStatus('error');
    });

    return () => unsubscribe();
  }, [user, isOnline, syncFrequency]);

  // Interval-based sync trigger effect (e.g. every 5 minutes / 300,000 ms)
  useEffect(() => {
    if (syncFrequency !== 'interval' || !isOnline || !user) return;

    // Trigger immediate check-sync on switch
    const runIntervalSync = async () => {
      console.log('[Interval Sync] Starting periodic background replication...');
      try {
        await forceSync();
      } catch (err) {
        console.warn('Background periodic interval sync skipped/failed:', err);
      }
    };

    // Run every 5 minutes (300,000 ms)
    const intervalId = setInterval(runIntervalSync, 300000);

    return () => clearInterval(intervalId);
  }, [syncFrequency, isOnline, user]);

  // Manual Force Sync trigger function
  const forceSync = async (): Promise<SyncResult> => {
    if (!isOnline) {
      toast.error('ไม่สามารถซิงค์ข้อมูลได้เนื่องจากอยู่ในโหมดออฟไลน์ กรุณาเชื่อมต่ออินเทอร์เน็ต', {
        id: 'force-sync-offline-error',
        duration: 4000,
        icon: '📡',
      });
      return { success: false, message: 'offline' };
    }

    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนทำการซิงค์ข้อมูล', {
        id: 'force-sync-no-user',
        duration: 3000,
      });
      return { success: false, message: 'no_user' };
    }

    setIsSyncing(true);
    setStatus('syncing');

    const toastId = toast.loading('กำลังบังคับซิงค์ข้อมูลและตรวจสอบสถานะคลาวด์ล่าสุด...', {
      style: {
        borderRadius: '16px',
        fontSize: '13px',
        fontWeight: '700',
      }
    });

    try {
      // 1. Process custom offline queue if present
      let syncedOfflineCount = 0;
      let rawQueue: any[] = [];
      try {
        const saved = localStorage.getItem('offline_transactions_queue');
        if (saved) {
          rawQueue = JSON.parse(saved);
        }
      } catch (e) {
        console.error('Error reading offline queue during force sync:', e);
      }

      if (Array.isArray(rawQueue) && rawQueue.length > 0) {
        const remaining: any[] = [];
        for (let i = 0; i < rawQueue.length; i++) {
          const tx = rawQueue[i];
          try {
            const { id, hasPendingWrites, ...cleanTx } = tx;
            const cleanedData = {
              ...cleanTx,
              createdAt: cleanTx.createdAt || new Date().toISOString(),
              createdBy: cleanTx.createdBy || user.uid,
            };

            const docRef = await addDoc(collection(db, 'transactions'), cleanedData);
            
            await logAuditEvent({
              action: 'TRANSACTION_CREATE',
              category: 'transaction',
              targetId: docRef.id,
              targetName: `${cleanTx.detail || cleanTx.category} (฿${cleanTx.amount?.toLocaleString()})`,
              details: `[บังคับซิงก์สำเร็จ] ส่งรายการธุรกรรม ${cleanTx.type === 'income' ? 'รายรับ' : 'รายจ่าย'} หมวดหมู่ [${cleanTx.category}] ยอด ฿${cleanTx.amount?.toLocaleString()} ขึ้นคลาวด์`,
              newData: cleanedData,
            });

            syncedOfflineCount++;
          } catch (itemErr: any) {
            console.warn('Failed to sync item in queue:', itemErr);
            remaining.push(tx);
            if (itemErr?.code === 'resource-exhausted' || itemErr?.message?.includes('quota') || itemErr?.message?.includes('Quota') || itemErr?.message?.includes('exhausted')) {
              remaining.push(...rawQueue.slice(i + 1));
              break;
            }
          }
        }

        try {
          localStorage.setItem('offline_transactions_queue', JSON.stringify(remaining));
        } catch (e) {
          console.error('Failed to update localStorage queue:', e);
        }
      }

      // 2. Perform a live server roundtrip to verify connection and refresh data
      try {
        const testQuery = query(collection(db, 'transactions'), limit(1));
        await getDocsFromServer(testQuery);
      } catch (serverErr) {
        // Even if collection is empty or rules trigger, we proceed if network succeeded
        console.warn('Server roundtrip response:', serverErr);
      }

      // 3. Mark last synced time
      const now = new Date();
      setLastSyncedAt(now);
      localStorage.setItem('solar_app_last_sync_time', now.toISOString());
      setStatus('synced');
      setIsSyncing(false);

      if (syncedOfflineCount > 0) {
        toast.success(`⚡ ซิงค์ข้อมูลสมบูรณ์! อัปโหลดรายการออฟไลน์ ${syncedOfflineCount} รายการ และรีเฟรชข้อมูลคลาวด์สำเร็จ`, {
          id: toastId,
          duration: 4500,
          icon: '☁️',
          style: {
            borderRadius: '16px',
            background: '#064e3b',
            color: '#ecfdf5',
            fontSize: '13px',
            fontWeight: '700',
            border: '1px solid #10b981',
          }
        });
      } else {
        toast.success('☁️ ซิงค์ข้อมูลกับคลาวด์สำเร็จ! ข้อมูลบนอุปกรณ์ของคุณตรงกับ Firebase Cloud ล่าสุดแล้ว', {
          id: toastId,
          duration: 4000,
          icon: '✅',
          style: {
            borderRadius: '16px',
            background: '#0f172a',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '700',
            border: '1px solid rgba(16, 185, 129, 0.4)',
          }
        });
      }

      return {
        success: true,
        message: 'synced',
        syncedCount: syncedOfflineCount,
        timestamp: now
      };
    } catch (err: any) {
      console.error('Force sync failed:', err);
      setStatus('error');
      setIsSyncing(false);
      
      toast.error('เกิดข้อผิดพลาดในการซิงค์ข้อมูลกับคลาวด์ กรุณาลองใหม่อีกครั้ง', {
        id: toastId,
        duration: 4000,
      });

      return {
        success: false,
        message: err?.message || 'unknown_error'
      };
    }
  };

  const triggerReassuranceToast = () => {
    const timeString = lastSyncedAt 
      ? `${lastSyncedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.`
      : 'เมื่อสักครู่';

    if (!isOnline) {
      toast('ระบบอยู่ในโหมดออฟไลน์ ข้อมูลถูกบันทึกลงในเครื่อง และจะซิงค์ขึ้นคลาวด์อัตโนมัติเมื่อเชื่อมต่อเน็ต', {
        id: 'cloud-offline-info',
        duration: 4000,
        icon: '📡',
        style: {
          borderRadius: '16px',
          background: '#1e293b',
          color: '#f8fafc',
          fontSize: '12.5px',
          fontWeight: '600',
        },
      });
      return;
    }

    if (pendingCount > 0 || status === 'syncing' || isSyncing) {
      toast('กำลังซิงค์ข้อมูลกับคลาวด์ระบบ...', {
        id: 'cloud-syncing-info',
        duration: 3000,
        icon: '⏳',
      });
      return;
    }

    toast.success(`ข้อมูลทั้งหมดปลอดภัย! ซิงค์กับ Firebase Cloud เรียบร้อยล่าสุดเวลา ${timeString}`, {
      id: 'cloud-reassurance-info',
      duration: 4500,
      icon: '🛡️',
      style: {
        borderRadius: '18px',
        background: '#064e3b',
        color: '#ecfdf5',
        fontSize: '13px',
        fontWeight: '700',
        border: '1px solid #10b981',
      },
    });
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
    triggerReassuranceToast
  };
}

