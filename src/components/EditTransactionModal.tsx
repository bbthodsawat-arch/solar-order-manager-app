import { useState, useEffect, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Tag as TagIcon, Plus, X, StickyNote, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { useAppConfig } from '../hooks/useAppConfig';
import { Transaction, TransactionType, TransactionCategory, ThaiProvinces, SaleOrderSets, SaleOrderAmps, SaleOrderSystems, BatteryOptions, CombinerOptions } from '../types';
import { format, parseISO } from 'date-fns';
import ReceiptCapture from './ReceiptCapture';
import { motion } from 'motion/react';
import { notifyReaction } from '../utils/feedback';
import SpeechDictationButton from './SpeechDictationButton';
import { suggestCategory } from '../utils/categorySuggestions';

interface EditTransactionModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'createdBy'>>) => Promise<void>;
}

const formatNumberInput = (val: string) => {
  let cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
  if (cleaned) {
    const p = cleaned.split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return p.join('.');
  }
  return cleaned;
};

export default function EditTransactionModal({ transaction, isOpen, onClose, onSave }: EditTransactionModalProps) {
  const { config, paymentMethods, paymentStatuses } = useAppConfig();
  const [loading, setLoading] = useState(false);
  
  const incomeCategories = config.incomeCategories.filter(c => c.isActive);
  const expenseCategories = config.expenseCategories.filter(c => c.isActive);
  
  const [transactionType, setTransactionType] = useState<TransactionType>(transaction.type);
  const [date, setDate] = useState(format(parseISO(transaction.date), "yyyy-MM-dd'T'HH:mm"));
  const [category, setCategory] = useState<TransactionCategory>(transaction.category);
  const [subcategory, setSubcategory] = useState<string>(transaction.subcategory || '');
  const [detail, setDetail] = useState(transaction.detail || '');
  const [notes, setNotes] = useState(transaction.notes || '');
  const [amount, setAmount] = useState(formatNumberInput(transaction.amount.toString()));
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(transaction.receiptUrl);
  const [tags, setTags] = useState<string[]>(transaction.tags || []);
  const [tagInput, setTagInput] = useState('');

  const categories = transactionType === 'income' ? incomeCategories : expenseCategories;
  const currentCategoryObj = categories.find(c => c.name === category);
  const subcategories = currentCategoryObj?.subcategories?.filter(s => s.isActive) || [];

  const handleAddTag = (tagToAdd?: string) => {
    const val = (tagToAdd || tagInput).trim().replace(/^#/, '');
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      if (!tagToAdd) setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Sale Order States
  const [soSet, setSoSet] = useState(transaction.saleOrderDetails?.setOption || SaleOrderSets[0]);
  const [soAmp, setSoAmp] = useState(transaction.saleOrderDetails?.ampOption || SaleOrderAmps[0]);
  const [soSystem, setSoSystem] = useState(transaction.saleOrderDetails?.systemOption || SaleOrderSystems[0]);
  const [soSolarPanelCount, setSoSolarPanelCount] = useState<number>(transaction.saleOrderDetails?.solarPanelCount || 0);
  const [soBatOption, setSoBatOption] = useState(transaction.saleOrderDetails?.batteryOption || BatteryOptions[0].label);
  const [soCombinerOption, setSoCombinerOption] = useState(transaction.saleOrderDetails?.combinerOption || CombinerOptions[0].label);
  const [soCustomerName, setSoCustomerName] = useState(transaction.saleOrderDetails?.customerName || '');
  const [soCustomerAddress, setSoCustomerAddress] = useState(transaction.saleOrderDetails?.customerAddress || '');
  const [soDistrict, setSoDistrict] = useState(transaction.saleOrderDetails?.district || '');
  const [soProvince, setSoProvince] = useState(transaction.saleOrderDetails?.province || ThaiProvinces[0]);
  const [soZipcode, setSoZipcode] = useState(transaction.saleOrderDetails?.zipcode || '');
  const [soPhoneNumber, setSoPhoneNumber] = useState(transaction.saleOrderDetails?.phoneNumber || '');
  const [soShippingStatus, setSoShippingStatus] = useState<string>(transaction.saleOrderDetails?.shippingStatus || 'สั่งซื้อแล้ว');
  const [soDeliveryDate, setSoDeliveryDate] = useState(transaction.saleOrderDetails?.deliveryDate ? format(parseISO(transaction.saleOrderDetails.deliveryDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [soPaymentStatus, setSoPaymentStatus] = useState<string>(transaction.saleOrderDetails?.paymentStatus || paymentStatuses[1] || 'unpaid');
  const [soPaymentMethod, setSoPaymentMethod] = useState<string>(transaction.saleOrderDetails?.paymentMethod || transaction.paymentMethod || paymentMethods[0] || 'เงินสด');
  const [soPaymentDate, setSoPaymentDate] = useState(transaction.saleOrderDetails?.paymentReceivedDate ? format(parseISO(transaction.saleOrderDetails.paymentReceivedDate), "yyyy-MM-dd") : '');
  const [soNote, setSoNote] = useState(transaction.saleOrderDetails?.note || '');

  useEffect(() => {
    if (isOpen) {
      setTransactionType(transaction.type);
      setDate(format(parseISO(transaction.date), "yyyy-MM-dd'T'HH:mm"));
      setCategory(transaction.category);
      setSubcategory(transaction.subcategory || '');
      setDetail(transaction.detail || '');
      setAmount(formatNumberInput(transaction.amount.toString()));
      setReceiptUrl(transaction.receiptUrl);
      setTags(transaction.tags || []);
      setNotes(transaction.notes || '');
      setSoPaymentMethod(transaction.saleOrderDetails?.paymentMethod || transaction.paymentMethod || paymentMethods[0] || 'เงินสด');
      
      if (transaction.saleOrderDetails) {
        if (transaction.saleOrderDetails.setOption) setSoSet(transaction.saleOrderDetails.setOption);
        if (transaction.saleOrderDetails.ampOption) setSoAmp(transaction.saleOrderDetails.ampOption);
        if (transaction.saleOrderDetails.systemOption) setSoSystem(transaction.saleOrderDetails.systemOption);
        if (transaction.saleOrderDetails.solarPanelCount !== undefined) setSoSolarPanelCount(transaction.saleOrderDetails.solarPanelCount);
        if (transaction.saleOrderDetails.batteryOption) setSoBatOption(transaction.saleOrderDetails.batteryOption);
        if (transaction.saleOrderDetails.combinerOption) setSoCombinerOption(transaction.saleOrderDetails.combinerOption);
        setSoCustomerName(transaction.saleOrderDetails.customerName);
        setSoCustomerAddress(transaction.saleOrderDetails.customerAddress || '');
        setSoDistrict(transaction.saleOrderDetails.district || '');
        setSoProvince(transaction.saleOrderDetails.province);
        setSoZipcode(transaction.saleOrderDetails.zipcode || '');
        setSoPhoneNumber(transaction.saleOrderDetails.phoneNumber || '');
        setSoShippingStatus(transaction.saleOrderDetails.shippingStatus || 'สั่งซื้อแล้ว');
        setSoDeliveryDate(format(parseISO(transaction.saleOrderDetails.deliveryDate), "yyyy-MM-dd"));
        setSoPaymentStatus(transaction.saleOrderDetails.paymentStatus);
        setSoPaymentDate(transaction.saleOrderDetails.paymentReceivedDate ? format(parseISO(transaction.saleOrderDetails.paymentReceivedDate), "yyyy-MM-dd") : '');
        setSoNote(transaction.saleOrderDetails.note || '');
      }
    }
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCategory: TransactionCategory) => {
    setCategory(newCategory);
    setSubcategory('');
    if (newCategory === 'แบตเตอรี่') {
      const opt = BatteryOptions.find(o => o.label === soBatOption);
      if (opt) setAmount(formatNumberInput(opt.price.toString()));
    } else if (newCategory === 'ตู้คอมบายเนอร์+อินเวอร์เตอร์') {
      const opt = CombinerOptions.find(o => o.label === soCombinerOption);
      if (opt) setAmount(formatNumberInput(opt.price.toString()));
    }
  };

  const handleBatChange = (val: string) => {
    setSoBatOption(val);
    const opt = BatteryOptions.find(o => o.label === val);
    if (opt) setAmount(formatNumberInput(opt.price.toString()));
  };

  const handleCombinerChange = (val: string) => {
    setSoCombinerOption(val);
    const opt = CombinerOptions.find(o => o.label === val);
    if (opt) setAmount(formatNumberInput(opt.price.toString()));
  };

  const handleTypeChange = (newType: TransactionType) => {
    setTransactionType(newType);
    const newCats = newType === 'income' ? incomeCategories : expenseCategories;
    setCategory(newCats[0]?.name || (newType === 'income' ? 'รายได้อื่นๆ' : 'ค่าใช้จ่ายอื่นๆ'));
    setSubcategory('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount.replace(/,/g, '')))) return notifyReaction('warning', 'กรุณากรอกจำนวนเงินให้ถูกต้อง');
    const isSale = ['รายรับจาก Sale order', 'แบตเตอรี่', 'ตู้คอมบายเนอร์+อินเวอร์เตอร์'].includes(category);
    if (isSale && !soCustomerName) return notifyReaction('warning', 'กรุณากรอกชื่อลูกค้า');
    
    setLoading(true);
    try {
      const saleOrderDetails = isSale ? {
        ...(category === 'รายรับจาก Sale order' ? { setOption: soSet, ampOption: soAmp, systemOption: soSystem, solarPanelCount: soSolarPanelCount } : {}),
        ...(category === 'แบตเตอรี่' ? { batteryOption: soBatOption } : {}),
        ...(category === 'ตู้คอมบายเนอร์+อินเวอร์เตอร์' ? { combinerOption: soCombinerOption } : {}),
        customerName: soCustomerName,
        customerAddress: soCustomerAddress,
        district: soDistrict,
        province: soProvince,
        zipcode: soZipcode,
        phoneNumber: soPhoneNumber,
        shippingStatus: soShippingStatus as any,
        deliveryDate: new Date(soDeliveryDate).toISOString(),
        paymentStatus: soPaymentStatus,
        paymentReceivedDate: (soPaymentStatus === 'paid' || soPaymentStatus === 'ชำระแล้ว') && soPaymentDate ? new Date(soPaymentDate).toISOString() : undefined,
        paymentMethod: soPaymentMethod,
        note: soNote,
      } : undefined;

      await onSave(transaction.id!, {
        date: new Date(date).toISOString(),
        type: transactionType,
        category,
        subcategory: subcategory || undefined,
        detail: isSale ? `${soCustomerName} (${soProvince})` : detail,
        amount: Number(amount.replace(/,/g, '')),
        receiptUrl,
        paymentMethod: soPaymentMethod,
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : [],
        ...(saleOrderDetails ? { saleOrderDetails } : {})
      });
      notifyReaction('success', 'บันทึกการแก้ไขรายการเรียบร้อยแล้ว!');
      onClose();
    } catch (err) {
      console.error(err);
      notifyReaction('error', 'เกิดข้อผิดพลาดในการแก้ไขรายการ');
    } finally {
      setLoading(false);
    }
  };

  const suggestedCat = suggestCategory(detail, transactionType);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <motion.form 
        onSubmit={handleSubmit}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-2xl h-full flex flex-col shadow-2xl transition-colors overflow-hidden border-l border-slate-200/80 dark:border-slate-800/80 z-50"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <span className="p-1.5 bg-brand-soft text-brand rounded-xl">
                <Sparkles size={16} />
              </span>
              <span>แก้ไขรายละเอียดรายการ</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Transaction Record (Slide-Over)</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Type Toggle */}
            <div className="flex rounded-xl p-1 bg-gray-100 dark:bg-gray-700 transition-colors">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                  transactionType === 'income' ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                รายรับ
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                  transactionType === 'expense' ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                รายจ่าย
              </button>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">วันที่และเวลา</label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
              />
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">หมวดหมู่หลัก</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as TransactionCategory)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  หมวดหมู่ย่อย {subcategories.length === 0 && <span className="text-[10px] text-gray-400 font-normal">(ไม่มี)</span>}
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  disabled={subcategories.length === 0}
                  className={`w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium ${subcategories.length === 0 ? 'opacity-50 grayscale' : ''}`}
                >
                  <option value="">-- เลือกหมวดหมู่ย่อย --</option>
                  {subcategories.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {['รายรับจาก Sale order', 'แบตเตอรี่', 'ตู้คอมบายเนอร์+อินเวอร์เตอร์'].includes(category) && (
              <div className="space-y-4 p-5 border border-blue-100 dark:border-blue-900/60 rounded-3xl bg-blue-50/30 dark:bg-blue-900/10">
                <h3 className="font-bold text-blue-800 dark:text-blue-400 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>รายละเอียดการขาย (Sale Data)</span>
                </h3>
                
                {category === 'รายรับจาก Sale order' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">ชุด</label>
                      <select value={soSet} onChange={e => setSoSet(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none font-medium">
                        {SaleOrderSets.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">แอมป์</label>
                      <select value={soAmp} onChange={e => setSoAmp(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none font-medium">
                        {SaleOrderAmps.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">ระบบ</label>
                      <select value={soSystem} onChange={e => setSoSystem(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none font-medium">
                        {SaleOrderSystems.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">จำนวนแผง</label>
                      <input
                        type="number"
                        min="0"
                        value={soSolarPanelCount || ''}
                        onChange={e => setSoSolarPanelCount(e.target.value === '' ? 0 : Number(e.target.value))}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none font-medium"
                      />
                    </div>
                  </div>
                )}

                {category === 'แบตเตอรี่' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">รุ่นแบตเตอรี่</label>
                    <select value={soBatOption} onChange={e => handleBatChange(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none font-medium">
                      {BatteryOptions.map(b => <option key={b.label} value={b.label}>{b.label} ({b.price.toLocaleString()} บ.)</option>)}
                    </select>
                  </div>
                )}

                {category === 'ตู้คอมบายเนอร์+อินเวอร์เตอร์' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">รุ่นตู้คอมบายเนอร์</label>
                    <select value={soCombinerOption} onChange={e => handleCombinerChange(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none font-medium">
                      {CombinerOptions.map(c => <option key={c.label} value={c.label}>{c.label} ({c.price.toLocaleString()} บ.)</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">ชื่อลูกค้า *</label>
                    <input required type="text" value={soCustomerName} onChange={e => setSoCustomerName(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">เบอร์โทรศัพท์</label>
                    <input type="tel" value={soPhoneNumber} onChange={e => setSoPhoneNumber(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none font-medium" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">ที่อยู่</label>
                  <textarea value={soCustomerAddress} onChange={e => setSoCustomerAddress(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none font-medium h-16 resize-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">เขต/อำเภอ</label>
                    <input type="text" value={soDistrict} onChange={e => setSoDistrict(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">จังหวัด</label>
                    <select value={soProvince} onChange={e => setSoProvince(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none font-medium">
                      {ThaiProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">รหัสไปรษณีย์</label>
                    <input type="text" value={soZipcode} onChange={e => setSoZipcode(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none font-medium" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">วันที่จัดส่ง</label>
                    <input type="date" value={soDeliveryDate} onChange={e => setSoDeliveryDate(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">สถานะจัดส่ง</label>
                    <select value={soShippingStatus} onChange={e => setSoShippingStatus(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none font-medium">
                      <option value="สั่งซื้อแล้ว">สั่งซื้อแล้ว</option>
                      <option value="กำลังประกอบ">กำลังประกอบ</option>
                      <option value="กำลังขนส่ง">กำลังขนส่ง</option>
                      <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">สถานะชำระเงิน</label>
                    <select value={soPaymentStatus} onChange={e => setSoPaymentStatus(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none font-medium">
                      {paymentStatuses.map(s => <option key={s} value={s}>{s === 'paid' ? 'ชำระแล้ว' : s === 'unpaid' ? 'ยังไม่ชำระ' : s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">รูปแบบชำระเงิน</label>
                    <select value={soPaymentMethod} onChange={e => setSoPaymentMethod(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none font-medium">
                      {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                {soPaymentStatus === 'paid' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">วันที่ได้รับเงิน</label>
                    <input type="date" value={soPaymentDate} onChange={e => setSoPaymentDate(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm outline-none font-medium" />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">หมายเหตุ</label>
                    <SpeechDictationButton
                      currentValue={soNote}
                      onTranscript={(text) => setSoNote(text)}
                      title="พูดบันทึกหมายเหตุการขาย"
                    />
                  </div>
                  <input type="text" value={soNote} onChange={e => setSoNote(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none font-medium" />
                </div>
              </div>
            )}

            {!['รายรับจาก Sale order', 'แบตเตอรี่', 'ตู้คอมบายเนอร์+อินเวอร์เตอร์'].includes(category) && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">รายละเอียดรายการ</label>
                    <SpeechDictationButton
                      currentValue={detail}
                      onTranscript={(text) => setDetail(text)}
                      title="พูดบันทึกรายละเอียดรายการ"
                    />
                  </div>
                  <input
                    type="text"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                  />

                  {suggestedCat && suggestedCat !== category && (
                    <div className="mt-2 flex items-center justify-between bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800/60 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-blue-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300">
                          แนะนำหมวดหมู่: <span className="font-black">"{suggestedCat}"</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCategory(suggestedCat);
                          notifyReaction('success', 'เปลี่ยนหมวดหมู่อัตโนมัติแล้ว');
                        }}
                        className="px-2.5 py-1 text-[10px] font-black bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        ใช้หมวดหมู่นี้
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">รูปแบบการชำระเงิน</label>
                  <select
                    value={soPaymentMethod}
                    onChange={(e) => setSoPaymentMethod(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                  >
                    {paymentMethods.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Tags (Optional) */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                <TagIcon size={16} className="text-blue-500" />
                <span>แท็กอ้างอิง (Tags)</span>
              </label>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="พิมพ์แท็ก..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  เพิ่ม
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold"
                    >
                      <span>#{t}</span>
                      <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-500">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Notes / Annotation */}
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                  <StickyNote size={14} className="text-amber-500" />
                  <span>บันทึกช่วยจำสำหรับรายการนี้ (Quick Note)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <SpeechDictationButton
                    currentValue={notes}
                    onTranscript={(text) => setNotes(text)}
                    title="พูดถอดความบันทึกช่วยจำ"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">{notes.length}/300</span>
                </div>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ระบุข้อความช่วยจำสั้นๆ สำหรับรายการนี้ (เช่น หักเงินมัดจำแล้ว, รอสลิปโอน, ลูกค้าแจ้งเลื่อนส่ง)"
                maxLength={300}
                rows={2}
                className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 rounded-xl outline-none focus:border-amber-500 text-slate-900 dark:text-white placeholder-slate-400 font-medium resize-none"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['หักมัดจำล่วงหน้าแล้ว', 'รอใบกำกับภาษี', 'ส่งมอบเรียบร้อย', 'ลูกค้าจ่ายสด', 'ช่างขอเบิกล่วงหน้า', 'รอสลิปโอน'].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setNotes(prev => prev ? `${prev} • ${sug}` : sug)}
                    className="px-2 py-0.5 rounded-lg text-[10.5px] font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all cursor-pointer shadow-3xs"
                  >
                    +{sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Receipt Photo */}
            <ReceiptCapture receiptUrl={receiptUrl} onChange={setReceiptUrl} />

            {/* Amount */}
            <div className="pt-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 text-center">จำนวนเงินสุทธิ</label>
              <div className="relative flex items-center max-w-[300px] mx-auto">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={amount}
                  onChange={(e) => setAmount(formatNumberInput(e.target.value))}
                  className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-6 py-4 text-2xl font-black text-center focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
                <span className="absolute right-6 text-slate-400 font-bold">฿</span>
              </div>
            </div>

        </div> {/* Close Scrollable Form Body */}

        {/* Locked Footer */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800/80 rounded-2xl font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-2xs active:scale-95"
          >
            <XCircle size={17} className="text-slate-400" />
            <span>ยกเลิก</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl transition-all shadow-lg shadow-blue-600/25 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                <span>บันทึกการแก้ไข</span>
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
