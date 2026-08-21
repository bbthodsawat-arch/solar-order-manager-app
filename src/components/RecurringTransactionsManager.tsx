import { useState, FormEvent } from 'react';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { useCategories } from '../hooks/useCategories';
import { RecurringTransaction, TransactionType, TransactionCategory } from '../types';
import { Plus, Trash2, Edit3, X, Calendar, Check, Power, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RecurringTransactionsManagerProps {
  onClose?: () => void;
}

const PRESETS = [
  { title: 'ค่าไฟฟ้าประจำเดือน', type: 'expense' as TransactionType, category: 'ค่าใช้จ่ายอื่นๆ' as TransactionCategory, amount: 3500, dayOfMonth: 25 },
  { title: 'ค่าเช่าร้าน/สถานที่', type: 'expense' as TransactionType, category: 'ค่าใช้จ่ายอื่นๆ' as TransactionCategory, amount: 15000, dayOfMonth: 1 },
  { title: 'ค่าอินเทอร์เน็ต', type: 'expense' as TransactionType, category: 'ค่าใช้จ่ายอื่นๆ' as TransactionCategory, amount: 890, dayOfMonth: 15 },
  { title: 'ค่าจ้างแอดมินประจำเดือน', type: 'expense' as TransactionType, category: 'ค่าจ้างแอดมิน' as TransactionCategory, amount: 12000, dayOfMonth: 30 },
  { title: 'ค่าโฆษณาเพจประจำเดือน', type: 'expense' as TransactionType, category: 'ค่าโฆษณา' as TransactionCategory, amount: 5000, dayOfMonth: 5 },
];

export default function RecurringTransactionsManager({ onClose }: RecurringTransactionsManagerProps) {
  const { recurringTransactions, loading, addRecurring, updateRecurring, deleteRecurring } = useRecurringTransactions();
  const { incomeCategories, expenseCategories } = useCategories();

  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>(expenseCategories[0] || 'ค่าใช้จ่ายอื่นๆ');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openForm = (item?: RecurringTransaction) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setType(item.type);
      setCategory(item.category);
      setAmount(item.amount.toString());
      setDayOfMonth(item.dayOfMonth ?? 1);
      setDetail(item.detail || '');
    } else {
      setEditingItem(null);
      setTitle('');
      setType('expense');
      setCategory(expenseCategories[0] || 'ค่าใช้จ่ายอื่นๆ');
      setAmount('');
      setDayOfMonth(1);
      setDetail('');
    }
    setIsAdding(true);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setEditingItem(null);
    setTitle(preset.title);
    setType(preset.type);
    setCategory(preset.category);
    setAmount(preset.amount.toString());
    setDayOfMonth(preset.dayOfMonth);
    setDetail('');
    setIsAdding(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('กรุณาระบุชื่อรายการประจำ');
    if (!amount || isNaN(Number(amount))) return toast.error('กรุณาระบุจำนวนเงินให้ถูกต้อง');
    if (dayOfMonth < 1 || dayOfMonth > 31) return toast.error('วันที่ต้องอยู่ระหว่าง 1 - 31');

    setSubmitting(true);
    try {
      if (editingItem && editingItem.id) {
        await updateRecurring(editingItem.id, {
          title,
          type,
          category,
          amount: Number(amount),
          dayOfMonth,
          detail
        });
        toast.success('อัปเดตรายการประจำสำเร็จ');
      } else {
        await addRecurring({
          title,
          type,
          category,
          amount: Number(amount),
          dayOfMonth,
          detail,
          isActive: true
        });
        toast.success('เพิ่มรายการประจำสำเร็จ');
      }
      setIsAdding(false);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: RecurringTransaction) => {
    if (!item.id) return;
    try {
      await updateRecurring(item.id, { isActive: !item.isActive });
      toast.success(item.isActive ? 'ปิดการแจ้งเตือนรายการนี้แล้ว' : 'เปิดการแจ้งเตือนรายการนี้แล้ว');
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการประจำนี้?')) {
      try {
        await deleteRecurring(id);
        toast.success('ลบรายการประจำเรียบร้อยแล้ว');
      } catch (e) {
        toast.error('เกิดข้อผิดพลาดในการลบ');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">ตั้งค่ารายการประจำเดือน (Recurring)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">กำหนดค่าใช้จ่าย/รายรับที่ต้องบันทึกเป็นประจำทุกเดือน</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Form or Add Button */}
      {!isAdding ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ระบบจะแสดงการแจ้งเตือนเตือนความจำให้อนุมัติบันทึกอัตโนมัติเมื่อถึงวันที่กำหนด
            </p>
            <button
              onClick={() => openForm()}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 shrink-0"
            >
              <Plus size={16} />
              <span>เพิ่มรายการประจำ</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              ตัวอย่างรายการยอดนิยม (คลิกเพื่อเพิ่มด่วน)
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5"
                >
                  <Plus size={12} />
                  <span>{preset.title} (ทุกวันที่ {preset.dayOfMonth})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {editingItem ? 'แก้ไขรายการประจำ' : 'สร้างรายการประจำใหม่'}
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อรายการประจำ *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="เช่น ค่าไฟฟ้าประจำเดือน, ค่าเช่าร้าน"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ประเภทรายการ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    setCategory(incomeCategories[0] || 'รายได้อื่นๆ');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    type === 'income'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  รายรับ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    setCategory(expenseCategories[0] || 'ค่าใช้จ่ายอื่นๆ');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    type === 'expense'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  รายจ่าย
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                หมวดหมู่
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TransactionCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {(type === 'income' ? incomeCategories : expenseCategories).map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                จำนวนเงินประจำ (บาท) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Day of Month */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                กำหนดบันทึกทุกวันที่เท่าไรของเดือน (1 - 31) *
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={e => setDayOfMonth(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Detail */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                รายละเอียดเพิ่มเติม (ถ้ามี)
              </label>
              <input
                type="text"
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="คำอธิบายเพิ่มเติมสำหรับการบันทึก"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setIsAdding(false)}
              className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
            >
              {submitting ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <>
                  <Check size={14} />
                  <span>บันทึกตั้งค่า</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Recurring Items List */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          รายการประจำทั้งหมด ({recurringTransactions.length} รายการ)
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">กำลังโหลดข้อมูล...</div>
        ) : recurringTransactions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
            <AlertCircle size={28} className="mx-auto text-slate-400" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">ยังไม่มีรายการประจำเดือนที่บันทึกไว้</p>
            <p className="text-[11px] text-slate-400">กดปุ่ม "เพิ่มรายการประจำ" หรือเลือกรายการยอดนิยมด้านบนเพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recurringTransactions.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex justify-between items-start ${
                  item.isActive
                    ? 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/60 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.type === 'income'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {item.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      ทุกวันที่ {item.dayOfMonth} ของเดือน
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.title}
                  </h4>

                  <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    ฿{Number(item.amount).toLocaleString()}
                    <span className="text-[11px] font-normal text-slate-400 ml-1">({item.category})</span>
                  </p>

                  {item.detail && (
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{item.detail}</p>
                  )}
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`p-2 rounded-xl transition-colors ${
                      item.isActive
                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                        : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title={item.isActive ? 'เปิดใช้งานอยู่ (คลิกเพื่อปิด)' : 'ปิดการใช้งานอยู่ (คลิกเพื่อเปิด)'}
                  >
                    <Power size={16} />
                  </button>
                  <button
                    onClick={() => openForm(item)}
                    className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                    title="แก้ไข"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => item.id && handleDelete(item.id)}
                    className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="ลบ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
