import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, CloudOff, RefreshCw, CheckCircle2, ShieldCheck, 
  Database, HardDrive, Wifi, WifiOff, X, Sparkles, Zap, ArrowDownToLine, AlertTriangle
} from 'lucide-react';
import { useCloudSyncStatus } from '../hooks/useCloudSyncStatus';
import { useDatabase } from '../hooks/useDatabase';
import { dbManager } from '../lib/dbManager';
import { format, formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { useEffect } from 'react';

export default function CloudSyncIndicator() {
  const { 
    status, 
    lastSyncedAt, 
    pendingCount, 
    isOnline, 
    isSyncing, 
    forceSync, 
    triggerReassuranceToast 
  } = useCloudSyncStatus();

  const { preferredProvider, actualProvider, health } = useDatabase();

  const [showModal, setShowModal] = useState(false);
  const [localSyncing, setLocalSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ count?: number; time?: Date } | null>(null);
  const [successTimes, setSuccessTimes] = useState(() => dbManager.getLastSyncSuccessTimestamps());

  useEffect(() => {
    if (!showModal) return;
    setSuccessTimes(dbManager.getLastSyncSuccessTimestamps());
    
    const interval = setInterval(() => {
      setSuccessTimes(dbManager.getLastSyncSuccessTimestamps());
    }, 2000);
    
    return () => clearInterval(interval);
  }, [showModal]);

  const isActuallySyncing = isSyncing || localSyncing || status === 'syncing';

  const handleManualSyncNow = async () => {
    if (isActuallySyncing) return;
    setLocalSyncing(true);
    try {
      const result = await forceSync();
      if (result.success) {
        setLastSyncResult({
          count: result.syncedCount,
          time: result.timestamp || new Date()
        });
      }
    } finally {
      setLocalSyncing(false);
    }
  };

  const formattedSyncTime = lastSyncedAt 
    ? format(lastSyncedAt, "d MMM yyyy 'เวลา' HH:mm:ss 'น.'", { locale: th })
    : 'เมื่อสักครู่';

  const relativeSyncTime = lastSyncedAt
    ? formatDistanceToNow(lastSyncedAt, { addSuffix: true, locale: th })
    : 'เมื่อสักครู่';

  return (
    <>
      {/* Header Indicator Button */}
      <button
        id="cloud-sync-header-btn"
        onClick={() => setShowModal(true)}
        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-2xl border text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 ${
          isActuallySyncing
            ? 'animate-pulse ring-2 ring-indigo-500/35 dark:ring-indigo-400/40 border-indigo-500/50 bg-indigo-500/15 text-indigo-800 dark:text-indigo-200'
            : actualProvider === 'local'
            ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/15'
            : actualProvider === 'supabase'
            ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15'
            : 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
        }`}
        title="คลิกเพื่อดูศูนย์ข้อมูล 3 ระบบ และประเมินสัญญาณเชื่อมต่อ"
      >
        {isActuallySyncing ? (
          <>
            <RefreshCw size={14} className="animate-spin text-indigo-500 dark:text-indigo-400" />
            <span className="hidden sm:inline text-[11px] font-black">
              {actualProvider === 'local' 
                ? 'DB: Local (กำลังเซฟ...)' 
                : actualProvider === 'supabase'
                ? 'DB: Firebase (กำลังซิงค์...)'
                : 'DB: Firebase (กำลังซิงค์...)'
              }
            </span>
          </>
        ) : actualProvider === 'local' ? (
          <>
            <HardDrive size={14} className="text-amber-500 animate-pulse" />
            <span className="hidden sm:inline text-[11px] font-black">DB: Local (ออฟไลน์)</span>
          </>
        ) : actualProvider === 'supabase' ? (
          <>
            <Zap size={14} className="text-emerald-500" />
            <span className="hidden sm:inline text-[11px] font-black">DB: Firebase</span>
          </>
        ) : (
          <>
            <Cloud size={14} className="text-indigo-500" />
            <span className="hidden sm:inline text-[11px] font-black">DB: Firebase</span>
          </>
        )}
      </button>

      {/* Cloud Sync & Data Safety Modal */}
      <AnimatePresence>
        {showModal && (
          <div 
            id="cloud-sync-modal-overlay"
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400" />

              {/* Modal Header */}
              <div className="flex items-start justify-between pt-1">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck size={13} className="mr-1 text-emerald-500" />
                      Data Protection & Cloud Sync
                    </span>
                    {isActuallySyncing && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 animate-pulse">
                        <RefreshCw size={10} className="mr-1 animate-spin" /> กำลังซิงค์
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    สถานะการซิงค์และความปลอดภัยข้อมูล
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ข้อมูลร้านถูกคุ้มครองและซิงค์ตรงกับ Firebase Cloud Storage
                  </p>
                </div>

                <button
                  id="cloud-sync-modal-close-btn"
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-center space-x-3.5 ${
                isActuallySyncing
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                  : status === 'offline'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                  : status === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
              }`}>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                  isActuallySyncing
                    ? 'bg-amber-500 text-white'
                    : status === 'offline'
                    ? 'bg-amber-500 text-white'
                    : status === 'error'
                    ? 'bg-rose-500 text-white'
                    : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                }`}>
                  {isActuallySyncing ? (
                    <RefreshCw size={22} className="animate-spin" />
                  ) : status === 'offline' ? (
                    <CloudOff size={22} />
                  ) : status === 'error' ? (
                    <AlertTriangle size={22} />
                  ) : (
                    <ShieldCheck size={24} />
                  )}
                </div>

                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <p className="text-sm font-black tracking-tight truncate">
                      {isActuallySyncing
                        ? 'กำลังอัปเดตข้อมูลขึ้นคลาวด์...'
                        : status === 'offline'
                        ? 'กำลังทำงานในโหมดออฟไลน์ (Offline Mode)'
                        : status === 'error'
                        ? 'เกิดข้อผิดพลาดในการเชื่อมต่อคลาวด์'
                        : 'ข้อมูลซิงค์ปลอดภัย 100% (Cloud Synced)'}
                    </p>
                  </div>
                  <p className="text-xs font-medium opacity-90 leading-relaxed">
                    {isActuallySyncing
                      ? pendingCount > 0
                        ? `กำลังส่งข้อมูล ${pendingCount} รายการขึ้นเซิร์ฟเวอร์คลาวด์และรีเฟรชแคช`
                        : 'กำลังติดต่อเซิร์ฟเวอร์คลาวด์เพื่อยืนยันเวอร์ชันข้อมูลล่าสุด'
                      : status === 'offline'
                      ? 'บันทึกลงความจำในเครื่องชั่วคราว ข้อมูลจะไม่สูญหายและจะซิงค์ทันทีเมื่อเน็ตกลับมา'
                      : status === 'error'
                      ? 'ระบบจะพยายามเชื่อมต่อใหม่ หรือคุณสามารถกดปุ่ม Sync Now ด้านล่างเพื่อลองใหม่ได้'
                      : 'รายการทั้งหมดถูกจัดเก็บไว้บนเซิร์ฟเวอร์คลาวด์เรียบร้อยแล้ว'}
                  </p>
                </div>
              </div>

              {/* Prominent Manual Force Sync Trigger Block */}
              <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                      <Zap size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        บังคับซิงค์ข้อมูล (Manual Sync Trigger)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        กดเพื่อตรวจสอบและดึงข้อมูลอัปเดตล่าสุดจาก Firebase ทันที
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      รายการค้างส่ง:
                    </span>{' '}
                    {pendingCount > 0 ? (
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {pendingCount} รายการ
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        0 รายการ (สมบูรณ์)
                      </span>
                    )}
                  </div>

                  <button
                    id="cloud-sync-now-trigger-btn"
                    onClick={handleManualSyncNow}
                    disabled={isActuallySyncing || !isOnline}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center space-x-2 cursor-pointer shadow-sm active:scale-95 ${
                      !isOnline
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        : isActuallySyncing
                        ? 'bg-amber-500 text-white cursor-wait'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-600/20 hover:shadow-md'
                    }`}
                  >
                    <RefreshCw 
                      size={14} 
                      className={isActuallySyncing ? 'animate-spin' : ''} 
                    />
                    <span>
                      {isActuallySyncing
                        ? 'กำลังซิงค์ข้อมูล...'
                        : !isOnline
                        ? 'ออฟไลน์ (เชื่อมต่อเน็ตก่อน)'
                        : 'Sync Now (ซิงค์ทันที)'}
                    </span>
                  </button>
                </div>

                {lastSyncResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center justify-between"
                  >
                    <span className="flex items-center space-x-1">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>บังคับซิงค์สำเร็จแล้ว</span>
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {lastSyncResult.time ? format(lastSyncResult.time, 'HH:mm:ss น.') : ''}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Database Providers breakdown list */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  ประวัติความสำเร็จรายระบบ (Database Providers Sync breakdown)
                </span>
                
                <div className="space-y-1.5">
                  {/* Firestore */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                        <Database size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-800 dark:text-white">Firestore (เซิร์ฟเวอร์หลัก)</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {successTimes.firebase 
                            ? `สำเร็จ: ${formatDistanceToNow(new Date(successTimes.firebase), { addSuffix: true, locale: th })}`
                            : 'ยังไม่ได้เชื่อมต่อสำเร็จ'
                          }
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      health.firebase.status === 'healthy'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {health.firebase.status === 'healthy' ? 'พร้อม' : 'ออฟไลน์'}
                    </span>
                  </div>

                  {/* Firebase */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                        <Zap size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-800 dark:text-white">Firebase (สำรองฉุกเฉิน)</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {successTimes.supabase 
                            ? `สำเร็จ: ${formatDistanceToNow(new Date(successTimes.supabase), { addSuffix: true, locale: th })}`
                            : 'ยังไม่ได้เชื่อมต่อสำเร็จ'
                          }
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      health.supabase.status === 'healthy'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : health.supabase.status === 'unconfigured'
                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {health.supabase.status === 'healthy' 
                        ? 'พร้อม' 
                        : health.supabase.status === 'unconfigured'
                        ? 'ไม่ระบุคีย์'
                        : 'ออฟไลน์'
                      }
                    </span>
                  </div>

                  {/* Local Storage */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                        <HardDrive size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-800 dark:text-white">Local DB (ออฟไลน์แคช)</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {successTimes.local 
                            ? `สำเร็จ: ${formatDistanceToNow(new Date(successTimes.local), { addSuffix: true, locale: th })}`
                            : 'พร้อมทำงาน'
                          }
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      ทำงานอยู่
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Cloud Connection */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center">
                    {isOnline ? <Wifi size={12} className="mr-1 text-emerald-500" /> : <WifiOff size={12} className="mr-1 text-amber-500" />}
                    สถานะการเชื่อมต่อ
                  </span>
                  <p className="font-black text-slate-800 dark:text-slate-100 text-xs flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
                    <span>{isOnline ? 'ออนไลน์ (Online)' : 'ออฟไลน์ (Offline)'}</span>
                  </p>
                </div>

                {/* Storage Engine */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center">
                    <Database size={12} className="mr-1 text-indigo-500" />
                    ฐานข้อมูลเริ่มต้น
                  </span>
                  <p className="font-black text-slate-800 dark:text-slate-100 text-xs truncate">
                    {preferredProvider === 'firebase' ? 'Firebase Firestore' : preferredProvider === 'supabase' ? 'Firebase PostgreSQL' : 'Local Storage'}
                  </p>
                </div>

                {/* Local Cache */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center">
                    <Zap size={12} className="mr-1 text-emerald-500" />
                    เชื่อมต่อใช้งานจริง
                  </span>
                  <p className="font-black text-emerald-600 dark:text-emerald-400 text-xs truncate">
                    {actualProvider === 'firebase' ? 'Firebase Cloud' : actualProvider === 'supabase' ? 'Firebase Cloud' : 'Local (ออฟไลน์)'}
                  </p>
                </div>

                {/* Last Sync Time */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center">
                    <CheckCircle2 size={12} className="mr-1 text-emerald-500" />
                    ซิงค์ล่าสุดเมื่อ
                  </span>
                  <p className="font-black text-slate-800 dark:text-slate-100 text-[11px] truncate" title={formattedSyncTime}>
                    {relativeSyncTime}
                  </p>
                </div>
              </div>

              {/* Security Guarantee Note */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50 rounded-2xl flex items-center space-x-2.5 text-xs text-emerald-900 dark:text-emerald-300">
                <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-[11px] leading-snug font-medium">
                  <strong>มั่นใจได้ 100%:</strong> เมื่อคุณบันทึกหรือแก้ไขรายการใดๆ ระบบจะทำการบันทึกทั้งบนอุปกรณ์และคลาวด์คู่ขนานกัน แม้อินเทอร์เน็ตหลุด ข้อมูลจะไม่สูญหาย
                </p>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  id="cloud-sync-verify-btn"
                  onClick={triggerReassuranceToast}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <ArrowDownToLine size={14} className="text-slate-500" />
                  <span>ทดสอบความพร้อม</span>
                </button>

                <button
                  id="cloud-sync-modal-dismiss-btn"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold rounded-2xl text-xs transition-all shadow-xs cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

