import React from 'react';
import { ShieldAlert, Download, X, Settings, Database, Clock, Calendar, CheckCircle2, Sparkles } from 'lucide-react';
import { useInactivityBackupReminder } from '../hooks/useInactivityBackupReminder';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface InactivityBackupReminderBannerProps {
  onOpenBackupSettings?: () => void;
  className?: string;
}

export const InactivityBackupReminderBanner: React.FC<InactivityBackupReminderBannerProps> = ({
  onOpenBackupSettings,
  className = ''
}) => {
  const {
    shouldShowReminder,
    daysSinceLastTransaction,
    latestTransactionDate,
    daysSinceLastBackup,
    isExporting,
    dismissForToday,
    triggerInstantBackup
  } = useInactivityBackupReminder();

  if (!shouldShowReminder) return null;

  const formattedLatestDate = latestTransactionDate
    ? format(latestTransactionDate, 'dd MMMM yyyy', { locale: th })
    : 'ไม่มีประวัติรายการ';

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-900/90 via-slate-900 to-amber-950 p-5 sm:p-6 text-white shadow-xl border border-amber-500/30 animate-fade-in ${className}`}>
      {/* Background Decorative Element */}
      <div className="absolute -right-10 -top-10 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Side: Icon & Details */}
        <div className="flex items-start space-x-4">
          <div className="p-3.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/40 shrink-0 shadow-inner mt-0.5">
            <ShieldAlert size={26} className="animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-xs">
                คำเตือนความปลอดภัย (7-Day Backup Reminder)
              </span>
              <span className="text-xs font-bold text-amber-300/80 flex items-center">
                <Clock size={12} className="mr-1" />
                ไม่พบรายการใหม่ {daysSinceLastTransaction} วัน
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              ไม่พบการลงบัญชีใหม่มาแล้ว {daysSinceLastTransaction} วัน — แนะนำให้ทำการสำรองข้อมูลไว้
            </h3>

            <p className="text-xs font-medium text-slate-300 leading-relaxed max-w-3xl">
              รายการรายรับ-รายจ่ายล่าสุดถูกบันทึกเมื่อ <span className="font-bold text-amber-200">{formattedLatestDate}</span>
              {daysSinceLastBackup === null ? (
                <span> และ<strong className="text-amber-300 font-extrabold">ยังไม่เคยทำการสำรองไฟล์ JSON ลงเครื่อง</strong></span>
              ) : (
                <span> และสำรองข้อมูลล่าสุดเมื่อ <strong className="text-amber-300 font-extrabold">{daysSinceLastBackup} วันที่แล้ว</strong></span>
              )}
              {' '}เพื่อความปลอดภัยของข้อมูลบัญชีร้านค้าและป้องกันข้อมูลสูญหาย แนะนำให้ดาวน์โหลดไฟล์สำรองเก็บไว้
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-400">
              <div className="flex items-center space-x-1">
                <Database size={13} className="text-amber-400" />
                <span>รวบรวมข้อมูล: ธุรกรรม, ลูกค้า CRM, สินค้า และตั้งค่า</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>ฟอร์แมตมาตรฐาน JSON พร้อมกู้คืน</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-amber-500/20">
          {/* Export Instant JSON Backup Button */}
          <button
            onClick={triggerInstantBackup}
            disabled={isExporting}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>กำลังสำรองข้อมูล...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>สำรองข้อมูล JSON ทันที</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            {/* Open Backup Settings Button */}
            {onOpenBackupSettings && (
              <button
                onClick={onOpenBackupSettings}
                className="flex-1 sm:flex-none px-3.5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700/80 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Settings size={14} className="text-slate-400" />
                <span>ตั้งค่า</span>
              </button>
            )}

            {/* Dismiss for Today */}
            <button
              onClick={dismissForToday}
              className="px-3.5 py-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs border border-slate-700/50 flex items-center justify-center space-x-1 transition-all cursor-pointer"
              title="ปิดการแจ้งเตือนสำหรับวันนี้"
            >
              <X size={14} />
              <span>ปิดวันนี้</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
