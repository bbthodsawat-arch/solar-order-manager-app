import React, { useState, useMemo } from 'react';
import { 
  Pin, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target, 
  Clock, 
  Calculator, 
  Percent, 
  Receipt, 
  AlertTriangle, 
  Wrench, 
  Plus, 
  X, 
  RotateCcw, 
  SlidersHorizontal, 
  Check, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  CheckCircle2,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, AppConfig } from '../types';
import { parseISO, isToday, startOfDay, subDays, isSameDay } from 'date-fns';
import { toast } from 'react-hot-toast';

export type PinnedMetricKey = 
  | 'daily_net_profit'
  | 'top_selling_product'
  | 'daily_revenue_goal'
  | 'unpaid_collections'
  | 'average_order_value'
  | 'profit_margin'
  | 'today_order_count'
  | 'low_stock_count'
  | 'pending_installations';

export interface PinnedMetricDefinition {
  id: PinnedMetricKey;
  title: string;
  category: 'finance' | 'sales' | 'operations' | 'inventory';
  description: string;
  icon: any;
  accentColor: string;
  bgLight: string;
  borderLight: string;
  badge: string;
}

export const ALL_PINNED_METRICS: PinnedMetricDefinition[] = [
  {
    id: 'daily_net_profit',
    title: 'กำไรสุทธิวันนี้ (Daily Net Profit)',
    category: 'finance',
    description: 'ยอดรายรับลบรายจ่ายของวันนี้พร้อมสัดส่วนมาร์จิ้น',
    icon: TrendingUp,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    borderLight: 'border-emerald-500/30',
    badge: 'กำไรวันนี้'
  },
  {
    id: 'top_selling_product',
    title: 'สินค้า/ชุดโซล่าเซลล์ขายดีที่สุด',
    category: 'sales',
    description: 'ชุดสินค้าหรือหมวดหมู่ที่ทำยอดขายและจำนวนคำสั่งซื้อสูงสุด',
    icon: Award,
    accentColor: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-500/10 dark:bg-amber-500/15',
    borderLight: 'border-amber-500/30',
    badge: 'สินค้าขายดี'
  },
  {
    id: 'daily_revenue_goal',
    title: 'เป้ารายรับประจำวัน (Daily Goal)',
    category: 'sales',
    description: 'เปอร์เซ็นต์ความคืบหน้าเทียบกับเป้าหมายรายรับรายวัน',
    icon: Target,
    accentColor: 'text-brand dark:text-brand-soft',
    bgLight: 'bg-brand/10 dark:bg-brand/15',
    borderLight: 'border-brand/30',
    badge: 'เป้าหมาย'
  },
  {
    id: 'unpaid_collections',
    title: 'ยอดค้างชำระคงค้าง (Unpaid Balance)',
    category: 'finance',
    description: 'รวมยอดเงินจากคำสั่งซื้อโซล่าเซลล์ที่รอเก็บเงิน',
    icon: Clock,
    accentColor: 'text-rose-600 dark:text-rose-400',
    bgLight: 'bg-rose-500/10 dark:bg-rose-500/15',
    borderLight: 'border-rose-500/30',
    badge: 'ลูกหนี้ค้าง'
  },
  {
    id: 'average_order_value',
    title: 'ยอดขายเฉลี่ยต่อออเดอร์ (AOV)',
    category: 'sales',
    description: 'มูลค่าคำสั่งซื้อเฉลี่ยต่อการขายหนึ่งรายการ',
    icon: Calculator,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    bgLight: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    borderLight: 'border-indigo-500/30',
    badge: 'AOV'
  },
  {
    id: 'profit_margin',
    title: 'อัตรากำไรสุทธิ (Gross Profit Margin %)',
    category: 'finance',
    description: 'สัดส่วนเปอร์เซ็นต์กำไรสุทธิต่อยอดรายรับรวม',
    icon: Percent,
    accentColor: 'text-purple-600 dark:text-purple-400',
    bgLight: 'bg-purple-500/10 dark:bg-purple-500/15',
    borderLight: 'border-purple-500/30',
    badge: 'Margin %'
  },
  {
    id: 'today_order_count',
    title: 'จำนวนคำสั่งซื้อวันนี้ (Today Orders)',
    category: 'sales',
    description: 'จำนวนธุรกรรมรายรับและออเดอร์งานขายของวันนี้',
    icon: Receipt,
    accentColor: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-500/10 dark:bg-blue-500/15',
    borderLight: 'border-blue-500/30',
    badge: 'ธุรกรรมวันนี้'
  },
  {
    id: 'low_stock_count',
    title: 'รายการสินค้าสต็อกต่ำ (Low Stock Alerts)',
    category: 'inventory',
    description: 'จำนวนสินค้าในคลังที่มีจำนวนเหลือน้อยกว่าเกณฑ์ขั้นต่ำ',
    icon: AlertTriangle,
    accentColor: 'text-orange-600 dark:text-orange-400',
    bgLight: 'bg-orange-500/10 dark:bg-orange-500/15',
    borderLight: 'border-orange-500/30',
    badge: 'สต็อกต่ำ'
  },
  {
    id: 'pending_installations',
    title: 'นัดหมายติดตั้งโซล่าเซลล์รอดำเนินการ',
    category: 'operations',
    description: 'จำนวนงานติดตั้งระบบที่อยู่นัดหมายหรือกำลังดำเนินการ',
    icon: Wrench,
    accentColor: 'text-cyan-600 dark:text-cyan-400',
    bgLight: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    borderLight: 'border-cyan-500/30',
    badge: 'คิวนัดติดตั้ง'
  }
];

