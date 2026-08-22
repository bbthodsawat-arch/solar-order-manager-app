import { doc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, ensureFirebaseUserProfile } from './firebase';
import { toast } from 'react-hot-toast';

export type DbProvider = 'local' | 'firebase';
export interface DbHealthStatus { local: { status: 'healthy' | 'warning'; message: string }; firebase: { status: 'healthy' | 'error' | 'offline'; latencyMs: number; message: string }; }
export interface SyncStats { transactions: number; customers: number; appointments: number; warranties: number; quickNotes: number; }
export interface DbSyncError { id: string; timestamp: string; source: 'local' | 'firebase' | 'network'; errorType: string; errorMessage: string; autoFailoverTriggered: boolean; }
type SubscriberCallback = (state: { preferredProvider: DbProvider; actualProvider: DbProvider; autoFailover: boolean; health: DbHealthStatus }) => void;

const subscribers = new Set<SubscriberCallback>();
const storedProvider = typeof localStorage !== 'undefined' ? localStorage.getItem('solar_preferred_database_mode') : null;
let preferredProvider: DbProvider = storedProvider === 'local' ? 'local' : 'firebase';
let actualProvider: DbProvider = 'firebase';
let healthStatus: DbHealthStatus = { local: { status: 'healthy', message: 'พร้อมใช้งานเป็น offline queue/cache' }, firebase: { status: 'healthy', latencyMs: 0, message: 'รอตรวจสอบการเชื่อมต่อ' } };
let queueFlushPromise: Promise<number> | null = null;
let authReadyPromise: Promise<boolean> | null = null;

