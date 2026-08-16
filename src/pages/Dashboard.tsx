import { useState, useMemo, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { format, isToday, isThisMonth, isThisWeek, parseISO, subDays, eachDayOfInterval, startOfDay, isAfter, isBefore, isSameDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  TrendingDown, TrendingUp, Wallet, Utensils, Fuel, AlertTriangle, 
  ShieldAlert, CheckCircle2, ArrowUpRight, ArrowDownRight, Clock, Sun, 
  Activity, ChevronRight, Layers, ShoppingBag, Sparkles, Filter, Search,
  Zap, Calendar, BarChart3, PieChart as PieIcon, ArrowRight, ShieldCheck, Check, Plus, Minus, Bell, Store,
  SlidersHorizontal, Eye, EyeOff, Settings2, X, Wrench, Truck, Target, Download, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { soundFeedback } from '../utils/feedback';
import QuickAccessWidget from '../components/QuickAccessWidget';
import ExpensePieChart from '../components/ExpensePieChart';
import TrendLineChart from '../components/TrendLineChart';
import Sparkline from '../components/Sparkline';
import MonthlyBudgetCard from '../components/MonthlyBudgetCard';
import { DailyRevenueGoalCard } from '../components/DailyRevenueGoalCard';
import { SmartBudgetAlertBanner } from '../components/SmartBudgetAlertBanner';
import RecurringSuggestionsBanner from '../components/RecurringSuggestionsBanner';
import RecurringTransactionsManager from '../components/RecurringTransactionsManager';
import DailyReminderBanner from '../components/DailyReminderBanner';
import StockReportCard from '../components/StockReportCard';
import QuickNotes from '../components/QuickNotes';
import TodaysSnapshotModal from '../components/TodaysSnapshotModal';
import CategorySalesSummaryCard from '../components/CategorySalesSummaryCard';
import SalesTrendChartCard from '../components/SalesTrendChartCard';
import PinnedMetricsWidget from '../components/PinnedMetricsWidget';
import { InactivityBackupReminderBanner } from '../components/InactivityBackupReminderBanner';
import { useAppConfig, DEFAULT_WIDGET_CONFIG } from '../hooks/useAppConfig';
import { useTheme } from '../hooks/useTheme';
import { getComputedCardColor, DEFAULT_DASHBOARD_CARD_DESIGN } from '../utils/dashboardCardPresets';
import DashboardCustomizer from '../components/DashboardCustomizer';
import DashboardMetricCardsGrid from '../components/dashboard/DashboardMetricCardsGrid';
import DashboardCardCustomizerModal from '../components/dashboard/DashboardCardCustomizerModal';
import { TransactionType, TransactionCategory, Transaction, PaymentMethods, DashboardWidgetConfig } from '../types';
import { getCategoryConfig } from '../utils/categoryIcons';

interface DashboardProps {
  onQuickAdd?: (type: TransactionType, category: TransactionCategory, detail?: string, amount?: number) => void;
  onNavigate?: (tab: any) => void;
}

type TimeframeOption = 'today' | 'week' | 'month' | '30days' | 'all';

export default function Dashboard({ onQuickAdd, onNavigate }: DashboardProps) {
  const { transactions, loading, updateTransaction } = useTransactions();
  const { 
    config, 
    updateWidgetConfig, 
    moveWidget,
    updateDashboardCardDesign,
    resetDashboardCardDesign,
    toggleDashboardCardVisibility,
    reorderDashboardCards,
    setDashboardCardCustomColor
  } = useAppConfig();
  const widgets = config.dashboardWidgets || DEFAULT_WIDGET_CONFIG;
  const cardDesign = config.dashboardCardDesign;
  
  const { isDarkMode } = useTheme();
  
  const currentDesign = cardDesign || DEFAULT_DASHBOARD_CARD_DESIGN;
  const balanceColors = getComputedCardColor('total_balance', currentDesign);

  const bgGradientFrom = isDarkMode ? (balanceColors.darkBgGradientFrom || balanceColors.bgGradientFrom) : balanceColors.bgGradientFrom;
  const bgGradientTo = isDarkMode ? (balanceColors.darkBgGradientTo || balanceColors.bgGradientTo) : balanceColors.bgGradientTo;
  const textColor = isDarkMode ? (balanceColors.darkTextColor || '#ffffff') : balanceColors.textColor;
  const borderColor = isDarkMode ? (balanceColors.darkBorderColor || balanceColors.borderColor) : balanceColors.borderColor;

  // Resolve corner radius
  const radiusClass = 
    currentDesign.borderRadius === 'rounded-xl' ? 'rounded-xl' :
    currentDesign.borderRadius === 'rounded-2xl' ? 'rounded-2xl' :
    currentDesign.borderRadius === 'rounded-full-pill' ? 'rounded-[2rem]' : 'rounded-3xl';

  // Resolve shadow
  const shadowClass = 
    currentDesign.shadowStyle === 'glow' ? 'shadow-lg ring-1' :
    currentDesign.shadowStyle === 'floating' ? 'shadow-xl -translate-y-0.5' :
    currentDesign.shadowStyle === 'flat' ? 'shadow-none border-2' : 'shadow-md';

  // Hover scale
  const hoverClass = currentDesign.enableHoverScale ? 'hover:scale-[1.01] hover:shadow-lg transition-all duration-300' : 'transition-all duration-300';
  
  const [timeframe, setTimeframe] = useState<TimeframeOption>('month');
  const [solarSearch, setSolarSearch] = useState('');
  const [solarStatusFilter, setSolarStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showTodaySnapshotModal, setShowTodaySnapshotModal] = useState(false);
  const [storeName, setStoreName] = useState<'ร้านน้ำหนาวโซล่าเซลล์' | 'ร้านกลางนาโซล่าเซลล์'>('ร้านกลางนาโซล่าเซลล์');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showCardCustomizerModal, setShowCardCustomizerModal] = useState(false);

  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem('dailyIncomeGoal');
    return saved ? Number(saved) : 50000;
  });
  const toggleWidget = (key: keyof DashboardWidgetConfig) => {
    updateWidgetConfig({ [key]: !widgets[key] });
  };

  const moveWidgetHandler = (key: keyof DashboardWidgetConfig, direction: 'up' | 'down') => {
    moveWidget(key, direction);
  };

  const resetWidgets = () => {
    updateWidgetConfig(DEFAULT_WIDGET_CONFIG);
    toast.success('คืนค่าการตั้งค่าเริ่มต้นเรียบร้อยแล้ว');
  };

  // Filter due payment alerts for solar sale orders that are unpaid & due today/overdue
  const duePaymentAlerts = useMemo(() => {
    const today = startOfDay(new Date());
    return transactions.filter(t => {
      if (t.type !== 'income' || !t.saleOrderDetails || t.saleOrderDetails.paymentStatus !== 'unpaid') {
        return false;
      }
      const deliveryDateStr = t.saleOrderDetails.deliveryDate || t.date;
      const delDate = startOfDay(parseISO(deliveryDateStr));
      return isBefore(delDate, today) || isSameDay(delDate, today);
    });
  }, [transactions]);

  // Mark order payment status to 'paid'
  const handleMarkPaid = async (t: Transaction) => {
    if (!t.id) return;
    try {
      await updateTransaction(t.id, {
        saleOrderDetails: {
          ...t.saleOrderDetails!,
          paymentStatus: 'paid',
          paymentReceivedDate: format(new Date(), 'yyyy-MM-dd')
        }
      });
      toast.success('อัปเดตสถานะเป็นชำระเงินเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // Calculate comprehensive statistics based on selected timeframe
  const stats = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));

    // Dynamic stats container for active timeframe
    let activeIncome = 0;
    let todayIncome = 0;
    let activeExpense = 0;
    let activeTxCount = 0;
    let activeSolarCount = 0;
    let activeSolarRevenue = 0;

    // Monthly fixed stats
    let monthIncome = 0;
    let monthExpense = 0;

    // Weekly fixed stats
    let weekIncome = 0;
    let weekExpense = 0;

    // Expenses category map for pie chart
    const expensesByCategory: Record<string, number> = {};
    
    // Shipping stats
    const shippingStats: Record<string, number> = {
      'สั่งซื้อแล้ว': 0,
      'กำลังประกอบ': 0,
      'กำลังขนส่ง': 0,
      'จัดส่งสำเร็จ': 0
    };

    // Last 30 days map
    const last30Days = eachDayOfInterval({ start: thirtyDaysAgo, end: todayStart });
    const trendMap: Record<string, { date: string; income: number; expense: number; solarRevenue: number }> = {};
    last30Days.forEach(date => {
      const dateStr = format(date, 'd MMM', { locale: th });
      trendMap[dateStr] = { date: dateStr, income: 0, expense: 0, solarRevenue: 0 };
    });

    // Unpaid totals
    let totalUnpaidAmount = 0;
    let totalUnpaidCount = 0;

    // All time totals for balance calculation
    let totalAllTimeIncome = 0;
    let totalAllTimeExpense = 0;

    transactions.forEach(tx => {
      const date = parseISO(tx.date);
      const amount = Number(tx.amount) || 0;

      if (tx.type === 'income') totalAllTimeIncome += amount;
      else if (tx.type === 'expense') totalAllTimeExpense += amount;

      if (tx.type === 'income' && isToday(date)) {
        todayIncome += amount;
      }

      // Timeframe condition check
      let inActiveTimeframe = false;
      if (timeframe === 'today' && isToday(date)) inActiveTimeframe = true;
      else if (timeframe === 'week' && isThisWeek(date, { weekStartsOn: 1 })) inActiveTimeframe = true;
      else if (timeframe === 'month' && isThisMonth(date)) inActiveTimeframe = true;
      else if (timeframe === '30days' && (isAfter(date, thirtyDaysAgo) || date.getTime() === thirtyDaysAgo.getTime())) inActiveTimeframe = true;
      else if (timeframe === 'all') inActiveTimeframe = true;

      if (inActiveTimeframe) {
        if (tx.type === 'income') {
          activeIncome += amount;
          if (tx.saleOrderDetails || ['รายรับจาก Sale order', 'แบตเตอรี่', 'ตู้คอมบายเนอร์+อินเวอร์เตอร์'].includes(tx.category)) {
            activeSolarCount += 1;
            activeSolarRevenue += amount;
          }
        } else {
          activeExpense += amount;
          expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + amount;
        }
        activeTxCount += 1;
      }

      // Always calculate month totals for high-level insight
      if (isThisMonth(date)) {
        if (tx.type === 'income') monthIncome += amount;
        else monthExpense += amount;
      }

      // Always calculate week totals for high-level insight
      if (isThisWeek(date, { weekStartsOn: 1 })) {
        if (tx.type === 'income') weekIncome += amount;
        else weekExpense += amount;
      }

      // Add to 30 days trend map
      if (isAfter(date, thirtyDaysAgo) || date.getTime() === thirtyDaysAgo.getTime()) {
        const dateStr = format(date, 'd MMM', { locale: th });
        if (trendMap[dateStr]) {
          if (tx.type === 'income') {
            trendMap[dateStr].income += amount;
            if (tx.saleOrderDetails || ['รายรับจาก Sale order', 'แบตเตอรี่', 'ตู้คอมบายเนอร์+อินเวอร์เตอร์'].includes(tx.category)) {
              trendMap[dateStr].solarRevenue += amount;
            }
          } else {
            trendMap[dateStr].expense += amount;
          }
        }
      }

      // Track unpaid sale orders
      if (tx.type === 'income' && tx.saleOrderDetails?.paymentStatus === 'unpaid') {
        totalUnpaidAmount += amount;
        totalUnpaidCount += 1;
      }

      // Track shipping statuses
      if (tx.type === 'income' && tx.saleOrderDetails?.shippingStatus) {
        const status = tx.saleOrderDetails.shippingStatus;
        shippingStats[status] = (shippingStats[status] || 0) + 1;
      }
    });

    const activeProfit = activeIncome - activeExpense;
    const activeProfitMargin = activeIncome > 0 ? ((activeProfit / activeIncome) * 100).toFixed(1) : '0';
    const avgOrderValue = activeSolarCount > 0 ? Math.round(activeSolarRevenue / activeSolarCount) : 0;

    const monthProfit = monthIncome - monthExpense;

    // Pie chart data
    const chartData = Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .filter(item => item.value > 0);

    const trendData = Object.values(trendMap);

    // Filter solar sale orders for dashboard table
    const allSolarOrders = transactions
      .filter(t => (['รายรับจาก Sale order', 'แบตเตอรี่', 'ตู้คอมบายเนอร์+อินเวอร์เตอร์'].includes(t.category) || t.saleOrderDetails));

    const filteredSolarOrders = allSolarOrders.filter(tx => {
      const matchesSearch = !solarSearch || 
        tx.saleOrderDetails?.customerName?.toLowerCase().includes(solarSearch.toLowerCase()) ||
        tx.saleOrderDetails?.province?.toLowerCase().includes(solarSearch.toLowerCase()) ||
        tx.category.toLowerCase().includes(solarSearch.toLowerCase()) ||
        tx.detail?.toLowerCase().includes(solarSearch.toLowerCase());

      const matchesStatus = solarStatusFilter === 'all' || tx.saleOrderDetails?.paymentStatus === solarStatusFilter;

      return matchesSearch && matchesStatus;
    });

    // Recent overall transactions
    const recentTransactions = transactions.slice(0, 6);

    // Top Expense Category
    const topExpenseCat = chartData.length > 0 ? chartData[0] : null;

    return {
      todayIncome,
      activeIncome,
      activeExpense,
      activeProfit,
      activeProfitMargin,
      activeTxCount,
      activeSolarCount,
      activeSolarRevenue,
      avgOrderValue,
      monthIncome,
      monthExpense,
      monthProfit,
      weekIncome,
      weekExpense,
      totalUnpaidAmount,
      totalUnpaidCount,
      totalAllTimeBalance: totalAllTimeIncome - totalAllTimeExpense,
      chartData,
      trendData,
      recentSolarOrders: filteredSolarOrders.slice(0, 8),
      totalSolarOrdersCount: filteredSolarOrders.length,
      recentTransactions,
      topExpenseCat,
      shippingStats
    };
  }, [transactions, timeframe, solarSearch, solarStatusFilter]);

  const incomeSparkline = useMemo(() => stats.trendData.map(d => ({ date: d.date, value: d.income })), [stats.trendData]);
  const expenseSparkline = useMemo(() => stats.trendData.map(d => ({ date: d.date, value: d.expense })), [stats.trendData]);
  const profitSparkline = useMemo(() => stats.trendData.map(d => ({ date: d.date, value: d.income - d.expense })), [stats.trendData]);
  const solarSparkline = useMemo(() => stats.trendData.map(d => ({ date: d.date, value: d.solarRevenue || 0 })), [stats.trendData]);

  const dashboardSparklines = useMemo(() => ({
    income: incomeSparkline.map(s => s.value),
    expense: expenseSparkline.map(s => s.value),
    profit: profitSparkline.map(s => s.value),
    balance: profitSparkline.map(s => s.value),
    unpaid: [10, 15, 12, 18, 14, 20, 15],
    solar: solarSparkline.map(s => s.value)
  }), [incomeSparkline, expenseSparkline, profitSparkline, solarSparkline]);

  const timeframeFilteredTransactions = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));

    return transactions.filter(tx => {
      const date = parseISO(tx.date);
      if (timeframe === 'today') return isToday(date);
      if (timeframe === 'week') return isThisWeek(date, { weekStartsOn: 1 });
      if (timeframe === 'month') return isThisMonth(date);
      if (timeframe === '30days') return isAfter(date, thirtyDaysAgo) || date.getTime() === thirtyDaysAgo.getTime();
      return true;
    });
  }, [transactions, timeframe]);

  useEffect(() => {
    if (stats.todayIncome > 0 && stats.todayIncome >= dailyGoal) {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastNotified = localStorage.getItem('dailyGoalNotifiedDate');
      if (lastNotified !== todayStr) {
        toast.success(`🎉 ยินดีด้วย! รายรับวันนี้ทะลุเป้าหมาย ฿${dailyGoal.toLocaleString()} แล้ว!`, {
          duration: 6000,
          icon: '🏆'
        });
        localStorage.setItem('dailyGoalNotifiedDate', todayStr);
      }
    }
  }, [stats.todayIncome, dailyGoal]);

  const timeframeLabelText = 
    timeframe === 'today' ? 'วันนี้' :
    timeframe === 'week' ? 'สัปดาห์นี้' :
    timeframe === 'month' ? 'เดือนนี้' :
    timeframe === '30days' ? '30 วันล่าสุด' : 'ทั้งหมด';

  const handleExportDashboardCSV = () => {
    try {
      soundFeedback.click();
      const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
      const storeTitle = storeName || 'ร้านกลางนาโซล่าเซลล์';
      const escapeCsv = (str: any) => {
        if (str === null || str === undefined) return '""';
        const s = String(str).replace(/"/g, '""');
        return `"${s}"`;
      };

      const lines: string[] = [];

      // Section Header & Meta Information
      lines.push(`=== รายงานสรุปผลการดำเนินงานและตัวเลขการเงิน (Dashboard Financial Performance Report) ===`);
      lines.push(`ชื่อร้าน/สาขา,${escapeCsv(storeTitle)}`);
      lines.push(`ช่วงเวลาประมวลผล,${escapeCsv(timeframeLabelText)}`);
      lines.push(`วันที่สร้างรายงาน,${escapeCsv(format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: th }))}`);
      lines.push(``);

      // Section 1: Executive KPI Summary
      lines.push(`=== 1. สรุปภาพรวมทางการเงิน (Executive Financial Summary) ===`);
      lines.push(`ตัวชี้วัด (Metric),จำนวนเงิน / ค่า (Value),หน่วย (Unit)`);
      lines.push(`รายรับรวม (Total Income),${stats.activeIncome},บาท`);
      lines.push(`รายจ่ายรวม (Total Expense),${stats.activeExpense},บาท`);
      lines.push(`กำไรสุทธิ (Net Profit),${stats.activeProfit},บาท`);
      lines.push(`อัตรากำไร (Net Margin),${stats.activeProfitMargin},%`);
      lines.push(`ยอดขายโซล่าเซลล์ (Solar Revenue),${stats.activeSolarRevenue},บาท`);
      lines.push(`จำนวนออเดอร์โซล่าเซลล์ (Solar Orders),${stats.activeSolarCount},รายการ`);
      lines.push(`ยอดขายเฉลี่ย/ออเดอร์ (Avg Order Value),${stats.avgOrderValue},บาท`);
      lines.push(`ยอดค้างชำระคงเหลือ (Total Unpaid),${stats.totalUnpaidAmount},บาท`);
      lines.push(`จำนวนรายการค้างชำระ (Unpaid Count),${stats.totalUnpaidCount},รายการ`);
      lines.push(`ยอดเงินคงเหลือสะสมรวมทั้งหมด (Total All-time Balance),${stats.totalAllTimeBalance},บาท`);
      lines.push(``);

      // Section 2: Expense Category Breakdown (Pie Chart Data)
      lines.push(`=== 2. สรุปสัดส่วนหมวดหมู่รายจ่าย (Expense Breakdown - Pie Chart Data) ===`);
      lines.push(`หมวดหมู่รายจ่าย (Category),จำนวนเงิน (Expense ฿),สัดส่วน (% of Total Expense)`);
      if (stats.chartData.length > 0) {
        stats.chartData.forEach(item => {
          const pct = stats.activeExpense > 0 ? ((item.value / stats.activeExpense) * 100).toFixed(1) : '0';
          lines.push(`${escapeCsv(item.name)},${item.value},${pct}%`);
        });
      } else {
        lines.push(`ไม่มีข้อมูลรายจ่ายในช่วงเวลานี้,-,-`);
      }
      lines.push(``);

      // Section 3: Daily Trend & Financial History (Trend Line Chart Data)
      lines.push(`=== 3. ข้อมูลแนวโน้มรายวัน 30 วันล่าสุด (Daily Financial Trend Data - Line Chart) ===`);
      lines.push(`วันที่ (Date),รายรับ (Income ฿),รายจ่าย (Expense ฿),กำไรสุทธิ (Net Profit ฿),ยอดขายโซล่าเซลล์ (Solar Revenue ฿)`);
      if (stats.trendData.length > 0) {
        stats.trendData.forEach(d => {
          const net = d.income - d.expense;
          lines.push(`${escapeCsv(d.date)},${d.income},${d.expense},${net},${d.solarRevenue || 0}`);
        });
      } else {
        lines.push(`ไม่มีข้อมูลแนวโน้มรายวัน,-,-,-,-`);
      }
      lines.push(``);

      // Section 4: Shipping & Fulfillment Status Summary
      lines.push(`=== 4. สรุปสถานะการจัดส่งสินค้า (Fulfillment & Shipping Summary) ===`);
      lines.push(`สถานะ (Status),จำนวนออเดอร์ (Orders)`);
      Object.entries(stats.shippingStats).forEach(([status, count]) => {
        lines.push(`${escapeCsv(status)},${count}`);
      });
      lines.push(``);

      // Section 5: Filtered Transactions List
      lines.push(`=== 5. รายการธุรกรรมย่อยในช่วงเวลา (${escapeCsv(timeframeLabelText)}) ===`);
      lines.push(`วันที่,เวลา,ประเภท,หมวดหมู่,รายละเอียด,จำนวนเงิน (฿),รูปแบบชำระ,สถานะการชำระ,ชื่อลูกค้า/ผู้จ่าย/ร้านค้า,จังหวัด,สถานะจัดส่ง`);
      
      timeframeFilteredTransactions.forEach(tx => {
        const d = parseISO(tx.date);
        const dateStr = format(d, 'yyyy-MM-dd');
        const timeStr = format(d, 'HH:mm');
        const typeStr = tx.type === 'income' ? 'รายรับ' : 'รายจ่าย';
        const catStr = escapeCsv(tx.category);
        const detailStr = escapeCsv(tx.detail || '-');
        const amtStr = tx.amount;
        const paymentMethodStr = escapeCsv(tx.paymentMethod || tx.saleOrderDetails?.paymentMethod || '-');
        const paymentStatusStr = tx.saleOrderDetails?.paymentStatus === 'paid' ? 'ชำระแล้ว' : (tx.saleOrderDetails?.paymentStatus === 'unpaid' ? 'ยังไม่ชำระ' : '-');
        const customerStr = escapeCsv(tx.saleOrderDetails?.customerName || tx.payer || tx.vendor || '-');
        const provinceStr = escapeCsv(tx.saleOrderDetails?.province || '-');
        const shippingStr = escapeCsv(tx.saleOrderDetails?.shippingStatus || '-');

        lines.push(`${dateStr},${timeStr},${typeStr},${catStr},${detailStr},${amtStr},${paymentMethodStr},${paymentStatusStr},${customerStr},${provinceStr},${shippingStr}`);
      });

      // UTF-8 BOM byte prefix for Excel compatibility with Thai language
      const csvContent = '\uFEFF' + lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Dashboard_Report_${storeTitle.replace(/\s+/g, '_')}_${timeframe}_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      soundFeedback.success();
      toast.success('ดาวน์โหลดรายงาน CSV สรุปข้อมูลการเงินและกราฟเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Error exporting dashboard CSV:', err);
      toast.error('เกิดข้อผิดพลาดในการส่งออกรายงาน CSV');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 pb-8">
        {/* Banner Skeleton */}
        <div className="h-14 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200/40 dark:border-slate-700/30"></div>

        {/* Hero Banner Skeleton */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-36 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
            <div className="h-6 w-48 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
            <div className="h-6 w-40 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0 animate-pulse"></div>
            <div className="space-y-2.5 w-full max-w-lg">
              <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-3/4"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/2"></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="h-8 w-28 bg-slate-50 dark:bg-slate-800/80 rounded-2xl"></div>
            <div className="h-8 w-36 bg-slate-50 dark:bg-slate-800/80 rounded-2xl"></div>
            <div className="h-8 w-32 bg-slate-50 dark:bg-slate-800/80 rounded-2xl"></div>
          </div>
        </div>

        {/* 5-Column Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="h-7 w-7 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
              </div>
              <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>

        {/* Charts & Analytical Widgets Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-8 w-44 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
            </div>
            <div className="h-64 bg-slate-50 dark:bg-slate-800/40 rounded-2xl"></div>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="h-5 w-28 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-20 bg-slate-50 dark:bg-slate-800/40 rounded-2xl"></div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="h-5 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-24 bg-slate-50 dark:bg-slate-800/40 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeCardsCount = [
    widgets.showTotalIncome,
    widgets.showTotalExpense,
    widgets.showNetProfit,
    widgets.showUnpaid,
    widgets.showSolarSales
  ].filter(Boolean).length;

  const gridColsClass = 
    activeCardsCount === 5 ? 'lg:grid-cols-5' :
    activeCardsCount === 4 ? 'lg:grid-cols-4' :
    activeCardsCount === 3 ? 'lg:grid-cols-3' :
    activeCardsCount === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1';

  return (
    <div className="space-y-6 pb-8">
      
      {/* Daily Reminder Banner */}
      <DailyReminderBanner onAddTransaction={() => onQuickAdd?.('income', 'รายรับจาก Sale order')} />

      {/* Executive Hero Banner & Header Controls */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all">
        {/* Subtle decorative glow shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-200/30 to-amber-400/10 dark:from-amber-500/10 dark:to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-200/20 to-teal-400/10 dark:from-emerald-500/10 dark:to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            
            {/* Header badges with store toggle, weather icon & notification bell */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-brand-soft text-brand dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
                <Sun size={15} className="mr-1 text-brand animate-spin-slow" />
                <select 
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value as any)}
                  className="bg-transparent font-black outline-none cursor-pointer text-brand dark:text-amber-300"
                >
                  <option value="ร้านน้ำหนาวโซล่าเซลล์">ร้านน้ำหนาวโซล่าเซลล์</option>
                  <option value="ร้านกลางนาโซล่าเซลล์">ร้านกลางนาโซล่าเซลล์</option>
                </select>
              </div>

              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                <Store size={13} className="mr-1 text-sky-600 dark:text-sky-400" />
                <span>สาขาหลัก • POS Terminal พร้อมใช้งาน</span>
              </div>

              <button
                onClick={() => setShowTodaySnapshotModal(true)}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#e6f4ea] text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 dark:hover:bg-emerald-900/80 border border-[#a7f3d0] dark:border-emerald-800/80 shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Sparkles size={13} className="mr-1.5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                <span>Today's Snapshot (สรุปยอดวันนี้)</span>
              </button>

              <button
                onClick={() => setShowCustomizer(true)}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <SlidersHorizontal size={12} className="mr-1.5 text-slate-500" />
                <span>ปรับแต่งหน้าแรก</span>
              </button>

              <button
                onClick={handleExportDashboardCSV}
                className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-700/80 shadow-2xs transition-all cursor-pointer active:scale-95"
                title="ดาวน์โหลดรายงานสรุปตัวเลขการเงินและกราฟเป็นไฟล์ CSV สำหรับวิเคราะห์ออฟไลน์"
              >
                <FileSpreadsheet size={13} className="mr-1.5 text-emerald-600 dark:text-emerald-400" />
                <span>ส่งออกรายงาน CSV</span>
              </button>

              {duePaymentAlerts.length > 0 && (
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                  <Bell size={13} className="mr-1 text-rose-500" />
                  <span>{duePaymentAlerts.length} แจ้งเตือนยอดค้าง</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {(config.shopInfo?.showLogo ?? true) && (
                <img
                  src={config.shopInfo?.logoUrl || '/logo.jpg'}
                  alt="Logo"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full border-2 border-brand bg-white p-0.5 shadow-md shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.jpg';
                  }}
                />
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  ระบบบริหารการเงินและยอดขาย (Dashboard)
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed mt-1">
                  ติดตามภาพรวมรายรับ-รายจ่าย กำไรสุทธิ ยอดค้างชำระ ตารางสต็อกสินค้า และออเดอร์งานโซล่าเซลล์ • วันที่ {format(new Date(), 'd MMMM yyyy', { locale: th })}
                </p>
              </div>
            </div>

            {/* Sub Metric Badges in Hero */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <span className="text-slate-500 dark:text-slate-400 mr-1.5">ออเดอร์โซล่าเซลล์:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{stats.activeSolarCount} รายการ</strong>
              </div>
              <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <span className="text-slate-500 dark:text-slate-400 mr-1.5">ยอดขายเฉลี่ย/ออเดอร์:</span>
                <strong className="text-brand dark:text-amber-400 font-bold">฿{stats.avgOrderValue.toLocaleString()}</strong>
              </div>
              <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <span className="text-slate-500 dark:text-slate-400 mr-1.5">อัตรากำไร (Margin):</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.activeProfitMargin}%</strong>
              </div>
            </div>
          </div>

          {/* Timeframe selector tabs with subtle pastel gradient effects */}
          <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
              <Calendar size={13} className="mr-1 text-brand" />
              ช่วงเวลาประมวลผล:
            </span>

            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <button
                onClick={() => setTimeframe('today')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  timeframe === 'today'
                    ? 'bg-gradient-to-r from-brand via-brand to-brand text-slate-900 shadow-md scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                วันนี้
              </button>
              <button
                onClick={() => setTimeframe('week')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  timeframe === 'week'
                    ? 'bg-gradient-to-r from-brand via-brand to-brand text-slate-900 shadow-md scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                สัปดาห์นี้
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  timeframe === 'month'
                    ? 'bg-gradient-to-r from-brand via-brand to-brand text-slate-900 shadow-md scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                เดือนนี้
              </button>
              <button
                onClick={() => setTimeframe('30days')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  timeframe === '30days'
                    ? 'bg-gradient-to-r from-brand via-brand to-brand text-slate-900 shadow-md scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                30 วัน
              </button>
              <button
                onClick={() => setTimeframe('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  timeframe === 'all'
                    ? 'bg-gradient-to-r from-brand via-brand to-brand text-slate-900 shadow-md scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ทั้งหมด
              </button>
            </div>
          </div>
        </div>
      </div> {/* Closes Hero Banner */}
      {/* Real-time Balance & Quick Actions (Playful Soft Hero Card - Fully Customizable!) */}
      <div 
        style={{
          background: `linear-gradient(135deg, ${bgGradientFrom} 0%, ${bgGradientTo} 100%)`,
          borderColor: borderColor,
        }}
        className={`relative overflow-hidden p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border ${radiusClass} ${shadowClass} ${hoverClass}`}
      >
        {/* Optional Glass Effect */}
        {currentDesign.glassBackdropBlur && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/15 rounded-full blur-xl pointer-events-none" />
        )}
        
        {/* Decorative Blobs - Only shown if not explicitly disabled by a highly minimal preset */}
        {currentDesign.themePreset !== 'retro_terminal' && currentDesign.themePreset !== 'cyber_neon' && (
          <>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          </>
        )}

        {/* Balance Display */}
        <div className="relative z-10 text-center sm:text-left flex-1 w-full">
          <div 
            style={{ color: textColor }}
            className="font-black text-xs sm:text-sm uppercase tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-1.5 opacity-90"
          >
            {currentDesign.showIconBadge && (
              <div 
                style={{
                  backgroundColor: balanceColors.iconBgColor || 'rgba(0,0,0,0.06)',
                  color: balanceColors.iconColor || textColor
                }}
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mr-1"
              >
                <Wallet size={14} />
              </div>
            )}
            ยอดคงเหลือรวมทั้งหมด (Total Balance)
          </div>
          <h2 
            style={{ color: textColor }}
            className="text-4xl sm:text-5xl font-black tracking-tight mt-1"
          >
            <span style={{ color: balanceColors.accentColor || textColor }} className="mr-2 opacity-80">฿</span>
            {stats.totalAllTimeBalance.toLocaleString()}
          </h2>
          <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] font-bold">
            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
              <TrendingUp size={12} /> รับ: ฿{(stats.activeIncome || 0).toLocaleString()}
            </span>
            <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800/50 flex items-center gap-1">
              <TrendingDown size={12} /> จ่าย: ฿{(stats.activeExpense || 0).toLocaleString()}
            </span>
            <span 
               onClick={() => {
                 const newGoal = window.prompt('ตั้งเป้าหมายรายรับต่อวัน (บาท):', dailyGoal.toString());
                 if (newGoal && !isNaN(Number(newGoal))) {
                   const val = Number(newGoal);
                   setDailyGoal(val);
                   localStorage.setItem('dailyIncomeGoal', val.toString());
                   localStorage.removeItem('dailyGoalNotifiedDate');
                 }
               }}
              className="bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800/50 flex items-center gap-1 cursor-pointer hover:bg-purple-200/60 dark:hover:bg-purple-900/50 transition-colors"
              title="คลิกเพื่อตั้งเป้าหมายใหม่"
            >
              <Target size={12} /> เป้าหมายวันนี้: ฿{dailyGoal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Executive Key Metric Cards Grid (Customizable Pastel/Theme Grid) */}
      <DashboardMetricCardsGrid
        designConfig={cardDesign}
        stats={stats}
        sparklines={dashboardSparklines}
        onOpenCardCustomizer={() => setShowCardCustomizerModal(true)}
      />

      {/* POS Shipping Status Overview */}
      {widgets.showSolarSales && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none mb-1">สั่งซื้อแล้ว</p>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{stats.shippingStats['สั่งซื้อแล้ว']}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Wrench size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none mb-1">กำลังประกอบ</p>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{stats.shippingStats['กำลังประกอบ']}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none mb-1">กำลังขนส่ง</p>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{stats.shippingStats['กำลังขนส่ง']}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none mb-1">จัดส่งสำเร็จ</p>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{stats.shippingStats['จัดส่งสำเร็จ']}</p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Revenue Goal & Sales Progress Motivation Widget */}
      {widgets.showDailyRevenueGoal !== false && (
        <DailyRevenueGoalCard
          todayIncome={stats.todayIncome}
          onQuickAddSale={() => onQuickAdd?.('income', 'รายรับจาก Sale order')}
        />
      )}

      {/* Quick Transaction Add Shortcuts Bar */}
      {widgets.showQuickShortcuts && (
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center shrink-0 mr-1">
              <Zap size={14} className="mr-1 text-brand" />
              บันทึกด่วน:
            </span>
            <button
              onClick={() => onQuickAdd?.('income', 'รายรับจาก Sale order')}
              className="flex items-center shrink-0 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold transition-all shadow-2xs hover:scale-[1.02]"
            >
              <Sun size={14} className="mr-1.5 text-emerald-600 dark:text-emerald-400" />
              + ขายงานโซล่าเซลล์
            </button>
            <button
              onClick={() => onQuickAdd?.('expense', 'ค่าอาหาร')}
              className="flex items-center shrink-0 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-orange-800 dark:text-orange-300 rounded-xl border border-orange-200 dark:border-orange-800/60 text-xs font-bold transition-all shadow-2xs hover:scale-[1.02]"
            >
              <Utensils size={14} className="mr-1.5 text-orange-600 dark:text-orange-400" />
              + ค่าอาหาร/เบี้ยเลี้ยง
            </button>
            <button
              onClick={() => onQuickAdd?.('expense', 'ค่าเดินทาง')}
              className="flex items-center shrink-0 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-800 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800/60 text-xs font-bold transition-all shadow-2xs hover:scale-[1.02]"
            >
              <Fuel size={14} className="mr-1.5 text-blue-600 dark:text-blue-400" />
              + ค่าน้ำมัน/เดินทาง
            </button>
            <button
              onClick={() => onQuickAdd?.('expense', 'สั่งซื้ออุปกรณ์ประกอบชุด')}
              className="flex items-center shrink-0 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-800 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-800/60 text-xs font-bold transition-all shadow-2xs hover:scale-[1.02]"
            >
              <Layers size={14} className="mr-1.5 text-purple-600 dark:text-purple-400" />
              + ซื้ออุปกรณ์/อะไหล่
            </button>
            <button
              onClick={() => setShowRecurringModal(true)}
              className="flex items-center shrink-0 px-3 py-1.5 bg-brand-soft dark:bg-amber-950/40 hover:bg-brand-soft text-brand dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs font-bold transition-all shadow-2xs hover:scale-[1.02]"
            >
              <Calendar size={14} className="mr-1.5 text-brand dark:text-amber-400" />
              ⚙️ รายการประจำ
            </button>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onQuickAdd?.('income', 'รายได้อื่นๆ')}
              className="flex items-center px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-brand dark:hover:bg-amber-600 dark:text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <Plus size={14} className="mr-1" />
              เพิ่มรายการใหม่
            </button>
          </div>
        </div>
      )}

      {/* Recurring Transactions Suggestions Banner */}
      {widgets.showQuickShortcuts && (
        <RecurringSuggestionsBanner
          onEditAndAdd={(item) => onQuickAdd?.(item.type, item.category, item.title, item.amount)}
          onOpenManager={() => setShowRecurringModal(true)}
        />
      )}

      {/* Smart Budget Alert Banner (Warning / Critical States) */}
      {widgets.showSmartBudgetAlerts !== false && (
        <SmartBudgetAlertBanner
          monthExpense={stats.monthExpense}
          onViewExpenses={() => setTimeframe('month')}
        />
      )}

      {/* Due Payments Alert Banner (if any pending) */}
      {widgets.showDueAlerts && duePaymentAlerts.length > 0 && (
        <div className="bg-brand/10 dark:bg-amber-900/20 border border-amber-500/30 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 text-brand dark:text-amber-300">
              <ShieldAlert size={20} className="text-brand dark:text-amber-400 animate-bounce shrink-0" />
              <div>
                <span className="font-bold text-sm block">
                  แจ้งเตือนยอดค้างชำระถึงกำหนด ({duePaymentAlerts.length} รายการ)
                </span>
                <span className="text-[11px] text-brand dark:text-amber-400">
                  มีรายการติดตั้ง/ส่งมอบโซล่าเซลล์ที่ถึงกำหนดชำระเงินแล้ว
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-brand dark:text-amber-300 bg-amber-200/80 dark:bg-amber-800/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700 shadow-2xs">
              รวม ฿{duePaymentAlerts.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pt-1">
            {duePaymentAlerts.map(t => (
              <div key={t.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/40 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {t.saleOrderDetails?.customerName || 'ลูกค้า'} ({t.saleOrderDetails?.province || '-'})
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                    <Clock size={11} className="mr-1 text-brand" />
                    กำหนด: {t.saleOrderDetails?.deliveryDate ? format(parseISO(t.saleOrderDetails.deliveryDate), 'd MMM yyyy', { locale: th }) : '-'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-xs text-brand dark:text-amber-400">
                    ฿{t.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleMarkPaid(t)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center shadow-2xs transition-colors"
                  >
                    <CheckCircle2 size={12} className="mr-1" />
                    ชำระแล้ว
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Trend Card */}
      {widgets.showWeeklyTrend && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-slate-900 dark:text-white font-black text-lg leading-tight">สัดส่วนรายรับ-รายจ่าย สัปดาห์นี้</h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">เปรียบเทียบกระแสเงินสดประจำสัปดาห์ปัจจุบัน (Weekly Cashflow)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">ผลประกอบการสัปดาห์นี้</p>
              <div className={`text-xl font-black ${stats.weekIncome - stats.weekExpense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {stats.weekIncome - stats.weekExpense >= 0 ? '+' : ''}฿{(stats.weekIncome - stats.weekExpense).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                <TrendingUp size={16} className="mr-1.5" />
                รายรับ ฿{stats.weekIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-rose-600 dark:text-rose-400 flex items-center">
                รายจ่าย ฿{stats.weekExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <TrendingDown size={16} className="ml-1.5" />
              </span>
            </div>
            
            <div className="relative h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div 
                className="bg-emerald-500 dark:bg-emerald-600 h-full transition-all duration-1000 ease-out relative"
                style={{ width: `${(stats.weekIncome + stats.weekExpense) > 0 ? (stats.weekIncome / (stats.weekIncome + stats.weekExpense)) * 100 : 50}%` }}
              >
                <div className="absolute inset-0 bg-white/20 dark:bg-black/10 w-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
              </div>
              <div 
                className="bg-rose-500 dark:bg-rose-600 h-full transition-all duration-1000 ease-out relative"
                style={{ width: `${(stats.weekIncome + stats.weekExpense) > 0 ? (stats.weekExpense / (stats.weekIncome + stats.weekExpense)) * 100 : 50}%` }}
              >
                 <div className="absolute inset-0 bg-white/20 dark:bg-black/10 w-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
              </div>
            </div>
            
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span>{(stats.weekIncome + stats.weekExpense) > 0 ? ((stats.weekIncome / (stats.weekIncome + stats.weekExpense)) * 100).toFixed(1) : 0}%</span>
              <span>{(stats.weekIncome + stats.weekExpense) > 0 ? ((stats.weekExpense / (stats.weekIncome + stats.weekExpense)) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Category Sales Summary Card (Modern Card) */}
      {widgets.showCategorySalesSummary && (
        <CategorySalesSummaryCard
          transactions={timeframeFilteredTransactions}
          timeframeLabel={timeframeLabelText}
          onQuickAdd={onQuickAdd}
        />
      )}

      {/* Analytics Charts Grid */}
      {(widgets.showTrendChart || widgets.showCategoryBreakdown) && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h3 className="text-slate-900 dark:text-white font-black text-base flex items-center">
                <BarChart3 size={18} className="mr-2 text-brand" />
                แผนภูมิและสถิติวิเคราะห์ทางการเงิน (Financial Charts & Data Summaries)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                วิเคราะห์แนวโน้มรายรับ-รายจ่ายย้อนหลัง 30 วัน และสัดส่วนค่าใช้จ่ายตามหมวดหมู่
              </p>
            </div>
            <button
              onClick={handleExportDashboardCSV}
              className="inline-flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Download size={14} className="mr-1.5" />
              <span>ส่งออกไฟล์ CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {widgets.showTrendChart && (
              <div className={widgets.showCategoryBreakdown ? "lg:col-span-2" : "lg:col-span-3"}>
                <TrendLineChart data={stats.trendData} />
              </div>
            )}

            {widgets.showCategoryBreakdown && (
              <div className={widgets.showTrendChart ? "lg:col-span-1" : "lg:col-span-3"}>
                <ExpensePieChart data={stats.chartData} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 30-Day Sales Trend & Busy Periods Chart (Recharts) */}
      <SalesTrendChartCard trendData={stats.trendData} />

      {/* Monthly Budget Goal Section */}
      {widgets.showMonthlyBudget && (
        <MonthlyBudgetCard monthExpense={stats.monthExpense} />
      )}

      {/* Operations Panel Grid (Stock Inventory & Quick Notes side-by-side) */}
      {(widgets.showStockInventory || widgets.showQuickNotes) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {widgets.showStockInventory && (
            <div className={widgets.showQuickNotes ? "lg:col-span-2" : "lg:col-span-3"}>
              <StockReportCard />
            </div>
          )}
          {widgets.showQuickNotes && (
            <div className={widgets.showStockInventory ? "lg:col-span-1" : "lg:col-span-3"}>
              <QuickNotes />
            </div>
          )}
        </div>
      )}

      {/* Solar Orders & Transactions Section */}
      {(widgets.showRecentSolarTable || widgets.showRecentTransactionsList) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Solar Sale Orders Table (Span 2) */}
          {widgets.showRecentSolarTable && (
            <div className={widgets.showRecentTransactionsList ? "lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80 p-5 transition-colors" : "lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80 p-5 transition-colors"}>
              
              {/* Table Header & Search Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-gray-900 dark:text-white font-black text-base flex items-center">
                    <Sun size={18} className="mr-2 text-brand" />
                    ออเดอร์ขายระบบโซล่าเซลล์ ({stats.totalSolarOrdersCount} รายการ)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    รายการส่งมอบ ติดตั้ง และสถานะการชำระเงินของลูกค้า
                  </p>
                </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาลูกค้า/จังหวัด..."
                  value={solarSearch}
                  onChange={(e) => setSolarSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white w-36 sm:w-44"
                />
              </div>

              <select
                value={solarStatusFilter}
                onChange={(e) => setSolarStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-green-500 text-gray-700 dark:text-gray-200 font-medium"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="paid">ชำระแล้ว</option>
                <option value="unpaid">ยังไม่ชำระ</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead>
                <tr className="text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                  <th className="py-2.5 font-bold px-3">วันที่จัดส่ง</th>
                  <th className="py-2.5 font-bold px-3">ลูกค้า / จังหวัด</th>
                  <th className="py-2.5 font-bold px-3">สเปคชุดสินค้า</th>
                  <th className="py-2.5 font-bold px-3 text-center">รูปแบบชำระ</th>
                  <th className="py-2.5 font-bold px-3 text-right">ยอดเงิน</th>
                  <th className="py-2.5 font-bold px-3 text-center">สถานะชำระ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {stats.recentSolarOrders.map((tx) => {
                  const details = tx.saleOrderDetails;
                  if (!details) return null;

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                        {details.deliveryDate ? format(parseISO(details.deliveryDate), 'd MMM yy', { locale: th }) : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {details.customerName}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          จ.{details.province || 'ไม่ระบุ'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                        {tx.category === 'รายรับจาก Sale order' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 font-semibold">
                            ชุด {details.setOption || '-'} • {details.ampOption || '-'} • {details.systemOption || '-'}
                          </span>
                        )}
                        {tx.category === 'แบตเตอรี่' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 font-semibold">
                            แบต: {details.batteryOption || '-'}
                          </span>
                        )}
                        {tx.category === 'ตู้คอมบายเนอร์+อินเวอร์เตอร์' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-brand-soft text-brand dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 font-semibold">
                            คอมบายเนอร์: {details.combinerOption || '-'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <select
                          value={details.paymentMethod || 'ไม่ระบุ'}
                          onChange={(e) => {
                            if (tx.id) {
                              const newMethod = e.target.value;
                              updateTransaction(tx.id, {
                                saleOrderDetails: {
                                  ...details,
                                  paymentMethod: newMethod === 'ไม่ระบุ' ? undefined : newMethod
                                }
                              }).then(() => toast.success('อัปเดตรูปแบบชำระเงินเรียบร้อย')).catch(() => toast.error('อัปเดตรูปแบบไม่สำเร็จ'));
                            }
                          }}
                          className="px-2 py-1 rounded-[6px] text-[10px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-400 outline-none cursor-pointer transition-all"
                        >
                          <option value="ไม่ระบุ">ไม่ระบุ</option>
                          {PaymentMethods.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ฿{tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <select
                          value={details.paymentStatus}
                          onChange={(e) => {
                            if (tx.id) {
                              const newStatus = e.target.value as 'paid' | 'unpaid';
                              updateTransaction(tx.id, {
                                saleOrderDetails: {
                                  ...details,
                                  paymentStatus: newStatus,
                                  paymentReceivedDate: newStatus === 'paid' ? format(new Date(), 'yyyy-MM-dd') : undefined
                                }
                              }).then(() => toast.success('อัปเดตสถานะชำระเงินเรียบร้อย')).catch(() => toast.error('อัปเดตสถานะไม่สำเร็จ'));
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold outline-none cursor-pointer border shadow-2xs transition-all ${
                            details.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                              : 'bg-brand-soft text-brand dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700 animate-pulse'
                          }`}
                        >
                          <option value="paid">ชำระแล้ว</option>
                          <option value="unpaid">ยังไม่ชำระ</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {stats.recentSolarOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                      ไม่พบรายการขายระบบโซล่าเซลล์ตรงตามเงื่อนไข
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* Right: Recent Cash Flow Movements (Span 1) */}
          {widgets.showRecentTransactionsList && (
            <div className={widgets.showRecentSolarTable ? "lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80 p-5 transition-colors flex flex-col justify-between" : "lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80 p-5 transition-colors flex flex-col justify-between"}>
              <div>
                <h3 className="text-gray-900 dark:text-white font-black text-base mb-3 flex items-center">
                  <ShoppingBag size={18} className="mr-2 text-blue-500" />
                  การเคลื่อนไหวล่าสุด
                </h3>

            <div className="space-y-2.5">
              {stats.recentTransactions.map((tx) => {
                const categoryConfig = getCategoryConfig(tx.category, tx.type);
                return (
                  <div key={tx.id} className="p-2.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-xs hover:border-gray-200 transition-colors">
                    <div className="flex items-center space-x-2.5 overflow-hidden mr-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${categoryConfig.bgClass} ${categoryConfig.textClass} ${categoryConfig.borderClass}`}>
                        <categoryConfig.icon size={15} />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-gray-900 dark:text-white truncate">
                          {tx.category}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {tx.detail || format(parseISO(tx.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <span className={`font-extrabold text-xs whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}฿{tx.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
              {stats.recentTransactions.length === 0 && (
                <p className="text-center py-8 text-gray-400 text-xs">ยังไม่มีรายการเคลื่อนไหว</p>
              )}
            </div>
          </div>

          {/* Business Insight Badge */}
          {stats.topExpenseCat && (
            <div className="mt-4 p-3 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-xl flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                ค่าใช้จ่ายสูงสุดประจำเดือน:
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {stats.topExpenseCat.name} (฿{stats.topExpenseCat.value.toLocaleString()})
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )}

      <div className="fixed bottom-20 sm:bottom-6 right-5 z-40">
        <button
          onClick={() => onQuickAdd?.('income', 'รายได้อื่นๆ')}
          className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-3xl font-black text-xs sm:text-sm shadow-xl flex items-center space-x-2 border border-slate-700/60 active:scale-95 transition-all group"
        >
          <div className="w-7 h-7 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold shadow-2xs group-hover:rotate-90 transition-transform">
            <Plus size={16} />
          </div>
          <span>+ บันทึกรายการใหม่</span>
        </button>
      </div>

      {/* Developer Credit Footer */}
      <div className="pt-6 mt-4 border-t border-gray-200/80 dark:border-gray-800 text-center text-xs text-gray-500 dark:text-gray-400">
        <p className="flex flex-wrap items-center justify-center gap-1.5 font-medium">
          <span>ระบบบริหารการเงินและบัญชี ร้านกลางนาโซล่าเซลล์</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
            by boy thodsawat ผู้พัฒนาระบบ
          </span>
        </p>
      </div>

      {/* Recurring Transactions Manager Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl my-8 animate-fade-in">
            <RecurringTransactionsManager onClose={() => setShowRecurringModal(false)} />
          </div>
        </div>
      )}

      {/* Today's Snapshot Modal */}
      <TodaysSnapshotModal
        isOpen={showTodaySnapshotModal}
        onClose={() => setShowTodaySnapshotModal(false)}
        transactions={transactions}
        onQuickAdd={onQuickAdd}
      />

      {/* Dashboard Customizer Component */}
      <DashboardCustomizer 
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        widgets={widgets}
        onToggle={toggleWidget}
        onReset={resetWidgets}
        onMove={moveWidgetHandler}
      />

      {/* Dashboard KPI Card Pastel & Design Customizer Modal */}
      <DashboardCardCustomizerModal
        isOpen={showCardCustomizerModal}
        onClose={() => setShowCardCustomizerModal(false)}
        designConfig={cardDesign}
        onUpdateDesign={updateDashboardCardDesign}
        onResetDesign={resetDashboardCardDesign}
        onToggleVisibility={toggleDashboardCardVisibility}
        onReorderCards={reorderDashboardCards}
        onSetCustomColor={setDashboardCardCustomColor}
      />

    </div>
  );
}

