import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, CloudOff, RefreshCw, ShieldCheck, HardDrive, X, AlertTriangle } from 'lucide-react';
import { useCloudSyncStatus } from '../hooks/useCloudSyncStatus';
import { useDatabase } from '../hooks/useDatabase';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export default function CloudSyncIndicator() {
  const { status, lastSyncedAt, pendingCount, isOnline, isSyncing, forceSync } = useCloudSyncStatus();
  const { actualProvider } = useDatabase();
  const [showModal, setShowModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isActuallySyncing = isSyncing || syncing || status === 'syncing';
  const relativeSyncTime = lastSyncedAt
    ? formatDistanceToNow(lastSyncedAt, { addSuffix: true, locale: th })
    : 'ยังไม่มีข้อมูลการซิงค์';

  const handleSync = async () => {
    if (isActuallySyncing || !isOnline) return;
    setSyncing(true);
    try {
      await forceSync();
    } finally {
      setSyncing(false);
    }
  };

  const isOffline = actualProvider === 'local' || !isOnline || status === 'offline';

  return (
    <>
      <button id="cloud-sync-header-btn" type="button" onClick={() => setShowModal(true)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 ${isActuallySyncing ? 'animate-pulse ring-2 ring-indigo-500/35 border-indigo-500/50 bg-indigo-500/15 text-indigo-800 dark:text-indigo-200' : isOffline ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30' : 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-500/30'}`} title="ดูสถานะ Firebase และการซิงค์ข้อมูล">
        {isOffline ? <HardDrive size={14} /> : <Cloud size={14} />}
        <span className="hidden sm:inline text-[11px] font-black">{isActuallySyncing ? 'DB: Firebase (กำลังซิงค์...)' : isOffline ? 'DB: Local (ออฟไลน์)' : 'DB: Firebase'}</span>
      </button>

      <AnimatePresence>
        {showModal && (
          <div id="cloud-sync-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={(event) => { if (event.target === event.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><ShieldCheck size={13} /> Firebase / Firestore</div>
                  <h3 className="mt-2 text-lg font-black text-slate-900 dark:text-white">สถานะข้อมูลและการซิงค์</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Firebase/Firestore เป็นฐานข้อมูล Cloud หลักของระบบ</p>
                </div>
                <button id="cloud-sync-modal-close-btn" type="button" onClick={() => setShowModal(false)} className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer" aria-label="ปิด"><X size={18} /></button>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${status === 'error' ? 'bg-rose-500/10 border-rose-500/30' : isOffline ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">{status === 'error' ? <AlertTriangle size={22} /> : isOffline ? <CloudOff size={22} /> : <ShieldCheck size={22} />}</div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white">{status === 'error' ? 'การเชื่อมต่อมีปัญหา' : isOffline ? 'โหมดออฟไลน์' : 'Firebase เชื่อมต่อพร้อมใช้งาน'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ซิงค์ล่าสุด {relativeSyncTime}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div><p className="text-xs font-black text-slate-800 dark:text-white">รายการค้างส่ง</p><p className="text-[11px] text-slate-500 mt-1">{pendingCount > 0 ? `${pendingCount} รายการรอซิงค์` : '0 รายการ (สมบูรณ์)'}</p></div>
                <button id="cloud-sync-now-trigger-btn" type="button" onClick={handleSync} disabled={isActuallySyncing || !isOnline} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black text-xs flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"><RefreshCw size={14} className={isActuallySyncing ? 'animate-spin' : ''} />{isActuallySyncing ? 'กำลังซิงค์...' : 'Sync Now'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
