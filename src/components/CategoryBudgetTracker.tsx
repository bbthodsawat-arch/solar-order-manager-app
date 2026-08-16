import React, { useState, useMemo } from 'react';
import { useCategoryBudgets } from '../hooks/useCategoryBudgets';
import { useAppConfig } from '../hooks/useAppConfig';
import { Transaction } from '../types';
import { 
  Target, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Search, 
  Filter, 
  SlidersHorizontal,
  X, 
  Check, 
  TrendingUp, 
  TrendingDown,
  PieChart as PieIcon,
  RefreshCw,
  Plus,
  DollarSign,
  Info,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface CategoryBudgetTrackerProps {
  transactions: Transaction[];
  selectedMonthName?: string;
}

export default function CategoryBudgetTracker({ 
  transactions,
  selectedMonthName
}: CategoryBudgetTrackerProps) {
  const { config } = useAppConfig();
  const { 
    categoryBudgets, 
    updateCategoryBudget, 
    updateAllCategoryBudgets, 
    resetCategoryBudgets 
  } = useCategoryBudgets();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'exceeded' | 'warning' | 'safe' | 'unset'>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempBudgets, setTempBudgets] = useState<Record<string, string>>({});
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [singleTempLimit, setSingleTempLimit] = useState('');

  // All Expense Categories List
  const expenseCategories = useMemo(() => {
    const configured = config.expenseCategories
      .filter(c => c.isActive !== false)
      .map(c => c.name);

    // Also include any expense categories found in transactions
    const fromTx = transactions
      .filter(t => t.type === 'expense')
      .map(t => t.category)
      .filter(Boolean);

    return Array.from(new Set([...configured, ...fromTx])).sort();
  }, [config.expenseCategories, transactions]);

  // Actual Expense breakdown by category
  const actualCategoryExpenses = useMemo(() => {
    const expenses: Record<string, number> = {};
    
    // Only process expense transactions in the current interval/month
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'ค่าใช้จ่ายอื่นๆ';
        expenses[cat] = (expenses[cat] || 0) + (t.amount || 0);
      });

    return expenses;
  }, [transactions]);

  // Combined statistics for all categories
  const trackerStats = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;
    let exceededCount = 0;
    let warningCount = 0;
    let safeCount = 0;
    let unsetCount = 0;

    expenseCategories.forEach(cat => {
      const budget = categoryBudgets[cat] || 0;
      const spent = actualCategoryExpenses[cat] || 0;

      totalSpent += spent;
      
      if (budget > 0) {
        totalBudget += budget;
        const pct = (spent / budget) * 100;
        if (pct >= 100) {
          exceededCount++;
        } else if (pct >= 80) {
          warningCount++;
        } else {
          safeCount++;
        }
      } else {
        unsetCount++;
      }
    });

    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPct,
      exceededCount,
      warningCount,
      safeCount,
      unsetCount
    };
  }, [expenseCategories, categoryBudgets, actualCategoryExpenses]);

  // Filtered categories for UI list
  const filteredCategories = useMemo(() => {
    return expenseCategories.filter(cat => {
      const matchesSearch = cat.toLowerCase().includes(searchQuery.toLowerCase().trim());
      
      const budget = categoryBudgets[cat] || 0;
      const spent = actualCategoryExpenses[cat] || 0;
      const pct = budget > 0 ? (spent / budget) * 100 : 0;

      let matchesStatus = true;
      if (statusFilter === 'exceeded') {
        matchesStatus = budget > 0 && pct >= 100;
      } else if (statusFilter === 'warning') {
        matchesStatus = budget > 0 && pct >= 80 && pct < 100;
      } else if (statusFilter === 'safe') {
        matchesStatus = budget > 0 && pct < 80;
      } else if (statusFilter === 'unset') {
        matchesStatus = budget === 0;
      }

      return matchesSearch && matchesStatus;
    });
  }, [expenseCategories, searchQuery, statusFilter, categoryBudgets, actualCategoryExpenses]);

  // Open Bulk Modal
  const handleOpenBulkEdit = () => {
    const initial: Record<string, string> = {};
    expenseCategories.forEach(cat => {
      initial[cat] = (categoryBudgets[cat] || 0).toString();
    });
    setTempBudgets(initial);
    setIsEditModalOpen(true);
  };

  // Save Bulk Budgets
  const handleSaveBulkBudgets = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Record<string, number> = {};
    Object.entries(tempBudgets).forEach(([cat, val]) => {
      updated[cat] = Number(val) || 0;
    });
    updateAllCategoryBudgets(updated);
    setIsEditModalOpen(false);
  };

  // Quick Single Edit
  const handleOpenSingleEdit = (cat: string) => {
    setEditingCategory(cat);
    setSingleTempLimit((categoryBudgets[cat] || 0).toString());
  };

  const handleSaveSingleEdit = async (cat: string) => {
    const limit = Number(singleTempLimit);
    if (isNaN(limit) || limit < 0) {
      toast.error('กรุณาระบุงบประมาณให้ถูกต้อง');
      return;
    }
    await updateCategoryBudget(cat, limit);
    toast.success(`อัปเดตงบประมาณหมวดหมู่ "${cat}" เรียบร้อยแล้ว`);
    setEditingCategory(null);
  };

  // Auto-fill budgets based on current spent + 20% safety buffer
  const handleAutoSuggestBudgets = () => {
    const suggested: Record<string, string> = { ...tempBudgets };
    expenseCategories.forEach(cat => {
      const spent = actualCategoryExpenses[cat] || 0;
      // Round up to nearest 1,000
      const suggestedVal = spent > 0 ? Math.ceil((spent * 1.2) / 1000) * 1000 : 10000;
      suggested[cat] = suggestedVal.toString();
    });
    setTempBudgets(suggested);
    toast.success('คำนวณงบประมาณอัตโนมัติ (เผื่อความปลอดภัย +20%) เรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <Target size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  ระบบติดตามงบประมาณรายหมวดหมู่ (Category Budget Tracker)
                </h3>
                {selectedMonthName && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {selectedMonthName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                กำหนดขีดจำกัดงบประมาณและติดตามแถบความคืบหน้าการใช้จ่ายรายหมวดหมู่เพื่อควบคุมกระแสเงินสด
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenBulkEdit}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 cursor-pointer self-start sm:self-auto"
          >
            <SlidersHorizontal size={15} />
            <span>ตั้งค่าขีดจำกัดงบประมาณทั้งหมด</span>
          </button>
        </div>

        {/* KPI Figures Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Budget Allocated */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">
              งบประมาณรวมที่กำหนด
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              ฿{trackerStats.totalBudget.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-400 mt-1 block">
              จาก {expenseCategories.length - trackerStats.unsetCount} หมวดหมู่
            </span>
          </div>

          {/* Actual Spent */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">
              ใช้จ่ายจริงรวม
            </span>
            <p className={`text-xl sm:text-2xl font-black ${
              trackerStats.overallPct >= 100 
                ? 'text-rose-600 dark:text-rose-400' 
                : trackerStats.overallPct >= 80 
                ? 'text-amber-600 dark:text-amber-400' 
                : 'text-slate-900 dark:text-white'
            }`}>
              ฿{trackerStats.totalSpent.toLocaleString()}
            </p>
            <span className="text-[10px] font-bold text-slate-500 mt-1 block">
              คิดเป็น {trackerStats.overallPct}% ของงบรวม
            </span>
          </div>

          {/* Remaining Budget */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">
              งบประมาณคงเหลือรวม
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ฿{trackerStats.totalRemaining.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
              คงเหลือสัดส่วน {Math.max(0, 100 - trackerStats.overallPct)}%
            </span>
          </div>

          {/* Category Health Breakdown */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">
              สถานะตามหมวดหมู่
            </span>
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                ปลอดภัย {trackerStats.safeCount}
              </span>
              {trackerStats.warningCount > 0 && (
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
                  เฝ้าระวัง {trackerStats.warningCount}
                </span>
              )}
              {trackerStats.exceededCount > 0 && (
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse">
                  เกินงบ {trackerStats.exceededCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Overall Category Budget Progress Bar */}
        {trackerStats.totalBudget > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <span>ความคืบหน้าภาพรวมงบประมาณรายหมวดหมู่</span>
              </span>
              <span className="font-mono">{trackerStats.overallPct}%</span>
            </div>
            <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  trackerStats.overallPct >= 100 
                    ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                    : trackerStats.overallPct >= 80 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-400' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(trackerStats.overallPct, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ค้นหาหมวดหมู่รายจ่าย..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-hide py-0.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({expenseCategories.length})
          </button>
          <button
            onClick={() => setStatusFilter('exceeded')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'exceeded'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            🚨 เกินงบ ({trackerStats.exceededCount})
          </button>
          <button
            onClick={() => setStatusFilter('warning')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'warning'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            ⚠️ เฝ้าระวัง ({trackerStats.warningCount})
          </button>
          <button
            onClick={() => setStatusFilter('safe')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'safe'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            ✅ ปกติ ({trackerStats.safeCount})
          </button>
          <button
            onClick={() => setStatusFilter('unset')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'unset'
                ? 'bg-slate-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            ยังไม่ได้ตั้งงบ ({trackerStats.unsetCount})
          </button>
        </div>
      </div>

      {/* Categories Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
            <Target className="mx-auto text-slate-300 dark:text-slate-600" size={40} />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              ไม่พบหมวดหมู่ตรงตามเงื่อนไขที่ค้นหา
            </p>
          </div>
        ) : (
          filteredCategories.map(categoryName => {
            const budget = categoryBudgets[categoryName] || 0;
            const spent = actualCategoryExpenses[categoryName] || 0;
            const remaining = Math.max(0, budget - spent);
            const overBy = Math.max(0, spent - budget);
            const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;

            const isExceeded = budget > 0 && percentage >= 100;
            const isWarning = budget > 0 && percentage >= 80 && percentage < 100;
            const isSafe = budget > 0 && percentage < 80;
            const isUnset = budget === 0;

            // Bar color styles
            let barGradient = 'bg-gradient-to-r from-emerald-500 to-teal-400';
            let statusBadgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            let StatusIcon = CheckCircle2;
            let statusLabel = 'ปกติ';

            if (isExceeded) {
              barGradient = 'bg-gradient-to-r from-rose-500 to-red-600';
              statusBadgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800 font-black animate-pulse';
              StatusIcon = ShieldAlert;
              statusLabel = `เกินงบไป ฿${overBy.toLocaleString()}`;
            } else if (isWarning) {
              barGradient = 'bg-gradient-to-r from-amber-500 to-orange-400';
              statusBadgeClass = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-bold';
              StatusIcon = AlertTriangle;
              statusLabel = `ใกล้งบ (เหลือ ฿${remaining.toLocaleString()})`;
            } else if (isUnset) {
              barGradient = 'bg-slate-300 dark:bg-slate-700';
              statusBadgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
              StatusIcon = Info;
              statusLabel = 'ยังไม่ได้กำหนดงบ';
            } else {
              statusLabel = `คงเหลือ ฿${remaining.toLocaleString()}`;
            }

            const isEditingThis = editingCategory === categoryName;

            return (
              <div 
                key={categoryName}
                className={`bg-white dark:bg-slate-900 p-5 rounded-3xl border transition-all duration-200 space-y-4 relative ${
                  isExceeded
                    ? 'border-rose-200 dark:border-rose-900/60 ring-2 ring-rose-500/10'
                    : isWarning
                    ? 'border-amber-200 dark:border-amber-900/60 ring-2 ring-amber-500/10'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Top Row: Category Title & Quick Action */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{categoryName}</span>
                    </h4>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${statusBadgeClass}`}>
                        <StatusIcon size={12} />
                        <span>{statusLabel}</span>
                      </span>
                    </div>
                  </div>

                  {/* Edit limit trigger */}
                  <button
                    onClick={() => handleOpenSingleEdit(categoryName)}
                    className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-all"
                    title="แก้ไขงบประมาณหมวดหมู่นี้"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>

                {/* Single Edit inline input */}
                {isEditingThis ? (
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                    <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      ตั้งงบประมาณรายเดือนสำหรับ {categoryName} (บาท)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={singleTempLimit}
                        onChange={e => setSingleTempLimit(e.target.value)}
                        placeholder="เช่น 20000"
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveSingleEdit(categoryName)}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                      >
                        บันทึก
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="p-2 text-slate-500 hover:text-slate-800 rounded-xl"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Numerical Breakdown */
                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">งบประมาณ</span>
                      <span className="font-black text-slate-800 dark:text-slate-200">
                        {budget > 0 ? `฿${budget.toLocaleString()}` : 'ไม่ได้ตั้ง'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">ใช้จ่ายจริง</span>
                      <span className={`font-black ${isExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        ฿{spent.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">
                        {isExceeded ? 'เกินไป' : 'คงเหลือ'}
                      </span>
                      <span className={`font-black ${isExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        ฿{isExceeded ? overBy.toLocaleString() : budget > 0 ? remaining.toLocaleString() : '-'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Category Progress Bar */}
                {budget > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500 dark:text-slate-400">สัดส่วนการใช้งบ</span>
                      <span className={`font-mono font-black ${
                        isExceeded ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {percentage}%
                      </span>
                    </div>

                    <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${barGradient}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* BULK EDIT CATEGORY BUDGETS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBulkBudgets}
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    กำหนดขีดจำกัดงบประมาณรายหมวดหมู่
                  </h4>
                  <p className="text-xs text-slate-400">
                    Set Monthly Spending Limits per Expense Category
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Quick Actions */}
            <div className="flex items-center justify-between gap-2 p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 text-xs shrink-0">
              <span className="text-emerald-900 dark:text-emerald-300 font-bold flex items-center">
                <Sparkles size={14} className="mr-1.5 text-emerald-500" />
                คำนวณงบแนะนำอัตโนมัติ:
              </span>
              <button
                type="button"
                onClick={handleAutoSuggestBudgets}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                เติมงบอัตโนมัติ (+20% Buffer)
              </button>
            </div>

            {/* Scrollable Category Inputs */}
            <div className="overflow-y-auto pr-1 space-y-3 flex-1">
              {expenseCategories.map(cat => {
                const currentVal = tempBudgets[cat] || '0';
                const spent = actualCategoryExpenses[cat] || 0;

                return (
                  <div 
                    key={cat}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        {cat}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        เดือนนี้ใช้ไปแล้ว: <strong className="text-slate-700 dark:text-slate-300">฿{spent.toLocaleString()}</strong>
                      </span>
                    </div>

                    <div className="relative w-full sm:w-48">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        ฿
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={currentVal}
                        onChange={e => setTempBudgets(prev => ({ ...prev, [cat]: e.target.value }))}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={resetCategoryBudgets}
                className="px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors"
              >
                รีเซ็ตเป็นค่าเริ่มต้น
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check size={16} />
                  <span>บันทึกทั้งหมด</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
