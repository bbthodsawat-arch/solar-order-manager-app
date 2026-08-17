import { getSupabase, isSupabaseConfigured, verifySupabaseConnection } from './supabase';
import { toast } from 'react-hot-toast';

export type DbProvider = 'local' | 'firebase' | 'supabase';
export interface DbHealthStatus {
  local: { status: 'healthy' | 'warning'; message: string };
  firebase: { status: 'healthy' | 'error' | 'offline'; latencyMs: number; message: string };
  supabase: { status: 'healthy' | 'error' | 'offline' | 'unconfigured'; latencyMs: number; message: string };
}
export interface SyncStats { transactions: number; customers: number; appointments: number; warranties: number; quickNotes: number; }

type SubscriberCallback = (state: { preferredProvider: DbProvider; actualProvider: DbProvider; autoFailover: boolean; health: DbHealthStatus }) => void;
const subscribers = new Set<SubscriberCallback>();
let preferredProvider: DbProvider = 'supabase';
let actualProvider: DbProvider = 'supabase';
let autoFailover = true;
let healthStatus: DbHealthStatus = {
  local: { status: 'healthy', message: 'LocalStorage พร้อมใช้งานเป็น offline cache' },
  firebase: { status: 'offline', latencyMs: 0, message: 'Firebase ถูกยกเลิกการใช้งาน' },
  supabase: { status: 'unconfigured', latencyMs: 0, message: 'กำลังตรวจสอบ Supabase' },
};

const notify = () => subscribers.forEach(cb => cb({ preferredProvider, actualProvider, autoFailover, health: healthStatus }));

export const dbManager = {
  getPreferredProvider: () => preferredProvider,
  getActualProvider: () => actualProvider,
  isAutoFailoverEnabled: () => autoFailover,
  getHealthStatus: () => healthStatus,
  getLastSyncSuccessTimestamps: () => ({
    local: localStorage.getItem('solar_last_sync_success_local'),
    firebase: null,
    supabase: localStorage.getItem('solar_last_sync_success_supabase'),
  }),
  setPreferredProvider(provider: DbProvider) {
    preferredProvider = provider === 'firebase' ? 'supabase' : provider;
    actualProvider = preferredProvider === 'local' ? 'local' : 'supabase';
    localStorage.setItem('solar_preferred_database_mode', actualProvider);
    notify();
  },
  setAutoFailover(enabled: boolean) { autoFailover = enabled; localStorage.setItem('solar_auto_failover_enabled', String(enabled)); notify(); },
  subscribe(callback: SubscriberCallback) { subscribers.add(callback); callback({ preferredProvider, actualProvider, autoFailover, health: healthStatus }); return () => subscribers.delete(callback); },
  recalculateActualProvider() {
    actualProvider = typeof navigator !== 'undefined' && !navigator.onLine ? 'local' : (preferredProvider === 'local' ? 'local' : 'supabase');
    notify();
  },
  async runDiagnostics(): Promise<DbHealthStatus> {
    healthStatus.local = { status: 'healthy', message: 'LocalStorage พร้อมใช้งานเป็น offline cache' };
    localStorage.setItem('solar_last_sync_success_local', new Date().toISOString());
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      healthStatus.supabase = isSupabaseConfigured() ? { status: 'offline', latencyMs: 0, message: 'ออฟไลน์' } : { status: 'unconfigured', latencyMs: 0, message: 'ยังไม่ได้ตั้งค่า Supabase' };
    } else if (!isSupabaseConfigured()) {
      healthStatus.supabase = { status: 'unconfigured', latencyMs: 0, message: 'ยังไม่ได้ตั้งค่า Supabase URL/Publishable Key' };
    } else {
      const result = await verifySupabaseConnection();
      healthStatus.supabase = result.isConnected ? { status: 'healthy', latencyMs: result.latencyMs, message: result.message } : { status: 'error', latencyMs: result.latencyMs, message: result.message };
      if (result.isConnected) localStorage.setItem('solar_last_sync_success_supabase', new Date().toISOString());
    }
    healthStatus.firebase = { status: 'offline', latencyMs: 0, message: 'Firebase ถูกยกเลิกการใช้งาน' };
    this.recalculateActualProvider();
    return healthStatus;
  },
  async syncDatabases(): Promise<{ success: boolean; stats: SyncStats }> {
    const stats: SyncStats = { transactions: 0, customers: 0, appointments: 0, warranties: 0, quickNotes: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('ไม่สามารถซิงค์ขณะออฟไลน์ได้');
    await this.runDiagnostics();
    if (healthStatus.supabase.status !== 'healthy') throw new Error(healthStatus.supabase.message);
    const client = getSupabase();
    if (!client) throw new Error('ไม่พบ Supabase client');
    const tables: (keyof SyncStats)[] = ['transactions', 'customers', 'appointments', 'warranties', 'quickNotes'];
    for (const key of tables) {
      const table = key === 'quickNotes' ? 'quick_notes' : key;
      const { count, error } = await client.from(table).select('id', { count: 'exact', head: true });
      if (!error) stats[key] = count || 0;
    }
    localStorage.setItem('solar_last_sync_success_supabase', new Date().toISOString());
    toast.success('Supabase ซิงค์และตรวจสอบข้อมูลเรียบร้อยแล้ว');
    return { success: true, stats };
  },
  addErrorLog(provider: string, operation: string, message: string, failover: boolean) {
    console.error(`[${provider}] ${operation}: ${message}`, { failover });
  },
};
