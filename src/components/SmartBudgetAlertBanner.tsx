import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  TrendingUp, 
  SlidersHorizontal, 
  ArrowRight, 
  X, 
  Bell, 
  DollarSign, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useBudgetGoal } from '../hooks/useBudgetGoal';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface SmartBudgetAlertBannerProps {
  monthExpense: number;
  onOpenBudgetSettings?: () => void;
  onViewExpenses?: () => void;
}

export const SmartBudgetAlertBanner: React.FC<SmartBudgetAlertBannerProps> = ({
  monthExpense,
  onOpenBudgetSettings,
  onViewExpenses
}) => {
  const { 
    budgetGoal, 
    warningThreshold, 
    criticalThreshold, 
    evaluateBudgetStatus 
  } = useBudgetGoal();

  const [isDismissed, setIsDismissed] = useState(false);

  const { status, percentage, remaining, overBy, isWarning, isCritical } = evaluateBudgetStatus(monthExpense);
  const currentMonthName = format(new Date(), 'MMMM yyyy', { locale: th });

  // If in normal state or dismissed for session, don't show the intrusive alert banner
  if (status === 'normal' || isDismissed || budgetGoal <= 0) {
    return null;
  }

  return (
    <div 
      className={`rounded-3xl p-4 sm:p-5 border transition-all duration-300 relative overflow-hidden shadow-sm ${
        isCritical
          ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80 text-rose-950 dark:text-rose-100'
          : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-100'
      }`}
    >
      {/* Background Decorative Gradient */}
      <div 
        className={`absolute -right-12 -top-12 w-40 h-40 rounded-full blur-2xl opacity-20 pointer-events-none ${
          isCritical ? 'bg-rose-600' : 'bg-amber-600'
        }`} 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        {/* Left: Icon & Alert Title */}
        <div className="flex items-start sm:items-center space-x-3.5">
          <div 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-md ${
              isCritical
                ? 'bg-rose-600 text-white shadow-rose-600/30 animate-pulse'
                : 'bg-amber-500 text-white shadow-amber-500/30'
            }`}
          >
            {isCritical ? <ShieldAlert size={26} /> : <AlertTriangle size={26} />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap">
              {/* Custom Color-Coded Status Badge */}
              {isCritical ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white border border-rose-500 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>CRITICAL ALERT</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white border border-amber-400 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>WARNING ALERT</span>
                </span>
              )}

              <span className="text-xs font-bold opacity-75">
                ประจำเดือน {currentMonthName}
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-black tracking-tight">
              {isCritical
                ? `แจ้งเตือนวิกฤต: รายจ่ายเดือนนี้เกินงบประมาณแล้ว (+฿${overBy.toLocaleString()})`
                : `แจ้งเตือนระวัง: รายจ่ายเดือนนี้เข้าใกล้ขีดจำกัดงบประมาณแล้ว (เหลือ ฿${remaining.toLocaleString()})`}
            </h4>

            <p className="text-xs opacity-85">
              {isCritical
                ? `ค่าใช้จ่ายสะสม ฿${monthExpense.toLocaleString()} คิดเป็น ${percentage}% ของงบประมาณที่ตั้งไว้ (เกินเกณฑ์ Critical ${criticalThreshold}%)`
                : `ค่าใช้จ่ายสะสม ฿${monthExpense.toLocaleString()} คิดเป็น ${percentage}% ของงบประมาณที่ตั้งไว้ (ถึงเกณฑ์ Warning ${warningThreshold}%)`}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
          {onOpenBudgetSettings && (
            <button
              onClick={onOpenBudgetSettings}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95 ${
                isCritical
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>ปรับงบประมาณ/เกณฑ์เตือน</span>
            </button>
          )}

          {onViewExpenses && (
            <button
              onClick={onViewExpenses}
              className="px-3.5 py-2 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-2xs border border-slate-200/60 dark:border-slate-700 cursor-pointer"
            >
              <span>ดูรายจ่าย</span>
              <ChevronRight size={13} />
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
            title="ซ่อนการแจ้งเตือนชั่วคราว"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress Bar within Banner */}
      <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 space-y-1.5">
        <div className="flex justify-between text-[11px] font-extrabold">
          <span>ความคืบหน้าการใช้งบประมาณ</span>
          <span className="font-mono">{percentage}%</span>
        </div>
        <div className="w-full h-2.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical
                ? 'bg-gradient-to-r from-rose-500 to-red-600'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
