import React, { useState } from 'react';
import { Database, HardDrive, Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { notifyReaction } from '../utils/feedback';
import { toast } from 'react-hot-toast';

export default function DatabaseManager() {
  const { preferredProvider, actualProvider, health, isSyncing, setPreferredProvider, runDiagnostics, syncDatabases } = useDatabase();
  const isOnline = useNetworkStatus();
  const [running, setRunning] = useState(false);
  const [lastSync, setLastSync] = useState<{ transactions: number; customers: number; appointments: number; warranties: number; quickNotes: number } | null>(null);

  const diagnostics = async () => {
    setRunning(true);
    try {
      await runDiagnostics();
      notifyReaction('success', 'ตรวจสอบ LocalStorage และ Supabase สำเร็จ');
    } catch (e: any) {
      toast.error(`ตรวจสอบฐานข้อมูลไม่สำเร็จ: ${e?.message || 'Unknown error'}`);
    } finally {
      setRunning(false);
    }
  };

  const sync = async () => {
    try {
      const result = await syncDatabases();
      setLastSync(result.stats);
      notifyReaction('success', 'ตรวจสอบข้อมูลบน Supabase สำเร็จ');
    } catch (e: any) {
      toast.error(`Supabase sync failed: ${e?.message || 'Unknown error'}`);
    }
  };

  const supabaseHealthy = health.supabase.status === 'healthy';

  return (
    <div className="space-y-6">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><Database size={12}/> DATABASE MANAGER ACTIVE</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border border-white/10 text-slate-300">{isOnline ? <Wifi size={12}/> : <WifiOff size={12}/>} {isOnline ? 'Network: Online' : 'Network: Offline'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">Database Connection Manager</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">Supabase PostgreSQL เป็น Cloud Database หลัก และ LocalStorage ใช้เป็น offline cache เท่านั้น</p>
          </div>
          <button onClick={diagnostics} disabled={running} className="px-5 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 border border-white/10 rounded-2xl text-xs font-black flex items-center gap-2">
            <RefreshCw size={14} className={running ? 'animate-spin' : ''}/>{running ? 'กำลังตรวจสอบ...' : 'ทดสอบการเชื่อมต่อ'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button onClick={() => setPreferredProvider('local')} className={`text-left p-6 rounded-3xl border-2 transition-all ${preferredProvider === 'local' ? 'border-amber-500 bg-amber-500/5' : 'border-slate-200 dark:border-slate-800'}`}>
          <div className="flex items-start justify-between"><div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500"><HardDrive size={22}/></div><span className="text-[9px] font-black px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">OFFLINE CACHE</span></div>
          <h3 className="mt-4 text-sm font-black">LocalStorage</h3>
          <p className="mt-1 text-xs text-slate-500">ใช้สำหรับการทำงานออฟไลน์และ cache บนอุปกรณ์ ไม่ใช่ฐานข้อมูล Cloud หลัก</p>
          <div className="mt-4 text-xs font-bold text-emerald-500">{health.local.status === 'healthy' ? 'พร้อมใช้งาน' : 'ตรวจสอบ'}</div>
        </button>

        <button onClick={() => setPreferredProvider('supabase')} className={`text-left p-6 rounded-3xl border-2 transition-all ${preferredProvider === 'supabase' ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-200 dark:border-slate-800'}`}>
          <div className="flex items-start justify-between"><div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500"><Zap size={22}/></div><span className="text-[9px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">PRIMARY CLOUD</span></div>
          <h3 className="mt-4 text-sm font-black">Supabase PostgreSQL</h3>
          <p className="mt-1 text-xs text-slate-500">ฐานข้อมูลหลักของ SOM และระบบ Authentication ผ่าน Supabase Auth</p>
          <div className={`mt-4 text-xs font-bold flex items-center gap-1 ${supabaseHealthy ? 'text-emerald-500' : 'text-rose-500'}`}>
            {supabaseHealthy ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>} {health.supabase.message}
          </div>
        </button>
      </div>

      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><h3 className="font-black">Supabase Data Verification</h3><p className="text-xs text-slate-500 mt-1">ตรวจจำนวนข้อมูลจากตารางหลักโดยตรง</p></div>
          <button onClick={sync} disabled={isSyncing || !isOnline} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black disabled:opacity-50 flex items-center gap-2"><RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''}/> ตรวจสอบข้อมูล</button>
        </div>
        {lastSync && <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">{Object.entries(lastSync).map(([key, value]) => <div key={key} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800"><div className="text-[10px] text-slate-500">{key}</div><div className="text-lg font-black">{value}</div></div>)}</div>}
        <div className="mt-5 text-[11px] text-slate-500">Active provider: <strong>{actualProvider}</strong></div>
      </div>
    </div>
  );
}
