import { useId } from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

interface SparklineDataPoint {
  date?: string;
  value: number;
}

interface SparklineProps {
  data: SparklineDataPoint[];
  color?: string;
  height?: number;
  label?: string;
}

export default function Sparkline({
  data,
  color = '#10b981',
  height = 36,
  label = 'ยอด'
}: SparklineProps) {
  const gradientId = useId();

  if (!data || data.length === 0) {
    return <div style={{ height }} className="w-full bg-slate-100/50 dark:bg-slate-800/50 rounded-lg animate-pulse" />;
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const point = payload[0].payload as SparklineDataPoint;
                return (
                  <div className="bg-slate-900/95 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl border border-slate-700/80 z-50">
                    {point.date && <div className="text-[9px] text-slate-400 font-medium">{point.date}</div>}
                    <div className="text-emerald-400">{label}: ฿{Number(point.value).toLocaleString()}</div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
