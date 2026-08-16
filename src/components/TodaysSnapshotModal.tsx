import { useMemo } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Wallet, X, Calendar, 
  Plus, CheckCircle2, ShoppingBag, ArrowUpRight, ArrowDownRight, Sun
} from 'lucide-react';
import { Transaction, TransactionType, TransactionCategory } from '../types';

interface TodaysSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onQuickAdd?: (type: TransactionType, category: TransactionCategory) => void;
}

export default function TodaysSnapshotModal({
  isOpen,
  onClose,
  transactions,
  onQuickAdd
}: TodaysSnapshotModalProps) {
  // Calculate today's summary
  const todaySummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    const todayTxs: Transaction[] = [];

    transactions.forEach(t => {
      if (t.date && isToday(parseISO(t.date))) {
        todayTxs.push(t);
        if (t.type === 'income') {
          income += Number(t.amount) || 0;
        } else {
          expense += Number(t.amount) || 0;
        }
      }
    });

    const profit = income - expense;
    const profitMargin = income > 0 ? Math.round((profit / income) * 100) : 0;

    return {
      income,
      expense,
      profit,
      profitMargin,
      todayTxs,
      count: todayTxs.length
    };
  }, [transactions]);

  if (!isOpen) return null;

  const formattedTodayDate = format(new Date(), 'EEEEที่ d MMMM yyyy', { locale: th });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative overflow-hidden"
        >
          {/* Subtle top pastel gradient banner */}
          <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-300 dark:from-emerald-600 dark:via-amber-500 dark:to-rose-600" />

          {/* Modal Header */}
          <div className="flex items-start justify-between pt-1">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <Sun size={14} className="mr-1 text-amber-500" />
                  Today's Snapshot
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                  {format(new Date(), 'dd/MM/yyyy')}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                สรุปยอดขายและรายจ่ายประจำวัน
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center">
                <Calendar size={13} className="mr-1 text-amber-500" />
                {formattedTodayDate}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Core Summary Cards Grid (Pastel Color Scheme) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Mint Green Income Card */}
            <div className="bg-[#e6f4ea] dark:bg-emerald-950/30 p-4 rounded-2xl border border-[#a7f3d0] dark:border-emerald-800/50 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                  รายรับวันนี้
                </span>
                <div className="w-7 h-7 rounded-xl bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <TrendingUp size={15} />
                </div>
              </div>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                ฿{todaySummary.income.toLocaleString()}
              </p>
              <span className="text-[10px] font-semibold text-emerald-800/80 dark:text-emerald-400 mt-1">
                {todaySummary.todayTxs.filter(t => t.type === 'income').length} รายการ
              </span>
            </div>

            {/* Light Pink Expense Card */}
            <div className="bg-[#fce8e6] dark:bg-rose-950/30 p-4 rounded-2xl border border-[#fca5a5] dark:border-rose-800/50 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-rose-800 dark:text-rose-300">
                  รายจ่ายวันนี้
                </span>
                <div className="w-7 h-7 rounded-xl bg-rose-200/80 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold">
                  <TrendingDown size={15} />
                </div>
              </div>
              <p className="text-xl font-black text-rose-700 dark:text-rose-300 tracking-tight">
                ฿{todaySummary.expense.toLocaleString()}
              </p>
              <span className="text-[10px] font-semibold text-rose-800/80 dark:text-rose-400 mt-1">
                {todaySummary.todayTxs.filter(t => t.type === 'expense').length} รายการ
              </span>
            </div>
          </div>

          {/* Purple Pastel Net Profit Banner */}
          <div className="bg-[#f3e8ff] dark:bg-purple-950/30 p-4 rounded-2xl border border-[#ddd6fe] dark:border-purple-800/50 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-200/80 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                <Wallet size={20} />
              </div>
              <div>
                <span className="text-xs font-black text-purple-800 dark:text-purple-300 block">
                  กำไรสุทธิวันนี้ (Net Profit)
                </span>
                <span className="text-xs font-semibold text-purple-700/80 dark:text-purple-400">
                  สัดส่วนกำไรสุทธิ: {todaySummary.profitMargin}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xl font-black tracking-tight ${
                todaySummary.profit >= 0 ? 'text-purple-800 dark:text-purple-300' : 'text-rose-600 dark:text-rose-400'
              }`}>
                ฿{todaySummary.profit.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Today's Transactions List Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center">
                <ShoppingBag size={14} className="mr-1.5 text-amber-500" />
                รายการของวันนี้ ({todaySummary.count})
              </h4>
              {onQuickAdd && (
                <button
                  onClick={() => {
                    onClose();
                    onQuickAdd('income', 'รายได้อื่นๆ');
                  }}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center"
                >
                  <Plus size={13} className="mr-0.5" />
                  เพิ่มรายการวันนี้
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {todaySummary.todayTxs.map((t, idx) => {
                const isInc = t.type === 'income';
                return (
                  <div
                    key={t.id || idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        isInc ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {isInc ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {t.detail || t.category}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {t.category} • {format(parseISO(t.date), 'HH:mm น.')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-black ${
                      isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isInc ? '+' : '-'}฿{Number(t.amount).toLocaleString()}
                    </span>
                  </div>
                );
              })}

              {todaySummary.count === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="font-semibold text-slate-500 dark:text-slate-400">ยังไม่มีรายการบันทึกของวันนี้</p>
                  <p className="text-[11px] text-slate-400">สามารถกดปุ่มเพิ่มรายการใหม่ได้ทันที</p>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold rounded-2xl text-xs transition-all shadow-xs"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
