import { useState, useEffect, FormEvent } from 'react';
import { useBudgetGoal } from '../hooks/useBudgetGoal';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  Target, 
  Edit3, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle,
  Bell,
  Sparkles, 
  X, 
  Check, 
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MonthlyBudgetCardProps {
  monthExpense: number;
}

const PRESET_BUDGETS = [20000, 50000, 100000, 150000, 200000];
const WARNING_PRESETS = [70, 75, 80, 85, 90];
const CRITICAL_PRESETS = [90, 95, 100, 105, 110];

export default function MonthlyBudgetCard({ monthExpense }: MonthlyBudgetCardProps) {
  const { 
    budgetGoal, 
    warningThreshold, 
    criticalThreshold, 
    enableNotifications, 
    updateBudget, 
    updateThresholds,
    evaluateBudgetStatus,
    checkAndNotifyBudgetAlert
  } = useBudgetGoal();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'budget' | 'thresholds'>('budget');
  const [tempBudget, setTempBudget] = useState(budgetGoal.toString());
  const [tempWarning, setTempWarning] = useState(warningThreshold);
  const [tempCritical, setTempCritical] = useState(criticalThreshold);
  const [tempNotifs, setTempNotifs] = useState(enableNotifications);
  const [saving, setSaving] = useState(false);

  const currentMonthName = format(new Date(), 'MMMM yyyy', { locale: th });

  // Evaluate current budget health
  const { status, percentage, remaining, overBy, isWarning, isCritical, isNormal } = evaluateBudgetStatus(monthExpense);

  // Trigger smart in-app notification if status is warning or critical
  useEffect(() => {
    checkAndNotifyBudgetAlert(monthExpense);
  }, [monthExpense, checkAndNotifyBudgetAlert]);

  const openEditor = (tab: 'budget' | 'thresholds' = 'budget') => {
    setTempBudget(budgetGoal.toString());
    setTempWarning(warningThreshold);
    setTempCritical(criticalThreshold);
    setTempNotifs(enableNotifications);
    setActiveTab(tab);
    setIsEditing(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const val = Number(tempBudget);
    if (isNaN(val) || val <= 0) {
      toast.error('กรุณาระบุจำนวนงบประมาณให้ถูกต้อง');
      return;
    }

    if (tempWarning >= tempCritical) {
      toast.error('เกณฑ์ Warning ต้องน้อยกว่าเกณฑ์ Critical');
      return;
    }

    setSaving(true);
    try {
      await updateBudget(val);
      await updateThresholds(tempWarning, tempCritical, tempNotifs);
      toast.success('อัปเดตเป้าหมายและเกณฑ์แจ้งเตือนงบประมาณเรียบร้อยแล้ว');
      setIsEditing(false);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  // Color selection based on Smart Budget Alert Status
  let progressColorClass = 'bg-gradient-to-r from-emerald-500 to-teal-400';
  let badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
  let statusText = `สถานะปกติ (คงเหลือ ฿${remaining.toLocaleString()})`;
  let StatusIcon = CheckCircle2;
  let statusLabel = 'NORMAL';

  if (isCritical) {
    progressColorClass = 'bg-gradient-to-r from-rose-500 to-red-600 shadow-md shadow-rose-500/30';
    badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800 font-black shadow-xs';
    statusText = `[Critical Alert] เกินงบประมาณไป ฿${overBy.toLocaleString()}`;
    StatusIcon = ShieldAlert;
    statusLabel = 'CRITICAL';
  } else if (isWarning) {
    progressColorClass = 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-md shadow-amber-500/30';
    badgeClass = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-black shadow-xs';
    statusText = `[Warning Alert] ใกล้ถึงงบประมาณสูงสุด (เหลือ ฿${remaining.toLocaleString()})`;
    StatusIcon = AlertTriangle;
    statusLabel = 'WARNING';
  }

  return (
    <div className={`rounded-3xl p-5 sm:p-6 border shadow-xs space-y-4 relative overflow-hidden transition-all duration-300 ${
      isCritical
        ? 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/60 ring-2 ring-rose-500/10'
        : isWarning
        ? 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60 ring-2 ring-amber-500/10'
        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
    }`}>
      {/* Background Decorative Glow */}
      <div 
        className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700 ${
          isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
        }`} 
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white shadow-md transition-colors ${
            isCritical
              ? 'bg-rose-600 shadow-rose-600/30'
              : isWarning
              ? 'bg-amber-500 shadow-amber-500/30'
              : 'bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-blue-500/20'
          }`}>
            {isCritical ? <ShieldAlert size={22} /> : isWarning ? <AlertTriangle size={22} /> : <Target size={22} />}
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                เป้าหมายงบประมาณรายจ่าย (Smart Budget)
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {currentMonthName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              ระบบแจ้งเตือนอัจฉริยะเมื่อรายจ่ายเข้าใกล้เกณฑ์ Warning ({warningThreshold}%) หรือ Critical ({criticalThreshold}%)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => openEditor('thresholds')}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-2xs active:scale-95 cursor-pointer"
            title="ตั้งค่าเกณฑ์การแจ้งเตือน"
          >
            <SlidersHorizontal size={13} className="text-brand" />
            <span>ตั้งเกณฑ์เตือน</span>
          </button>

          <button
            onClick={() => openEditor('budget')}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-black rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs active:scale-95 cursor-pointer"
          >
            <Edit3 size={13} className="text-blue-600 dark:text-blue-400" />
            <span>ปรับงบ</span>
          </button>
        </div>
      </div>

      {/* Figures Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Budget Goal */}
        <div className="bg-slate-50/90 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
            งบประมาณรวม
          </span>
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            ฿{budgetGoal.toLocaleString()}
          </span>
        </div>

        {/* Current Expense */}
        <div className="bg-slate-50/90 dark:bg-slate-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
            ใช้จ่ายไปแล้ว
          </span>
          <span className={`text-lg sm:text-xl font-black tracking-tight ${
            isCritical ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
          }`}>
            ฿{monthExpense.toLocaleString()}
          </span>
        </div>

        {/* Status / Remaining */}
        <div className={`col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between ${
          isCritical
            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-800/60'
            : isWarning
            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/60'
            : 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60'
        }`}>
          <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
            {isCritical ? 'เกินงบประมาณไป' : 'งบประมาณคงเหลือ'}
          </span>
          <span className={`text-lg sm:text-xl font-black tracking-tight ${
            isCritical ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            ฿{isCritical ? overBy.toLocaleString() : remaining.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Progress Bar Container with Color-Coded Status Badge */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-black">
          {/* Custom Color-Coded Status Badge */}
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-black border transition-all ${badgeClass}`}>
              <StatusIcon size={14} className={isCritical ? 'animate-pulse' : ''} />
              <span>{statusText}</span>
            </span>
          </div>

          <span className={`font-mono text-xs font-black ${
            isCritical ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
          }`}>
            ใช้ไป {percentage}%
          </span>
        </div>

        {/* Outer Bar with Warning & Critical Threshold Markers */}
        <div className="relative w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${progressColorClass}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Threshold Milestone Markers */}
        <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
          <span>0%</span>
          <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center">
            ⚠️ Warning ({warningThreshold}%)
          </span>
          <span className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center">
            🚨 Critical ({criticalThreshold}%)
          </span>
        </div>
      </div>

      {/* Edit Budget & Smart Alert Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Target size={18} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    ตั้งค่าเป้าหมายและแจ้งเตือนงบประมาณ
                  </h4>
                  <p className="text-[11px] text-slate-400">Smart Budget Alerts & Threshold Settings</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('budget')}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                  activeTab === 'budget'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                1. กำหนดงบประมาณ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('thresholds')}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                  activeTab === 'thresholds'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                2. เกณฑ์เตือน Warning & Critical
              </button>
            </div>

            {/* TAB 1: Budget Amount */}
            {activeTab === 'budget' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    จำนวนเงินงบประมาณสูงสุดต่อเดือน (บาท)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      ฿
                    </span>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      value={tempBudget}
                      onChange={e => setTempBudget(e.target.value)}
                      placeholder="เช่น 50000"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base font-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                    ตัวเลือกงบประมาณด่วน
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {PRESET_BUDGETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTempBudget(preset.toString())}
                        className={`px-2 py-2 rounded-xl text-xs font-bold border transition-all ${
                          Number(tempBudget) === preset
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        ฿{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Thresholds & Alerts */}
            {activeTab === 'thresholds' && (
              <div className="space-y-4">
                {/* Warning Threshold */}
                <div className="space-y-1.5 p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span>เกณฑ์เตือน Warning Alert (% ของงบ)</span>
                    </label>
                    <span className="font-mono text-xs font-black text-amber-700 dark:text-amber-300">
                      {tempWarning}%
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                    ระบบจะแสดงป้ายเตือน Warning สีส้ม เมื่อใช้จ่ายถึงเปอร์เซ็นต์นี้
                  </p>
                  <div className="flex gap-1.5 pt-1">
                    {WARNING_PRESETS.map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setTempWarning(w)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          tempWarning === w
                            ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {w}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Critical Threshold */}
                <div className="space-y-1.5 p-3.5 bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-800/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-rose-900 dark:text-rose-200 flex items-center space-x-1.5">
                      <ShieldAlert size={14} className="text-rose-500" />
                      <span>เกณฑ์เตือน Critical Alert (% ของงบ)</span>
                    </label>
                    <span className="font-mono text-xs font-black text-rose-700 dark:text-rose-300">
                      {tempCritical}%
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                    ระบบจะแสดงป้ายเตือน Critical สีแดงและแจ้งเตือนด่วนทันทีเมื่อใช้จ่ายถึงเกณฑ์นี้
                  </p>
                  <div className="flex gap-1.5 pt-1">
                    {CRITICAL_PRESETS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTempCritical(c)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          tempCritical === c
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {c}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notifications Switch */}
                <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
                      <Bell size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        แจ้งเตือนผ่าน Toast Alert อัตโนมัติ
                      </span>
                      <p className="text-[10px] text-slate-400">ส่งแจ้งเตือนในระบบเมื่อก้าวข้ามเกณฑ์ Warning/Critical</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempNotifs}
                    onChange={e => setTempNotifs(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={saving}
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <Check size={16} />
                <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