function notifySubscribers() { const state = { preferredProvider, actualProvider, autoFailover: false, health: healthStatus }; subscribers.forEach(cb => { try { cb(state); } catch (err) { console.error('Database subscriber error:', err); } }); }
function recalculateActualProvider() { actualProvider = typeof navigator !== 'undefined' && !navigator.onLine ? 'local' : preferredProvider; }
function parseQueue(): any[] { try { const parsed = JSON.parse(localStorage.getItem('offline_transactions_queue') || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function persistQueue(items: any[]) { localStorage.setItem('offline_transactions_queue', JSON.stringify(items)); if (typeof window !== 'undefined') window.dispatchEvent(new Event('solar_offline_queue_changed')); }
function snapshotItem(item: any) { return JSON.stringify(item); }
function cleanTransaction(item: any) { const cleanItem = { ...item }; delete cleanItem.id; delete cleanItem.hasPendingWrites; return JSON.parse(JSON.stringify(cleanItem)); }
function mutateQueue(mutator: (items: any[]) => any[]) { const next = mutator(parseQueue()); persistQueue(next); return next; }
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> { return new Promise<T>((resolve, reject) => { const timer = window.setTimeout(() => reject(new Error(`${label} ใช้เวลานานเกิน ${Math.round(timeoutMs / 1000)} วินาที — ข้อมูลยังอยู่ในคิวและจะลองใหม่อัตโนมัติ`)), timeoutMs); promise.then(v => { window.clearTimeout(timer); resolve(v); }, e => { window.clearTimeout(timer); reject(e); }); }); }

async function waitForAuthReady(timeoutMs = 5000): Promise<boolean> {
  if (auth.currentUser) return true;
  if (!authReadyPromise) authReadyPromise = new Promise<boolean>((resolve) => {
    let unsubscribe: (() => void) | undefined;
    const finish = (value: boolean) => { if (unsubscribe) unsubscribe(); resolve(value); };
    const timeout = window.setTimeout(() => finish(Boolean(auth.currentUser)), timeoutMs);
    unsubscribe = onAuthStateChanged(auth, user => { window.clearTimeout(timeout); finish(Boolean(user)); });
  }).finally(() => { authReadyPromise = null; });
  return authReadyPromise;
}

/** Auth alone is not enough: Firestore rules derive transaction permissions from users/{uid}.
 * Always provision/read that profile synchronously before any write or auto-flush. */
async function waitForFirestoreWriteAccess(): Promise<void> {
  const signedIn = await waitForAuthReady();
  const user = auth.currentUser;
  if (!signedIn || !user) throw new Error('Firebase Authentication ยังไม่พร้อมใช้งาน');
  await ensureFirebaseUserProfile(user);
}

async function flushOfflineTransactionQueue(): Promise<number> {
  if (queueFlushPromise) return queueFlushPromise;
  queueFlushPromise = (async () => {
    // The provisioning await is inside the shared coordinator so manual sync,
    // reconnect and startup sync all obey the same permission-ready barrier.
    await waitForFirestoreWriteAccess();
    const localQueue = parseQueue().filter(item => item?.id);
    if (!localQueue.length) return 0;
    const snapshotById = new Map(localQueue.map(item => [String(item.id), snapshotItem(item)]));
    let count = 0;
    for (let start = 0; start < localQueue.length; start += 450) {
      const chunk = localQueue.slice(start, start + 450);
      const batch = writeBatch(db);
      for (const item of chunk) batch.set(doc(db, 'transactions', String(item.id)), cleanTransaction(item), { merge: true });
      await withTimeout(batch.commit(), 15000, `การซิงค์ Firestore ชุดที่ ${Math.floor(start / 450) + 1}`);
      count += chunk.length;
    }
    const latestQueue = parseQueue();
    persistQueue(latestQueue.filter(item => snapshotById.get(String(item?.id)) !== snapshotItem(item)));
    return count;
  })().finally(() => { queueFlushPromise = null; });
  return queueFlushPromise;
}

export const dbManager = {
  getPreferredProvider(): DbProvider { return preferredProvider; }, getActualProvider(): DbProvider { return actualProvider; }, isAutoFailoverEnabled(): boolean { return false; }, getHealthStatus(): DbHealthStatus { return healthStatus; },
  getLastSyncSuccessTimestamps(): { local: string | null; firebase: string | null } { return { local: localStorage.getItem('solar_last_sync_success_local'), firebase: localStorage.getItem('solar_last_sync_success_firebase') }; },
  readOfflineQueue<T = any>(): T[] { return parseQueue() as T[]; },
  enqueueOfflineTransaction<T extends { id?: string }>(item: T): T[] { if (!item.id) throw new Error('Offline transaction requires an ID'); return mutateQueue(items => [...items.filter(existing => String(existing?.id) !== String(item.id)), item]) as T[]; },
  updateOfflineQueueTransaction<T extends { id?: string }>(id: string, updates: Partial<T>): T[] { return mutateQueue(items => items.map(item => String(item?.id) === id ? { ...item, ...updates } : item)) as T[]; },
  removeOfflineQueueTransaction<T = any>(id: string): T[] { return mutateQueue(items => items.filter(item => String(item?.id) !== id)) as T[]; }, clearOfflineQueue() { persistQueue([]); },
  setPreferredProvider(provider: DbProvider) { preferredProvider = provider === 'local' ? 'local' : 'firebase'; localStorage.setItem('solar_preferred_database_mode', preferredProvider); recalculateActualProvider(); notifySubscribers(); },
  setAutoFailover(_enabled: boolean) { localStorage.setItem('solar_auto_failover_enabled', 'false'); notifySubscribers(); },
  subscribe(callback: SubscriberCallback) { subscribers.add(callback); callback({ preferredProvider, actualProvider, autoFailover: false, health: healthStatus }); return () => subscribers.delete(callback); },
  async runDiagnostics(): Promise<DbHealthStatus> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    healthStatus.local = { status: 'healthy', message: `Offline queue พร้อมใช้งาน (${parseQueue().length} รายการ)` };
    if (!isOnline) { healthStatus.firebase = { status: 'offline', latencyMs: 0, message: 'อุปกรณ์ออฟไลน์ — รอซิงค์เมื่อกลับมาออนไลน์' }; actualProvider = 'local'; notifySubscribers(); return healthStatus; }
    const started = Date.now();
    try {
      await waitForFirestoreWriteAccess();
      healthStatus.firebase = { status: 'healthy', latencyMs: Date.now() - started, message: 'Firebase session และสิทธิ์ Firestore พร้อมซิงค์ข้อมูล' }; actualProvider = 'firebase';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      healthStatus.firebase = { status: 'error', latencyMs: Date.now() - started, message }; actualProvider = 'local'; this.addErrorLog('firebase', 'Authentication / Permission Required', message, false);
    }
    notifySubscribers(); return healthStatus;
  },
  async flushOfflineQueue(): Promise<number> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('อุปกรณ์ออฟไลน์: รอการเชื่อมต่ออินเทอร์เน็ตก่อนซิงค์');
    const count = await flushOfflineTransactionQueue();
    healthStatus.firebase = { status: 'healthy', latencyMs: healthStatus.firebase.latencyMs, message: count > 0 ? `ซิงค์สำเร็จ ${count} รายการ` : 'ไม่มีรายการค้างสำหรับซิงค์' };
    actualProvider = 'firebase';
    if (count > 0) { const now = new Date().toISOString(); localStorage.setItem('solar_last_sync_success_local', now); localStorage.setItem('solar_last_sync_success_firebase', now); }
    notifySubscribers(); return count;
  },
  async syncDatabases(): Promise<{ success: boolean; stats: SyncStats }> {
    const stats: SyncStats = { transactions: 0, customers: 0, appointments: 0, warranties: 0, quickNotes: 0 };
    const toastId = toast.loading('กำลังซิงค์ข้อมูลกับ Firebase Firestore...');
    try { stats.transactions = await this.flushOfflineQueue(); toast.success(stats.transactions > 0 ? `☁️ ซิงค์สำเร็จ ${stats.transactions} รายการ` : '☁️ ไม่มีรายการค้างสำหรับซิงค์', { id: toastId }); return { success: true, stats }; }
    catch (error: any) { const message = error?.message || 'ระบบขัดข้อง'; this.addErrorLog('firebase', 'Sync Error', message, false); healthStatus.firebase = { status: 'error', latencyMs: healthStatus.firebase.latencyMs, message }; actualProvider = 'local'; notifySubscribers(); toast.error(`การซิงค์ Firebase ล้มเหลว: ${message}`, { id: toastId }); return { success: false, stats }; }
  },
  getErrorLogs(): DbSyncError[] { try { return JSON.parse(localStorage.getItem('solar_db_sync_errors') || '[]'); } catch { return []; } },
  clearErrorLogs() { localStorage.setItem('solar_db_sync_errors', '[]'); notifySubscribers(); },
  addErrorLog(source: DbSyncError['source'], errorType: string, errorMessage: string, autoFailoverTriggered: boolean) { try { const logs = this.getErrorLogs(); const entry: DbSyncError = { id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, timestamp: new Date().toISOString(), source, errorType, errorMessage, autoFailoverTriggered }; localStorage.setItem('solar_db_sync_errors', JSON.stringify([entry, ...logs].slice(0, 50))); notifySubscribers(); } catch (error) { console.error('Failed to save database error log:', error); } },
};

if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, user => { if (user && navigator.onLine) void dbManager.flushOfflineQueue().catch(error => dbManager.addErrorLog('firebase', 'Automatic Queue Flush Failed', error instanceof Error ? error.message : String(error), false)); });
  window.addEventListener('online', () => { void dbManager.flushOfflineQueue().catch(error => dbManager.addErrorLog('network', 'Automatic Queue Flush Failed', error instanceof Error ? error.message : String(error), false)); });
  window.addEventListener('offline', () => { void dbManager.runDiagnostics(); });
  setTimeout(() => { void dbManager.flushOfflineQueue().catch(() => undefined); }, 1000);
}
