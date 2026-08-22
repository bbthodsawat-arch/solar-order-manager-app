import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { toast } from 'react-hot-toast';

export type DbProvider = 'local' | 'firebase';
export interface DbHealthStatus {
  local: { status: 'healthy' | 'warning'; message: string };
  firebase: { status: 'healthy' | 'error' | 'offline'; latencyMs: number; message: string };
}
export interface SyncStats { transactions: number; customers: number; appointments: number; warranties: number; quickNotes: number; }
export interface DbSyncError { id: string; timestamp: string; source: 'local' | 'firebase' | 'network'; errorType: string; errorMessage: string; autoFailoverTriggered: boolean; }

type SubscriberCallback = (state: { preferredProvider: DbProvider; actualProvider: DbProvider; autoFailover: boolean; health: DbHealthStatus }) => void;
const subscribers = new Set<SubscriberCallback>();
const storedProvider = typeof localStorage !== 'undefined' ? localStorage.getItem('solar_preferred_database_mode') : null;
let preferredProvider: DbProvider = storedProvider === 'local' ? 'local' : 'firebase';
let actualProvider: DbProvider = 'firebase';
let healthStatus: DbHealthStatus = {
  local: { status: 'healthy', message: 'พร้อมใช้งานเป็น offline queue/cache' },
  firebase: { status: 'healthy', latencyMs: 0, message: 'รอตรวจสอบการเชื่อมต่อ' },
};
let queueFlushPromise: Promise<number> | null = null;

function notifySubscribers() { const state = { preferredProvider, actualProvider, autoFailover: false, health: healthStatus }; subscribers.forEach(cb => { try { cb(state); } catch (err) { console.error('Database subscriber error:', err); } }); }
function recalculateActualProvider() { actualProvider = typeof navigator !== 'undefined' && !navigator.onLine ? 'local' : preferredProvider; }
function parseQueue(): any[] { try { return JSON.parse(localStorage.getItem('offline_transactions_queue') || '[]'); } catch { return []; } }

/** Flushes the shared transaction queue with deterministic document IDs.
 * Repeated/concurrent attempts are idempotent because every queued item keeps its local ID.
 */
async function flushOfflineTransactionQueue(): Promise<number> {
  if (queueFlushPromise) return queueFlushPromise;
  queueFlushPromise = (async () => {
    const localQueue = parseQueue();
    if (!localQueue.length) return 0;
    const batch = writeBatch(db);
    let count = 0;
    for (const item of localQueue) {
      if (!item?.id) continue;
      const cleanItem = { ...item };
      delete cleanItem.id;
      delete cleanItem.hasPendingWrites;
      batch.set(doc(db, 'transactions', String(item.id)), JSON.parse(JSON.stringify(cleanItem)), { merge: true });
      count++;
    }
    await batch.commit();
    localStorage.setItem('offline_transactions_queue', '[]');
    window.dispatchEvent(new Event('solar_offline_queue_changed'));
    return count;
  })().finally(() => { queueFlushPromise = null; });
  return queueFlushPromise;
}

