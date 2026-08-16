import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Check, Trash2, Search, LayoutGrid, RotateCcw, Sparkles, 
  TrendingUp, TrendingDown, DollarSign, Wallet, Sun, Clock, 
  BarChart3, PieChart, ShieldAlert, Target, Bell, Zap, Layers, 
  Package, FileText, ShoppingBag, Pin, ArrowUp, ArrowDown, SlidersHorizontal
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { soundFeedback } from '../../utils/feedback';
import { DashboardWidgetConfig } from '../../types';
import { DEFAULT_WIDGET_CONFIG } from '../../hooks/useAppConfig';

export interface WidgetMeta {
  key: keyof DashboardWidgetConfig;
  title: string;
  englishTitle: string;
  category: 'kpi' | 'charts' | 'tools' | 'goals';
  categoryLabel: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  badgeColor: string;
  recommendedRole?: string;
}

export const ALL_AVAILABLE_WIDGETS: WidgetMeta[] = [
  {
    key: 'showPinnedMetrics',
    title: 'ตัวชี้วัดปักหมุดด่วน (Admin Pinned Metrics)',
    englishTitle: 'Pinned Key Metrics Bar',
    category: 'kpi',
    categoryLabel: 'ตัวชี้วัด KPI',
    description: 'แถบสรุปตัวชี้วัดการเงินสำคัญปักหมุดด่วนด้านบนสุดของแดชบอร์ด สามารถปรับเปลี่ยนตัวเลขที่ต้องการเน้นได้',
    icon: Pin,
    gradient: 'from-amber-500 to-orange-500',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
  },
  {
    key: 'showDailyRevenueGoal',
    title: 'เป้าหมายยอดขายรายวัน (Daily Revenue Goal)',
    englishTitle: 'Daily Revenue Progress Tracker',
    category: 'goals',
    categoryLabel: 'เป้าหมาย & การแจ้งเตือน',
    description: 'เกจวัดยอดขายเปรียบเทียบกับเป้าหมายรายวัน พร้อมเปอร์เซนต์ความสำเร็จแบบเรียลไทม์',
    icon: Target,
    gradient: 'from-emerald-500 to-teal-600',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
  },
  {
    key: 'showSmartBudgetAlerts',
    title: 'แจ้งเตือนงบประมาณอัจฉริยะ (Smart Budget Alerts)',
    englishTitle: 'Intelligent Budget Overrun Warnings',
    category: 'goals',
    categoryLabel: 'เป้าหมาย & การแจ้งเตือน',
    description: 'ระบบตรวจจับอัตราการใช้เงินงบประมาณรายเดือน เตือนอัตโนมัติเมื่อใกล้เต็มวงเงิน',
    icon: ShieldAlert,
    gradient: 'from-rose-500 to-pink-600',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
  },
  {
    key: 'showTotalIncome',
    title: 'การ์ดสรุปยอดรายรับรวม (Total Income KPI)',
    englishTitle: 'Income Summary Card',
    category: 'kpi',
    categoryLabel: 'ตัวชี้วัด KPI',
    description: 'การ์ดสีพาสเทลแสดงยอดเงินรายรับรวม พร้อมมินิกราฟ Sparkline และจำนวนรายการ',
    icon: TrendingUp,
    gradient: 'from-emerald-400 to-teal-500',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
  },
  {
    key: 'showTotalExpense',
    title: 'การ์ดสรุปยอดรายจ่ายรวม (Total Expense KPI)',
    englishTitle: 'Expense Summary Card',
    category: 'kpi',
    categoryLabel: 'ตัวชี้วัด KPI',
    description: 'การ์ดแสดงยอดเงินรายจ่ายรวม สัดส่วน % เปรียบเทียบกับรายรับ และกราฟแนวโน้ม',
    icon: TrendingDown,
    gradient: 'from-rose-400 to-red-500',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
  },
  {
    key: 'showNetProfit',
    title: 'การ์ดกำไรสุทธิ & อัตรากำไร (Net Profit Margin)',
    englishTitle: 'Net Profit & Margin %',
    category: 'kpi',
    categoryLabel: 'ตัวชี้วัด KPI',
    description: 'การ์ดคำนวณผลกำไรสุทธิ (รายรับ - รายจ่าย) พร้อมคำนวณ Profit Margin %',
    icon: Wallet,
    gradient: 'from-purple-500 to-indigo-600',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
  },
  {
    key: 'showUnpaid',
    title: 'การ์ดยอดค้างชำระ (Pending Unpaid Orders)',
    englishTitle: 'Unpaid Receivables KPI',
    category: 'kpi',
    categoryLabel: 'ตัวชี้วัด KPI',
    description: 'การ์ดรวมยอดเงินที่ลูกค้ายังค้างชำระ และจำนวนออเดอร์ที่รอเก็บเงิน',
    icon: Clock,
    gradient: 'from-amber-400 to-yellow-500',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
  },
  {
    key: 'showSolarSales',
    title: 'การ์ดยอดขายชุดโซล่าเซลล์ (Solar Product Sales)',
    englishTitle: 'Solar Equipment Revenue KPI',
    category: 'kpi',
    categoryLabel: 'ตัวชี้วัด KPI',
    description: 'ยอดขายเฉพาะหมวดหมู่โซล่าเซลล์ จำนวนชุดที่ส่งมอบ และสถิติแนวโน้ม 30 วัน',
    icon: Sun,
    gradient: 'from-sky-400 to-blue-600',
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300'
  },
  {
    key: 'showCategorySalesSummary',
    title: 'สรุปยอดขายแยกหมวดหมู่สินค้า (Category Sales Cards)',
    englishTitle: 'Sales Breakdown by Category',
    category: 'charts',
    categoryLabel: 'กราฟ & วิเคราะห์',
    description: 'การ์ดแสดงยอดขายและสัดส่วนของแต่ละหมวดหมู่สินค้า เช่น ชุดโซล่าเซลล์ ปั๊มน้ำ อุปกรณ์ไฟฟ้า',
    icon: Layers,
    gradient: 'from-blue-500 to-indigo-600',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
  },
  {
    key: 'showTrendChart',
    title: 'กราฟแนวโน้มรายรับ-รายจ่าย (30-Day Financial Trend Chart)',
    englishTitle: 'Interactive Income & Expense Line Chart',
    category: 'charts',
    categoryLabel: 'กราฟ & วิเคราะห์',
    description: 'แผนภูมิเส้นเชิงโต้ตอบแสดงทิศทางรายรับ รายจ่าย และกำไรย้อนหลัง 30 วัน',
    icon: BarChart3,
    gradient: 'from-indigo-500 to-cyan-500',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
  },
  {
    key: 'showCategoryBreakdown',
    title: 'แผนภูมิวงกลมสัดส่วนรายจ่าย (Expense Category Pie Chart)',
    englishTitle: 'Expense Distribution Donut Chart',
    category: 'charts',
    categoryLabel: 'กราฟ & วิเคราะห์',
    description: 'แผนภูมิโดนัทแสดงสัดส่วนการใช้น้ำเงินแบ่งตามหมวดหมู่รายจ่ายอย่างชัดเจน',
    icon: PieChart,
    gradient: 'from-fuchsia-500 to-pink-500',
    badgeColor: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-300'
  },
  {
    key: 'showDueAlerts',
    title: 'ตารางการแจ้งเตือนออเดอร์ค้างชำระ (Due Payment Reminders)',
    englishTitle: 'Overdue & Pending Customer Invoices',
    category: 'tools',
    categoryLabel: 'การจัดการ & เครื่องมือ',
    description: 'ตารางรายการลูกค้าค้างชำระ พร้อมปุ่มส่งการแจ้งเตือนหรือบันทึกชำระเงินด่วน',
    icon: ShieldAlert,
    gradient: 'from-orange-500 to-amber-600',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
  },
  {
    key: 'showQuickShortcuts',
    title: 'เมนูปุ่มบันทึกด่วน (Quick Action Floating Shortcuts)',
    englishTitle: 'Fast Action Buttons Bar',
    category: 'tools',
    categoryLabel: 'การจัดการ & เครื่องมือ',
    description: 'ปุ่มทางลัดสำหรับเพิ่มรายการรายรับ รายจ่าย หรือเปิดบิลขายโซล่าเซลล์ได้ทันที',
    icon: Zap,
    gradient: 'from-cyan-500 to-blue-600',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300'
  },
  {
    key: 'showStockInventory',
    title: 'สรุปสต็อกสินค้าและสินค้าใกล้หมด (Inventory Alert Widget)',
    englishTitle: 'Stock Balance & Low Stock Table',
    category: 'tools',
    categoryLabel: 'การจัดการ & เครื่องมือ',
    description: 'ตารางแสดงสินค้าคงเหลือหลัก และการเตือนสินค้าคงคลังระดับต่ำ',
    icon: Package,
    gradient: 'from-slate-600 to-slate-800',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
  },
  {
    key: 'showRecentSolarTable',
    title: 'ตารางงานขายและติดตั้งโซล่าเซลล์ล่าสุด (Recent Solar Orders)',
    englishTitle: 'Solar Installation & Sales Orders Table',
    category: 'tools',
    categoryLabel: 'การจัดการ & เครื่องมือ',
    description: 'รายการงานขายระบบโซล่าเซลล์ สถานะการส่งมอบ และการรับประกัน',
    icon: ShoppingBag,
    gradient: 'from-amber-500 to-yellow-600',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
  },
  {
    key: 'showRecentTransactionsList',
    title: 'ตารางรายการธุรกรรมล่าสุด (Recent Transactions Stream)',
    englishTitle: 'Realtime Transaction Feed',
    category: 'tools',
    categoryLabel: 'การจัดการ & เครื่องมือ',
    description: 'สายธารรายการธุรกรรมรับ-จ่ายล่าสุด พร้อมปุ่มแก้ไขหรือลบรายการ',
    icon: FileText,
    gradient: 'from-teal-500 to-emerald-600',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300'
  },
  {
    key: 'showQuickNotes',
    title: 'สมุดบันทึกช่วยจำด่วน (Quick Scratchpad Notes)',
    englishTitle: 'Sticky Notes & Task Scratchpad',
    category: 'tools',
    categoryLabel: 'การจัดการ & เครื่องมือ',
    description: 'กระดาษโน้ตบันทึกข้อความสั้นหรือสิ่งที่ต้องทำประจำวันบนหน้าแดชบอร์ด',
    icon: FileText,
    gradient: 'from-violet-500 to-purple-600',
    badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300'
  }
];

