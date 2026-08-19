import React, { useState } from 'react';
import { Database, HardDrive, Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { notifyReaction } from '../utils/feedback';
import { toast } from 'react-hot-toast';

export default function DatabaseManager() {
  const { preferredProvider, actualProvider, health, isSyncing, setPreferredProvider, runDiagnostics, syncDatabases } = useDatabase();
  const isOnline = useNetworkStatus();
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [lastSyncStats, setLastSyncStats] = useState<any>(null);

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try { await runDiagnostics(); notifyReaction('success', 'ตรวจสอบ Firebase/Firestore สำเร็จ'); }
    catch (e: any) { toast.error(e?.message || 'ตรวจสอบการเชื่อมต่อล้มเหลว'); }
    finally { setIsRunningDiagnostics(false); }
  };
  const handleSync = async () => {
    if (isSyncing) return;
    try { const result = await syncDatabases(); if (result.success) { setLastSyncStats(result.stats); notifyReaction('success', 'ซิงค์ข้อมูลกับ Firebase Firestore สำเร็จ'); } }
    catch (e: any) { toast.error(e?.message || 'การซิงค์ล้มเหลว'); }
  };

  return <div className="space-y-6">
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><Database size={12}/> FIREBASE DATABASE MANAGER</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{isOnline ? <Wifi size={12}/> : <WifiOff size={12}/>} {isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Firebase / Firestore Database Manager</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-2xl">Firebase/Firestore เป็นฐานข้อมูลคลาวด์เพียงตัวเดียวของ SOM ส่วน LocalStorage ใช้เป็นคิวออฟไลน์และแคชเท่านั้น</p>
        </div>
        <button onClick={handleRunDiagnostics} disabled={isRunningDiagnostics} className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-xs font-black flex items-center gap-2"><RefreshCw size={14} className={isRunningDiagnostics ? 'animate-spin' : ''}/>{isRunningDiagnostics ? 'กำลังตรวจ...' : 'ตรวจสอบการเชื่อมต่อ'}</button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <button onClick={() => setPreferredProvider('local')} className={`text-left p-6 rounded-3xl border-2 ${preferredProvider === 'local' ? 'border-amber-500 bg-amber-500/5' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
        <div className="flex items-center justify-between"><HardDrive size={24}/><span className="text-xs font-black">LOCAL OFFLINE QUEUE</span></div><h3 className="font-black mt-5">LocalStorage</h3><p className="text-xs text-slate-500 mt-1">ใช้เก็บคิวออฟไลน์ชั่วคราว ไม่ใช่ฐานข้อมูลหลัก</p>{actualProvider === 'local' && <span className="inline-block mt-4 text-[10px] font-black px-2 py-1 rounded-full bg-amber-500 text-white">ACTIVE OFFLINE</span>}
      </button>
      <button onClick={() => setPreferredProvider('firebase')} className={`text-left p-6 rounded-3xl border-2 ${preferredProvider === 'firebase' ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
        <div className="flex items-center justify-between"><Database size={24}/><span className="text-xs font-black">FIREBASE FIRESTORE</span></div><h3 className="font-black mt-5">Firebase / Firestore</h3><p className="text-xs text-slate-500 mt-1">ฐานข้อมูลหลักแบบคลาวด์และเรียลไทม์</p>{actualProvider === 'firebase' && <span className="inline-block mt-4 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500 text-white">ACTIVE NOW</span>}
      </button>
    </div>
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-4"><div><h3 className="font-black">สถานะ Firebase</h3><p className="text-xs text-slate-500 mt-1">{health.firebase.message}</p></div><div className="flex items-center gap-2 text-xs font-bold">{health.firebase.status === 'healthy' ? <CheckCircle2 className="text-emerald-500" size={18}/> : <AlertCircle className="text-rose-500" size={18}/>} {health.firebase.latencyMs}ms</div></div>
      <button onClick={handleSync} disabled={isSyncing || !isOnline} className="mt-5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black disabled:opacity-50">{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์คิวออฟไลน์เข้า Firestore'}</button>{lastSyncStats && <p className="text-xs text-slate-500 mt-3">ซิงค์ล่าสุด: ธุรกรรม {lastSyncStats.transactions} รายการ</p>}
    </div>
  </div>;
}
