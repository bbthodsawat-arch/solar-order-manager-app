import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, Sparkles, LayoutGrid, Sliders, Eye, EyeOff, ArrowUp, ArrowDown, 
  RotateCcw, Check, Sun, Moon, Zap, Wallet, TrendingUp, TrendingDown, Clock, 
  Layers, ShieldCheck, HelpCircle, ChevronRight, CheckCircle2, SlidersHorizontal
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { soundFeedback } from '../../utils/feedback';
import { 
  DashboardCardDesignConfig, 
  DashboardCardId, 
  DashboardCardThemePreset, 
  DashboardCardLayoutStyle, 
  DashboardCardBorderRadius, 
  DashboardCardShadow,
  DashboardCardColorDefinition
} from '../../types';
import { 
  DASHBOARD_CARD_PRESETS, 
  DEFAULT_DASHBOARD_CARD_DESIGN, 
  CARD_METRIC_META,
  getComputedCardColor 
} from '../../utils/dashboardCardPresets';
import Sparkline from '../Sparkline';

interface DashboardCardCustomizerTabProps {
  designConfig?: DashboardCardDesignConfig;
  onUpdateDesign: (updates: Partial<DashboardCardDesignConfig>) => Promise<void> | void;
  onResetDesign: () => Promise<void> | void;
  onToggleVisibility: (cardId: DashboardCardId) => Promise<void> | void;
  onReorderCards: (newOrders: DashboardCardId[]) => Promise<void> | void;
  onSetCustomColor: (cardId: DashboardCardId, colors: Partial<DashboardCardColorDefinition>) => Promise<void> | void;
}

const SAMPLE_DATA: Record<DashboardCardId, { value: string; subtext: string; count: string; spark: number[] }> = {
  total_balance: { value: '฿1,250,400', subtext: 'ยอดคงเหลือรวมทั้งหมด', count: 'เงินสด + โอน + ธนาคาร', spark: [30, 45, 60, 50, 70, 85, 90] },
  total_income: { value: '฿485,000', subtext: '34 รายการ', count: 'แนวโน้ม 30 วัน', spark: [20, 35, 45, 60, 75, 90, 100] },
  total_expense: { value: '฿162,500', subtext: 'สัดส่วน 33.5%', count: 'แนวโน้ม 30 วัน', spark: [40, 30, 45, 35, 50, 40, 35] },
  net_profit: { value: '฿322,500', subtext: 'อัตรากำไร 66.5%', count: 'กำไรสุทธิเดือนนี้', spark: [15, 30, 40, 55, 65, 80, 95] },
  unpaid: { value: '฿45,900', subtext: '3 ออเดอร์รอชำระ', count: 'ค้างชำระคงเหลือ', spark: [10, 15, 12, 18, 14, 20, 15] },
  solar_sales: { value: '฿389,000', subtext: '12 ออเดอร์งานโซล่า', count: 'ยอดขายโซล่าเซลล์', spark: [25, 40, 50, 65, 70, 85, 90] }
};

const SWATCH_PALETTES = [
  { name: 'มิ้นต์พาสเทล (Mint)', from: '#e6f4ea', to: '#d1fae5', text: '#065f46', border: '#a7f3d0', spark: '#059669' },
  { name: 'ครามพาสเทล (Indigo)', from: '#e0e7ff', to: '#ede9fe', text: '#312e81', border: '#c7d2fe', spark: '#4f46e5' },
  { name: 'กุหลาบพาสเทล (Rose)', from: '#fce8e6', to: '#ffe4e6', text: '#9f1239', border: '#fca5a5', spark: '#e11d48' },
  { name: 'ม่วงพาสเทล (Violet)', from: '#f3e8ff', to: '#fce7f3', text: '#581c87', border: '#ddd6fe', spark: '#7c3aed' },
  { name: 'อำพันพาสเทล (Amber)', from: '#fef7e0', to: '#ffedd5', text: '#92400e', border: '#fde68a', spark: '#d97706' },
  { name: 'ฟ้าพาสเทล (Sky)', from: '#e8f0fe', to: '#cffafe', text: '#075985', border: '#bae6fd', spark: '#0284c7' },
  { name: 'ส้มพีชพาสเทล (Peach)', from: '#fff7ed', to: '#ffedd5', text: '#9a3412', border: '#fed7aa', spark: '#ea580c' },
  { name: 'ชมพูแคนดี้ (Candy)', from: '#fce7f3', to: '#fee2e2', text: '#831843', border: '#fbcfe8', spark: '#ec4899' },
];

