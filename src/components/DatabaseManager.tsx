import React, { useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { 
  Database, HardDrive, Wifi, WifiOff, RefreshCw, 
  CheckCircle2, AlertCircle, Settings, Play, Zap, 
  Activity, Clock, RefreshCw as SpinnerIcon
} from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useCloudSyncStatus } from '../hooks/useCloudSyncStatus';
import { notifyReaction } from '../utils/feedback';
import { toast } from 'react-hot-toast';
import ErrorLogger from './ErrorLogger';

export default function DatabaseManager() {
  const {
    preferredProvider,
    actualProvider,
    autoFailover,
    health,
    isSyncing,
    setPreferredProvider,
    setAutoFailover,
    runDiagnostics,
    syncDatabases,
  } = useDatabase();

  const { syncFrequency, setSyncFrequency } = useCloudSyncStatus();

  const isOnline = useNetworkStatus();
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [lastSyncStats, setLastSyncStats] = useState<{
    transactions: number;
    customers: number;
    appointments: number;
    warranties: number;
    quickNotes: number;
    timestamp: string;
  } | null>(null);

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    notifyReaction('success', 'เริ่มรันระบบตรวจจับการเชื่อมต่อฐานข้อมูล (Multi-DB Connectivity Diagnostics)...');
    try {
      await runDiagnostics();
      notifyReaction('success', 'วิเคราะห์การเชื่อมต่อและวัดผล Latency สำเร็จครบถ้วน!');
    } catch (e: any) {
      toast.error('การตรวจวิเคราะห์ล้มเหลว: ' + e?.message);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const handleSyncDatabases = async () => {
    if (isSyncing) return;
    setSyncLogs(['[INFO] เริ่มต้นระบบประสานข้อมูลแบบ 3 ทาง (Replication Engine Initialized)...']);
    
    try {
      const result = await syncDatabases();
      if (result.success) {
        const now = new Date().toLocaleTimeString('th-TH');
        setLastSyncStats({
          ...result.stats,
          timestamp: now
        });

        setSyncLogs(prev => [
          ...prev,
          `[OK] ซิงค์ข้อมูลรายการธุรกรรมแล้ว: +${result.stats.transactions} รายการ`,
          `[OK] ซิงค์รายชื่อลูกค้าแล้ว: +${result.stats.customers} รายการ`,
          `[OK] ซิงค์ตารางนัดหมายแล้ว: +${result.stats.appointments} รายการ`,
          `[OK] ซิงค์ใบรับประกันสินค้าแล้ว: +${result.stats.warranties} รายการ`,
          `[OK] ซิงค์บันทึกย่อแล้ว: +${result.stats.quickNotes} รายการ`,
          `[COMPLETE] การรวมข้อมูลเสร็จสมบูรณ์เมื่อเวลา ${now} (ไม่มีการซ้ำซ้อนของข้อมูล)`
        ]);
        notifyReaction('success', 'ประสานข้อมูลและซิงค์ฐานข้อมูลทั้ง 3 ระบบเสร็จสมบูรณ์!');
      } else {
        setSyncLogs(prev => [...prev, '[ERROR] ไม่สามารถรวมข้อมูลได้เนื่องจากระบบคลาวด์ปลายทางขัดข้อง']);
      }
    } catch (err: any) {
      setSyncLogs(prev => [...prev, `[ERROR] เกิดข้อผิดพลาด: ${err?.message || 'การซิงค์ล้มเหลว'}`]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connectivity Status Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 text-white relative overflow-hidden border border-slate-800 shadow-md">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Database size={12} />
                <span>DATABASE MANAGER ACTIVE</span>
              </span>

              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                isOnline 
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
              }`}>
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span>{isOnline ? 'Network: Online' : 'Network: Offline (โหมดออฟไลน์)'}</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              โมดูลควบคุมและประสานดาต้าเบส (Database Connection Manager)
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              ควบคุมกลไกสลับ Database อัตโนมัติและสตรีมสถานะเครือข่ายของ <strong className="text-slate-200">LocalStorage (Local DB)</strong>, <strong className="text-slate-200">Firebase Firestore</strong> และ <strong className="text-slate-200">Supabase PostgreSQL</strong>
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={handleRunDiagnostics}
              disabled={isRunningDiagnostics}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 disabled:bg-slate-800 disabled:text-slate-600 border border-white/10 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 active:scale-95 shadow-md"
            >
              <RefreshCw size={14} className={isRunningDiagnostics ? 'animate-spin text-emerald-400' : 'text-slate-300'} />
              <span>{isRunningDiagnostics ? 'กำลังสแกน...' : 'ทดสอบสัญญาณการเชื่อมต่อ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Online/Offline Diagnostic Grid for 3 Databases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1. Local Database Status */}
        <div 
          onClick={() => setPreferredProvider('local')}
          className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[190px] ${
            preferredProvider === 'local'
              ? 'bg-emerald-500/5 dark:bg-slate-800/40 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/20 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20">
                <HardDrive size={22} />
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full border border-slate-200 dark:border-slate-700">
                  LOCAL
                </span>
                {actualProvider === 'local' && (
                  <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 bg-amber-500 text-white rounded-full animate-pulse">
                    ACTIVE NOW
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">LocalStorage Database</h3>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                เก็บข้อมูลหลักและคิวธุรกรรมออฟไลน์ลงบนหน่วยความจำของอุปกรณ์ (พร้อมใช้งานเสมอบนบราวเซอร์)
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>สถานะเซิร์ฟเวอร์:</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>{health.local.status === 'healthy' ? 'ออนไลน์ (เสถียร)' : 'พร้อมใช้'}</span>
            </span>
          </div>
        </div>

        {/* 2. Firebase Database Status */}
        <div 
          onClick={() => setPreferredProvider('firebase')}
          className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[190px] ${
            preferredProvider === 'firebase'
              ? 'bg-emerald-500/5 dark:bg-slate-800/40 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/20 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
                <Database size={22} />
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full border border-slate-200 dark:border-slate-700">
                  FIREBASE NO-SQL
                </span>
                {actualProvider === 'firebase' && (
                  <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 bg-emerald-500 text-white rounded-full animate-pulse">
                    ACTIVE NOW
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Firebase Firestore</h3>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                เซิร์ฟเวอร์คลาวด์หลัก จัดการข้อมูลธุรกรรม รายชื่อลูกค้า และอัปเดตแบบเรียลไทม์ผ่านการสตรีม
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>สถานะเซิร์ฟเวอร์:</span>
            <span className={`font-bold flex items-center gap-1 ${
              health.firebase.status === 'healthy' ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {health.firebase.status === 'healthy' ? (
                <>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span>ออนไลน์ ({health.firebase.latencyMs}ms)</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                  <span>{health.firebase.status === 'offline' ? 'ออฟไลน์ (เน็ตขาด)' : 'ขัดข้อง'}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* 3. Supabase Database Status */}
        <div 
          onClick={() => setPreferredProvider('supabase')}
          className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[190px] ${
            preferredProvider === 'supabase'
              ? 'bg-emerald-500/5 dark:bg-slate-800/40 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/20 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
                <Zap size={22} />
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full border border-slate-200 dark:border-slate-700">
                  SUPABASE POSTGRES
                </span>
                {actualProvider === 'supabase' && (
                  <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 bg-emerald-500 text-white rounded-full animate-pulse">
                    ACTIVE NOW
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Supabase SQL</h3>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                เซิร์ฟเวอร์ฐานข้อมูลเชิงสัมพันธ์สำรองระดับองค์กร สำหรับสลับการทำงานอัตโนมัติเมื่อเกิดการขัดข้อง
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>สถานะเซิร์ฟเวอร์:</span>
            <span className={`font-bold flex items-center gap-1 ${
              health.supabase.status === 'healthy' ? 'text-emerald-500' : 'text-rose-500 dark:text-rose-400'
            }`}>
              {health.supabase.status === 'healthy' ? (
                <>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span>ออนไลน์ ({health.supabase.latencyMs}ms)</span>
                </>
              ) : health.supabase.status === 'unconfigured' ? (
                <span className="text-slate-400 font-bold">ยังไม่ได้ตั้งค่าคีย์</span>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                  <span>{health.supabase.status === 'offline' ? 'ออฟไลน์ (เน็ตขาด)' : 'ขัดข้อง'}</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Failover Configurations & Syncer Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">ระบบจัดการการสลับฐานข้อมูลอัตโนมัติ (Failover Strategy)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">ควบคุมกลไกการสลับอัตโนมัติและสแตนด์บายฐานข้อมูลสามระบบพร้อมตรวจสอบเครือข่าย</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Auto Failover Toggle Button */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
              <div className="space-y-0.5 flex-1 pr-4">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Play size={13} className="text-emerald-500" />
                  <span>เปิดโหมดกู้ภัยสลับฐานข้อมูลอัตโนมัติ (Auto-Failover Strategy)</span>
                </span>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  เมื่อเปิดใช้งาน หากฐานข้อมูลหลักที่ท่านระบุขาดการเชื่อมต่อ หรือล่าช้าเกินเกณฑ์ที่กำหนด ระบบจะสลับไปดึงข้อมูลใน Local DB หรือ Supabase ทันทีเพื่อไม่ให้ระบบหน้าร้านสะดุดหยุดทำงาน
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoFailover}
                  onChange={(e) => setAutoFailover(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Sync Frequency Panel */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-200/85 dark:border-slate-800/80 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-500" />
                    <span>ความถี่ในการประสานข้อมูล (Sync Frequency & Battery Optimizer)</span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    เลือกความถี่ในการเชื่อมต่อระบบคลาวด์เพื่อช่วยถนอมอายุการใช้งานแบตเตอรี่บนอุปกรณ์พกพาของท่าน
                  </p>
                </div>
                {syncFrequency !== 'real_time' && (
                  <span className="shrink-0 inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span>BATTERY SAVER ACTIVE</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Real-time */}
                <button
                  type="button"
                  onClick={() => setSyncFrequency('real_time')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                    syncFrequency === 'real_time'
                      ? 'bg-indigo-500/5 border-indigo-500 ring-1 ring-indigo-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="p-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                      <Zap size={14} />
                    </span>
                    <span className={`w-2 h-2 rounded-full ${syncFrequency === 'real_time' ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-extrabold text-slate-800 dark:text-white">Real-time (เรียลไทม์)</h5>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-medium leading-tight">สตรีมข้อมูลทันทีผ่าน WebSocket</p>
                  </div>
                </button>

                {/* 2. Interval-based (5 mins) */}
                <button
                  type="button"
                  onClick={() => setSyncFrequency('interval')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                    syncFrequency === 'interval'
                      ? 'bg-indigo-500/5 border-indigo-500 ring-1 ring-indigo-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="p-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                      <Clock size={14} />
                    </span>
                    <span className={`w-2 h-2 rounded-full ${syncFrequency === 'interval' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-extrabold text-slate-800 dark:text-white">ทุกๆ 5 นาที (Interval)</h5>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-medium leading-tight">ซิงค์เป็นรอบเวลา ถนอมแบตเตอรี่</p>
                  </div>
                </button>

                {/* 3. Manual */}
                <button
                  type="button"
                  onClick={() => setSyncFrequency('manual')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                    syncFrequency === 'manual'
                      ? 'bg-indigo-500/5 border-indigo-500 ring-1 ring-indigo-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="p-1 bg-slate-500/10 text-slate-600 dark:text-slate-400 rounded-lg shrink-0">
                      <Database size={14} />
                    </span>
                    <span className={`w-2 h-2 rounded-full ${syncFrequency === 'manual' ? 'bg-slate-500' : 'bg-slate-300'}`} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-extrabold text-slate-800 dark:text-white">แมนนวล (Manual)</h5>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-medium leading-tight">ซิงค์เมื่อกดปุ่ม ประหยัดแบตเตอรี่สูงสุด</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Diagnostics Overview Box */}
            <div className="p-5 bg-gradient-to-br from-slate-50 to-emerald-50/20 dark:from-slate-800/40 dark:to-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3">
              <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity size={14} />
                <span>สรุปการคัดเลือกตัวแปรเชื่อมต่อข้อมูล (Automatic Data Router)</span>
              </h4>

              <div className="space-y-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>ฐานข้อมูลที่กำหนดหลัก:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{preferredProvider === 'firebase' ? 'Firebase Firestore' : preferredProvider === 'supabase' ? 'Supabase Database' : 'LocalStorage'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>สิทธิ์การสลับข้อมูลอัตโนมัติ (Auto-Failover):</span>
                  <span className={autoFailover ? 'text-emerald-500' : 'text-slate-400'}>{autoFailover ? 'เปิดใช้งานอยู่' : 'ปิดการทำงาน'}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-700/80 pt-2">
                  <span>ระบบที่ใช้งานจริงขณะนี้:</span>
                  <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>{actualProvider === 'firebase' ? 'Firebase Firestore (Cloud)' : actualProvider === 'supabase' ? 'Supabase PostgreSQL (Cloud)' : 'LocalStorage (ออฟไลน์บนเครื่อง)'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sync now trigger button */}
            <div className="pt-2">
              <button
                onClick={handleSyncDatabases}
                disabled={isSyncing || !isOnline}
                className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.98]"
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'กำลังตรวจเช็คและประสานดาต้าเบสทั้ง 3 ทาง...' : 'ประสานและซิงค์เชื่อมต่อฐานข้อมูล 3 ฝั่งทันที (Sync & Replication Now)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Logs Container */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">รายงานประวัติซิงค์ & ล็อกเครือข่าย</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">ล็อกการประเมินผลและการรวมข้อมูลของระบบ Multi-DB Manager</p>
              </div>
            </div>

            {/* Last stats summary */}
            {lastSyncStats ? (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2.5">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>ประสานสำเร็จล่าสุด: {lastSyncStats.timestamp}</span>
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-400 text-[10px]">ธุรกรรมการเงิน</p>
                    <p className="text-emerald-600">+{lastSyncStats.transactions} รายการ</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-400 text-[10px]">รายชื่อลูกค้า</p>
                    <p className="text-emerald-600">+{lastSyncStats.customers} รายการ</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-400 text-[10px]">ตารางการนัดหมาย</p>
                    <p className="text-emerald-600">+{lastSyncStats.appointments} รายการ</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-400 text-[10px]">รายการบันทึกด่วน</p>
                    <p className="text-emerald-600">+{lastSyncStats.quickNotes} รายการ</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 border-dashed text-slate-400 text-[11px] font-semibold">
                <Clock size={20} className="mx-auto mb-1.5 text-slate-300" />
                <span>ยังไม่มีข้อมูลสถิติบันทึกการซิงค์ข้อมูลในเซสชันนี้</span>
              </div>
            )}

            {/* Logging terminal console */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">คอนโซลสถานะการกู้ภัย (Database Real-time Console)</span>
              <div className="bg-slate-950 text-emerald-400 p-3.5 rounded-2xl border border-slate-800 font-mono text-[9px] space-y-1 overflow-y-auto max-h-[110px] leading-relaxed">
                {syncLogs.length > 0 ? (
                  syncLogs.map((log, index) => (
                    <div key={index} className="truncate">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic">[Terminal Console] พร้อมตรวจสอบและรายงานระบบ...</div>
                )}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-3">
            * ระบบสลับฐานข้อมูลอัตโนมัติ (Database Connection Failover) จะทำงานตรวจเช็คระบบคลาวด์ทุกครั้งที่ตรวจพบว่าการตั้งค่ามีการเปลี่ยนแปลง หรือสัญญาณอินเทอร์เน็ตของผู้ใช้อ่อนลงอย่างกะทันหัน
          </div>
        </div>
      </div>

      {/* Database Connection & Synchronization Errors Log Panel */}
      <ErrorLogger />
    </div>
  );
}
