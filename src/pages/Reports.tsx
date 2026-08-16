import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useTransactions } from '../hooks/useTransactions';
import { useChartTheme } from '../hooks/useTheme';
import { useAppConfig } from '../hooks/useAppConfig';
import PDFReportModal from '../components/PDFReportModal';
import DocumentGeneratorModal from '../components/DocumentGeneratorModal';
import CategoryBudgetTracker from '../components/CategoryBudgetTracker';
import ProfitabilitySimulator from '../components/ProfitabilitySimulator';
import { Transaction, DocumentType } from '../types';
import { 
  format, parseISO, startOfDay, endOfDay, isWithinInterval, 
  subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameDay, subMonths, startOfYear, endOfYear
} from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  FileText, Calendar, BarChart3, PieChart as PieIcon, Download, 
  Printer, TrendingUp, TrendingDown, Wallet, Percent, Target,
  CheckCircle2, Clock, Filter, ArrowUpRight, ArrowDownRight, RefreshCw,
  Receipt, ShieldCheck, FileCheck, Building, Calculator, Sliders
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, Line, ComposedChart
} from 'recharts';
import { toast } from 'react-hot-toast';

type PeriodMode = 'daily' | 'weekly' | 'monthly' | 'custom';
type ReportViewMode = 'monthly_summary' | 'budget_tracker' | 'what_if_simulation' | 'overview' | 'categories' | 'sales' | 'tax_report' | 'table';

const PIE_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1'
];

const ReportCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-3 text-xs space-y-1.5">
        <p className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/80 pb-1">
          {label}
        </p>
        {payload.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between space-x-4">
            <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span>{item.name}:</span>
            </span>
            <span className="font-bold font-num" style={{ color: item.color }}>
              ฿{Number(item.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PieCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-3 text-xs space-y-1">
        <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-100">
          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: item.payload.fill || item.color }} />
          <span>{item.name}</span>
        </div>
        <div className="font-black text-brand dark:text-brand font-num">
          ฿{Number(item.value).toLocaleString()}
        </div>
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const { transactions, loading } = useTransactions();
  const { chartColors } = useChartTheme();
  const { config } = useAppConfig();
  
  // Period filter states
  const [periodMode, setPeriodMode] = useState<PeriodMode>('monthly');
  const [singleDate, setSingleDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Active view tab
  const [activeViewMode, setActiveViewMode] = useState<ReportViewMode>('monthly_summary');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableFilterType, setTableFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showPDFModal, setShowPDFModal] = useState(false);

  // Single Transaction Document Generator Modal State
  const [selectedDocTx, setSelectedDocTx] = useState<Transaction | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('full_tax_invoice');

  // Quick preset shortcuts
  const applyPreset = (preset: 'today' | '7days' | 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const today = new Date();
    if (preset === 'today') {
      setPeriodMode('daily');
      setSingleDate(format(today, 'yyyy-MM-dd'));
    } else if (preset === '7days') {
      setPeriodMode('custom');
      setStartDate(format(subDays(today, 6), 'yyyy-MM-dd'));
      setEndDate(format(today, 'yyyy-MM-dd'));
    } else if (preset === 'thisMonth') {
      setPeriodMode('monthly');
      setSelectedMonth(format(today, 'yyyy-MM'));
    } else if (preset === 'lastMonth') {
      setPeriodMode('monthly');
      setSelectedMonth(format(subMonths(today, 1), 'yyyy-MM'));
    } else if (preset === 'thisYear') {
      setPeriodMode('custom');
      setStartDate(format(startOfYear(today), 'yyyy-MM-dd'));
      setEndDate(format(endOfYear(today), 'yyyy-MM-dd'));
    }
  };

  // Calculate actual Date objects range
  const dateInterval = useMemo(() => {
    let start: Date;
    let end: Date;

    if (periodMode === 'daily') {
      const d = singleDate ? new Date(singleDate) : new Date();
      start = startOfDay(d);
      end = endOfDay(d);
    } else if (periodMode === 'weekly') {
      const d = singleDate ? new Date(singleDate) : new Date();
      start = startOfWeek(d, { weekStartsOn: 1 }); // Monday start
      end = endOfWeek(d, { weekStartsOn: 1 });
    } else if (periodMode === 'monthly') {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const d = new Date(Number(yearStr), Number(monthStr) - 1, 1);
      start = startOfMonth(d);
      end = endOfMonth(d);
    } else {
      start = startOfDay(startDate ? new Date(startDate) : new Date());
      end = endOfDay(endDate ? new Date(endDate) : new Date());
    }

    return { start, end };
  }, [periodMode, singleDate, selectedMonth, startDate, endDate]);

  // Filter transactions within interval
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start: dateInterval.start, end: dateInterval.end });
    });
  }, [transactions, dateInterval]);

  // Report Statistics Calculations
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const incomeCategories: Record<string, number> = {};
    const expenseCategories: Record<string, number> = {};
    const setOptions: Record<string, { count: number; amount: number }> = {};
    let paidAmount = 0;
    let unpaidAmount = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    filteredTransactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amt;
        incomeCategories[t.category] = (incomeCategories[t.category] || 0) + amt;

        // Sale orders tracking
        if (['รายรับจาก Sale order', 'แบตเตอรี่', 'ตู้คอมบายเนอร์+อินเวอร์เตอร์'].includes(t.category)) {
          let setName = t.category;
          if (t.saleOrderDetails?.setOption) {
            setName = `ชุด ${t.saleOrderDetails.setOption}`;
          } else if (t.category === 'แบตเตอรี่' && t.saleOrderDetails?.batteryOption) {
            setName = `แบต: ${t.saleOrderDetails.batteryOption}`;
          } else if (t.category === 'ตู้คอมบายเนอร์+อินเวอร์เตอร์' && t.saleOrderDetails?.combinerOption) {
            setName = `คอมบายเนอร์: ${t.saleOrderDetails.combinerOption}`;
          }

          if (!setOptions[setName]) {
            setOptions[setName] = { count: 0, amount: 0 };
          }
          setOptions[setName].count += 1;
          setOptions[setName].amount += amt;

          if (t.saleOrderDetails?.paymentStatus === 'paid') {
            paidAmount += amt;
            paidCount += 1;
          } else {
            unpaidAmount += amt;
            unpaidCount += 1;
          }
        }
      } else {
        totalExpense += amt;
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + amt;
      }
    });

    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0';

    // Group time-series data for chart
    const daysList = eachDayOfInterval({ start: dateInterval.start, end: dateInterval.end });
    const trendMap: Record<string, { dateStr: string; label: string; income: number; expense: number; profit: number }> = {};

    daysList.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      const label = format(day, daysList.length <= 14 ? 'd MMM' : 'd/MM', { locale: th });
      trendMap[key] = { dateStr: key, label, income: 0, expense: 0, profit: 0 };
    });

    filteredTransactions.forEach(t => {
      const key = format(parseISO(t.date), 'yyyy-MM-dd');
      if (trendMap[key]) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') {
          trendMap[key].income += amt;
        } else {
          trendMap[key].expense += amt;
        }
        trendMap[key].profit = trendMap[key].income - trendMap[key].expense;
      }
    });

    const trendChartData = Object.values(trendMap);

    // Format category chart data
    const incomePieData = Object.entries(incomeCategories).map(([name, value]) => ({ name, value }));
    const expensePieData = Object.entries(expenseCategories).map(([name, value]) => ({ name, value }));

    const salesBreakdown = Object.entries(setOptions)
      .map(([name, data]) => ({ name, count: data.count, amount: data.amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin,
      transactionCount: filteredTransactions.length,
      incomeCategories,
      expenseCategories,
      incomePieData,
      expensePieData,
      trendChartData,
      salesBreakdown,
      paidAmount,
      unpaidAmount,
      paidCount,
      unpaidCount
    };
  }, [filteredTransactions, dateInterval]);

  // Export to CSV function
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = ['วันที่', 'เวลา', 'ประเภท', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน (บาท)', 'สถานะชำระเงิน', 'ลูกค้า/จังหวัด'];
    
    const rows = filteredTransactions.map(t => {
      const d = parseISO(t.date);
      const dateStr = format(d, 'yyyy-MM-dd');
      const timeStr = format(d, 'HH:mm');
      const typeStr = t.type === 'income' ? 'รายรับ' : 'รายจ่าย';
      const catStr = `"${t.category.replace(/"/g, '""')}"`;
      const detailStr = `"${(t.detail || '').replace(/"/g, '""')}"`;
      const amtStr = t.amount;
      const statusStr = t.saleOrderDetails?.paymentStatus === 'paid' ? 'ชำระแล้ว' : (t.saleOrderDetails?.paymentStatus === 'unpaid' ? 'ยังไม่ชำระ' : '-');
      const customerStr = t.saleOrderDetails ? `"${t.saleOrderDetails.customerName} (${t.saleOrderDetails.province})"` : '-';

      return [dateStr, timeStr, typeStr, catStr, detailStr, amtStr, statusStr, customerStr].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายงานรายรับรายจ่าย_${format(dateInterval.start, 'yyyyMMdd')}-${format(dateInterval.end, 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว');
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Filtered transactions for the Table view tab
  const tableData = useMemo(() => {
    return filteredTransactions.filter(t => {
      const matchesType = tableFilterType === 'all' || t.type === tableFilterType;
      const q = tableSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        t.category.toLowerCase().includes(q) || 
        t.detail?.toLowerCase().includes(q) || 
        t.amount.toString().includes(q) ||
        t.saleOrderDetails?.customerName.toLowerCase().includes(q) ||
        t.saleOrderDetails?.province.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [filteredTransactions, tableFilterType, tableSearch]);

  const topExpenseCategory = useMemo(() => {
    if (!stats.expensePieData || stats.expensePieData.length === 0) return null;
    return stats.expensePieData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
  }, [stats.expensePieData]);

  const averageDailySpend = useMemo(() => {
    const daysCount = stats.trendChartData.length || 1;
    return stats.totalExpense / daysCount;
  }, [stats.totalExpense, stats.trendChartData]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FileText className="mr-2 text-green-600 dark:text-green-400" size={28} />
            ระบบออกรายงาน
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            สรุปรายงานผลการดำเนินงาน รายรับ รายจ่าย กำไร และยอดขาย
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setShowPDFModal(true)}
            className="flex items-center px-3.5 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-xs transition-all"
            title="พรีวิวและออกรายงานเอกสาร PDF"
          >
            <FileText size={14} className="mr-1.5" />
            รายงาน PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center px-3 py-2 text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors shadow-xs"
            title="ส่งออกไฟล์ CSV สำหรับเปิดใน Excel"
          >
            <Download size={14} className="mr-1.5" />
            ส่งออก CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="พิมพ์รายงาน"
          >
            <Printer size={14} className="mr-1.5" />
            พิมพ์
          </button>
        </div>
      </div>

      {/* Date Range Selector Box */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors space-y-4">
        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            <button
              onClick={() => setPeriodMode('daily')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                periodMode === 'daily'
                  ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              รายวัน
            </button>
            <button
              onClick={() => setPeriodMode('weekly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                periodMode === 'weekly'
                  ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              รายสัปดาห์
            </button>
            <button
              onClick={() => setPeriodMode('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                periodMode === 'monthly'
                  ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              รายเดือน
            </button>
            <button
              onClick={() => setPeriodMode('custom')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                periodMode === 'custom'
                  ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              กำหนดเอง
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center space-x-1 text-[11px] overflow-x-auto scrollbar-hide py-1">
            <span className="text-gray-400 mr-1 hidden sm:inline">ทางลัด:</span>
            <button
              onClick={() => applyPreset('today')}
              className="px-2 py-1 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg whitespace-nowrap"
            >
              วันนี้
            </button>
            <button
              onClick={() => applyPreset('7days')}
              className="px-2 py-1 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg whitespace-nowrap"
            >
              7 วันล่าสุด
            </button>
            <button
              onClick={() => applyPreset('thisMonth')}
              className="px-2 py-1 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg whitespace-nowrap"
            >
              เดือนนี้
            </button>
            <button
              onClick={() => applyPreset('lastMonth')}
              className="px-2 py-1 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg whitespace-nowrap"
            >
              เดือนที่แล้ว
            </button>
            <button
              onClick={() => applyPreset('thisYear')}
              className="px-2 py-1 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg whitespace-nowrap"
            >
              ปีนี้
            </button>
          </div>
        </div>

        {/* Inputs based on Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {periodMode === 'daily' && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">เลือกวันที่ต้องการ</label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          {periodMode === 'weekly' && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">เลือกวันที่ในสัปดาห์นั้น</label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          {periodMode === 'monthly' && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">เลือกเดือนและปี</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          {periodMode === 'custom' && (
            <div className="grid grid-cols-2 gap-2 sm:col-span-2">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">ตั้งแต่วันที่</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">ถึงวันที่</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {/* Current Period Active Label */}
          <div className="bg-green-50/70 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 p-2.5 rounded-xl flex items-center justify-between text-xs sm:col-span-1">
            <span className="text-gray-600 dark:text-gray-300 font-medium flex items-center">
              <Calendar size={14} className="mr-1.5 text-green-600 dark:text-green-400" />
              ช่วงเวลาที่เลือก:
            </span>
            <span className="font-bold text-green-700 dark:text-green-400">
              {format(dateInterval.start, 'd MMM yyyy', { locale: th })} - {format(dateInterval.end, 'd MMM yyyy', { locale: th })}
            </span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Income Card */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">รายรับรวม</span>
            <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 truncate">
            ฿{stats.totalIncome.toLocaleString()}
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">
            จากทั้งหมด {stats.transactionCount} รายการ
          </span>
        </div>

        {/* Expense Card */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">รายจ่ายรวม</span>
            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <TrendingDown size={16} />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400 truncate">
            ฿{stats.totalExpense.toLocaleString()}
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">
            ค่าใช้จ่ายดำเนินงาน
          </span>
        </div>

        {/* Profit Card */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">กำไรสุทธิ</span>
            <div className={`w-7 h-7 rounded-lg ${stats.netProfit >= 0 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'} flex items-center justify-center`}>
              <Wallet size={16} />
            </div>
          </div>
          <p className={`text-lg sm:text-xl font-bold truncate ${stats.netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
            ฿{stats.netProfit.toLocaleString()}
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">
            {stats.netProfit >= 0 ? 'กำไร' : 'ขาดทุน'}
          </span>
        </div>

        {/* Margin Card */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">อัตรากำไร (Margin)</span>
            <div className="w-7 h-7 rounded-lg bg-brand-soft dark:bg-brand/40 text-brand dark:text-brand flex items-center justify-center">
              <Percent size={16} />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
            {stats.profitMargin}%
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">
            ต่อรายรับรวม
          </span>
        </div>
      </div>

      {/* Report View Format Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveViewMode('monthly_summary')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center ${
            activeViewMode === 'monthly_summary'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Percent size={16} className="mr-1.5" />
          สรุปผลการดำเนินงานรายเดือน
        </button>
        <button
          onClick={() => setActiveViewMode('budget_tracker')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center ${
            activeViewMode === 'budget_tracker'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Target size={16} className="mr-1.5 text-emerald-500" />
          ติดตามงบประมาณหมวดหมู่ (Budget Tracker)
        </button>
        <button
          onClick={() => setActiveViewMode('what_if_simulation')}
          className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center ${
            activeViewMode === 'what_if_simulation'
              ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/30'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Calculator size={16} className="mr-1.5 text-brand" />
          จำลองกำไรสุทธิ (What-If Simulator)
        </button>
        <button
          onClick={() => setActiveViewMode('overview')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center ${
            activeViewMode === 'overview'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BarChart3 size={16} className="mr-1.5" />
          กราฟภาพรวมกำไรขาดทุน
        </button>
        <button
          onClick={() => setActiveViewMode('categories')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center ${
            activeViewMode === 'categories'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <PieIcon size={16} className="mr-1.5" />
          สัดส่วนหมวดหมู่
        </button>
        <button
          onClick={() => setActiveViewMode('sales')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center ${
            activeViewMode === 'sales'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Wallet size={16} className="mr-1.5" />
          วิเคราะห์งานขาย (Solar)
        </button>
        <button
          onClick={() => setActiveViewMode('tax_report')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center ${
            activeViewMode === 'tax_report'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Receipt size={16} className="mr-1.5" />
          รายงานภาษี (ภ.พ. 30) & เอกสาร
        </button>
        <button
          onClick={() => setActiveViewMode('table')}
          className={`px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center ${
            activeViewMode === 'table'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FileText size={16} className="mr-1.5" />
          ตารางรายละเอียด ({filteredTransactions.length})
        </button>
      </div>

      {/* VIEW 0: MONTHLY SUMMARY */}
      {activeViewMode === 'monthly_summary' && (
        <div className="space-y-6">
          {/* Executive Overview Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-3xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 block uppercase tracking-wider">กำไรสุทธิ</span>
                <span className={`text-xl font-black font-num block mt-1 ${stats.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  ฿{stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${stats.netProfit >= 0 ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'}`}>
                {stats.netProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-3xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 block uppercase tracking-wider">อัตรากำไร</span>
                <span className="text-xl font-black font-num block mt-1 text-blue-600 dark:text-blue-400">
                  {stats.profitMargin}%
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Percent size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-3xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 block uppercase tracking-wider">รายจ่ายเฉลี่ยต่อวัน</span>
                <span className="text-xl font-black font-num block mt-1 text-orange-600 dark:text-orange-400">
                  ฿{averageDailySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-3xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 block uppercase tracking-wider">กลุ่มรายจ่ายสูงสุด</span>
                <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200 block mt-2 truncate max-w-[150px]">
                  {topExpenseCategory ? topExpenseCategory.name : 'ไม่มีรายจ่าย'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Wallet size={20} />
              </div>
            </div>
          </div>

          {/* Analytical Double Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Donut Chart */}
            <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center">
                  <PieIcon size={18} className="mr-2 text-rose-500" />
                  สัดส่วนรายจ่ายแยกตามหมวดหมู่
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">
                  กราฟแสดงสัดส่วนการใช้จ่ายเพื่อวิเคราะห์หาหมวดหมู่ที่ใช้เงินสูงสุดในเดือนนี้
                </p>
              </div>

              {stats.expensePieData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-6">
                  {/* The actual Pie Donut */}
                  <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.expensePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {stats.expensePieData.map((_, i) => (
                            <Cell key={`summary-cell-${i}`} fill={PIE_COLORS[(i + 3) % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieCustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Sum of Expenses in Center of Donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">รวมรายจ่าย</span>
                      <span className="text-sm font-black font-num text-gray-850 dark:text-white mt-0.5">
                        ฿{stats.totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* Legendary indicators side-by-side on desktop */}
                  <div className="flex-1 space-y-2.5 w-full">
                    {stats.expensePieData.slice(0, 5).map((item, i) => {
                      const pct = ((item.value / (stats.totalExpense || 1)) * 100).toFixed(1);
                      return (
                        <div key={item.name} className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center space-x-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[(i + 3) % PIE_COLORS.length] }}></span>
                            <span className="text-gray-650 dark:text-gray-300 font-bold truncate">{item.name}</span>
                          </div>
                          <span className="text-gray-400 font-bold ml-2 shrink-0">
                            ฿{item.value.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                    {stats.expensePieData.length > 5 && (
                      <div className="text-[10px] text-gray-450 italic text-right font-medium">
                        และหมวดหมู่อื่นๆ อีก {stats.expensePieData.length - 5} หมวดหมู่...
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <PieIcon size={32} className="opacity-20 mb-2" />
                  <p className="text-xs">ไม่มีข้อมูลรายจ่ายในช่วงนี้</p>
                </div>
              )}
            </div>

            {/* Right: Rich Category Expenditure Details Progress bars */}
            <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center">
                  <Percent size={18} className="mr-2 text-brand" />
                  วิเคราะห์งบประมาณและรายจ่าย
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">
                  การแจกแจงค่าใช้จ่ายสะสมเรียงลำดับจากสูงไปต่ำพร้อมสัดส่วนเปอร์เซ็นต์
                </p>
              </div>

              {stats.expensePieData.length > 0 ? (
                <div className="space-y-4 py-4 overflow-y-auto max-h-[220px] scrollbar-thin pr-1">
                  {stats.expensePieData.slice(0, 6).map((item, i) => {
                    const pct = ((item.value / (stats.totalExpense || 1)) * 100).toFixed(1);
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                          <span className="text-gray-900 dark:text-white font-num">
                            ฿{item.value.toLocaleString()} <span className="text-gray-400 font-medium text-[10px]">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: PIE_COLORS[(i + 3) % PIE_COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Percent size={32} className="opacity-20 mb-2" />
                  <p className="text-xs">ไม่มีข้อมูลรายละเอียดรายจ่าย</p>
                </div>
              )}
            </div>
          </div>

          {/* Intelligent Automated Advisor Card */}
          <div className="bg-gradient-to-r from-brand-soft/40 via-brand-soft/10 to-transparent dark:from-amber-950/20 dark:to-transparent border border-brand-soft/50 dark:border-amber-950/40 rounded-2xl p-5 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-soft dark:bg-amber-950/40 text-brand dark:text-brand uppercase tracking-wider mb-1">
                การวิเคราะห์การเงินอัตโนมัติ
              </span>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                สรุปและข้อเสนอแนะประจำรอบช่วงเวลานี้
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                {stats.totalExpense === 0 ? (
                  "ยินดีด้วย! คุณยังไม่มีรายการรายจ่ายในช่วงเวลานี้เลย ถือเป็นโอกาสดีในการเก็บออมและเพิ่มพูนสภาพคล่องทางการเงินให้พร้อมรับทุกสถานการณ์"
                ) : (
                  <>
                    หมวดหมู่ <strong className="text-brand dark:text-brand font-extrabold">"{topExpenseCategory?.name || 'ทั่วไป'}"</strong> เป็นกลุ่มรายจ่ายส่วนใหญ่ของคุณในรอบนี้ 
                    คิดเป็นสัดส่วนสูงถึง <strong className="text-gray-800 dark:text-gray-100 font-extrabold">{((topExpenseCategory?.value || 0) / (stats.totalExpense || 1) * 100).toFixed(1)}%</strong> ของรายจ่ายรวมทั้งหมด 
                    {stats.netProfit >= 0 ? (
                      ` แม้ว่าคุณจะยังมีกำไรสุทธิคงเหลือสะสม ฿${stats.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} แต่อาจลองพิจารณาควบคุมงบประมาณในส่วนดังกล่าวเพิ่มเติมเพื่อช่วยยกกระชับกำไรส่วนต่างสุทธิให้สูงขึ้นในอนาคต`
                    ) : (
                      ` และเนื่องจากรอบนี้สถานการณ์รวมติดลบอยู่ ฿${Math.abs(stats.netProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })} การปรับลดหรือเจรจาขอลดต้นทุนวัตถุดิบ/ค่าบริการในหมวดดังกล่าวจะช่วยให้สถิติการเงินฟื้นตัวกลับสู่จุดคุ้มทุนได้รวดเร็วที่สุด`
                    )}
                  </>
                )}
              </p>
            </div>
            <div className="shrink-0 flex items-center space-x-2">
              <button
                onClick={() => setActiveViewMode('budget_tracker')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Target size={14} />
                <span>ติดตามงบรายหมวดหมู่</span>
              </button>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3.5 py-2 rounded-xl flex items-center space-x-2.5 shadow-3xs">
                <div className="w-7 h-7 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={15} />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 block uppercase tracking-wider">สุขภาพการเงิน</span>
                  <span className="text-xs font-black text-gray-800 dark:text-white">
                    {stats.netProfit >= 0 ? 'อยู่ในเกณฑ์ดีเยี่ยม' : 'ควรปรับปรุงต้นทุน'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CATEGORY BUDGET TRACKER */}
      {activeViewMode === 'budget_tracker' && (
        <CategoryBudgetTracker 
          transactions={filteredTransactions}
          selectedMonthName={format(dateInterval.start, 'MMMM yyyy', { locale: th })}
        />
      )}

      {/* VIEW: WHAT-IF PROFITABILITY SIMULATOR */}
      {activeViewMode === 'what_if_simulation' && (
        <ProfitabilitySimulator
          baseIncome={stats.totalIncome}
          baseExpense={stats.totalExpense}
          expenseCategories={stats.expenseCategories}
          incomeCategories={stats.incomeCategories}
        />
      )}

      {/* VIEW 1: OVERVIEW CHARTS */}
      {activeViewMode === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transition-colors">
            <h3 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center">
              <BarChart3 className="mr-2 text-green-500" size={18} />
              แนวโน้มรายรับ รายจ่าย และกำไร (ตามช่วงเวลาที่เลือก)
            </h3>
            {stats.trendChartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer key={chartColors.isDarkMode ? 'dark' : 'light'} width="100%" height="100%">
                  <ComposedChart data={stats.trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.gridColor} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: chartColors.subtextColor }} />
                    <YAxis 
                      tick={{ fontSize: 10, fill: chartColors.subtextColor }}
                      tickFormatter={(val) => val >= 1000 ? `฿${(val / 1000).toFixed(0)}k` : `฿${val}`}
                    />
                    <Tooltip content={<ReportCustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
                      formatter={(value: string) => (
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">{value}</span>
                      )}
                    />
                    <Bar name="รายรับ" dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar name="รายจ่าย" dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Line name="กำไรสุทธิ" type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">ไม่มีข้อมูลในช่วงเวลานี้</div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: CATEGORY BREAKDOWN */}
      {activeViewMode === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center text-green-600 dark:text-green-400">
              <TrendingUp size={18} className="mr-2" />
              สัดส่วนรายรับตามหมวดหมู่
            </h3>
            {stats.incomePieData.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.incomePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.incomePieData.map((_, i) => (
                          <Cell key={`income-cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieCustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {stats.incomePieData.map((item, i) => {
                    const pct = ((item.value / (stats.totalIncome || 1)) * 100).toFixed(1);
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 dark:text-white mr-2">฿{item.value.toLocaleString()}</span>
                          <span className="text-gray-400">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs">ไม่มีข้อมูลรายรับในช่วงนี้</div>
            )}
          </div>

          {/* Expense Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center text-red-600 dark:text-red-400">
              <TrendingDown size={18} className="mr-2" />
              สัดส่วนรายจ่ายตามหมวดหมู่
            </h3>
            {stats.expensePieData.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.expensePieData.map((_, i) => (
                          <Cell key={`expense-cell-${i}`} fill={PIE_COLORS[(i + 3) % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieCustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {stats.expensePieData.map((item, i) => {
                    const pct = ((item.value / (stats.totalExpense || 1)) * 100).toFixed(1);
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[(i + 3) % PIE_COLORS.length] }}></span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 dark:text-white mr-2">฿{item.value.toLocaleString()}</span>
                          <span className="text-gray-400">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs">ไม่มีข้อมูลรายจ่ายในช่วงนี้</div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: SALES ANALYSIS */}
      {activeViewMode === 'sales' && (
        <div className="space-y-6">
          {/* Payment Status Ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center">
                  <CheckCircle2 size={16} className="mr-1" />
                  ยอดขายที่ชำระเงินแล้ว ({stats.paidCount} ออเดอร์)
                </span>
                <p className="text-xl font-bold text-green-700 dark:text-green-400 mt-1">
                  ฿{stats.paidAmount.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="bg-brand-soft dark:bg-brand/20 border border-brand-soft dark:border-brand p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-brand dark:text-brand font-medium flex items-center">
                  <Clock size={16} className="mr-1" />
                  ยอดค้างชำระ ({stats.unpaidCount} ออเดอร์)
                </span>
                <p className="text-xl font-bold text-brand dark:text-brand mt-1">
                  ฿{stats.unpaidAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Sales by Set / Product Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">ยอดขายจำแนกตามรุ่น/ชุดสินค้า</h3>
            {stats.salesBreakdown.length > 0 ? (
              <div className="space-y-3">
                {stats.salesBreakdown.map((item) => {
                  const maxAmt = stats.salesBreakdown[0]?.amount || 1;
                  const pct = Math.min(100, Math.round((item.amount / maxAmt) * 100));
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-800 dark:text-gray-200">{item.name} ({item.count} ออเดอร์)</span>
                        <span className="text-green-600 dark:text-green-400 font-bold">฿{item.amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs">ไม่มีรายการขายในช่วงนี้</div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3.5: TAX REPORT (ภ.พ. 30) & DOCUMENT MANAGEMENT */}
      {activeViewMode === 'tax_report' && (
        <div className="space-y-6">
          {/* Tax Summary Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-3xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">รายได้รวมทั้งหมด</span>
              <span className="text-lg font-black text-gray-900 dark:text-white block mt-1">
                ฿{stats.totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-400 mt-1 block">ฐานภาษีขาย: ฿{(stats.totalIncome / 1.07).toLocaleString('th-TH', { maximumFractionDigits: 2 })}</span>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-3xs">
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">ภาษีขาย (Output VAT 7%)</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                ฿{(stats.totalIncome - (stats.totalIncome / 1.07)).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1 block">คำนวณจากรายรับรวม</span>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-3xs">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">รายจ่ายรวมทั้งหมด</span>
              <span className="text-lg font-black text-gray-900 dark:text-white block mt-1">
                ฿{stats.totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-400 mt-1 block">ฐานภาษีซื้อ: ฿{(stats.totalExpense / 1.07).toLocaleString('th-TH', { maximumFractionDigits: 2 })}</span>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-4 border border-rose-200 dark:border-rose-800 shadow-3xs">
              <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">ภาษีซื้อ (Input VAT 7%)</span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400 block mt-1">
                ฿{(stats.totalExpense - (stats.totalExpense / 1.07)).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-rose-600 dark:text-rose-500 mt-1 block">คำนวณจากรายจ่ายรวม</span>
            </div>

            <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl p-4 shadow-md col-span-1 sm:col-span-3 lg:col-span-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-70">ภาษีสุทธิ ภ.พ. 30</span>
              <span className="text-lg font-black block mt-1 text-emerald-400 dark:text-emerald-600">
                ฿{((stats.totalIncome - (stats.totalIncome / 1.07)) - (stats.totalExpense - (stats.totalExpense / 1.07))).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] opacity-70 mt-1 block">
                {((stats.totalIncome - (stats.totalIncome / 1.07)) - (stats.totalExpense - (stats.totalExpense / 1.07))) >= 0 ? 'ภาษีต้องนำส่งสรรพากร' : 'ภาษีชำระเกิน (ขอคืน/เครดิตยกไป)'}
              </span>
            </div>
          </div>

          {/* Output VAT Register Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <FileCheck size={18} className="text-emerald-500" />
                  <span>รายงานภาษีขาย & ศูนย์ออกเอกสารการค้า</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  เลือกรายการขายเพื่อพิมพ์หรือออกใบกำกับภาษีเต็มรูปแบบ/ย่อ, ใบเสร็จ, ใบเสนอราคา หรือใบแจ้งหนี้
                </p>
              </div>

              <div className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-xl">
                รวม {filteredTransactions.filter(t => t.type === 'income').length} รายการขาย
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-extrabold">
                    <th className="py-2.5 px-2">วันที่</th>
                    <th className="py-2.5 px-2">ชื่อลูกค้า / รายการ</th>
                    <th className="py-2.5 px-2 text-right">จำนวนเงินรวม</th>
                    <th className="py-2.5 px-2 text-right">มูลค่าสินค้า</th>
                    <th className="py-2.5 px-2 text-right">ภาษีขาย (7%)</th>
                    <th className="py-2.5 px-2 text-center">พิมพ์ / ออกเอกสาร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTransactions.filter(t => t.type === 'income').map(t => {
                    const amt = Number(t.amount) || 0;
                    const baseAmt = amt / 1.07;
                    const vat = amt - baseAmt;

                    return (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-gray-500 dark:text-gray-400">
                          {format(parseISO(t.date), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {t.saleOrderDetails?.customerName || t.category}
                          </div>
                          <div className="text-[10px] text-gray-400">{t.detail || '-'}</div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-black text-gray-900 dark:text-white">
                          ฿{amt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-gray-600 dark:text-gray-300">
                          ฿{baseAmt.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ฿{vat.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedDocTx(t);
                                setSelectedDocType('full_tax_invoice');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer flex items-center space-x-1"
                              title="ออกใบกำกับภาษีเต็มรูปแบบ"
                            >
                              <FileCheck size={12} />
                              <span>ใบกำกับภาษี</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDocTx(t);
                                setSelectedDocType('abbreviated_tax_invoice');
                              }}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[11px] cursor-pointer flex items-center space-x-1"
                              title="ออกสลิปอย่างย่อ POS"
                            >
                              <Receipt size={12} />
                              <span>สลิปย่อ</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDocTx(t);
                                setSelectedDocType('quotation');
                              }}
                              className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 rounded-lg font-bold text-[11px] cursor-pointer flex items-center space-x-1"
                              title="ออกใบเสนอราคา"
                            >
                              <FileText size={12} />
                              <span>ใบเสนอราคา</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTransactions.filter(t => t.type === 'income').length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        ไม่มีรายการรายรับในช่วงเวลานี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: DETAILED TABLE */}
      {activeViewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4 transition-colors">
          {/* Table Filters */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => setTableFilterType('all')}
                className={`px-3 py-1.5 text-xs rounded-xl font-medium ${tableFilterType === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setTableFilterType('income')}
                className={`px-3 py-1.5 text-xs rounded-xl font-medium ${tableFilterType === 'income' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}
              >
                เฉพาะรายรับ
              </button>
              <button
                onClick={() => setTableFilterType('expense')}
                className={`px-3 py-1.5 text-xs rounded-xl font-medium ${tableFilterType === 'expense' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
              >
                เฉพาะรายจ่าย
              </button>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="ค้นหารายการ, ลูกค้า, หมวดหมู่..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <th className="py-2.5 px-2">วันที่-เวลา</th>
                  <th className="py-2.5 px-2">ประเภท</th>
                  <th className="py-2.5 px-2">หมวดหมู่</th>
                  <th className="py-2.5 px-2">รายละเอียด</th>
                  <th className="py-2.5 px-2 text-right">จำนวนเงิน</th>
                  <th className="py-2.5 px-2 text-center">การจัดการเอกสาร</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {tableData.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-2.5 px-2 text-gray-500 dark:text-gray-400">
                      {format(parseISO(t.date), 'd MMM yy HH:mm', { locale: th })}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${t.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-medium text-gray-900 dark:text-gray-200">
                      {t.category}
                    </td>
                    <td className="py-2.5 px-2 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {t.detail || '-'}
                    </td>
                    <td className={`py-2.5 px-2 text-right font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}฿{t.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => {
                          setSelectedDocTx(t);
                          setSelectedDocType('full_tax_invoice');
                        }}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Receipt size={12} />
                        <span>ออกเอกสาร</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      ไม่พบข้อมูลตรงตามเงื่อนไข
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF Report Modal */}
      <PDFReportModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        dateInterval={dateInterval}
        transactions={filteredTransactions}
        stats={stats}
      />

      {/* Document Generator Modal for selected Transaction */}
      {selectedDocTx && (
        <DocumentGeneratorModal
          isOpen={Boolean(selectedDocTx)}
          transaction={selectedDocTx}
          shopInfo={config.shopInfo || { name: 'ร้านค้าโซล่าเซลล์', address: '', phone: '', receiptNote: '' }}
          onClose={() => setSelectedDocTx(null)}
          initialDocType={selectedDocType}
        />
      )}
    </div>
  );
}
