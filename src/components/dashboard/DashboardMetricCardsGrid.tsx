import React from 'react';
import { motion } from 'motion/react';
import {
  Wallet, TrendingUp, TrendingDown, Zap, Clock, Sun, Sparkles, SlidersHorizontal
} from 'lucide-react';
import {
  DashboardCardDesignConfig,
  DashboardCardId
} from '../../types';
import {
  CARD_METRIC_META,
  DEFAULT_DASHBOARD_CARD_DESIGN,
  getComputedCardColor
} from '../../utils/dashboardCardPresets';
import Sparkline from '../Sparkline';

interface DashboardMetricCardsGridProps {
  designConfig?: DashboardCardDesignConfig;
  stats: {
    totalAllTimeBalance: number;
    activeIncome: number;
    activeExpense: number;
    activeProfit: number;
    activeProfitMargin: number;
    totalUnpaidAmount: number;
    totalUnpaidCount: number;
    activeSolarRevenue: number;
    activeSolarCount: number;
    activeTxCount: number;
  };
  sparklines: {
    income: number[];
    expense: number[];
    profit: number[];
    balance: number[];
    unpaid: number[];
    solar: number[];
  };
  onOpenCardCustomizer?: () => void;
}

export const DashboardMetricCardsGrid: React.FC<DashboardMetricCardsGridProps> = ({
  designConfig = DEFAULT_DASHBOARD_CARD_DESIGN,
  stats,
  sparklines,
  onOpenCardCustomizer
}) => {
  const current = designConfig || DEFAULT_DASHBOARD_CARD_DESIGN;

  const cardOrders = current.cardOrders && current.cardOrders.length === 6
    ? current.cardOrders
    : DEFAULT_DASHBOARD_CARD_DESIGN.cardOrders;

  const cardVisibility = current.cardVisibility || DEFAULT_DASHBOARD_CARD_DESIGN.cardVisibility;

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

  // Grid layout class based on layoutStyle
  const gridClass =
    current.layoutStyle === 'two_column'
      ? 'grid-cols-1 sm:grid-cols-2'
      : current.layoutStyle === 'compact_dense'
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      : current.layoutStyle === 'bento_hero'
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';

  const visibleCards = cardOrders.filter(id => cardVisibility[id] !== false);

  if (visibleCards.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Quick Customize Bar Header */}
      {onOpenCardCustomizer && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" />
              สรุปภาพรวมสำคัญ (Executive Key Metrics)
            </span>
          </div>

          <button
            onClick={onOpenCardCustomizer}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 transition-all border border-slate-200/60 dark:border-slate-700/60 shadow-2xs cursor-pointer active:scale-95"
            title="คลิกเพื่อเปลี่ยนโทนสีพาสเทล หรือปรับแต่งการ์ด"
          >
            <SlidersHorizontal size={12} className="text-brand" />
            <span>ปรับแต่งสไตล์การ์ด & โทนพาสเทล</span>
          </button>
        </div>
      )}

      {/* The Metric Cards Grid */}
      <div className={`grid ${gridClass} gap-3.5`}>
        {cardOrders.map((cardId) => {
          const isVisible = cardVisibility[cardId] !== false;
          if (!isVisible) return null;

          const meta = CARD_METRIC_META[cardId];
          const colors = getComputedCardColor(cardId, current);

          const isBentoSpan = current.layoutStyle === 'bento_hero' && (cardId === 'total_balance' || cardId === 'net_profit');

          // Determine Card Values & Subtexts
          let valueStr = '฿0';
          let subtextLeft = '';
          let subtextRight = '';
          let sparkData = sparklines.income;
          let IconComponent = Wallet;

          switch (cardId) {
            case 'total_balance':
              valueStr = `฿${stats.totalAllTimeBalance.toLocaleString()}`;
              subtextLeft = `เงินสด + โอน + ธนาคาร`;
              subtextRight = `ยอดรวมสุทธิ`;
              sparkData = sparklines.balance;
              IconComponent = Wallet;
              break;
            case 'total_income':
              valueStr = `฿${stats.activeIncome.toLocaleString()}`;
              subtextLeft = `${stats.activeTxCount} รายการ`;
              subtextRight = `แนวโน้ม 30 วัน`;
              sparkData = sparklines.income;
              IconComponent = TrendingUp;
              break;
            case 'total_expense':
              valueStr = `฿${stats.activeExpense.toLocaleString()}`;
              const expenseRatio = stats.activeIncome > 0 ? ((stats.activeExpense / stats.activeIncome) * 100).toFixed(0) : '0';
              subtextLeft = `สัดส่วน: ${expenseRatio}%`;
              subtextRight = `แนวโน้ม 30 วัน`;
              sparkData = sparklines.expense;
              IconComponent = TrendingDown;
              break;
            case 'net_profit':
              valueStr = `฿${stats.activeProfit.toLocaleString()}`;
              subtextLeft = `อัตรากำไร`;
              subtextRight = `${stats.activeProfitMargin}%`;
              sparkData = sparklines.profit;
              IconComponent = Zap;
              break;
            case 'unpaid':
              valueStr = `฿${stats.totalUnpaidAmount.toLocaleString()}`;
              subtextLeft = `${stats.totalUnpaidCount} ออเดอร์`;
              subtextRight = `รอชำระ`;
              sparkData = sparklines.unpaid;
              IconComponent = Clock;
              break;
            case 'solar_sales':
              valueStr = `฿${stats.activeSolarRevenue.toLocaleString()}`;
              subtextLeft = `ส่งมอบ ${stats.activeSolarCount} ชุด`;
              subtextRight = `แนวโน้ม 30 วัน`;
              sparkData = sparklines.solar;
              IconComponent = Sun;
              break;
          }

          const bgGradientStyle = {
            background: `linear-gradient(135deg, ${colors.bgGradientFrom} 0%, ${colors.bgGradientTo} 100%)`,
            borderColor: colors.borderColor,
            color: colors.textColor
          };

          return (
            <motion.div
              key={cardId}
              layout
              style={bgGradientStyle}
              className={`${radiusClass} ${shadowClass} p-4 border transition-all flex flex-col justify-between relative overflow-hidden ${
                isBentoSpan ? 'sm:col-span-2' : 'col-span-1'
              } ${current.enableHoverScale ? 'hover:scale-[1.02] hover:shadow-md' : ''}`}
            >
              {/* Optional Glass Effect */}
              {current.glassBackdropBlur && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/15 rounded-full blur-xl pointer-events-none" />
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
                  {valueStr}
                </p>
              </div>

              {/* Sparkline */}
              {current.showSparklines && (
                <div className="my-2.5">
                  <Sparkline
                    data={sparkData && sparkData.length > 0 ? sparkData.map(value => ({ value })) : [{ value: 0 }, { value: 10 }, { value: 20 }, { value: 15 }, { value: 30 }]}
                    color={colors.sparklineColor || colors.accentColor}
                    height={32}
                    label={meta.label}
                  />
                </div>
              )}

              {/* Trend Subtext Badge */}
              {current.showTrendSubtext && (
                <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10 text-[10px] font-semibold opacity-90">
                  <span className="truncate">{subtextLeft}</span>
                  <span className="font-bold shrink-0">{subtextRight}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardMetricCardsGrid;
