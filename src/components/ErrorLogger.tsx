import React, { useState, useEffect } from 'react';
import { dbManager, DbSyncError } from '../lib/dbManager';
import { 
  AlertTriangle, Clock, RefreshCw, Trash2, Search, Filter, 
  Database, Zap, HardDrive, Wifi, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { notifyReaction } from '../utils/feedback';

export default function ErrorLogger() {
  const [logs, setLogs] = useState<DbSyncError[]>([]);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'local' | 'firebase' | 'supabase' | 'network'>('all');

  const loadLogs = () => {
    setLogs(dbManager.getErrorLogs());
  };

  useEffect(() => {
    loadLogs();
    
    // Subscribe to state updates in dbManager
    const unsubscribe = dbManager.subscribe(() => {
      loadLogs();
    });
    
    return unsubscribe;
  }, []);

  const handleClearLogs = () => {
    if (confirm('คุณต้องการลบประวัติข้อผิดพลาดในการเชื่อมต่อทั้งหมดใช่หรือไม่?')) {
      dbManager.clearErrorLogs();
      notifyReaction('success', 'ล้างประวัติข้อผิดพลาดฐานข้อมูลสำเร็จ!');
      loadLogs();
    }
  };

  const handleSimulateError = (source: 'firebase' | 'supabase' | 'local') => {
    const errorMessages = {
      firebase: 'Firebase Error: [Firestore]: GrpcConnectionClient failed to handshake with endpoint. Quota exceeded (403).',
      supabase: 'PostgresException: relation "transactions" does not exist. DB response timed out after 10000ms.',
      local: 'QuotaExceededError: The user agent is out of disk space. LocalStorage cannot commit transaction payload.'
    };

    dbManager.addErrorLog(
      source,
      'Simulated failure',
      errorMessages[source],
      dbManager.isAutoFailoverEnabled()
    );
    notifyReaction('success', `จำลองข้อผิดพลาดของระบบฐานข้อมูล ${source.toUpperCase()} สำเร็จ!`);
    loadLogs();
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.errorMessage.toLowerCase().includes(search.toLowerCase()) || 
                          log.errorType.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === 'all' || log.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'firebase':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Database size={11} />
            <span>FIREBASE</span>
          </span>
        );
      case 'supabase':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Zap size={11} />
            <span>SUPABASE</span>
          </span>
        );
      case 'local':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <HardDrive size={11} />
            <span>LOCAL</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <Wifi size={11} />
            <span>NETWORK</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 sm:p-8 space-y-6">
      
      {/* Header section with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-500" />
            <span>บันทึกประวัติข้อผิดพลาดในการเชื่อมต่อ (Multi-DB Failures History)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ตรวจสอบข้อมูลและสวิงค่าความพร้อมเชื่อมต่อสำหรับช่วยเหลือผู้ดูแลระบบในการวิเคราะห์ปัญหาเครือข่าย
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95 shadow-2xs border border-rose-100 dark:border-rose-900/50"
          >
            <Trash2 size={13} />
            <span>ล้างบันทึกทั้งหมด</span>
          </button>
        )}
      </div>

      {/* Simulator Tools for Administrators */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-3">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <RefreshCw size={12} className="text-slate-500" />
          <span>แผงควบคุมจำลองภัยพิบัติฐานข้อมูล (Disaster Recovery Simulation Tools)</span>
        </span>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSimulateError('firebase')}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl text-[11px] font-bold border border-indigo-200/50 dark:border-indigo-800/50 transition-all cursor-pointer active:scale-95"
          >
            ⚡ จำลอง Firebase ขัดข้อง
          </button>
          <button
            onClick={() => handleSimulateError('supabase')}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl text-[11px] font-bold border border-emerald-200/50 dark:border-emerald-800/50 transition-all cursor-pointer active:scale-95"
          >
            ⚡ จำลอง Supabase ขัดข้อง
          </button>
          <button
            onClick={() => handleSimulateError('local')}
            className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded-xl text-[11px] font-bold border border-amber-200/50 dark:border-amber-800/50 transition-all cursor-pointer active:scale-95"
          >
            ⚡ จำลอง LocalStorage เต็ม
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาข้อผิดพลาดหรือรหัสความผิดปกติ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Source filters tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          {(['all', 'local', 'firebase', 'supabase', 'network'] as const).map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                sourceFilter === src
                  ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {src === 'all' ? 'แสดงทั้งหมด' : src}
            </button>
          ))}
        </div>
      </div>

      {/* Logger list */}
      <div className="space-y-3.5">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const formattedTime = format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm:ss น.', { locale: th });
            return (
              <div 
                key={log.id} 
                className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl mt-0.5 border border-rose-100 dark:border-rose-900/30 shrink-0">
                    <AlertTriangle size={16} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSourceBadge(log.source)}
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{log.errorType}</span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-relaxed max-w-2xl break-all">
                      {log.errorMessage}
                    </p>

                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-semibold">
                      <span className="flex items-center">
                        <Clock size={11} className="mr-1" />
                        {formattedTime}
                      </span>

                      {log.autoFailoverTriggered && (
                        <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={11} className="mr-1" />
                          สลับฐานข้อมูลอัตโนมัติสำเร็จ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono select-all font-semibold shrink-0">
                  {log.id}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center border border-slate-200 border-dashed rounded-3xl text-slate-400 dark:border-slate-800 space-y-2">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500 animate-bounce" />
            <div className="space-y-0.5">
              <p className="text-xs font-black text-slate-800 dark:text-white">ไม่พบประวัติความล้มเหลวในการเชื่อมต่อ</p>
              <p className="text-[11px] text-slate-400">ฐานข้อมูลและระบบเครือข่ายทั้งหมดทำงานสอดคล้องประสานกันอย่างเสถียร</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
