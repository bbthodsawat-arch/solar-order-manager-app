import React, { useState } from 'react';
import { useAppConfig } from '../../hooks/useAppConfig';
import { useDesignSystem } from '../../hooks/useDesignSystem';
import { LAYOUT_PRESETS } from '../../lib/designSystemPresets';
import { LayoutPresetId } from '../../types/designSystem';
import { 
  LayoutGrid, 
  TrendingUp, 
  Store, 
  BarChart3, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles, 
  DollarSign, 
  Package, 
  Calendar, 
  Layers,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

const PRESET_ICONS: Record<string, any> = {
  LayoutGrid,
  TrendingUp,
  Store,
  BarChart3,
};

interface WidgetCatalogItem {
  id: string;
  configKey: string;
  name: string;
  nameThai: string;
  category: 'finance' | 'sales' | 'charts' | 'stock_notes';
  description: string;
  size: 'compact' | 'medium' | 'full';
  icon: any;
}

const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    id: 'pinned_metrics',
    configKey: 'showPinnedMetrics',
    name: 'Executive Pinned KPIs',
    nameThai: 'แถบตัวชี้วัดด่วนปักหมุด (Pinned Metrics Bar)',
    category: 'finance',
    description: 'แถบไฮไลต์ตัวเลขสำคัญที่ปักหมุดไว้ เช่น อัตรากำไร ยอดขายเฉลี่ยต่อบิล',
    size: 'full',
    icon: Sparkles
  },
  {
    id: 'daily_goal',
    configKey: 'showDailyRevenueGoal',
    name: 'Daily Revenue Goal Tracker',
    nameThai: 'แถบเกจเป้าหมายรายได้ประจำวัน (Daily Goal)',
    category: 'finance',
    description: 'เกจความคืบหน้าเป้าหมายรายได้วันนี้ พร้อมเปอร์เซ็นต์ความสำเร็จ',
    size: 'full',
    icon: DollarSign
  },
  {
    id: 'total_income',
    configKey: 'showTotalIncome',
    name: 'Total Income Card',
    nameThai: 'การ์ดยอดรวมรายรับ (Total Revenue)',
    category: 'finance',
    description: 'ยอดรายรับสะสมตามช่วงเวลา พร้อมเปอร์เซ็นต์เปรียบเทียบ',
    size: 'compact',
    icon: DollarSign
  },
  {
    id: 'total_expense',
    configKey: 'showTotalExpense',
    name: 'Total Expense Card',
    nameThai: 'การ์ดยอดรวมรายจ่าย (Total Expense)',
    category: 'finance',
    description: 'ยอดรวมค่าใช้จ่าย ต้นทุนอุปกรณ์ และค่าจ้างช่าง',
    size: 'compact',
    icon: DollarSign
  },
  {
    id: 'net_profit',
    configKey: 'showNetProfit',
    name: 'Net Profit & Margin Card',
    nameThai: 'การ์ดกำไรสุทธิ & Profit Margin',
    category: 'finance',
    description: 'กำไรสุทธิและอัตรากำไร (Net Profit Margin %)',
    size: 'compact',
    icon: TrendingUp
  },
  {
    id: 'unpaid',
    configKey: 'showUnpaid',
    name: 'Unpaid Receivables Card',
    nameThai: 'การ์ดยอดค้างชำระ (Pending Receivables)',
    category: 'finance',
    description: 'ยอดเงินที่ลูกค้ารอชำระ หรือเงินมัดจำคงค้าง',
    size: 'compact',
    icon: DollarSign
  },
  {
    id: 'solar_sales',
    configKey: 'showSolarSales',
    name: 'Solar Panel & Inverter Sales Counter',
    nameThai: 'สรุปยอดขายอุปกรณ์โซล่า (Solar Units Sold)',
    category: 'sales',
    description: 'นับจำนวนแผงโซล่า อินเวอร์เตอร์ และแบตเตอรี่ที่จำหน่ายได้',
    size: 'medium',
    icon: Package
  },
  {
    id: 'quick_shortcuts',
    configKey: 'showQuickShortcuts',
    name: 'POS Quick Action Shortcuts',
    nameThai: 'ปุ่มทางลัดบันทึกด่วน (Quick Actions & POS)',
    category: 'sales',
    description: 'ปุ่มคีย์ลัดบันทึกเงินสด ออกใบเสนอราคา และเพิ่มออเดอร์',
    size: 'full',
    icon: Store
  },
  {
    id: 'due_alerts',
    configKey: 'showDueAlerts',
    name: 'Overdue & Payment Due Alerts',
    nameThai: 'แถบเตือนยอดถึงกำหนดชำระ & นัดหมาย',
    category: 'sales',
    description: 'แจ้งเตือนออเดอร์ที่ใกล้ถึงกำหนดหรือเกินกำหนดชำระ',
    size: 'full',
    icon: Calendar
  },
  {
    id: 'trend_chart',
    configKey: 'showTrendChart',
    name: '30-Day Cashflow Trend Chart',
    nameThai: 'กราฟวิเคราะห์กระแสเงินสด 30 วัน (Trend Chart)',
    category: 'charts',
    description: 'แผนภูมิแท่งและเส้นเปรียบเทียบรายรับ-รายจ่ายรายวัน',
    size: 'full',
    icon: BarChart3
  },
  {
    id: 'category_breakdown',
    configKey: 'showCategoryBreakdown',
    name: 'Category Expense & Revenue Breakdown',
    nameThai: 'แผนภูมิแจกแจงตามหมวดหมู่ (Breakdown Pie)',
    category: 'charts',
    description: 'สัดส่วนค่าใช้จ่ายและรายรับแยกรายหมวดหมู่',
    size: 'medium',
    icon: BarChart3
  },
  {
    id: 'monthly_budget',
    configKey: 'showMonthlyBudget',
    name: 'Monthly Budget & Cost Control',
    nameThai: 'งบประมาณและการควบคุมค่าใช้จ่าย (Budget Progress)',
    category: 'finance',
    description: 'แถบหลอดติดตามการใช้งบประมาณเทียบกับเพดานที่กำหนด',
    size: 'medium',
    icon: DollarSign
  },
  {
    id: 'stock_inventory',
    configKey: 'showStockInventory',
    name: 'Low Stock & Warehouse Inventory',
    nameThai: 'สต็อกคงเหลือ & แจ้งเตือนสินค้าใกล้หมด',
    category: 'stock_notes',
    description: 'ตารางสรุปสินค้าในคลังและการแจ้งเตือนจุดสั่งซื้อใหม่',
    size: 'medium',
    icon: Package
  },
  {
    id: 'quick_notes',
    configKey: 'showQuickNotes',
    name: 'Team Quick Notes & Reminders',
    nameThai: 'บันทึกช่วยจำด่วนของทีม (Quick Notes)',
    category: 'stock_notes',
    description: 'กระดานโน้ตสั้นสำหรับทีมช่างและฝ่ายขาย',
    size: 'medium',
    icon: Sparkles
  },
  {
    id: 'recent_solar_table',
    configKey: 'showRecentSolarTable',
    name: 'Recent Solar Installations Table',
    nameThai: 'ตารางออเดอร์ & งานติดตั้งโซล่าล่าสุด',
    category: 'sales',
    description: 'รายการงานติดตั้งและคำสั่งซื้อโซล่าเซลล์ล่าสุดพร้อมสถานะ',
    size: 'full',
    icon: Store
  }
];