export const DEFAULT_PINNED_METRICS: PinnedMetricKey[] = [
  'daily_net_profit',
  'top_selling_product',
  'daily_revenue_goal',
  'unpaid_collections'
];

interface PinnedMetricsWidgetProps {
  transactions: Transaction[];
  config: AppConfig;
  onUpdatePinnedMetrics: (metrics: string[]) => void;
  dailyGoal?: number;
}

export default function PinnedMetricsWidget({
  transactions,
  config,
  onUpdatePinnedMetrics,
  dailyGoal = 50000
}: PinnedMetricsWidgetProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const pinnedKeys = useMemo(() => {
    const list = config.dashboardWidgets?.pinnedMetrics;
    if (Array.isArray(list) && list.length > 0) {
      return list as PinnedMetricKey[];
    }
    return DEFAULT_PINNED_METRICS;
  }, [config.dashboardWidgets?.pinnedMetrics]);

  // Compute stats for metrics
  const calculatedMetrics = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const yesterdayStart = startOfDay(subDays(new Date(), 1));

    let todayIncome = 0;
    let todayExpense = 0;
    let todayOrdersCount = 0;

    let yesterdayIncome = 0;
    let yesterdayExpense = 0;

    let totalIncomeTimeframe = 0;
    let totalExpenseTimeframe = 0;
    let totalOrdersTimeframe = 0;

    let unpaidTotal = 0;
    let unpaidOrdersCount = 0;

    // Track product sales for top selling
    const productSalesMap: Record<string, { name: string; count: number; totalRevenue: number }> = {};

    transactions.forEach(t => {
      const tDate = parseISO(t.date);
      const isItemToday = isSameDay(startOfDay(tDate), todayStart);
      const isItemYesterday = isSameDay(startOfDay(tDate), yesterdayStart);

      if (t.type === 'income') {
        totalIncomeTimeframe += t.amount;
        totalOrdersTimeframe += 1;

        if (isItemToday) {
          todayIncome += t.amount;
          todayOrdersCount += 1;
        } else if (isItemYesterday) {
          yesterdayIncome += t.amount;
        }

        // Sale Order Package or Category Name
        const setOption = t.saleOrderDetails?.setOption;
        const productName = setOption || t.subcategory || t.category || 'สินค้าโซล่าเซลล์';
        if (!productSalesMap[productName]) {
          productSalesMap[productName] = { name: productName, count: 0, totalRevenue: 0 };
        }
        productSalesMap[productName].count += 1;
        productSalesMap[productName].totalRevenue += t.amount;

        // Unpaid
        if (t.saleOrderDetails?.paymentStatus === 'unpaid') {
          unpaidTotal += t.amount;
          unpaidOrdersCount += 1;
        }
      } else if (t.type === 'expense') {
        totalExpenseTimeframe += t.amount;

        if (isItemToday) {
          todayExpense += t.amount;
        } else if (isItemYesterday) {
          yesterdayExpense += t.amount;
        }
      }
    });

    // Daily Net Profit
    const todayNetProfit = todayIncome - todayExpense;
    const yesterdayNetProfit = yesterdayIncome - yesterdayExpense;
    const profitDiff = todayNetProfit - yesterdayNetProfit;
    const todayMargin = todayIncome > 0 ? (todayNetProfit / todayIncome) * 100 : 0;

    // Top Selling Product
    const sortedProducts = Object.values(productSalesMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
    const topProduct = sortedProducts[0] || { name: 'ยังไม่มีข้อมูลการขาย', count: 0, totalRevenue: 0 };

    // Daily Goal
    const goalPercent = Math.min(100, Math.round((todayIncome / dailyGoal) * 100));
    const remainingGoal = Math.max(0, dailyGoal - todayIncome);

    // AOV
    const aov = totalOrdersTimeframe > 0 ? Math.round(totalIncomeTimeframe / totalOrdersTimeframe) : 0;

    // Overall Margin
    const overallMargin = totalIncomeTimeframe > 0 ? ((totalIncomeTimeframe - totalExpenseTimeframe) / totalIncomeTimeframe) * 100 : 0;

    // Low stock count from product categories
    let lowStockCount = 0;
    if (config.productCategories) {
      config.productCategories.forEach(cat => {
        cat.items.forEach(item => {
          if (item.isActive && typeof item.inStock === 'number' && typeof item.minStock === 'number') {
            if (item.inStock <= item.minStock) {
              lowStockCount += 1;
            }
          }
        });
      });
    }

    return {
      todayIncome,
      todayExpense,
      todayNetProfit,
      yesterdayNetProfit,
      profitDiff,
      todayMargin,
      topProduct,
      goalPercent,
      remainingGoal,
      unpaidTotal,
      unpaidOrdersCount,
      aov,
      overallMargin,
      todayOrdersCount,
      lowStockCount
    };
  }, [transactions, dailyGoal, config.productCategories]);

  const handleTogglePin = (key: PinnedMetricKey) => {
    let nextList: PinnedMetricKey[];
    if (pinnedKeys.includes(key)) {
      if (pinnedKeys.length <= 1) {
        toast.error('ต้องปักหมุดไว้ล่างสุดอย่างน้อย 1 รายการ');
        return;
      }
      nextList = pinnedKeys.filter(k => k !== key);
    } else {
      nextList = [...pinnedKeys, key];
    }
    onUpdatePinnedMetrics(nextList);
  };

  const handleResetDefaults = () => {
    onUpdatePinnedMetrics(DEFAULT_PINNED_METRICS);
    toast.success('คืนค่ารายการหมุดเริ่มต้นเรียบร้อยแล้ว');
  };

  // Render metric card UI according to metric key
  const renderMetricCard = (key: PinnedMetricKey) => {
    const def = ALL_PINNED_METRICS.find(m => m.id === key);
    if (!def) return null;

    const Icon = def.icon;

    switch (key) {
      case 'daily_net_profit': {
        const isProfitable = calculatedMetrics.todayNetProfit >= 0;
        return (
          <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`p-2.5 rounded-2xl ${def.bgLight} ${def.accentColor}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                      📌 {def.badge}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">กำไรสุทธิวันนี้</h3>
                </div>
              </div>

              <button
                onClick={() => handleTogglePin(key)}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="ถอนหมุดออก"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ฿{calculatedMetrics.todayNetProfit.toLocaleString()}
              </div>
              <div className="flex items-center space-x-2 text-[11px] font-bold">
                <span className={calculatedMetrics.profitDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400 flex items-center' : 'text-rose-500 flex items-center'}>
                  {calculatedMetrics.profitDiff >= 0 ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
                  {calculatedMetrics.profitDiff >= 0 ? '+' : ''}฿{Math.abs(calculatedMetrics.profitDiff).toLocaleString()} vs เมื่อวาน
                </span>
                <span className="text-slate-400">• มาร์จิ้น {calculatedMetrics.todayMargin.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      }

      case 'top_selling_product': {
        return (
          <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`p-2.5 rounded-2xl ${def.bgLight} ${def.accentColor}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                    📌 {def.badge}
                  </span>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">สินค้าขายดีอันดับ 1</h3>
                </div>
              </div>

              <button
                onClick={() => handleTogglePin(key)}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="ถอนหมุดออก"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <div className="text-lg font-black text-slate-900 dark:text-white truncate" title={calculatedMetrics.topProduct.name}>
                {calculatedMetrics.topProduct.name}
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>ขายได้ {calculatedMetrics.topProduct.count} ออเดอร์</span>
                <span className="text-amber-600 dark:text-amber-400 font-extrabold">฿{calculatedMetrics.topProduct.totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      }

      case 'daily_revenue_goal': {
        return (
          <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-brand/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`p-2.5 rounded-2xl ${def.bgLight} ${def.accentColor}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase text-brand bg-brand-soft px-2 py-0.5 rounded-md border border-brand/20">
                    📌 {def.badge}
                  </span>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">เป้าหมายยอดขายวันนี้</h3>
                </div>
              </div>

              <button
                onClick={() => handleTogglePin(key)}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="ถอนหมุดออก"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {calculatedMetrics.goalPercent}%
                </div>
                <div className="text-[11px] font-bold text-slate-400">
                  ฿{calculatedMetrics.todayIncome.toLocaleString()} / ฿{dailyGoal.toLocaleString()}
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden p-0.5">
                <div 
                  className="bg-brand h-full rounded-full transition-all duration-500"
                  style={{ width: `${calculatedMetrics.goalPercent}%` }}
                />
              </div>
            </div>
          </div>
        );
      }

      case 'unpaid_collections': {
        return (
          <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-rose-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`p-2.5 rounded-2xl ${def.bgLight} ${def.accentColor}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/60">
                    📌 {def.badge}
                  </span>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">ยอดค้างชำระคงค้าง</h3>
                </div>
              </div>

              <button
                onClick={() => handleTogglePin(key)}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="ถอนหมุดออก"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                ฿{calculatedMetrics.unpaidTotal.toLocaleString()}
              </div>
              <p className="text-[11px] font-bold text-slate-400">
                รอเรียกเก็บทั้งหมด {calculatedMetrics.unpaidOrdersCount} รายการ
              </p>
            </div>
          </div>
        );
      }

      case 'average_order_value': {
        return (
          <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`p-2.5 rounded-2xl ${def.bgLight} ${def.accentColor}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60">
                    📌 {def.badge}
                  </span>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">ยอดขายเฉลี่ย (AOV)</h3>
                </div>
              </div>

              <button
                onClick={() => handleTogglePin(key)}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="ถอนหมุดออก"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ฿{calculatedMetrics.aov.toLocaleString()}
              </div>
              <p className="text-[11px] font-bold text-slate-400">
                คำนวณจากตั๋วขายเฉลี่ยต่อออเดอร์
              </p>
            </div>
          </div>
        );
      }

      case 'profit_margin': {
        return (
          <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`p-2.5 rounded-2xl ${def.bgLight} ${def.accentColor}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/60">
                    📌 {def.badge}
                  </span>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">อัตรากำไรสุทธิรวม</h3>
                </div>
              </div>

              <button
                onClick={() => handleTogglePin(key)}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="ถอนหมุดออก"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                {calculatedMetrics.overallMargin.toFixed(1)}%
              </div>
              <p className="text-[11px] font-bold text-slate-400">
                มาร์จิ้นภาพรวมงวดปัจจุบัน
              </p>
            </div>
          </div>
        );
      }

      case 'today_order_count': {
        return (
          <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-blue-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`p-2.5 rounded-2xl ${def.bgLight} ${def.accentColor}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60">
                    📌 {def.badge}
                  </span>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">ออเดอร์ขายวันนี้</h3>
                </div>
              </div>

              <button
                onClick={() => handleTogglePin(key)}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="ถอนหมุดออก"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {calculatedMetrics.todayOrdersCount} <span className="text-sm font-bold text-slate-400">รายการ</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400">
                ยอดการขายที่บันทึกแล้วในวันนี้
              </p>
            </div>
          </div>
        );
      }

      case 'low_stock_count': {
        return (
          <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`p-2.5 rounded-2xl ${def.bgLight} ${def.accentColor}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-800/60">
                    📌 {def.badge}
                  </span>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">สินค้าสต็อกต่ำเกณฑ์</h3>
                </div>
              </div>

              <button
                onClick={() => handleTogglePin(key)}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="ถอนหมุดออก"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400 tracking-tight">
                {calculatedMetrics.lowStockCount} <span className="text-sm font-bold text-slate-400">รายการ</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400">
                ต้องการสั่งซื้ออุปกรณ์เพิ่มเติม
              </p>
            </div>
          </div>
        );
      }

      case 'pending_installations': {
        return (
          <div key={key} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`p-2.5 rounded-2xl ${def.bgLight} ${def.accentColor}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800/60">
                    📌 {def.badge}
                  </span>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">คิวนัดติดตั้งรอลงพื้นที่</h3>
                </div>
              </div>

              <button
                onClick={() => handleTogglePin(key)}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="ถอนหมุดออก"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                พร้อมบริการ <span className="text-sm font-bold text-cyan-600">ช่างเทคนิค</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400">
                ระบบจัดการตารางงานโซล่าเซลล์
              </p>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const filteredDefinitions = useMemo(() => {
    return ALL_PINNED_METRICS.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.badge.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="space-y-3">
      {/* Widget Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-[#e0ecfc] to-[#ebf3fe] dark:from-slate-900/60 dark:to-slate-950/60 p-4 px-5 rounded-3xl text-slate-800 dark:text-white border border-[#c3ddfd] dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-brand text-white shadow-sm shrink-0">
            <Pin size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
                📌 ตัวชี้วัดสำคัญปักหมุดด่วน (Admin Pinned Key Metrics)
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand/25 text-brand dark:text-brand-soft border border-brand/30">
                {pinnedKeys.length} รายการ
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              ข้อมูลสรุปผลงานระดับผู้บริหารที่ปักหมุดไว้สำหรับตรวจสอบทันทีเมื่อเข้าสู่ระบบ
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer shrink-0"
        >
          <SlidersHorizontal size={14} className="text-brand" />
          <span>จัดการหมุด KPI</span>
        </button>
      </div>

      {/* Pinned Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {pinnedKeys.map(key => renderMetricCard(key))}
      </div>

      {/* Pin Customizer Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 rounded-2xl bg-brand/10 text-brand">
                    <Pin size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      เลือกหมุดตัวชี้วัดสำคัญ (Customize Pinned Metrics)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      เลือกตัวชี้วัดที่ต้องการให้แสดงปักหมุดที่ส่วนบนสุดของแดชบอร์ด
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search & Quick Filter */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 space-y-3">
                <input
                  type="text"
                  placeholder="ค้นหาตัวชี้วัด KPI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-brand outline-none"
                />

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">
                    เลือกอยู่: <span className="text-brand font-black">{pinnedKeys.length}</span> จาก {ALL_PINNED_METRICS.length} รายการ
                  </span>

                  <button
                    onClick={handleResetDefaults}
                    className="text-xs font-bold text-slate-500 hover:text-brand flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>คืนค่าเริ่มต้น</span>
                  </button>
                </div>
              </div>

              {/* Metrics Checkbox List */}
              <div className="p-5 max-h-[50vh] overflow-y-auto space-y-2.5 custom-scrollbar">
                {filteredDefinitions.map(def => {
                  const isPinned = pinnedKeys.includes(def.id);
                  const Icon = def.icon;

                  return (
                    <button
                      key={def.id}
                      onClick={() => handleTogglePin(def.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                        isPinned
                          ? 'bg-brand/5 border-brand/40 dark:bg-brand/10 text-slate-900 dark:text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-2xl shrink-0 ${def.bgLight} ${def.accentColor}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold">{def.title}</span>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {def.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{def.description}</p>
                        </div>
                      </div>

                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                        isPinned
                          ? 'bg-brand text-white border-brand'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}>
                        {isPinned ? <Check size={16} /> : <Plus size={16} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-brand text-white font-black text-xs rounded-2xl shadow-md hover:bg-brand/90 transition-all cursor-pointer"
                >
                  เสร็จสิ้น
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