interface WidgetGalleryProps {
  widgets?: DashboardWidgetConfig;
  onToggleWidget?: (key: keyof DashboardWidgetConfig) => Promise<void> | void;
  onResetWidgets?: () => Promise<void> | void;
  onMoveWidget?: (key: keyof DashboardWidgetConfig, direction: 'up' | 'down') => Promise<void> | void;
}

export function WidgetGallery({
  widgets = DEFAULT_WIDGET_CONFIG,
  onToggleWidget,
  onResetWidgets,
  onMoveWidget
}: WidgetGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeWidgetsCount = useMemo(() => {
    return ALL_AVAILABLE_WIDGETS.filter(w => widgets[w.key] !== false).length;
  }, [widgets]);

  const filteredWidgets = useMemo(() => {
    return ALL_AVAILABLE_WIDGETS.filter(widget => {
      const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery = !query || 
        widget.title.toLowerCase().includes(query) ||
        widget.englishTitle.toLowerCase().includes(query) ||
        widget.description.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handleToggle = async (key: keyof DashboardWidgetConfig) => {
    soundFeedback.click();
    if (onToggleWidget) {
      await onToggleWidget(key);
      const widget = ALL_AVAILABLE_WIDGETS.find(w => w.key === key);
      const isNowActive = !widgets[key];
      if (isNowActive) {
        toast.success(`เพิ่มวิดเจ็ต "${widget?.title.split('(')[0]}" เข้าหน้าแรกแล้ว`);
      } else {
        toast.success(`ลบวิดเจ็ต "${widget?.title.split('(')[0]}" ออกจากหน้าแรกแล้ว`);
      }
    }
  };

  const handleReset = async () => {
    soundFeedback.click();
    if (onResetWidgets) {
      await onResetWidgets();
      toast.success('คืนค่าการเปิด/ปิดวิดเจ็ตทั้งหมดเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
    }
  };

  const categories = [
    { id: 'all', label: 'ทั้งหมด (All)', count: ALL_AVAILABLE_WIDGETS.length },
    { id: 'kpi', label: 'ตัวชี้วัด KPI', count: ALL_AVAILABLE_WIDGETS.filter(w => w.category === 'kpi').length },
    { id: 'charts', label: 'กราฟ & วิเคราะห์', count: ALL_AVAILABLE_WIDGETS.filter(w => w.category === 'charts').length },
    { id: 'tools', label: 'เครื่องมือ & การจัดการ', count: ALL_AVAILABLE_WIDGETS.filter(w => w.category === 'tools').length },
    { id: 'goals', label: 'เป้าหมาย & แจ้งเตือน', count: ALL_AVAILABLE_WIDGETS.filter(w => w.category === 'goals').length },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-indigo-900/50">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 backdrop-blur-md">
              <Sparkles size={14} className="text-brand" />
              <span>DASHBOARD WIDGET GALLERY & MANAGER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              คลังวิดเจ็ตหน้าแรก (Dashboard Widget Gallery)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              เลือกเพิ่มหรือลบการ์ดวิดเจ็ตบนหน้าแรกได้อย่างอิสระ ควบคุมการแสดงผลตัวชี้วัด KPI, แผนภูมิวิเคราะห์, การแจ้งเตือนเป้าหมาย และเครื่องมือบันทึกด่วนตามต้องการ
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-300 block font-bold">เปิดใช้งานอยู่</span>
              <span className="text-xl font-black text-emerald-400">
                {activeWidgetsCount} / {ALL_AVAILABLE_WIDGETS.length}
              </span>
            </div>

            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black border border-white/20 shadow-md active:scale-95 transition-all cursor-pointer"
              title="คืนค่าเริ่มต้นของวิดเจ็ต"
            >
              <RotateCcw size={15} />
              <span>คืนค่าเริ่มต้น</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาวิดเจ็ต เช่น KPI, กราฟ, งบประมาณ, โซล่าเซลล์..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundFeedback.click();
                setSelectedCategory(cat.id);
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredWidgets.map((widget) => {
            const isActive = widgets[widget.key] !== false;
            const Icon = widget.icon;

            return (
              <motion.div
                key={widget.key}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`p-5 rounded-3xl border-2 flex flex-col justify-between transition-all relative overflow-hidden ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                    : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-75 hover:opacity-100'
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${widget.gradient} text-white flex items-center justify-center shadow-md shrink-0`}>
                        <Icon size={22} />
                      </div>
                      <div>
                        <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full ${widget.badgeColor}`}>
                          {widget.categoryLabel}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1 line-clamp-1">
                          {widget.title.split('(')[0]}
                        </h3>
                      </div>
                    </div>

                    {/* Active Status Badge & Toggle Switch */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center space-x-1 ${
                        isActive 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        <span>{isActive ? 'แสดงผลอยู่' : 'ซ่อนอยู่'}</span>
                      </span>

                      {/* Interactive Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggle(widget.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        aria-pressed={isActive}
                        title={isActive ? 'คลิกเพื่อปิดการแสดงผล' : 'คลิกเพื่อเปิดการแสดงผล'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed my-2 line-clamp-3">
                    {widget.description}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                    {widget.englishTitle}
                  </span>

                  <div className="flex items-center space-x-2 shrink-0">
                    {onMoveWidget && isActive && (
                      <div className="flex items-center space-x-1 border-r border-slate-200 dark:border-slate-700 pr-2">
                        <button
                          onClick={() => {
                            soundFeedback.click();
                            onMoveWidget(widget.key, 'up');
                          }}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="เลื่อนขึ้น"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => {
                            soundFeedback.click();
                            onMoveWidget(widget.key, 'down');
                          }}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="เลื่อนลง"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleToggle(widget.key)}
                      className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-sm'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Trash2 size={14} />
                          <span>นำออก (Remove)</span>
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          <span>+ เพิ่มวิดเจ็ต (Add)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredWidgets.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <LayoutGrid size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">ไม่พบวิดเจ็ตที่ตรงกับเงื่อนไขการค้นหา</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
}

export default WidgetGallery;