export function DashboardCardCustomizerTab({
  designConfig = DEFAULT_DASHBOARD_CARD_DESIGN,
  onUpdateDesign,
  onResetDesign,
  onToggleVisibility,
  onReorderCards,
  onSetCustomColor
}: DashboardCardCustomizerTabProps) {
  const current = designConfig || DEFAULT_DASHBOARD_CARD_DESIGN;
  const [simulatorDarkMode, setSimulatorDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'layout' | 'custom_colors' | 'cards_manager'>('presets');
  const [selectedCardForCustom, setSelectedCardForCustom] = useState<DashboardCardId>('total_income');

  const cardOrders = current.cardOrders && current.cardOrders.length === 6 
    ? current.cardOrders 
    : DEFAULT_DASHBOARD_CARD_DESIGN.cardOrders;

  const cardVisibility = current.cardVisibility || DEFAULT_DASHBOARD_CARD_DESIGN.cardVisibility;

  const handleSelectPreset = async (presetId: DashboardCardThemePreset) => {
    soundFeedback.click();
    await onUpdateDesign({ themePreset: presetId });
    toast.success(`เปลี่ยนโทนสีเป็น: ${DASHBOARD_CARD_PRESETS.find(p => p.id === presetId)?.label.split('(')[0] || presetId}`);
  };

  const handleMoveCard = async (cardId: DashboardCardId, direction: 'up' | 'down') => {
    soundFeedback.click();
    const index = cardOrders.indexOf(cardId);
    if (index === -1) return;

    const newOrders = [...cardOrders];
    if (direction === 'up' && index > 0) {
      const temp = newOrders[index - 1];
      newOrders[index - 1] = newOrders[index];
      newOrders[index] = temp;
    } else if (direction === 'down' && index < newOrders.length - 1) {
      const temp = newOrders[index + 1];
      newOrders[index + 1] = newOrders[index];
      newOrders[index] = temp;
    }
    await onReorderCards(newOrders);
  };

  const handleApplySwatch = async (swatch: typeof SWATCH_PALETTES[0]) => {
    soundFeedback.success();
    await onSetCustomColor(selectedCardForCustom, {
      bgGradientFrom: swatch.from,
      bgGradientTo: swatch.to,
      textColor: swatch.text,
      borderColor: swatch.border,
      accentColor: swatch.spark,
      sparklineColor: swatch.spark
    });
    toast.success(`ใช้ชุดสี ${swatch.name} กับ ${CARD_METRIC_META[selectedCardForCustom].label}`);
  };

  const activeVisibleCount = cardOrders.filter(id => cardVisibility[id] !== false).length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-brand to-brand p-6 sm:p-8 rounded-3xl text-slate-900 shadow-md">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-black bg-white/30 backdrop-blur-md border border-white/40 shadow-xs">
              <Sparkles size={14} className="animate-spin-slow" />
              <span>DASHBOARD METRIC CARDS & PASTEL STYLING</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              ปรับแต่งสไตล์การ์ดสรุปหน้าแรก (Dashboard KPI Cards)
            </h1>
            <p className="text-slate-800 text-xs sm:text-sm font-semibold max-w-2xl leading-relaxed">
              เลือกโทนสีพาสเทลไล่ระดับ (Soft Pastel Gradients), สไตล์การ์ดมัลติคัลเลอร์, ปรับมุมมน, เอฟเฟกต์เงา และจัดลำดับการแสดงผลยอดคงเหลือ รายรับ รายจ่าย กำไรสุทธิ ยอดค้างชำระ และยอดขายโซล่าเซลล์
            </p>
          </div>

          <button
            onClick={() => {
              soundFeedback.click();
              onResetDesign();
              toast.success('คืนค่าสไตล์การ์ดแดชบอร์ดเริ่มต้นเรียบร้อยแล้ว');
            }}
            className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white/90 hover:bg-white text-slate-900 text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <RotateCcw size={16} />
            <span>คืนค่ามาตรฐาน (Default Pastel)</span>
          </button>
        </div>
      </div>

      {/* Live Interactive Simulator (พรีวิวสดแบบเรียลไทม์) */}
      <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-brand text-slate-900 flex items-center justify-center font-bold shadow-2xs">
              <Eye size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                ตัวอย่างจำลองหน้าแดชบอร์ด (Live Simulator Preview)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                แสดงผลตามธีมและตัวเลือกปัจจุบัน ({activeVisibleCount} การ์ดเปิดใช้งาน)
              </p>
            </div>
          </div>

          {/* Simulator Dark/Light Toggle */}
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 pl-2">โหมดพรีวิว:</span>
            <button
              onClick={() => setSimulatorDarkMode(false)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                !simulatorDarkMode ? 'bg-amber-100 text-amber-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sun size={14} className="text-amber-600" />
              <span>โหมดสว่าง (Light)</span>
            </button>
            <button
              onClick={() => setSimulatorDarkMode(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                simulatorDarkMode ? 'bg-indigo-900 text-indigo-100 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Moon size={14} className="text-indigo-400" />
              <span>โหมดมืด (Dark)</span>
            </button>
          </div>
        </div>

        {/* The Live Cards Container */}
        <div className={`p-4 sm:p-6 rounded-3xl transition-all ${simulatorDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100/80 text-slate-900'}`}>
          <div className={`grid gap-3.5 ${
            current.layoutStyle === 'two_column' 
              ? 'grid-cols-1 sm:grid-cols-2'
              : current.layoutStyle === 'compact_dense'
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
              : current.layoutStyle === 'bento_hero'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
          }`}>
            {cardOrders.map((cardId) => {
              const isVisible = cardVisibility[cardId] !== false;
              if (!isVisible) return null;

              const meta = CARD_METRIC_META[cardId];
              const sample = SAMPLE_DATA[cardId];
              const colors = getComputedCardColor(cardId, current, simulatorDarkMode);

              const isBentoSpan = current.layoutStyle === 'bento_hero' && (cardId === 'total_balance' || cardId === 'net_profit');

              // Resolve corner radius
              const radiusClass = 
                current.borderRadius === 'rounded-xl' ? 'rounded-xl' :
                current.borderRadius === 'rounded-2xl' ? 'rounded-2xl' :
                current.borderRadius === 'rounded-full-pill' ? 'rounded-[2rem]' : 'rounded-3xl';

              // Resolve shadow
              const shadowClass = 
                current.shadowStyle === 'glow' ? 'shadow-lg ring-1' :
                current.shadowStyle === 'floating' ? 'shadow-xl -translate-y-0.5' :
                current.shadowStyle === 'flat' ? 'shadow-none border-2' : 'shadow-sm';

              // Background styling
              const bgStyle = simulatorDarkMode
                ? {
                    background: colors.darkBgGradientFrom && colors.darkBgGradientTo
                      ? `linear-gradient(135deg, ${colors.darkBgGradientFrom} 0%, ${colors.darkBgGradientTo} 100%)`
                      : '#1e293b',
                    borderColor: colors.darkBorderColor || colors.borderColor,
                    color: colors.darkTextColor || '#ffffff'
                  }
                : {
                    background: `linear-gradient(135deg, ${colors.bgGradientFrom} 0%, ${colors.bgGradientTo} 100%)`,
                    borderColor: colors.borderColor,
                    color: colors.textColor
                  };

              const IconComponent = 
                cardId === 'total_balance' ? Wallet :
                cardId === 'total_income' ? TrendingUp :
                cardId === 'total_expense' ? TrendingDown :
                cardId === 'net_profit' ? Zap :
                cardId === 'unpaid' ? Clock : Sun;

              return (
                <motion.div
                  key={cardId}
                  layout
                  style={bgStyle}
                  className={`${radiusClass} ${shadowClass} p-4 border transition-all flex flex-col justify-between relative overflow-hidden ${
                    isBentoSpan ? 'sm:col-span-2' : 'col-span-1'
                  } ${current.enableHoverScale ? 'hover:scale-[1.02] hover:shadow-md' : ''}`}
                >
                  {/* Subtle glass reflection effect if enabled */}
                  {current.glassBackdropBlur && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider line-clamp-1 opacity-90">
                        {meta.label}
                      </span>
                      {current.showIconBadge && (
                        <div 
                          style={{
                            backgroundColor: colors.iconBgColor || 'rgba(0,0,0,0.06)',
                            color: colors.iconColor || colors.textColor
                          }}
                          className="w-7 h-7 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-2xs"
                        >
                          <IconComponent size={15} />
                        </div>
                      )}
                    </div>

                    <p className="text-lg sm:text-xl font-black tracking-tight truncate">
                      {sample.value}
                    </p>
                  </div>

                  {/* Sparkline trend representation */}
                  {current.showSparklines && (
                    <div className="my-2.5">
                      <Sparkline 
                        data={sample.spark.map(val => ({ value: val }))} 
                        color={colors.sparklineColor || colors.accentColor} 
                        height={32} 
                        label={meta.label} 
                      />
                    </div>
                  )}

                  {/* Trend Subtext Badge */}
                  {current.showTrendSubtext && (
                    <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10 text-[10px] font-semibold opacity-90">
                      <span className="truncate">{sample.subtext}</span>
                      <span className="font-bold shrink-0">{sample.count}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'presets'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Palette size={16} />
          <span>1. ชุดสีและโทนพาสเทล (Presets Gallery)</span>
        </button>

        <button
          onClick={() => setActiveTab('layout')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'layout'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutGrid size={16} />
          <span>2. สไตล์เลย์เอาต์ & ทรงการ์ด (Geometry & Layout)</span>
        </button>

        <button
          onClick={() => setActiveTab('cards_manager')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'cards_manager'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <SlidersHorizontal size={16} />
          <span>3. สลับการ์ด & จัดลำดับ (Visibility & Orders)</span>
        </button>

        <button
          onClick={() => setActiveTab('custom_colors')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'custom_colors'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders size={16} />
          <span>4. ปรับแต่งสีแยกรายใบ (Custom Color Studio)</span>
        </button>
      </div>

      {/* Tab 1: Presets Gallery */}
      {activeTab === 'presets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DASHBOARD_CARD_PRESETS.map((preset) => {
              const isSelected = current.themePreset === preset.id;

              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-brand bg-amber-50/40 dark:bg-amber-950/20 shadow-md ring-2 ring-brand/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header with badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${preset.badgeClass}`}>
                        {preset.badge}
                      </span>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-brand text-slate-900 flex items-center justify-center font-bold shadow-2xs">
                          <Check size={14} />
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {preset.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  {/* Swatch Strip */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-1.5">
                      {preset.previewColors.map((col, idx) => (
                        <div
                          key={idx}
                          style={{ backgroundColor: col }}
                          className="h-6 flex-1 rounded-lg border border-black/10 dark:border-white/10 shadow-2xs"
                        />
                      ))}
                    </div>
                    <div className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">
                      {preset.subLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Layout & Geometry */}
      {activeTab === 'layout' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          
          {/* Layout Mode Selector */}
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <LayoutGrid size={16} className="text-brand" />
              <span>รูปแบบการจัดวางการ์ด (Card Layout Mode)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: 'standard_grid', label: 'Standard Grid (5-6 คอลัมน์)', desc: 'ขนาดการ์ดเท่ากัน เรียงแถวแนวนอนอย่างสมดุล' },
                { id: 'bento_hero', label: 'Bento Hero (เน้นยอดคงเหลือ & กำไร)', desc: 'การ์ดยอดคงเหลือและกำไรสุทธิกว้างเป็นพิเศษ' },
                { id: 'two_column', label: 'Two Column (2 คอลัมน์ใหญ่)', desc: 'การ์ดขนาดใหญ่ มองเห็นชัดเจนสำหรับจอแท็บเล็ต' },
                { id: 'compact_dense', label: 'Compact Dense (กระชับ ประหยัดพื้นที่)', desc: 'ความสูงการ์ดลดลง เหมาะสำหรับหน้าจอขนาดเล็ก' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    soundFeedback.click();
                    onUpdateDesign({ layoutStyle: item.id as DashboardCardLayoutStyle });
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    current.layoutStyle === item.id
                      ? 'border-brand bg-amber-50/50 dark:bg-amber-950/20 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-xs font-black block text-slate-900 dark:text-white">{item.label}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">
              ความโค้งมนของขอบการ์ด (Corner Radius)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'rounded-xl', label: 'มินิมอล (12px)', class: 'rounded-xl' },
                { id: 'rounded-2xl', label: 'มาตรฐาน (16px)', class: 'rounded-2xl' },
                { id: 'rounded-3xl', label: 'ขอบมนละมุน (24px)', class: 'rounded-3xl' },
                { id: 'rounded-full-pill', label: 'แคปซูลโค้งพิเศษ', class: 'rounded-full' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    soundFeedback.click();
                    onUpdateDesign({ borderRadius: item.id as DashboardCardBorderRadius });
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    current.borderRadius === item.id
                      ? 'border-brand bg-amber-50/50 dark:bg-amber-950/20 font-black text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className={`w-8 h-8 mx-auto mb-2 border-2 border-brand/60 ${item.class} bg-amber-100/50 dark:bg-amber-950/40`} />
                  <span className="text-xs font-bold block">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Elevation & Shadows */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">
              มิติเงาและการเรืองแสง (Elevation & Ambient Shadow)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'soft', label: 'เงานุ่มละมุน (Soft Shadow)' },
                { id: 'glow', label: 'แสงเรืองรอบการ์ด (Ambient Glow)' },
                { id: 'floating', label: 'มิติลอยเด่น (Floating Elevation)' },
                { id: 'flat', label: 'แบนเรียบ ขอบชัด (Flat Crisp)' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    soundFeedback.click();
                    onUpdateDesign({ shadowStyle: item.id as DashboardCardShadow });
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    current.shadowStyle === item.id
                      ? 'border-brand bg-amber-50/50 dark:bg-amber-950/20 font-black text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold block">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">
              องค์ประกอบภายในตัวการ์ด (Internal Elements)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'showSparklines', label: 'แสดงกราฟขนาดเล็ก Sparkline แนวโน้ม 30 วัน', desc: 'มินิกราฟเส้นแสดงทิศทางของตัวเลข' },
                { key: 'showTrendSubtext', label: 'แสดงแถบข้อมูลสรุปด้านล่างการ์ด (จำนวนรายการ / สัดส่วน %)', desc: 'เช่น 34 รายการ, สัดส่วน Margin %' },
                { key: 'showIconBadge', label: 'แสดงไอคอนหัวการ์ดในวงกลม/เม็ดยา', desc: 'ไอคอน Wallet, TrendingUp, Sun ฯลฯ' },
                { key: 'enableHoverScale', label: 'เอฟเฟกต์แอนิเมชันเมื่อเลื่อนเมาส์ชี้ (Hover Animation)', desc: 'การ์ดจะขยายเล็กน้อยและมีเงามิติ' },
              ].map(item => {
                const isEnabled = (current as any)[item.key] !== false;
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      soundFeedback.click();
                      onUpdateDesign({ [item.key]: !isEnabled });
                    }}
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isEnabled
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black block">{item.label}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">{item.desc}</span>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isEnabled ? 'right-1' : 'left-1'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Tab 3: Card Visibility & Reordering */}
      {activeTab === 'cards_manager' && (
        <div className="space-y-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                การมองเห็นและลำดับของการ์ด (Visibility & Orders)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                คลิกปุ่มลูกศรขึ้น/ลง เพื่อจัดเรียงลำดับ หรือคลิกไอคอนดวงตาเพื่อซ่อน/แสดงการ์ด
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {cardOrders.map((cardId, idx) => {
              const meta = CARD_METRIC_META[cardId];
              const isVisible = cardVisibility[cardId] !== false;
              const colors = getComputedCardColor(cardId, current);

              return (
                <div
                  key={cardId}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isVisible
                      ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs'
                      : 'bg-slate-100/60 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      style={{
                        background: `linear-gradient(135deg, ${colors.bgGradientFrom}, ${colors.bgGradientTo})`,
                        borderColor: colors.borderColor
                      }}
                      className="w-10 h-10 rounded-xl border flex items-center justify-center font-bold shadow-2xs"
                    >
                      <span className="text-xs font-black" style={{ color: colors.textColor }}>
                        {idx + 1}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {meta.englishLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleMoveCard(cardId, 'up')}
                      disabled={idx === 0}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="เลื่อนขึ้น"
                    >
                      <ArrowUp size={16} />
                    </button>

                    <button
                      onClick={() => handleMoveCard(cardId, 'down')}
                      disabled={idx === cardOrders.length - 1}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="เลื่อนลง"
                    >
                      <ArrowDown size={16} />
                    </button>

                    <button
                      onClick={() => {
                        soundFeedback.click();
                        onToggleVisibility(cardId);
                      }}
                      className={`p-2 rounded-xl transition-all ${
                        isVisible
                          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                      title={isVisible ? 'คลิกเพื่อซ่อน' : 'คลิกเพื่อแสดง'}
                    >
                      {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Custom Color Studio */}
      {activeTab === 'custom_colors' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              กำหนดสีเองทีละการ์ด (Custom Per-Card Color Studio)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เลือกการ์ดที่ต้องการ แล้วเลือกชุดสีพาสเทลสำเร็จรูป หรือปรับรหัสสี Hex ตามใจชอบ
            </p>
          </div>

          {/* Card Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {cardOrders.map((cardId) => {
              const meta = CARD_METRIC_META[cardId];
              const isSelected = selectedCardForCustom === cardId;

              return (
                <button
                  key={cardId}
                  onClick={() => setSelectedCardForCustom(cardId)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                    isSelected
                      ? 'bg-brand text-slate-900 shadow-sm scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Preset Swatches for Selected Card */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
              เลือกพาเลทพาสเทลสำเร็จรูปด่วน:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SWATCH_PALETTES.map((swatch, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplySwatch(swatch)}
                  style={{
                    background: `linear-gradient(135deg, ${swatch.from}, ${swatch.to})`,
                    borderColor: swatch.border,
                    color: swatch.text
                  }}
                  className="p-3 rounded-2xl border text-left shadow-2xs hover:shadow-sm hover:scale-[1.02] transition-all font-black text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>{swatch.name.split('(')[0]}</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: swatch.spark }} />
                  </div>
                  <span className="text-[10px] opacity-80 block">คลิกเพื่อใช้สีนี้</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Hex Pickers for Selected Card */}
          {(() => {
            const currentCardColor = getComputedCardColor(selectedCardForCustom, current);

            return (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                    สีเริ่มต้นการไล่เฉด (Gradient Start):
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={currentCardColor.bgGradientFrom.startsWith('#') ? currentCardColor.bgGradientFrom : '#e0e7ff'}
                      onChange={(e) => onSetCustomColor(selectedCardForCustom, { bgGradientFrom: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={currentCardColor.bgGradientFrom}
                      onChange={(e) => onSetCustomColor(selectedCardForCustom, { bgGradientFrom: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                    สีสิ้นสุดการไล่เฉด (Gradient End):
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={currentCardColor.bgGradientTo.startsWith('#') ? currentCardColor.bgGradientTo : '#ede9fe'}
                      onChange={(e) => onSetCustomColor(selectedCardForCustom, { bgGradientTo: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={currentCardColor.bgGradientTo}
                      onChange={(e) => onSetCustomColor(selectedCardForCustom, { bgGradientTo: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                    สีตัวอักษรและตัวเลข (Text Color):
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={currentCardColor.textColor.startsWith('#') ? currentCardColor.textColor : '#312e81'}
                      onChange={(e) => onSetCustomColor(selectedCardForCustom, { textColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                    />
                    <input
                      type="text"
                      value={currentCardColor.textColor}
                      onChange={(e) => onSetCustomColor(selectedCardForCustom, { textColor: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}

    </div>
  );
}

export default DashboardCardCustomizerTab;
