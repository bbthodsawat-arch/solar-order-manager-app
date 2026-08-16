import React, { useState, useMemo } from 'react';
import { 
  Sun, Battery, Cpu, Layers, Sparkles, TrendingUp, Award, 
  ChevronDown, ChevronUp, BarChart3, PieChart, ShoppingBag, 
  ArrowUpRight, ArrowDownUp, CheckCircle2, Package, Filter
} from 'lucide-react';
import { Transaction } from '../types';

interface CategorySalesSummaryCardProps {
  transactions: Transaction[];
  timeframeLabel?: string;
  onQuickAdd?: (type: 'income' | 'expense', category: string, detail?: string, amount?: number) => void;
}

interface SubcategoryData {
  name: string;
  revenue: number;
  count: number;
}

interface CategoryData {
  id: string;
  name: string;
  revenue: number;
  count: number;
  percentage: number;
  avgOrderValue: number;
  color: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    barBg: string;
    iconBg: string;
  };
  icon: React.ReactNode;
  subcategories: SubcategoryData[];
}

const CATEGORY_STYLE_MAP: Record<string, {
  color: CategoryData['color'];
  icon: React.ReactNode;
}> = {
  'SOLAR ENERGY STANDARDS': {
    color: {
      bg: 'bg-amber-50/70 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800/60',
      text: 'text-amber-900 dark:text-amber-300',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200',
      barBg: 'bg-gradient-to-r from-amber-400 to-amber-500',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    },
    icon: <Sun size={18} />,
  },
  'LITHIUM BATTERY SET': {
    color: {
      bg: 'bg-purple-50/70 dark:bg-purple-950/20',
      border: 'border-purple-200 dark:border-purple-800/60',
      text: 'text-purple-900 dark:text-purple-300',
      badgeBg: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200',
      barBg: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
    },
    icon: <Battery size={18} />,
  },
  'INVERTER | COMBINER SET': {
    color: {
      bg: 'bg-sky-50/70 dark:bg-sky-950/20',
      border: 'border-sky-200 dark:border-sky-800/60',
      text: 'text-sky-900 dark:text-sky-300',
      badgeBg: 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200',
      barBg: 'bg-gradient-to-r from-sky-400 to-blue-500',
      iconBg: 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400',
    },
    icon: <Cpu size={18} />,
  },
  'CUSTOM SOLAR SET': {
    color: {
      bg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      text: 'text-emerald-900 dark:text-emerald-300',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
      barBg: 'bg-gradient-to-r from-emerald-400 to-teal-500',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
    },
    icon: <Layers size={18} />,
  },
  'SOLAR PANEL SET': {
    color: {
      bg: 'bg-blue-50/70 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800/60',
      text: 'text-blue-900 dark:text-blue-300',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200',
      barBg: 'bg-gradient-to-r from-blue-400 to-indigo-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    },
    icon: <Package size={18} />,
  },
  'รายรับจาก Sale order': {
    color: {
      bg: 'bg-amber-50/70 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800/60',
      text: 'text-amber-900 dark:text-amber-300',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200',
      barBg: 'bg-gradient-to-r from-amber-400 to-amber-500',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    },
    icon: <Sun size={18} />,
  },
  'แบตเตอรี่': {
    color: {
      bg: 'bg-purple-50/70 dark:bg-purple-950/20',
      border: 'border-purple-200 dark:border-purple-800/60',
      text: 'text-purple-900 dark:text-purple-300',
      badgeBg: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200',
      barBg: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
    },
    icon: <Battery size={18} />,
  },
  'ตู้คอมบายเนอร์+อินเวอร์เตอร์': {
    color: {
      bg: 'bg-sky-50/70 dark:bg-sky-950/20',
      border: 'border-sky-200 dark:border-sky-800/60',
      text: 'text-sky-900 dark:text-sky-300',
      badgeBg: 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200',
      barBg: 'bg-gradient-to-r from-sky-400 to-blue-500',
      iconBg: 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400',
    },
    icon: <Cpu size={18} />,
  },
};

const DEFAULT_CATEGORY_STYLE = {
  color: {
    bg: 'bg-slate-50/70 dark:bg-slate-800/30',
    border: 'border-slate-200 dark:border-slate-700/60',
    text: 'text-slate-900 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
    barBg: 'bg-gradient-to-r from-slate-400 to-slate-600',
    iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  },
  icon: <ShoppingBag size={18} />,
};

export default function CategorySalesSummaryCard({
  transactions,
  timeframeLabel = 'เดือนนี้',
  onQuickAdd
}: CategorySalesSummaryCardProps) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'revenue' | 'count' | 'name'>('revenue');

  // Process income transactions and group by category
  const { categoriesData, totalSalesRevenue, totalSalesCount, topCategory } = useMemo(() => {
    const incomeTxs = transactions.filter(t => t.type === 'income');
    
    let totalRevenue = 0;
    let totalCount = 0;

    const catMap: Record<string, {
      revenue: number;
      count: number;
      subcategories: Record<string, { revenue: number; count: number }>;
    }> = {};

    incomeTxs.forEach(tx => {
      const amount = Number(tx.amount) || 0;
      totalRevenue += amount;
      totalCount += 1;

      const catName = tx.category || 'รายได้อื่นๆ';
      if (!catMap[catName]) {
        catMap[catName] = { revenue: 0, count: 0, subcategories: {} };
      }

      catMap[catName].revenue += amount;
      catMap[catName].count += 1;

      // Extract subcategory name from tx.subcategory or saleOrderDetails
      let subName = tx.subcategory;
      if (!subName && tx.saleOrderDetails) {
        if (tx.saleOrderDetails.setOption) {
          subName = `ชุด ${tx.saleOrderDetails.setOption}`;
        } else if (tx.saleOrderDetails.batteryOption) {
          subName = `แบต ${tx.saleOrderDetails.batteryOption}`;
        } else if (tx.saleOrderDetails.combinerOption) {
          subName = `คอมบายเนอร์ ${tx.saleOrderDetails.combinerOption}`;
        }
      }

      if (subName) {
        if (!catMap[catName].subcategories[subName]) {
          catMap[catName].subcategories[subName] = { revenue: 0, count: 0 };
        }
        catMap[catName].subcategories[subName].revenue += amount;
        catMap[catName].subcategories[subName].count += 1;
      }
    });

    // Build category objects array
    const catList: CategoryData[] = Object.entries(catMap).map(([name, data]) => {
      const percentage = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
      const avgOrderValue = data.count > 0 ? Math.round(data.revenue / data.count) : 0;
      const style = CATEGORY_STYLE_MAP[name] || DEFAULT_CATEGORY_STYLE;

      const subList: SubcategoryData[] = Object.entries(data.subcategories)
        .map(([subName, subData]) => ({
          name: subName,
          revenue: subData.revenue,
          count: subData.count
        }))
        .sort((a, b) => b.revenue - a.revenue);

      return {
        id: name,
        name,
        revenue: data.revenue,
        count: data.count,
        percentage: Number(percentage.toFixed(1)),
        avgOrderValue,
        color: style.color,
        icon: style.icon,
        subcategories: subList
      };
    });

    // Sort category list
    if (sortBy === 'revenue') {
      catList.sort((a, b) => b.revenue - a.revenue);
    } else if (sortBy === 'count') {
      catList.sort((a, b) => b.count - a.count);
    } else {
      catList.sort((a, b) => a.name.localeCompare(b.name, 'th'));
    }

    const topCat = catList.length > 0 && catList[0].revenue > 0 ? catList[0] : null;

    return {
      categoriesData: catList,
      totalSalesRevenue: totalRevenue,
      totalSalesCount: totalCount,
      topCategory: topCat
    };
  }, [transactions, sortBy]);

  const toggleExpand = (id: string) => {
    setExpandedCat(prev => prev === id ? null : id);
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
      {/* Decorative subtle ambient gradients */}
      <div className="absolute -top-12 -right-12 w-56 h-56 bg-amber-200/20 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/20 text-brand dark:text-amber-400 flex items-center justify-center font-bold shadow-2xs">
            <PieChart size={24} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                สรุปยอดขายแยกตามหมวดหมู่สินค้า
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {timeframeLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              สัดส่วนรายรับ ยอดขายรวม และสถิติออเดอร์แยกตามประเภทชุดโซล่าเซลล์
            </p>
          </div>
        </div>

        {/* Sort & Header Summary Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[10px] font-bold text-slate-400 px-2 flex items-center">
              <ArrowDownUp size={11} className="mr-1" /> เรียง:
            </span>
            <button
              onClick={() => setSortBy('revenue')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                sortBy === 'revenue'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ยอดเงิน
            </button>
            <button
              onClick={() => setSortBy('count')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                sortBy === 'count'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              จำนวน
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
        <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/50">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
            ยอดขายรวมทั้งหมด
          </span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            ฿{totalSalesRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/50">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
            จำนวนออเดอร์รวม
          </span>
          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {totalSalesCount} <span className="text-xs text-slate-400 font-normal">รายการ</span>
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-800/50">
          <span className="text-[10px] font-black text-brand dark:text-amber-300 uppercase tracking-wider block mb-0.5 flex items-center">
            <Award size={13} className="mr-1 text-amber-500" />
            หมวดขายดีอันดับ 1
          </span>
          <p className="text-sm font-black text-slate-900 dark:text-white truncate">
            {topCategory ? topCategory.name : '-'}
          </p>
          {topCategory && (
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
              ฿{topCategory.revenue.toLocaleString()} ({topCategory.percentage}%)
            </span>
          )}
        </div>
      </div>

      {/* Category List */}
      <div className="relative z-10 space-y-3.5">
        {categoriesData.length > 0 ? (
          categoriesData.map((cat, idx) => {
            const isExpanded = expandedCat === cat.id;
            const hasSubcategories = cat.subcategories.length > 0;

            return (
              <div
                key={cat.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${cat.color.bg} ${cat.color.border}`}
              >
                {/* Main Category Header Row */}
                <div
                  onClick={() => hasSubcategories && toggleExpand(cat.id)}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    hasSubcategories ? 'cursor-pointer select-none hover:opacity-95' : ''
                  }`}
                >
                  {/* Left: Rank, Icon & Name */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-900/10 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className={`w-10 h-10 rounded-xl ${cat.color.iconBg} flex items-center justify-center font-bold shrink-0 shadow-2xs`}>
                      {cat.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-black text-sm tracking-tight truncate ${cat.color.text}`}>
                          {cat.name}
                        </h4>
                        {idx === 0 && cat.revenue > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900 flex items-center shrink-0 shadow-2xs">
                            <Sparkles size={11} className="mr-0.5" /> Best Seller
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {cat.count} ออเดอร์ • เฉลี่ย ฿{cat.avgOrderValue.toLocaleString()}/ชุด
                      </p>
                    </div>
                  </div>

                  {/* Right: Revenue, Percentage & Toggle Icon */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                        ฿{cat.revenue.toLocaleString()}
                      </p>
                      <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${cat.color.badgeBg}`}>
                        {cat.percentage}% ของยอดขาย
                      </span>
                    </div>

                    {hasSubcategories && (
                      <button
                        type="button"
                        className="p-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Smooth Gradient Visual Progress Bar */}
                <div className="px-4 pb-2.5">
                  <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-slate-700/50 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${cat.color.barBg}`}
                      style={{ width: `${Math.min(Math.max(cat.percentage, 3), 100)}%` }}
                    />
                  </div>
                </div>

                {/* Subcategories Unfolded Panel */}
                {isExpanded && hasSubcategories && (
                  <div className="bg-white/80 dark:bg-slate-900/80 border-t border-slate-200/60 dark:border-slate-800 p-3.5 space-y-2 animate-fade-in">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      <BarChart3 size={12} className="mr-1 text-slate-500" />
                      รายละเอียดสเปค/ชุดย่อยในหมวดนี้ ({cat.subcategories.length} รายการ)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {cat.subcategories.map((sub, sIdx) => {
                        const subPct = cat.revenue > 0 ? ((sub.revenue / cat.revenue) * 100).toFixed(1) : 0;
                        return (
                          <div
                            key={sIdx}
                            className="p-2.5 bg-slate-50/90 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 mr-2">
                              <p className="font-bold text-slate-900 dark:text-slate-200 truncate">
                                {sub.name}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {sub.count} ออเดอร์ ({subPct}% ของหมวด)
                              </span>
                            </div>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                              ฿{sub.revenue.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                ยังไม่มีข้อมูลยอดขายใน{timeframeLabel}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                เริ่มบันทึกออเดอร์ขายระบบโซล่าเซลล์เพื่อดูการสรุปสัดส่วนยอดขาย
              </p>
            </div>
            {onQuickAdd && (
              <button
                onClick={() => onQuickAdd('income', 'SOLAR ENERGY STANDARDS')}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-brand dark:hover:bg-amber-600 dark:text-slate-900 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <Sun size={14} />
                <span>+ เพิ่มรายการขายโซล่าเซลล์</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