export const WidgetGallery: React.FC = () => {
  const { config, updateWidgetConfig } = useAppConfig();
  const { designConfig, applyLayoutPreset } = useDesignSystem();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'finance' | 'sales' | 'charts' | 'stock_notes'>('all');

  const widgets = config.dashboardWidgets || {};

  const handleToggleWidget = (configKey: string) => {
    const currentValue = (widgets as any)[configKey] ?? true;
    updateWidgetConfig({ [configKey]: !currentValue });
  };

  const filteredCatalog = WIDGET_CATALOG.filter(w => 
    selectedCategory === 'all' ? true : w.category === selectedCategory
  );

  return (
    <div className="space-y-8">
      {/* 1. Layout Presets Selector */}
      <div className="bg-slate-50/70 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutGrid size={18} className="text-brand" />
              <span>🏛️ พรีเซ็ตเลย์เอาต์หน้าแรก (Dashboard Layout Presets)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เลือกโครงสร้างแดชบอร์ดที่จัดเตรียมไว้ให้เหมาะสมกับบทบาทหน้าที่ของคุณ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {LAYOUT_PRESETS.map((preset) => {
            const isSelected = designConfig.layoutPreset === preset.id;
            const Icon = PRESET_ICONS[preset.icon] || LayoutGrid;

            return (
              <button
                key={preset.id}
                onClick={() => applyLayoutPreset(preset.id as LayoutPresetId)}
                className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer ${
                  isSelected
                    ? 'border-brand bg-white dark:bg-slate-900 shadow-md ring-2 ring-brand/30 scale-[1.02]'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      isSelected
                        ? 'bg-brand text-white border-brand'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  {isSelected && (
                    <span className="flex items-center text-brand font-black text-[11px] gap-1 bg-brand-soft px-2 py-0.5 rounded-md">
                      <CheckCircle2 size={13} /> กำลังใช้
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {preset.name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                    {preset.labelThai}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {preset.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                  <span>{preset.widgetKeys.length} วิดเจ็ต</span>
                  <span className="text-brand font-extrabold">คลิกเพื่อใช้งาน</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Widget Gallery & Catalog */}
      <div className="bg-slate-50/70 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers size={18} className="text-brand" />
              <span>📊 แกลเลอรีวิดเจ็ตทั้งหมด (SOM Widget Gallery)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เปิด-ปิด และปรับแต่งการแสดงผลวิดเจ็ตแต่ละตัวในแดชบอร์ดตามต้องการ
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              ทั้งหมด ({WIDGET_CATALOG.length})
            </button>
            <button
              onClick={() => setSelectedCategory('finance')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedCategory === 'finance'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              การเงิน
            </button>
            <button
              onClick={() => setSelectedCategory('sales')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedCategory === 'sales'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              หน้าร้าน & ขาย
            </button>
            <button
              onClick={() => setSelectedCategory('charts')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedCategory === 'charts'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              กราฟ & สถิติ
            </button>
            <button
              onClick={() => setSelectedCategory('stock_notes')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedCategory === 'stock_notes'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              สต็อก & โน้ต
            </button>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCatalog.map((widget) => {
            const isVisible = (widgets as any)[widget.configKey] ?? true;
            const Icon = widget.icon || Sparkles;

            return (
              <div
                key={widget.id}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                  isVisible
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
                    : 'border-dashed border-slate-300 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isVisible
                          ? 'bg-brand-soft text-brand border-brand-soft'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {widget.nameThai.split('(')[0]}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {widget.name}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleWidget(widget.configKey)}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 text-[11px] font-bold ${
                      isVisible
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                    }`}
                    title={isVisible ? 'คลิกเพื่อซ่อนวิดเจ็ตนี้' : 'คลิกเพื่อแสดงวิดเจ็ตนี้'}
                  >
                    {isVisible ? (
                      <>
                        <Eye size={13} />
                        <span>แสดง</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={13} />
                        <span>ซ่อน</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {widget.description}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400">
                    ขนาด: {widget.size === 'full' ? 'เต็มแถว' : widget.size === 'medium' ? 'ขนาดกลาง' : 'การ์ดย่อย'}
                  </span>

                  <span className="font-semibold text-slate-400">
                    {isVisible ? 'เปิดแสดงผลอยู่' : 'ถูกปิดการแสดงผล'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
