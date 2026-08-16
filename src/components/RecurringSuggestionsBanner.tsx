import { useState } from 'react';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { useTransactions } from '../hooks/useTransactions';
import { RecurringTransaction } from '../types';
import { Calendar, CheckCircle2, ArrowRight, X, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface RecurringSuggestionsBannerProps {
  onQuickAddSuccess?: () => void;
  onEditAndAdd?: (item: RecurringTransaction) => void;
  onOpenManager?: () => void;
}

export default function RecurringSuggestionsBanner({
  onQuickAddSuccess,
  onEditAndAdd,
  onOpenManager
}: RecurringSuggestionsBannerProps) {
  const { transactions, addTransaction } = useTransactions();
  const { getDueRecurringItems } = useRecurringTransactions();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  const dueItems = getDueRecurringItems(transactions, dismissedIds);

  if (dueItems.length === 0) return null;

  const handleQuickAdd = async (item: RecurringTransaction) => {
    if (!item.id) return;
    setAddingId(item.id);
    try {
      await addTransaction({
        date: new Date().toISOString(),
        type: item.type,
        category: item.category,
        detail: item.title + (item.detail ? ` (${item.detail})` : ''),
        amount: Number(item.amount),
        recurringId: item.id
      });
      toast.success(`บันทึกรายการ "${item.title}" เรียบร้อยแล้ว`);
      if (onQuickAddSuccess) onQuickAddSuccess();
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการบันทึกรายการ');
    } finally {
      setAddingId(null);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds([...dismissedIds, id]);
  };

  const currentMonthName = format(new Date(), 'MMMM yyyy', { locale: th });

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-amber-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 p-4 sm:p-5 rounded-3xl border border-amber-500/30 dark:border-amber-500/20 shadow-md mb-6 animate-fade-in space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 animate-pulse">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              รายการประจำเดือนประจำ {currentMonthName}
              <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {dueItems.length} รายการที่ต้องบันทึก
              </span>
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              พบรายการประจำตามรอบบันทึกประจำเดือนที่ยังไม่ได้ถูกบันทึก คุณสามารถกดบันทึกได้ทันที
            </p>
          </div>
        </div>

        {onOpenManager && (
          <button
            onClick={onOpenManager}
            className="hidden sm:inline-flex items-center space-x-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
          >
            <span>ตั้งค่ารายการประจำ</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* List of items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {dueItems.map(item => (
          <div
            key={item.id}
            className="bg-white/90 dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-2.5 transition-all hover:border-amber-300 dark:hover:border-amber-700"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide mb-1 ${
                  item.type === 'income' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {item.type === 'income' ? 'รายรับ' : 'รายจ่าย'} • {item.category}
                </span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  {item.title}
                </h4>
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <Clock size={12} className="text-amber-500" />
                  <span>กำหนดทุกวันที่ {item.dayOfMonth} ของเดือน</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-sm font-black ${
                  item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  ฿{Number(item.amount).toLocaleString()}
                </span>
                <button
                  onClick={() => item.id && handleDismiss(item.id)}
                  className="block text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-1 ml-auto"
                  title="ข้ามคำแนะนำนี้"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <button
                disabled={addingId === item.id}
                onClick={() => handleQuickAdd(item)}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 shadow-xs"
              >
                <CheckCircle2 size={13} />
                <span>{addingId === item.id ? 'กำลังบันทึก...' : 'บันทึกทันที'}</span>
              </button>

              {onEditAndAdd && (
                <button
                  onClick={() => onEditAndAdd(item)}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
                >
                  ปรับแก้ไข
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
