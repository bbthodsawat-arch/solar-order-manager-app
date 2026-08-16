import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'motion/react';
import { useChartTheme } from '../hooks/useTheme';

interface ExpensePieChartProps {
  data: { name: string; value: number }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-3.5 text-xs space-y-1.5 transition-colors">
        <div className="flex items-center space-x-2 font-extrabold text-slate-800 dark:text-slate-100">
          <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: item.payload.fill || item.color }} />
          <span>{item.name}</span>
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ยอดรวมค่าใช้จ่าย</div>
        <div className="font-black text-rose-600 dark:text-rose-400 text-sm">
          ฿{Number(item.value).toLocaleString()}
        </div>
      </div>
    );
  }
  return null;
};

export default function ExpensePieChart({ data }: ExpensePieChartProps) {
  const { chartColors } = useChartTheme();
  const colors = chartColors.pieColors;

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xs border border-slate-200/80 dark:border-slate-800 p-5 transition-colors">
        <h3 className="text-slate-900 dark:text-white font-bold mb-4 text-base">สัดส่วนรายจ่ายเดือนนี้</h3>
        <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 transition-colors">
          <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">ยังไม่มีข้อมูลรายจ่ายในเดือนนี้</p>
        </div>
      </div>
    );
  }

  // Custom label to show percentage inside the pie slices
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    // Only show percentage if it's greater than 5% so it doesn't clutter small slices
    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xs border border-slate-200/80 dark:border-slate-800 p-5 transition-colors"
    >
      <h3 className="text-slate-900 dark:text-white font-bold mb-4 text-base">สัดส่วนรายจ่ายเดือนนี้</h3>
      <div className="h-64">
        <ResponsiveContainer key={chartColors.isDarkMode ? 'dark' : 'light'} width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
              formatter={(value: string) => (
                <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