export const dbManager = {
  getPreferredProvider(): DbProvider { return preferredProvider; },
  getActualProvider(): DbProvider { return actualProvider; },
  isAutoFailoverEnabled(): boolean { return false; },
  getHealthStatus(): DbHealthStatus { return healthStatus; },
  getLastSyncSuccessTimestamps(): { local: string | null; firebase: string | null } { return { local: localStorage.getItem('solar_last_sync_success_local'), firebase: localStorage.getItem('solar_last_sync_success_firebase') }; },
  setPreferredProvider(provider: DbProvider) { preferredProvider = provider === 'local' ? 'local' : 'firebase'; localStorage.setItem('solar_preferred_database_mode', preferredProvider); recalculateActualProvider(); notifySubscribers(); },
  setAutoFailover(_enabled: boolean) { localStorage.setItem('solar_auto_failover_enabled', 'false'); notifySubscribers(); },
  subscribe(callback: SubscriberCallback) { subscribers.add(callback); callback({ preferredProvider, actualProvider, autoFailover: false, health: healthStatus }); return () => subscribers.delete(callback); },
  async runDiagnostics(): Promise<DbHealthStatus> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    healthStatus.local = { status: 'healthy', message: `Offline queue พร้อมใช้งาน (${parseQueue().length} รายการ)` };
    if (!isOnline) { healthStatus.firebase = { status: 'offline', latencyMs: 0, message: 'อุปกรณ์ออฟไลน์ — ใช้ Firebase SDK offline queue/cache' }; actualProvider = 'local'; notifySubscribers(); return healthStatus; }
    const started = Date.now();
    try {
      await getDoc(doc(db, 'config', 'app'));
      const latencyMs = Date.now() - started;
      healthStatus.firebase = { status: 'healthy', latencyMs, message: `เชื่อมต่อ Firebase Firestore สำเร็จ (${latencyMs}ms)` };
      localStorage.setItem('solar_last_sync_success_firebase', new Date().toISOString());
      actualProvider = 'firebase';
    } catch (error: any) {
      const latencyMs = Date.now() - started;
      healthStatus.firebase = { status: 'error', latencyMs, message: `Firebase error: ${error?.message || 'Unreachable'}` };
      actualProvider = 'local';
      this.addErrorLog('firebase', 'Ping Failed', healthStatus.firebase.message, false);
    }
    notifySubscribers(); return healthStatus;
  },
  async flushOfflineQueue(): Promise<number> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;
    await this.runDiagnostics();
    if (healthStatus.firebase.status !== 'healthy') throw new Error('Firebase Firestore ไม่พร้อมใช้งาน');
    const count = await flushOfflineTransactionQueue();
    if (count > 0) {
      localStorage.setItem('solar_last_sync_success_local', new Date().toISOString());
      localStorage.setItem('solar_last_sync_success_firebase', new Date().toISOString());
    }
    return count;
  },
  async syncDatabases(): Promise<{ success: boolean; stats: SyncStats }> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const stats: SyncStats = { transactions: 0, customers: 0, appointments: 0, warranties: 0, quickNotes: 0 };
    if (!isOnline) throw new Error('อุปกรณ์ออฟไลน์: Firestore SDK จะเก็บงานไว้ใน offline queue/cache');
    const toastId = toast.loading('กำลังซิงค์ข้อมูลกับ Firebase Firestore...');
    try {
      stats.transactions = await this.flushOfflineQueue();
      await this.runDiagnostics();
      toast.success('☁️ ซิงค์กับ Firebase Firestore สำเร็จ', { id: toastId });
      return { success: true, stats };
    } catch (error: any) {
      const message = error?.message || 'ระบบขัดข้อง';
      this.addErrorLog('firebase', 'Sync Error', message, false);
      toast.error(`การซิงค์ Firebase ล้มเหลว: ${message}`, { id: toastId });
      return { success: false, stats };
    }
  },
  getErrorLogs(): DbSyncError[] { try { return JSON.parse(localStorage.getItem('solar_db_sync_errors') || '[]'); } catch { return []; } },
  clearErrorLogs() { localStorage.setItem('solar_db_sync_errors', '[]'); notifySubscribers(); },
  addErrorLog(source: DbSyncError['source'], errorType: string, errorMessage: string, autoFailoverTriggered: boolean) {
    try {
      const logs = this.getErrorLogs();
      const newLog: DbSyncError = { id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, timestamp: new Date().toISOString(), source, errorType, errorMessage, autoFailoverTriggered };
      localStorage.setItem('solar_db_sync_errors', JSON.stringify([newLog, ...logs].slice(0, 50)));
      notifySubscribers();
    } catch (error) { console.error('Failed to save database error log:', error); }
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void dbManager.runDiagnostics().then(() => dbManager.flushOfflineQueue()).catch((error) => {
      dbManager.addErrorLog('network', 'Automatic Queue Flush Failed', error instanceof Error ? error.message : String(error), false);
    });
  });
  window.addEventListener('offline', () => { void dbManager.runDiagnostics(); });
  setTimeout(() => { void dbManager.runDiagnostics().then(() => dbManager.flushOfflineQueue()).catch(() => undefined); }, 1000);
}
