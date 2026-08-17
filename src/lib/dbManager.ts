import { toast } from 'react-hot-toast';
import { collection, getDocs } from './firestore-compat';
import { db, isFirebaseConfigured } from './firebase';

export type DbProvider = 'local' | 'firebase' | 'supabase';
export interface DbHealthStatus {
  local: { status: 'healthy' | 'warning'; message: string };
  firebase: { status: 'healthy' | 'error' | 'offline'; latencyMs: number; message: string };
  supabase: { status: 'unconfigured'; latencyMs: number; message: string };
}
export interface SyncStats { transactions: number; customers: number; appointments: number; warranties: number; quickNotes: number; }
export interface DbSyncError { id: string; source: 'local' | 'firebase' | 'supabase' | 'network'; errorType: string; errorMessage: string; timestamp: string; autoFailoverTriggered: boolean; }

type SubscriberCallback = (state: { preferredProvider: DbProvider; actualProvider: DbProvider; autoFailover: boolean; health: DbHealthStatus }) => void;
const subscribers = new Set<SubscriberCallback>();
const ERROR_LOG_KEY = 'solar_db_error_logs';
let preferredProvider: DbProvider = 'firebase';
let actualProvider: DbProvider = 'firebase';
let autoFailover = true;
let healthStatus: DbHealthStatus = {
  local: { status: 'healthy', message: 'LocalStorage พร้อมใช้งานเป็น offline cache' },
  firebase: { status: isFirebaseConfigured() ? 'healthy' : 'error', latencyMs: 0, message: isFirebaseConfigured() ? 'Firebase พร้อมใช้งาน' : 'ยังไม่ได้ตั้งค่า Firebase' },
  supabase: { status: 'unconfigured', latencyMs: 0, message: 'Supabase ถูกปิดใช้งาน — SOM ใช้ Firebase/Firestore เป็นฐานข้อมูลหลัก' },
};

const notify = () => subscribers.forEach(cb => cb({ preferredProvider, actualProvider, autoFailover, health: healthStatus }));
const readErrorLogs = (): DbSyncError[] => {
  try { return JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]'); } catch { return []; }
};
const writeErrorLogs = (logs: DbSyncError[]) => localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs.slice(-200)));

export const dbManager = {
  getPreferredProvider: () => preferredProvider,
  getActualProvider: () => actualProvider,
  isAutoFailoverEnabled: () => autoFailover,
  getHealthStatus: () => healthStatus,
  getLastSyncSuccessTimestamps: () => ({ local: localStorage.getItem('solar_last_sync_success_local'), firebase: localStorage.getItem('solar_last_sync_success_firebase'), supabase: null }),
  getErrorLogs: () => readErrorLogs(),
  clearErrorLogs: () => { localStorage.removeItem(ERROR_LOG_KEY); notify(); },
  setPreferredProvider(provider: DbProvider) {
    preferredProvider = provider === 'local' ? 'local' : 'firebase';
    actualProvider = preferredProvider;
    localStorage.setItem('solar_preferred_database_mode', actualProvider);
    notify();
  },
  setAutoFailover(enabled: boolean) { autoFailover = enabled; localStorage.setItem('solar_auto_failover_enabled', String(enabled)); notify(); },
  subscribe(callback: SubscriberCallback) { subscribers.add(callback); callback({ preferredProvider, actualProvider, autoFailover, health: healthStatus }); return () => subscribers.delete(callback); },
  recalculateActualProvider() {
    actualProvider = typeof navigator !== 'undefined' && !navigator.onLine ? 'local' : (preferredProvider === 'local' ? 'local' : 'firebase');
    notify();
  },
  async runDiagnostics(): Promise<DbHealthStatus> {
    healthStatus.local = { status: 'healthy', message: 'LocalStorage พร้อมใช้งานเป็น offline cache' };
    localStorage.setItem('solar_last_sync_success_local', new Date().toISOString());
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      healthStatus.firebase = { status: 'offline', latencyMs: 0, message: 'ออฟไลน์' };
    } else if (!isFirebaseConfigured() || !db) {
      healthStatus.firebase = { status: 'error', latencyMs: 0, message: 'ยังไม่ได้ตั้งค่า Firebase' };
    } else {
      const started = performance.now();
      try {
        await getDocs(collection(db, '__healthcheck'));
        const latencyMs = Math.round(performance.now() - started);
        healthStatus.firebase = { status: 'healthy', latencyMs, message: 'Firebase/Firestore เชื่อมต่อสำเร็จ' };
        localStorage.setItem('solar_last_sync_success_firebase', new Date().toISOString());
      } catch (error) {
        const latencyMs = Math.round(performance.now() - started);
        healthStatus.firebase = { status: 'error', latencyMs, message: error instanceof Error ? error.message : String(error) };
      }
    }
    healthStatus.supabase = { status: 'unconfigured', latencyMs: 0, message: 'Supabase ถูกปิดใช้งาน — SOM ใช้ Firebase/Firestore เป็นฐานข้อมูลหลัก' };
    this.recalculateActualProvider();
    return healthStatus;
  },
  async syncDatabases(): Promise<{ success: boolean; stats: SyncStats }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('ไม่สามารถซิงค์ขณะออฟไลน์ได้');
    const health = await this.runDiagnostics();
    if (health.firebase.status !== 'healthy') throw new Error(health.firebase.message);
    const stats: SyncStats = { transactions: 0, customers: 0, appointments: 0, warranties: 0, quickNotes: 0 };
    const collections: Record<keyof SyncStats, string> = { transactions: 'transactions', customers: 'customers', appointments: 'appointments', warranties: 'warranties', quickNotes: 'quick_notes' };
    for (const key of Object.keys(collections) as (keyof SyncStats)[]) {
      const snapshot = await getDocs(collection(db, collections[key]));
      stats[key] = snapshot.size;
    }
    localStorage.setItem('solar_last_sync_success_firebase', new Date().toISOString());
    toast.success('Firebase/Firestore ซิงค์และตรวจสอบข้อมูลเรียบร้อยแล้ว');
    return { success: true, stats };
  },
  addErrorLog(provider: string, operation: string, message: string, failover: boolean) {
    const source: DbSyncError['source'] = provider === 'firebase' || provider === 'supabase' || provider === 'local' ? provider : 'network';
    const entry: DbSyncError = { id: crypto.randomUUID(), source, errorType: operation, errorMessage: message, timestamp: new Date().toISOString(), autoFailoverTriggered: failover };
    writeErrorLogs([...readErrorLogs(), entry]);
    console.error(`[${provider}] ${operation}: ${message}`, { failover });
    notify();
  },
};
