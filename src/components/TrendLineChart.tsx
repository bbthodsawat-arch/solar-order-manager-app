import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useChartTheme } from '../hooks/useTheme';
import { useTransactions } from '../hooks/useTransactions';
import { 
  format, parseISO, subDays, subMonths, eachDayOfInterval, 
  isToday, startOfDay, startOfMonth, endOfMonth 
} from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  Sparkles, AlertCircle, TrendingUp, TrendingDown, 
  DollarSign, Activity, Calendar, LineChart as LineIcon, BarChart2
} from 'lucide-react';

type ChartRange = 'monthly' | '30days' | '7days' | 'today';
type ChartType = 'line' | 'area';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const incomeObj = payload.find((p: any) => p.dataKey === 'income' || p.name === 'รายรับ');
    const expenseObj = payload.find((p: any) => p.dataKey === 'expense' || p.name === 'รายจ่าย');
    const profitObj = payload.find((p: any) => p.dataKey === 'profit' || p.name === 'กำไรสุทธิ');

    const income = incomeObj ? Number(incomeObj.value) || 0 : 0;
    const expense = expenseObj ? Number(expenseObj.value) || 0 : 0;
    const profit = profitObj ? Number(profitObj.value) || 0 : (income - expense);
    const isProfit = profit >= 0;
    const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : '0';

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 min-w-[220px] text-xs space-y-3 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center justify-between">
          <span className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Calendar size={13} className="text-indigo-500" />
            {label}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
            isProfit 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
          }`}>
            {isProfit ? 'กำไร' : 'ขาดทุน'}
          </span>
        </div>

        {/* Highlighted Net Profit */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">กำไรสุทธิ (Net Profit)</span>
            <span className="text-[10px] font-black text-indigo-500">อัตรา {margin}%</span>
          </div>
          <p className={`text-base font-black tracking-tight mt-0.5 ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isProfit ? '+' : ''}฿{profit.toLocaleString()}
          </p>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between space-x-4">
            <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>รายรับ (Revenue):</span>
            </span>
            <span className="font-black text-slate-800 dark:text-slate-100">
              ฿{income.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between space-x-4">
            <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span>รายจ่าย (Expense):</span>
            </span>
            <span className="font-black text-slate-800 dark:text-slate-100">
              ฿{expense.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function TrendLineChart({ data: defaultData }: { data?: any[] }) {
  const { chartColors } = useChartTheme();
  const { transactions, loading } = useTransactions();
  const [range, setRange] = useState<ChartRange>('monthly');
  const [chartType, setChartType] = useState<ChartType>('area');

  // Compute chart data dynamically
  const chartData = useMemo(() => {
    if (loading || transactions.length === 0) {
      return defaultData || [];
    }

    const todayStart = startOfDay(new Date());

    if (range === 'monthly') {
      // Build 12 months array (from 11 months ago up to current month)
      const monthsList = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, 'yyyy-MM');
        const displayDate = format(d, 'MMM yy', { locale: th });
        monthsList.push({ key, displayDate, income: 0, expense: 0, profit: 0 });
      }

      const map: Record<string, typeof monthsList[0]> = {};
      monthsList.forEach(m => { map[m.key] = { ...m }; });

      transactions.forEach(tx => {
        const txDate = parseISO(tx.date);
        const key = format(txDate, 'yyyy-MM');
        const amount = Number(tx.amount) || 0;
        if (map[key]) {
          if (tx.type === 'income') map[key].income += amount;
          else if (tx.type === 'expense') map[key].expense += amount;
          map[key].profit = map[key].income - map[key].expense;
        }
      });

      return Object.values(map);
    }

    if (range === '30days') {
      const thirtyDaysAgo = startOfDay(subDays(new Date(), 29));
      const interval = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() });
      
      const map: Record<string, { date: string; displayDate: string; income: number; expense: number; profit: number }> = {};
      interval.forEach(date => {
        const key = format(date, 'yyyy-MM-dd');
        const displayDate = format(date, 'd MMM', { locale: th });
        map[key] = { date: key, displayDate, income: 0, expense: 0, profit: 0 };
      });

      transactions.forEach(tx => {
        const txDate = parseISO(tx.date);
        const key = format(txDate, 'yyyy-MM-dd');
        if (map[key]) {
          const amount = Number(tx.amount) || 0;
          if (tx.type === 'income') map[key].income += amount;
          else if (tx.type === 'expense') map[key].expense += amount;
          map[key].profit = map[key].income - map[key].expense;
        }
      });

      return Object.values(map).map(item => ({
        displayDate: item.displayDate,
        income: item.income,
        expense: item.expense,
        profit: item.profit
      }));
    }

    if (range === '7days') {
      const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
      const interval = eachDayOfInterval({ start: sevenDaysAgo, end: new Date() });
      
      const map: Record<string, { date: string; displayDate: string; income: number; expense: number; profit: number }> = {};
      interval.forEach(date => {
        const key = format(date, 'yyyy-MM-dd');
        const displayDate = format(date, 'E d MMM', { locale: th });
        map[key] = { date: key, displayDate, income: 0, expense: 0, profit: 0 };
      });

      transactions.forEach(tx => {
        const txDate = parseISO(tx.date);
        const key = format(txDate, 'yyyy-MM-dd');
        if (map[key]) {
          const amount = Number(tx.amount) || 0;
          if (tx.type === 'income') map[key].income += amount;
          else if (tx.type === 'expense') map[key].expense += amount;
          map[key].profit = map[key].income - map[key].expense;
        }
      });

      return Object.values(map).map(item => ({
        displayDate: item.displayDate,
        income: item.income,
        expense: item.expense,
        profit: item.profit
      }));
    }

    if (range === 'today') {
      const todayTxs = transactions
        .filter(tx => isToday(parseISO(tx.date)))
        .reverse();

      if (todayTxs.length === 0) return [];

      let runningIncome = 0;
      let runningExpense = 0;

      return todayTxs.map((tx, idx) => {
        const amount = Number(tx.amount) || 0;
        if (tx.type === 'income') runningIncome += amount;
        else runningExpense += amount;

        const timeStr = tx.date.includes('T') ? format(parseISO(tx.date), 'HH:mm') : '';
        const nameLabel = `#${idx + 1} ${tx.category} ${timeStr ? `(${timeStr})` : ''}`;

        return {
          displayDate: nameLabel,
          income: tx.type === 'income' ? amount : 0,
          expense: tx.type === 'expense' ? amount : 0,
          profit: (tx.type === 'income' ? amount : 0) - (tx.type === 'expense' ? amount : 0)
        };
      });
    }

    return defaultData || [];
  }, [transactions, range, loading, defaultData]);

  // Aggregate summary stats for the active view
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let peakMonthName = '';
    let peakMonthIncome = 0;

    chartData.forEach(d => {
      const inc = d.income || 0;
      const exp = d.expense || 0;
      income += inc;
      expense += exp;
      if (inc > peakMonthIncome) {
        peakMonthIncome = inc;
        peakMonthName = d.displayDate;
      }
    });

    const profit = income - expense;
    const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : '0';

    return { income, expense, profit, margin, peakMonthName, peakMonthIncome };
  }, [chartData]);

  const hasData = chartData.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 transition-all"
    >
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shrink-0">
            <LineIcon size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>แนวโน้มรายรับ - รายจ่าย (Monthly Revenue vs. Expense)</span>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-full text-[10px] font-extrabold uppercase border border-indigo-200 dark:border-indigo-800">
                Recharts Trend
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              กราฟเปรียบเทียบสัดส่วนรายรับ รายจ่าย และผลกำไรรายเดือนแบบเรียลไทม์
            </p>
          </div>
        </div>

        {/* Filter Controls: Range & Chart Type */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                chartType === 'line'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="กราฟเส้น (Line Chart)"
            >
              <LineIcon size={15} />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="กราฟพื้นที่ (Area Chart)"
            >
              <BarChart2 size={15} />
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            {(['monthly', '30days', '7days', 'today'] as const).map((r) => {
              const labels: Record<ChartRange, string> = {
                monthly: 'รายเดือน (12M)',
                '30days': '30 วัน',
                '7days': '7 วัน',
                today: 'วันนี้'
              };
              const isActive = range === r;
              return (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {labels[r]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Numerical KPI Cards Banner */}
      {hasData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">รายรับรวม (Revenue)</span>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
              ฿{summary.income.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider block">รายจ่ายรวม (Expense)</span>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
              ฿{summary.expense.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">กำไรสุทธิ (Net Profit)</span>
            <p className={`text-sm sm:text-base font-black mt-0.5 ${summary.profit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
              ฿{summary.profit.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">เดือนรายรับสูงสุด</span>
            <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5 truncate">
              {summary.peakMonthName || '-'} {summary.peakMonthIncome ? `(฿${summary.peakMonthIncome.toLocaleString()})` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="h-72 relative">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 transition-colors">
            <AlertCircle size={22} className="text-slate-400 dark:text-slate-500 mb-2" />
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">ยังไม่มีข้อมูลรายรับ-รายจ่ายย้อนหลังในระบบ</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.gridColor} />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 10, fill: chartColors.subtextColor, fontWeight: 700 }}
                  tickMargin={10}
                  axisLine={{ stroke: chartColors.gridColor }}
                  tickLine={false}
                  minTickGap={15}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: chartColors.subtextColor, fontWeight: 700 }}
                  tickFormatter={(value) => value >= 1000 ? `฿${(value / 1000).toFixed(0)}k` : `฿${value}`}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: chartColors.gridColor, strokeWidth: 1 }} />
                <Legend 
                  verticalAlign="top"
                  align="right"
                  height={32}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 800, paddingBottom: '10px' }} 
                  formatter={(value: string) => (
                    <span className="text-slate-700 dark:text-slate-300 font-extrabold text-[11px] ml-1">{value}</span>
                  )}
                />
                <Line 
                  type="monotone" 
                  name="รายรับ"
                  dataKey="income" 
                  stroke={chartColors.incomeColor} 
                  strokeWidth={3}
                  dot={{ r: 4, fill: chartColors.incomeColor, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: chartColors.incomeColor, stroke: '#fff', strokeWidth: 3 }}
                  isAnimationActive={true}
                  animationDuration={900}
                />
                <Line 
                  type="monotone" 
                  name="รายจ่าย"
                  dataKey="expense" 
                  stroke={chartColors.expenseColor} 
                  strokeWidth={3}
                  dot={{ r: 4, fill: chartColors.expenseColor, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: chartColors.expenseColor, stroke: '#fff', strokeWidth: 3 }}
                  isAnimationActive={true}
                  animationDuration={900}
                />
                <Line 
                  type="monotone" 
                  name="กำไรสุทธิ"
                  dataKey="profit" 
                  stroke={chartColors.profitColor} 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: chartColors.profitColor }}
                  activeDot={{ r: 6, fill: chartColors.profitColor, stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={900}
                />
              </LineChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.incomeColor} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={chartColors.incomeColor} stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="colorExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.expenseColor} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={chartColors.expenseColor} stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="colorProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.profitColor} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={chartColors.profitColor} stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.gridColor} />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 10, fill: chartColors.subtextColor, fontWeight: 700 }}
                  tickMargin={10}
                  axisLine={{ stroke: chartColors.gridColor }}
                  tickLine={false}
                  minTickGap={15}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: chartColors.subtextColor, fontWeight: 700 }}
                  tickFormatter={(value) => value >= 1000 ? `฿${(value / 1000).toFixed(0)}k` : `฿${value}`}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: chartColors.gridColor, strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                <Legend 
                  verticalAlign="top"
                  align="right"
                  height={32}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 800, paddingBottom: '10px' }} 
                  formatter={(value: string) => (
                    <span className="text-slate-700 dark:text-slate-300 font-extrabold text-[11px] ml-1">{value}</span>
                  )}
                />
                <Area 
                  type="monotone" 
                  name="รายรับ"
                  dataKey="income" 
                  stroke={chartColors.incomeColor} 
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorIncomeGrad)"
                  dot={{ r: 3, fill: chartColors.incomeColor, strokeWidth: 1.5, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: chartColors.incomeColor, stroke: '#fff', strokeWidth: 3 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
                <Area 
                  type="monotone" 
                  name="รายจ่าย"
                  dataKey="expense" 
                  stroke={chartColors.expenseColor} 
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorExpenseGrad)"
                  dot={{ r: 3, fill: chartColors.expenseColor, strokeWidth: 1.5, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: chartColors.expenseColor, stroke: '#fff', strokeWidth: 3 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
                <Area 
                  type="monotone" 
                  name="กำไรสุทธิ"
                  dataKey="profit" 
                  stroke={chartColors.profitColor} 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorProfitGrad)"
                  dot={{ r: 2.5, fill: chartColors.profitColor }}
                  activeDot={{ r: 6, fill: chartColors.profitColor, stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
