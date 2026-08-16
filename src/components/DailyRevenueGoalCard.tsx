import React, { useState, FormEvent } from 'react';
import { 
  Target, 
  TrendingUp, 
  Sparkles, 
  Edit3, 
  CheckCircle2, 
  Zap, 
  Trophy, 
  Check, 
  X, 
  ArrowRight,
  Flame
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useDailyRevenueGoal } from '../hooks/useDailyRevenueGoal';

interface DailyRevenueGoalCardProps {
  todayIncome: number;
  onQuickAddSale?: () => void;
}

const PRESET_GOALS = [10000, 20000, 30000, 50000, 80000, 100000, 150000];

export const DailyRevenueGoalCard: React.FC<DailyRevenueGoalCardProps> = ({
  todayIncome,
  onQuickAddSale
}) => {
  const { dailyGoal, updateDailyGoal } = useDailyRevenueGoal();
  const [isEditing, setIsEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState(dailyGoal.toString());
  const [isSaving, setIsSaving] = useState(false);

  const todayFormatted = format(new Date(), 'd MMMM yyyy', { locale: th });
  
  // Calculate percentage and gap
  const rawPercentage = dailyGoal > 0 ? (todayIncome / dailyGoal) * 100 : 0;
  const percentage = Math.round(rawPercentage);
  const displayProgressWidth = Math.min(Math.max(rawPercentage, 0), 100);
  const isGoalReached = todayIncome >= dailyGoal && dailyGoal > 0;
  const remainingAmount = dailyGoal - todayIncome;
  const surplusAmount = todayIncome - dailyGoal;

  const openEditor = () => {
    setTempGoal(dailyGoal.toString());
    setIsEditing(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const val = Number(tempGoal);
    if (isNaN(val) || val <= 0) {
      toast.error('กรุณาระบุเป้าหมายยอดขายเป็นตัวเลขที่มากกว่า 0');
      return;
    }

    setIsSaving(true);
    try {
      await updateDailyGoal(val);
      toast.success('อัปเดตเป้าหมายยอดขายรายวันเรียบร้อยแล้ว');
      setIsEditing(false);
    } catch {
      toast.error('เกิดข้อผิดพลาดในการบันทึกเป้าหมาย');
    } finally {
      setIsSaving(false);
    }
  };

  // Motivational message selection
  let motivationalMessage = 'เริ่มต้นวันใหม่! บันทึกยอดขายแรกของวันนี้เพื่อพิชิตเป้าหมาย';
  let motivationIcon = <Zap size={15} className="text-amber-500 shrink-0" />;

  if (isGoalReached) {
    motivationalMessage = `สุดยอดมาก! วันนี้ทำยอดขายทะลุเป้าสำเร็จแล้ว (+฿${surplusAmount.toLocaleString()}) 🎉`;
    motivationIcon = <Trophy size={15} className="text-emerald-500 shrink-0 animate-bounce" />;
  } else if (rawPercentage >= 80) {
    motivationalMessage = `เข้าสู่โค้งสุดท้าย! ขาดอีกเพียง ฿${remainingAmount.toLocaleString()} จะถึงเป้าหมาย ลุยเลย!`;
    motivationIcon = <Flame size={15} className="text-rose-500 shrink-0 animate-pulse" />;
  } else if (rawPercentage >= 50) {
    motivationalMessage = `ผ่านครึ่งทางแล้ว! เดินหน้าบันทึกยอดขายเพิ่มอีก ฿${remainingAmount.toLocaleString()}`;
    motivationIcon = <TrendingUp size={15} className="text-amber-500 shrink-0" />;
  } else if (todayIncome > 0) {
    motivationalMessage = `เริ่มต้นได้ดี! เก็บยอดขายเพิ่มอีก ฿${remainingAmount.toLocaleString()} เพื่อพิชิตเป้าหมายวันนี้`;
    motivationIcon = <Sparkles size={15} className="text-brand shrink-0" />;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden space-y-4">
      {/* Background Decorative Glow */}
      <div 
        className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
          isGoalReached ? 'bg-emerald-500' : 'bg-amber-500'
        }`} 
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black shadow-md transition-colors ${
            isGoalReached
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-amber-500/20'
          }`}>
            {isGoalReached ? <Trophy size={22} /> : <Target size={22} />}
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                เป้าหมายยอดขายประจำวัน (Daily Revenue Goal)
              </h3>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {todayFormatted}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              ติดตามยอดขายและสร้างแรงผลักดันให้ทีมงานในแต่ละวัน
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {onQuickAddSale && (
            <button
              onClick={onQuickAddSale}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Zap size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>+ เพิ่มยอดขาย</span>
            </button>
          )}

          <button
            onClick={openEditor}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs active:scale-95 cursor-pointer"
            title="ตั้งเป้าหมายรายวันใหม่"
          >
            <Edit3 size={13} className="text-brand" />
            <span>ปรับเป้า</span>
          </button>
        </div>
      </div>

      {/* Visual Progress Layout with Circular Ring and Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Progress Ring Column (4/12) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
            {/* SVG Progress Ring */}
            <svg width={120} height={120} className="transform -rotate-90">
              <defs>
                <linearGradient id="progressRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isGoalReached ? "#10b981" : "#f59e0b"} />
                  <stop offset="100%" stopColor={isGoalReached ? "#34d399" : "#fb923c"} />
                </linearGradient>
              </defs>
              {/* Track circle */}
              <circle
                cx={60}
                cy={60}
                r={50}
                className="stroke-slate-200 dark:stroke-slate-800 fill-transparent"
                strokeWidth={10}
              />
              {/* Progress circle */}
              <circle
                cx={60}
                cy={60}
                r={50}
                stroke="url(#progressRingGradient)"
                className="fill-transparent transition-all duration-1000 ease-out"
                strokeWidth={10}
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 - (Math.min(displayProgressWidth, 100) / 100) * (2 * Math.PI * 50)}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Centered text */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none font-mono">
                {percentage}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase">
                {isGoalReached ? 'สำเร็จ' : 'คืบหน้า'}
              </span>
            </div>
          </div>
          <div className="mt-2.5 text-center">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">
              {isGoalReached ? 'บรรลุเป้าหมายยอดขายแล้ว! 🏆' : `ความคืบหน้าวันนี้`}
            </span>
          </div>
        </div>

        {/* Figures Breakdown Column (8/12) */}
        <div className="md:col-span-8 space-y-4">
          {/* Figures Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Actual Revenue Today */}
            <div className="bg-slate-50/90 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
              <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                ยอดขายทำได้วันนี้
              </span>
              <div className="flex items-baseline space-x-1">
                <span className={`text-xl sm:text-2xl font-black tracking-tight ${
                  isGoalReached ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                }`}>
                  ฿{todayIncome.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Target Goal */}
            <div className="bg-slate-50/90 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
              <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                เป้าหมายที่ตั้งไว้
              </span>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  ฿{dailyGoal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Status / Gap */}
            <div className={`col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between ${
              isGoalReached
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60'
                : 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60'
            }`}>
              <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                {isGoalReached ? 'ผลงานเกินเป้าหมาย' : 'ยอดที่ต้องทำเพิ่ม'}
              </span>
              <div className="flex items-baseline space-x-1.5">
                {isGoalReached ? (
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                    +฿{surplusAmount.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                    ฿{remainingAmount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-slate-700 dark:text-slate-300">ความคืบหน้ารวม:</span>
              <span className="text-slate-400 text-[11px] font-bold">
                {isGoalReached ? 'ทะลุเป้าหมาย 100% 🎯' : `คงเหลืออีก ${(100 - displayProgressWidth).toFixed(0)}%`}
              </span>
            </div>
            <div className="relative w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                  isGoalReached
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-sm shadow-emerald-500/40'
                    : 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-400'
                }`}
                style={{ width: `${displayProgressWidth}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Message Footer Banner */}
      <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
        isGoalReached
          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
          : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
      }`}>
        <div className="flex items-center space-x-2 font-bold">
          {motivationIcon}
          <span>{motivationalMessage}</span>
        </div>

        {isGoalReached && (
          <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shrink-0 shadow-xs">
            <CheckCircle2 size={12} />
            <span>สำเร็จแล้ว</span>
          </span>
        )}
      </div>

      {/* Goal Setting Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5 text-slate-900 dark:text-white">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-brand rounded-xl">
                  <Target size={20} />
                </div>
                <h3 className="text-base font-black">ตั้งเป้าหมายยอดขายรายวัน</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  เลือกเป้าหมายยอดนิยม (บาท/วัน):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_GOALS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTempGoal(amt.toString())}
                      className={`py-2 px-2 rounded-xl text-xs font-black transition-all border ${
                        Number(tempGoal) === amt
                          ? 'bg-brand text-white border-brand shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      ฿{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  หรือระบุจำนวนเงินที่ต้องการ (บาท):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ฿
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-black text-base focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="เช่น 50000"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-brand hover:bg-amber-600 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md shadow-brand/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Check size={16} />
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกเป้าหมาย'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
