import { doc, getDoc, getDocs, setDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { toast } from 'react-hot-toast';

export type DbProvider = 'local' | 'firebase' | 'supabase';

export interface DbHealthStatus {
  local: { status: 'healthy' | 'warning'; message: string };
  firebase: { status: 'healthy' | 'error' | 'offline'; latencyMs: number; message: string };
  supabase: { status: 'healthy' | 'error' | 'offline' | 'unconfigured'; latencyMs: number; message: string };
}

export interface SyncStats {
  transactions: number;
  customers: number;
  appointments: number;
  warranties: number;
  quickNotes: number;
}

// Subscriptions callback storage
type SubscriberCallback = (state: {
  preferredProvider: DbProvider;
  actualProvider: DbProvider;
  autoFailover: boolean;
  health: DbHealthStatus;
}) => void;

const subscribers = new Set<SubscriberCallback>();

// Default state
let preferredProvider: DbProvider = (localStorage.getItem('solar_preferred_database_mode') as DbProvider) || 'firebase';
let autoFailover: boolean = localStorage.getItem('solar_auto_failover_enabled') !== 'false';
let actualProvider: DbProvider = 'firebase';

let healthStatus: DbHealthStatus = {
  local: { status: 'healthy', message: 'พร้อมใช้งานเสมอบนเครื่อง (LocalStorage)' },
  firebase: { status: 'healthy', latencyMs: 0, message: 'เชื่อมต่อสำเร็จ' },
  supabase: { status: 'unconfigured', latencyMs: 0, message: 'ยังไม่ได้ตั้งค่า' },
};

// Simple global event hub
export const dbManager = {
  getPreferredProvider(): DbProvider {
    return preferredProvider;
  },

  getActualProvider(): DbProvider {
    return actualProvider;
  },

  isAutoFailoverEnabled(): boolean {
    return autoFailover;
  },

  getHealthStatus(): DbHealthStatus {
    return healthStatus;
  },

  getLastSyncSuccessTimestamps(): { local: string | null; firebase: string | null; supabase: string | null } {
    return {
      local: localStorage.getItem('solar_last_sync_success_local'),
      firebase: localStorage.getItem('solar_last_sync_success_firebase'),
      supabase: localStorage.getItem('solar_last_sync_success_supabase'),
    };
  },

  // Update preferred provider
  setPreferredProvider(provider: DbProvider) {
    preferredProvider = provider;
    localStorage.setItem('solar_preferred_database_mode', provider);
    this.recalculateActualProvider();
    this.notifySubscribers();
  },

  // Update auto failover setting
  setAutoFailover(enabled: boolean) {
    autoFailover = enabled;
    localStorage.setItem('solar_auto_failover_enabled', enabled ? 'true' : 'false');
    this.recalculateActualProvider();
    this.notifySubscribers();
  },

  // Add listener for real-time React updates
  subscribe(callback: SubscriberCallback) {
    subscribers.add(callback);
    // Initial emit
    callback({
      preferredProvider,
      actualProvider,
      autoFailover,
      health: healthStatus,
    });
    return () => {
      subscribers.delete(callback);
    };
  },

  notifySubscribers() {
    const state = {
      preferredProvider,
      actualProvider,
      autoFailover,
      health: healthStatus,
    };
    subscribers.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('Subscriber callback error:', err);
      }
    });
  },

  // Re-calculate actual provider in use based on preferred provider, auto-failover, and network
  recalculateActualProvider() {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (!isOnline) {
      if (actualProvider !== 'local') {
        actualProvider = 'local';
        toast('สลับไปใช้ฐานข้อมูลภายในเครื่อง (Local Database) อัตโนมัติเนื่องจากออฟไลน์', {
          icon: '📡',
          id: 'failover-offline',
        });
      }
      return;
    }

    if (preferredProvider === 'firebase') {
      if (healthStatus.firebase.status === 'healthy' || !autoFailover) {
        actualProvider = 'firebase';
      } else if (healthStatus.supabase.status === 'healthy') {
        actualProvider = 'supabase';
      } else {
        actualProvider = 'local';
      }
    } else if (preferredProvider === 'supabase') {
      if (healthStatus.supabase.status === 'healthy' || !autoFailover) {
        actualProvider = 'supabase';
      } else if (healthStatus.firebase.status === 'healthy') {
        actualProvider = 'firebase';
      } else {
        actualProvider = 'local';
      }
    } else {
      actualProvider = 'local';
    }
  },

  // Run comprehensive health diagnostic checks
  async runDiagnostics(): Promise<DbHealthStatus> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // 1. Local Database Diagnostic
    healthStatus.local = {
      status: 'healthy',
      message: `พร้อมใช้งานบนอุปกรณ์ของคุณเรียบร้อย (มีข้อมูลสำรองค้างอยู่ในคิว: ${
        localStorage.getItem('offline_transactions_queue')
          ? JSON.parse(localStorage.getItem('offline_transactions_queue') || '[]').length
          : 0
      } รายการ)`,
    };
    localStorage.setItem('solar_last_sync_success_local', new Date().toISOString());

    if (!isOnline) {
      healthStatus.firebase = { status: 'offline', latencyMs: 0, message: 'อินเทอร์เน็ตขาดการเชื่อมต่อ (Offline)' };
      healthStatus.supabase = isSupabaseConfigured()
        ? { status: 'offline', latencyMs: 0, message: 'อินเทอร์เน็ตขาดการเชื่อมต่อ (Offline)' }
        : { status: 'unconfigured', latencyMs: 0, message: 'ไม่ได้กำหนดข้อมูลยืนยันตัวตน' };
      
      this.recalculateActualProvider();
      this.notifySubscribers();
      return healthStatus;
    }

    // 2. Firebase Firestore Diagnostic
    const fbStart = Date.now();
    try {
      const configDocRef = doc(db, 'config', 'app');
      await getDoc(configDocRef);
      const latency = Date.now() - fbStart;
      healthStatus.firebase = {
        status: 'healthy',
        latencyMs: latency,
        message: `เชื่อมต่อ Firebase Firestore สำเร็จ (ความเร็ว: ${latency}ms)`,
      };
      localStorage.setItem('solar_last_sync_success_firebase', new Date().toISOString());
    } catch (err: any) {
      const latency = Date.now() - fbStart;
      healthStatus.firebase = {
        status: 'error',
        latencyMs: latency,
        message: `เกิดข้อผิดพลาดกับ Firebase: ${err?.message || 'Unreachable'}`,
      };
      
      // Log Firebase connection failure
      dbManager.addErrorLog(
        'firebase',
        'Ping Failed',
        `การทดสอบเชื่อมต่อ Firebase ล้มเหลว: ${err?.message || 'ติดต่อไม่ได้'}`,
        autoFailover
      );
    }

    // 3. Supabase Diagnostic
    if (!isSupabaseConfigured()) {
      healthStatus.supabase = {
        status: 'unconfigured',
        latencyMs: 0,
        message: 'ไม่ได้เปิดใช้งาน Supabase (ต้องการ Project URL & Anon Key)',
      };
    } else {
      const sbStart = Date.now();
      try {
        const client = getSupabase();
        if (!client) {
          throw new Error('ไม่สามารถเชื่อมต่อ Supabase Client ได้');
        }
        // Ping testing on _health_check_ or standard system query
        const { error } = await client.from('_health_check_').select('count', { count: 'exact', head: true });
        const latency = Date.now() - sbStart;

        // Ignore missing table since endpoint contact means healthy
        if (error && error.code !== '42P01' && !error.message.includes('does not exist')) {
          throw new Error(error.message);
        }

        healthStatus.supabase = {
          status: 'healthy',
          latencyMs: latency,
          message: `เชื่อมต่อ Supabase PostgreSQL สำเร็จ (ความเร็ว: ${latency}ms)`,
        };
        localStorage.setItem('solar_last_sync_success_supabase', new Date().toISOString());
      } catch (err: any) {
        const latency = Date.now() - sbStart;
        healthStatus.supabase = {
          status: 'error',
          latencyMs: latency,
          message: `เกิดข้อผิดพลาดกับ Supabase: ${err?.message || 'Unreachable'}`,
        };

        // Log Supabase connection failure
        dbManager.addErrorLog(
          'supabase',
          'Ping Failed',
          `การทดสอบเชื่อมต่อ Supabase ล้มเหลว: ${err?.message || 'ติดต่อไม่ได้'}`,
          autoFailover
        );
      }
    }

    this.recalculateActualProvider();
    this.notifySubscribers();
    return healthStatus;
  },

  // Perform multi-direction database replication & synchronization
  async syncDatabases(): Promise<{ success: boolean; stats: SyncStats }> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      throw new Error('ไม่สามารถซิงค์ฐานข้อมูลได้เนื่องจากอุปกรณ์อยู่ในโหมดออฟไลน์');
    }

    const toastId = toast.loading('กำลังเริ่มระบบจัดการและประสานข้อมูล (Multi-DB Replication Engine)...', {
      style: { borderRadius: '16px', fontSize: '13px', fontWeight: '700' }
    });

    const stats: SyncStats = {
      transactions: 0,
      customers: 0,
      appointments: 0,
      warranties: 0,
      quickNotes: 0,
    };

    try {
      // Ensure diagnostics are fresh
      await this.runDiagnostics();

      const firebaseActive = healthStatus.firebase.status === 'healthy';
      const supabaseActive = healthStatus.supabase.status === 'healthy';

      if (!firebaseActive) {
        throw new Error('ฐานข้อมูลหลัก Firebase ทำงานผิดพลาดหรือไม่สามารถติดต่อได้ในขณะนี้');
      }

      // 1. Load data from LocalStorage Fallback Queue
      let localTxQueue: any[] = [];
      try {
        localTxQueue = JSON.parse(localStorage.getItem('offline_transactions_queue') || '[]');
      } catch (e) {
        console.error('Failed to load local offline queue:', e);
      }

      // 2. Load all records from Firebase Firestore
      const fbTransactions = (await getDocs(collection(db, 'transactions'))).docs.map(d => ({ id: d.id, ...d.data() }));
      const fbCustomers = (await getDocs(collection(db, 'customers'))).docs.map(d => ({ id: d.id, ...d.data() }));
      const fbAppointments = (await getDocs(collection(db, 'appointments'))).docs.map(d => ({ id: d.id, ...d.data() }));
      const fbWarranties = (await getDocs(collection(db, 'warranties'))).docs.map(d => ({ id: d.id, ...d.data() }));
      const fbQuickNotes = (await getDocs(collection(db, 'quick_notes'))).docs.map(d => ({ id: d.id, ...d.data() }));

      // Map to unique maps
      const uniqueTxMap = new Map<string, any>();
      const uniqueCustomerMap = new Map<string, any>();
      const uniqueAppointmentMap = new Map<string, any>();
      const uniqueWarrantyMap = new Map<string, any>();
      const uniqueNoteMap = new Map<string, any>();

      // Populate unique maps from Firebase (Source of truth initially)
      fbTransactions.forEach(t => uniqueTxMap.set(t.id, t));
      fbCustomers.forEach(c => uniqueCustomerMap.set(c.id, c));
      fbAppointments.forEach(a => uniqueAppointmentMap.set(a.id, a));
      fbWarranties.forEach(w => uniqueWarrantyMap.set(w.id, w));
      fbQuickNotes.forEach(n => uniqueNoteMap.set(n.id, n));

      // Append from local queue
      localTxQueue.forEach(t => {
        if (t.id && !uniqueTxMap.has(t.id)) {
          uniqueTxMap.set(t.id, t);
          stats.transactions++;
        }
      });

      // 3. Load all records from Supabase (if active) and merge
      if (supabaseActive) {
        const client = getSupabase();
        if (client) {
          const { data: sbTx } = await client.from('transactions').select('*');
          const { data: sbCustomers } = await client.from('customers').select('*');
          const { data: sbAppointments } = await client.from('appointments').select('*');
          const { data: sbWarranties } = await client.from('warranties').select('*');
          const { data: sbNotes } = await client.from('quick_notes').select('*');

          if (sbTx) {
            sbTx.forEach(t => {
              if (!uniqueTxMap.has(t.id)) {
                uniqueTxMap.set(t.id, {
                  ...t,
                  amount: Number(t.amount),
                  date: t.date || new Date().toISOString(),
                });
                stats.transactions++;
              }
            });
          }

          if (sbCustomers) {
            sbCustomers.forEach(c => {
              if (!uniqueCustomerMap.has(c.id)) {
                uniqueCustomerMap.set(c.id, c);
                stats.customers++;
              }
            });
          }

          if (sbAppointments) {
            sbAppointments.forEach(a => {
              if (!uniqueAppointmentMap.has(a.id)) {
                uniqueAppointmentMap.set(a.id, a);
                stats.appointments++;
              }
            });
          }

          if (sbWarranties) {
            sbWarranties.forEach(w => {
              if (!uniqueWarrantyMap.has(w.id)) {
                uniqueWarrantyMap.set(w.id, w);
                stats.warranties++;
              }
            });
          }

          if (sbNotes) {
            sbNotes.forEach(n => {
              if (!uniqueNoteMap.has(n.id)) {
                uniqueNoteMap.set(n.id, n);
                stats.quickNotes++;
              }
            });
          }
        }
      }

      // 4. Propagate unique merged dataset back to Firebase Firestore
      const writeToFirebase = async (colName: string, itemsMap: Map<string, any>, existingIds: string[]) => {
        const batch = writeBatch(db);
        let writeCount = 0;

        for (const [id, item] of itemsMap.entries()) {
          if (!existingIds.includes(id)) {
            const cleanItem = { ...item };
            delete cleanItem.hasPendingWrites; // Clean out runtime flags
            
            const docRef = doc(db, colName, id);
            batch.set(docRef, JSON.parse(JSON.stringify(cleanItem)));
            writeCount++;
          }
        }
        if (writeCount > 0) {
          await batch.commit();
        }
      };

      await writeToFirebase('transactions', uniqueTxMap, fbTransactions.map(d => d.id));
      await writeToFirebase('customers', uniqueCustomerMap, fbCustomers.map(d => d.id));
      await writeToFirebase('appointments', uniqueAppointmentMap, fbAppointments.map(d => d.id));
      await writeToFirebase('warranties', uniqueWarrantyMap, fbWarranties.map(d => d.id));
      await writeToFirebase('quick_notes', uniqueNoteMap, fbQuickNotes.map(d => d.id));

      // 5. Propagate unique merged dataset back to Supabase PostgreSQL (if active)
      if (supabaseActive) {
        const client = getSupabase();
        if (client) {
          const syncToSupabase = async (tableName: string, itemsMap: Map<string, any>) => {
            const items = Array.from(itemsMap.values()).map(item => {
              const cleanItem = { ...item };
              delete cleanItem.hasPendingWrites;
              
              // Map JS camelCase variables to standard snake_case Supabase columns
              if (tableName === 'transactions') {
                return {
                  id: cleanItem.id,
                  type: cleanItem.type,
                  amount: cleanItem.amount || 0,
                  title: cleanItem.detail || cleanItem.category,
                  category: cleanItem.category,
                  date: cleanItem.date,
                  payment_method: cleanItem.paymentMethod,
                  customer_id: cleanItem.customerId,
                  customer_name: cleanItem.customerName,
                  notes: cleanItem.notes || '',
                  created_at: cleanItem.createdAt || cleanItem.date,
                };
              }

              if (tableName === 'quick_notes') {
                return {
                  id: cleanItem.id,
                  content: cleanItem.content,
                  color: cleanItem.color || 'blue',
                  is_pinned: cleanItem.isPinned || false,
                  created_at: cleanItem.createdAt,
                };
              }

              if (tableName === 'appointments') {
                return {
                  id: cleanItem.id,
                  title: cleanItem.title,
                  customer_name: cleanItem.customerName,
                  date: cleanItem.date,
                  time: cleanItem.time,
                  status: cleanItem.status,
                  location: cleanItem.location || '',
                  notes: cleanItem.notes || '',
                  created_at: cleanItem.createdAt || new Date().toISOString(),
                };
              }

              if (tableName === 'warranties') {
                return {
                  id: cleanItem.id,
                  product_name: cleanItem.productName,
                  serial_number: cleanItem.serialNumber,
                  customer_name: cleanItem.customerName,
                  start_date: cleanItem.startDate,
                  end_date: cleanItem.endDate,
                  status: cleanItem.status,
                  created_at: cleanItem.createdAt || new Date().toISOString(),
                };
              }

              if (tableName === 'customers') {
                return {
                  id: cleanItem.id,
                  name: cleanItem.name,
                  phone: cleanItem.phone,
                  email: cleanItem.email,
                  address: cleanItem.address,
                  tax_id: cleanItem.taxId,
                  notes: cleanItem.notes,
                  created_at: cleanItem.createdAt || new Date().toISOString(),
                };
              }

              return cleanItem;
            });

            if (items.length > 0) {
              const { error } = await client.from(tableName).upsert(items, { onConflict: 'id' });
              if (error) {
                console.error(`Failed to upsert to ${tableName}:`, error);
              }
            }
          };

          await syncToSupabase('transactions', uniqueTxMap);
          await syncToSupabase('customers', uniqueCustomerMap);
          await syncToSupabase('appointments', uniqueAppointmentMap);
          await syncToSupabase('warranties', uniqueWarrantyMap);
          await syncToSupabase('quick_notes', uniqueNoteMap);
        }
      }

      // 6. Clear local queued files after successful upload
      localStorage.setItem('offline_transactions_queue', '[]');

      // Update successful sync timestamps
      const nowStr = new Date().toISOString();
      localStorage.setItem('solar_last_sync_success_local', nowStr);
      localStorage.setItem('solar_last_sync_success_firebase', nowStr);
      if (supabaseActive) {
        localStorage.setItem('solar_last_sync_success_supabase', nowStr);
      }

      // 7. Re-calculate health and provider
      await this.runDiagnostics();

      toast.success('☁️ การซิงค์และผสานข้อมูลสมบูรณ์ครบทั้ง 3 ฐานข้อมูลแล้ว!', {
        id: toastId,
        duration: 4500,
        icon: '🛡️',
      });

      return { success: true, stats };
    } catch (err: any) {
      console.error('Database sync failed:', err);
      
      // Log this synchronization failure
      dbManager.addErrorLog(
        'firebase',
        'Sync Error',
        `การประสานฐานข้อมูลล้มเหลว: ${err?.message || 'ระบบขัดข้อง'}`,
        autoFailover
      );

      toast.error(`การซิงค์ข้อมูลล้มเหลว: ${err?.message || 'โปรดติดต่อผู้ดูแล'}`, {
        id: toastId,
        duration: 4000,
      });
      return { success: false, stats };
    }
  },

  // --- Dynamic Error Logger Helpers ---
  getErrorLogs(): DbSyncError[] {
    try {
      return JSON.parse(localStorage.getItem('solar_db_sync_errors') || '[]');
    } catch {
      return [];
    }
  },

  clearErrorLogs() {
    localStorage.setItem('solar_db_sync_errors', '[]');
    this.notifySubscribers();
  },

  addErrorLog(source: 'local' | 'firebase' | 'supabase' | 'network', errorType: string, errorMessage: string, autoFailoverTriggered: boolean) {
    try {
      const logs = this.getErrorLogs();
      const newLog: DbSyncError = {
        id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        source,
        errorType,
        errorMessage,
        autoFailoverTriggered,
      };
      
      // Keep up to 50 logs to prevent storage bloating
      const updatedLogs = [newLog, ...logs].slice(0, 50);
      localStorage.setItem('solar_db_sync_errors', JSON.stringify(updatedLogs));
      this.notifySubscribers();
    } catch (e) {
      console.error('Failed to save database error log:', e);
    }
  }
};

export interface DbSyncError {
  id: string;
  timestamp: string;
  source: 'local' | 'firebase' | 'supabase' | 'network';
  errorType: string;
  errorMessage: string;
  autoFailoverTriggered: boolean;
}

// Auto-trigger diagnostics on window load or state changes
if (typeof window !== 'undefined') {
  // Listen for online/offline events to trigger auto-failover dynamically
  window.addEventListener('online', () => {
    toast.success('อุปกรณ์ของคุณกลับมาออนไลน์แล้ว! กำลังเตรียมประเมินความพร้อมฐานข้อมูล...', { id: 'db-online-alert' });
    dbManager.runDiagnostics();
  });

  window.addEventListener('offline', () => {
    dbManager.runDiagnostics();
  });

  // Run first diagnostics check
  setTimeout(() => {
    dbManager.runDiagnostics();
  }, 1000);
}
