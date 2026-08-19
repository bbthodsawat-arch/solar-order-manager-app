import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Sparkles } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { parseISO, subDays } from 'date-fns';

export function FinancialForecasting() {
  const { transactions, loading } = useTransactions();
  const forecast = useMemo(() => {
    const cutoff = subDays(new Date(), 30);
    const recent = transactions.filter(t => parseISO(t.date) >= cutoff);
    const income = recent.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = recent.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    const dailyNet = (income - expense) / 30;
    return { income, expense, projected: dailyNet * 30 };
  }, [transactions]);

  if (loading) return <div className="p-4 rounded-2xl bg-white/70 animate-pulse">กำลังคำนวณประมาณการ...</div>;

  return (
    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex items-center gap-2"><Sparkles size={18} /><h3 className="font-black">ประมาณการกระแสเงินสด</h3></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-4"><div className="flex items-center gap-2 text-emerald-700"><TrendingUp size={16} />รายรับ 30 วัน</div><strong className="text-xl">฿{income.toLocaleString('th-TH')}</strong></div>
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-4"><div className="flex items-center gap-2 text-rose-700"><TrendingDown size={16} />รายจ่าย 30 วัน</div><strong className="text-xl">฿{expense.toLocaleString('th-TH')}</strong></div>
      </div>
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 flex items-center gap-3"><Calendar size={18} /><div><div className="text-xs text-slate-500">คาดการณ์สุทธิใน 30 วันถัดไป</div><strong className="text-lg">฿{projected.toLocaleString('th-TH')}</strong></div></div>
    </section>
  );
}
