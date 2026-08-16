import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp, Calendar, Sparkles, Award } from 'lucide-react';
import { useChartTheme } from '../hooks/useTheme';

interface TrendItem {
  date: string;
  income: number;
  expense: number;
  solarRevenue: number;
}

interface SalesTrendChartCardProps {
  trendData: TrendItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as TrendItem;
    const netProfit = data.income - data.expense;

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 text-xs space-y-2 min-w-[200px] transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Calendar size={13} className="text-brand" />
            วันที่ {label}
          </span>
          {data.income > 50000 && (
            <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={10} /> วันขายดี (Busy)
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 font-medium">ยอดขายรวมทั้งหมด:</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">฿{data.income.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 font-medium">ยอดโซล่าเซลล์:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">฿{data.solarRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 font-medium">รายจ่ายประจำวัน:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">฿{data.expense.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-700 dark:text-slate-300 font-bold">กำไรสุทธิรายวัน:</span>
            <span className={`font-black ${netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
              {netProfit >= 0 ? '+' : ''}฿{netProfit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function SalesTrendChartCard({ trendData }: SalesTrendChartCardProps) {
  const [metricView, setMetricView] = useState<'all' | 'solar' | 'profit'>('all');
  const { chartColors } = useChartTheme();

  // Find peak sales day in the last 30 days
  const peakDay = React.useMemo(() => {
    if (!trendData || trendData.length === 0) return null;
    let peak = trendData[0];
    trendData.forEach(d => {
      if (d.income > peak.income) {
        peak = d;
      }
    });
    return peak;
  }, [trendData]);

  const total30DaysIncome = trendData.reduce((sum, d) => sum + d.income, 0);
  const total30DaysSolar = trendData.reduce((sum, d) => sum + d.solarRevenue, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
    >
      {/* Header with Title and Mode Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-slate-900 dark:text-white font-black text-lg sm:text-xl tracking-tight">
                แนวโน้มยอดขายย้อนหลัง 30 วัน (Sales Trend & Busy Periods)
              </h3>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Real-time Analytics
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              วิเคราะห์ช่วงเวลาขายดี ปริมาณรายรับ และยอดขายโซล่าเซลล์เพื่อวางแผนสต็อกสินค้า
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMetricView('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricView === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            รายรับรวม vs รายจ่าย
          </button>
          <button
            onClick={() => setMetricView('solar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricView === 'solar'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            เฉพาะยอดโซล่าเซลล์
          </button>
          <button
            onClick={() => setMetricView('profit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricView === 'profit'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            กำไรสุทธิรายวัน
          </button>
        </div>
      </div>

      {/* Quick Summary Highlights for 30 Days */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
            ฿
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ยอดขายรวม 30 วันล่าสุด</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">฿{total30DaysIncome.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm">
            ☀️
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ยอดโซล่าเซลล์ 30 วัน</p>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400">฿{total30DaysSolar.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
            🔥
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">วันที่ขายดีที่สุด (Peak Day)</p>
            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
              {peakDay ? `${peakDay.date} (฿${peakDay.income.toLocaleString()})` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer key={chartColors.isDarkMode ? 'dark' : 'light'} width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.isDarkMode ? '#334155' : '#e2e8f0'} opacity={0.6} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: chartColors.isDarkMode ? '#94a3b8' : '#64748b' }} 
              stroke={chartColors.isDarkMode ? '#475569' : '#cbd5e1'}
              interval={4}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: chartColors.isDarkMode ? '#94a3b8' : '#64748b' }} 
              stroke={chartColors.isDarkMode ? '#475569' : '#cbd5e1'}
              tickFormatter={(value) => `฿${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}
              formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-bold text-xs">{value}</span>}
            />

            {(metricView === 'all' || metricView === 'profit') && (
              <Area 
                type="monotone" 
                dataKey="income" 
                name="ยอดขายรวม (Income)" 
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorIncome)" 
              />
            )}

            {metricView === 'solar' && (
              <Area 
                type="monotone" 
                dataKey="solarRevenue" 
                name="ยอดขายโซล่าเซลล์ (Solar)" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorSolar)" 
              />
            )}

            {metricView === 'all' && (
              <Area 
                type="monotone" 
                dataKey="expense" 
                name="รายจ่ายประจำวัน (Expense)" 
                stroke="#ef4444" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorExpense)" 
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-2xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
        <div className="flex items-center space-x-2">
          <Award size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-medium">
            <strong>คำแนะนำ:</strong> ช่วงเวลาที่กราฟพุ่งสูงขึ้นแสดงถึงช่วงขายดี (Busy Period) คุณสามารถตรวจสอบรายการออเดอร์ในหน้าประวัติเพื่อดูว่าลูกค้ากลุ่มไหนสั่งซื้อสินค้าประเภทใดมากที่สุด
          </span>
        </div>
      </div>
    </motion.div>
  );
}
