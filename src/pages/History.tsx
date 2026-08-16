import { useState, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../hooks/useAuth';
import { useActionHistory } from '../hooks/useActionHistory';
import { getUserPermissions } from '../utils/permissions';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, subDays, startOfYear } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  Filter, Cloud, CloudOff, RefreshCw, CheckCircle2, Wifi, WifiOff, 
  TrendingUp, TrendingDown, Wallet, Calendar, AlertTriangle, Trash2, 
  X, Search, CheckSquare, Square, MoreVertical, Trash, History as HistoryIcon, 
  RotateCcw, Tag, Package, Layers, SlidersHorizontal, Rows3, ListCollapse, Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Transaction, PaymentStatus } from '../types';
import EditTransactionModal from '../components/EditTransactionModal';
import SwipeableTransactionItem from '../components/SwipeableTransactionItem';
import RecentActionsFeed from '../components/RecentActionsFeed';
import ReceiptGenerator from '../components/ReceiptGenerator';
import QuickPrintModal from '../components/QuickPrintModal';
import SimplifiedReceiptModal from '../components/SimplifiedReceiptModal';
import { useAppConfig } from '../hooks/useAppConfig';
import { notifyReaction } from '../utils/feedback';
import { AnimatePresence } from 'motion/react';

export default function History() {
  const { appUser } = useAuth();
  const { config, displayDensity, updateDisplayDensity } = useAppConfig();
  const userPerms = getUserPermissions(appUser);
  const { transactions, loading, pendingCount, deleteTransaction, updateTransaction, restoreTransaction, addTransaction } = useTransactions();
  
  const { history, addAction, undoAction, clearHistory } = useActionHistory(
    addTransaction,
    deleteTransaction,
    updateTransaction,
    restoreTransaction
  );

  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [showFilters, setShowFilters] = useState(false);
  const [showRecentActions, setShowRecentActions] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  const [quickPrintTransaction, setQuickPrintTransaction] = useState<Transaction | null>(null);
  const [simplifiedReceiptTransaction, setSimplifiedReceiptTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter States
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterProductSet, setFilterProductSet] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<PaymentStatus | 'all'>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'date' | 'category'>('category');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  const handleTogglePaymentStatus = async (tx: Transaction) => {
    if (!tx.id || !tx.saleOrderDetails) return;
    const currentStatus = tx.saleOrderDetails.paymentStatus;
    const newStatus: PaymentStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    
    try {
      await updateTransaction(tx.id, {
        saleOrderDetails: {
          ...tx.saleOrderDetails,
          paymentStatus: newStatus,
          paymentReceivedDate: newStatus === 'paid' ? format(new Date(), 'yyyy-MM-dd') : undefined
        }
      });
      addAction({
        type: 'UPDATE',
        transactionId: tx.id,
        previousData: { saleOrderDetails: tx.saleOrderDetails },
        newData: { saleOrderDetails: { ...tx.saleOrderDetails, paymentStatus: newStatus } }
      });
      notifyReaction('success', `อัปเดตเป็น ${newStatus === 'paid' ? 'ชำระแล้ว (Paid)' : 'ยังไม่ชำระ (Unpaid)'} เรียบร้อย`);
    } catch (error) {
      notifyReaction('error', 'อัปเดตไม่สำเร็จ');
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 pb-8">
        {/* Header Controls Skeleton */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
              <div className="h-9 w-28 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
            </div>
          </div>

          {/* Search Bar & Date Pickers Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>

        {/* Filters Panel Skeleton (Simulating toggle states if needed) */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
          ))}
        </div>

        {/* Transactions list rows skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-4 w-2/3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0"></div>
                <div className="space-y-2 w-full">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allTags = Array.from(
    new Set(transactions.flatMap(t => t.tags || []))
  );

  const categoriesPresent = Array.from(
    new Set(transactions.map(t => t.category).filter(Boolean))
  ).sort();

  const incomeCategoriesPresent = Array.from(
    new Set(transactions.filter(t => t.type === 'income').map(t => t.category).filter(Boolean))
  ).sort();

  const expenseCategoriesPresent = Array.from(
    new Set(transactions.filter(t => t.type === 'expense').map(t => t.category).filter(Boolean))
  ).sort();

  const productSetsPresent = Array.from(
    new Set([
      ...(config.standardSets?.map(s => s.name) || []),
      ...(transactions.map(t => t.saleOrderDetails?.setOption).filter(Boolean) as string[])
    ])
  ).sort();

  const activeFiltersCount = [
    filterType !== 'all',
    filterCategory !== 'all',
    filterProductSet !== 'all',
    filterPayment !== 'all',
    filterTag !== 'all',
    searchQuery.trim() !== ''
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setFilterProductSet('all');
    setFilterPayment('all');
    setFilterTag('all');
    setSearchQuery('');
    setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  };

  const setPresetDateRange = (preset: 'thisMonth' | 'lastMonth' | 'last7' | 'last30' | 'thisYear' | 'all') => {
    const now = new Date();
    if (preset === 'thisMonth') {
      setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    } else if (preset === 'lastMonth') {
      const prev = subMonths(now, 1);
      setStartDate(format(startOfMonth(prev), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(prev), 'yyyy-MM-dd'));
    } else if (preset === 'last7') {
      setStartDate(format(subDays(now, 6), 'yyyy-MM-dd'));
      setEndDate(format(now, 'yyyy-MM-dd'));
    } else if (preset === 'last30') {
      setStartDate(format(subDays(now, 29), 'yyyy-MM-dd'));
      setEndDate(format(now, 'yyyy-MM-dd'));
    } else if (preset === 'thisYear') {
      setStartDate(format(startOfYear(now), 'yyyy-MM-dd'));
      setEndDate(format(now, 'yyyy-MM-dd'));
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate(format(now, 'yyyy-MM-dd'));
    }
  };

  // Filter by selected date range, type, category, product set, payment status, tag, and search query
  const filteredTransactions = transactions.filter(tx => {
    const txDate = parseISO(tx.date);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const isWithinDate = txDate >= start && txDate <= end;
    const isTypeMatch = filterType === 'all' || tx.type === filterType;
    const isCategoryMatch = filterCategory === 'all' || tx.category === filterCategory;
    const isProductSetMatch = filterProductSet === 'all' || 
      (tx.saleOrderDetails?.setOption && tx.saleOrderDetails.setOption === filterProductSet) ||
      (tx.detail && tx.detail.toLowerCase().includes(filterProductSet.toLowerCase()));
    
    const isPaymentMatch = filterPayment === 'all' || 
      (tx.saleOrderDetails?.paymentStatus === filterPayment);

    const isTagMatch = filterTag === 'all' || (tx.tags && tx.tags.includes(filterTag));

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const isQueryMatch = !normalizedQuery || 
      (tx.category && tx.category.toLowerCase().includes(normalizedQuery)) ||
      (tx.detail && tx.detail.toLowerCase().includes(normalizedQuery)) ||
      (tx.amount.toString().includes(normalizedQuery)) ||
      (tx.tags && tx.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))) ||
      (tx.notes && tx.notes.toLowerCase().includes(normalizedQuery)) ||
      (tx.saleOrderDetails?.setOption && tx.saleOrderDetails.setOption.toLowerCase().includes(normalizedQuery)) ||
      (tx.saleOrderDetails?.customerName && tx.saleOrderDetails.customerName.toLowerCase().includes(normalizedQuery)) ||
      (tx.saleOrderDetails?.customerAddress && tx.saleOrderDetails.customerAddress.toLowerCase().includes(normalizedQuery)) ||
      (tx.saleOrderDetails?.district && tx.saleOrderDetails.district.toLowerCase().includes(normalizedQuery)) ||
      (tx.saleOrderDetails?.province && tx.saleOrderDetails.province.toLowerCase().includes(normalizedQuery)) ||
      (tx.saleOrderDetails?.phoneNumber && tx.saleOrderDetails.phoneNumber.toLowerCase().includes(normalizedQuery)) ||
      (tx.saleOrderDetails?.zipcode && tx.saleOrderDetails.zipcode.toLowerCase().includes(normalizedQuery)) ||
      (tx.saleOrderDetails?.shippingStatus && tx.saleOrderDetails.shippingStatus.toLowerCase().includes(normalizedQuery)) ||
      (tx.saleOrderDetails?.paymentStatus && tx.saleOrderDetails.paymentStatus.toLowerCase().includes(normalizedQuery));

    return isWithinDate && isTypeMatch && isCategoryMatch && isProductSetMatch && isPaymentMatch && isTagMatch && isQueryMatch;
  });

  // Summary calculations for selected month / range
  const summaryIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const summaryExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const summaryNet = summaryIncome - summaryExpense;

  // Group by day or category
  const grouped = filteredTransactions.reduce((groups, tx) => {
    const key = groupBy === 'date' 
      ? format(parseISO(tx.date), 'yyyy-MM-dd') 
      : tx.category;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(tx);
    return groups;
  }, {} as Record<string, typeof transactions>);

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (groupBy === 'date') {
      return b.localeCompare(a); // Newest date first
    } else {
      return a.localeCompare(b); // Alphabetical category order
    }
  });

  const onRequestDelete = (id: string) => {
    const target = transactions.find(t => t.id === id);
    if (target) {
      setDeletingTransaction(target);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction || !deletingTransaction.id) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(deletingTransaction.id);
      addAction({
        type: 'DELETE',
        transactionId: deletingTransaction.id,
        previousData: deletingTransaction
      });
      notifyReaction('delete', 'ลบรายการสำเร็จเรียบร้อยแล้ว');
      setDeletingTransaction(null);
    } catch (e) {
      console.error('Failed to delete transaction:', e);
      notifyReaction('error', 'ลบรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`ยืนยันการลบ ${selectedIds.length} รายการที่เลือกหรือไม่?`)) return;

    setIsBatchUpdating(true);
    try {
      const targets = transactions.filter(t => selectedIds.includes(t.id!));
      await Promise.all(selectedIds.map(id => deleteTransaction(id)));
      addAction({
        type: 'BATCH_DELETE',
        transactions: targets
      });
      toast.success(`ลบ ${selectedIds.length} รายการสำเร็จ`);
      setSelectedIds([]);
      setIsSelectionMode(false);
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการลบรายการแบบกลุ่ม');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  const handleBatchUpdateStatus = async (status: 'paid' | 'unpaid') => {
    if (selectedIds.length === 0) return;
    
    setIsBatchUpdating(true);
    try {
      const targets = transactions.filter(t => selectedIds.includes(t.id!) && ['รายรับจาก Sale order', 'แบตเตอรี่', 'ตู้คอมบายเนอร์+อินเวอร์เตอร์'].includes(t.category));
      
      if (targets.length === 0) {
        toast.error('รายการที่เลือกไม่มีรายการที่เป็น Sale Order');
        return;
      }

      await Promise.all(targets.map(tx => 
        updateTransaction(tx.id!, {
          saleOrderDetails: {
            ...tx.saleOrderDetails!,
            paymentStatus: status,
            paymentReceivedDate: status === 'paid' ? format(new Date(), 'yyyy-MM-dd') : undefined
          }
        })
      ));

      addAction({
        type: 'BATCH_UPDATE',
        transactions: targets,
        previousData: targets.reduce((acc, tx) => ({ ...acc, [tx.id!]: { saleOrderDetails: tx.saleOrderDetails } }), {}),
        newData: { paymentStatus: status }
      });

      toast.success(`อัปเดตสถานะ ${targets.length} รายการสำเร็จ`);
      setSelectedIds([]);
      setIsSelectionMode(false);
    } catch (e) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setIsBatchUpdating(false);
    }
  };

  // Export to CSV function
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = ['วันที่', 'เวลา', 'ประเภท', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน (บาท)', 'สถานะชำระเงิน', 'ชื่อลูกค้า', 'เบอร์โทร', 'จังหวัด', 'สถานะจัดส่ง'];
    
    const rows = filteredTransactions.map(t => {
      const d = parseISO(t.date);
      const dateStr = format(d, 'yyyy-MM-dd');
      const timeStr = format(d, 'HH:mm');
      const typeStr = t.type === 'income' ? 'รายรับ' : 'รายจ่าย';
      const catStr = `"${(t.category || '').replace(/"/g, '""')}"`;
      const detailStr = `"${(t.detail || '').replace(/"/g, '""')}"`;
      const amtStr = t.amount;
      const statusStr = t.saleOrderDetails?.paymentStatus === 'paid' ? 'ชำระแล้ว' : (t.saleOrderDetails?.paymentStatus === 'unpaid' ? 'ยังไม่ชำระ' : '-');
      const nameStr = t.saleOrderDetails?.customerName ? `"${t.saleOrderDetails.customerName.replace(/"/g, '""')}"` : '-';
      const phoneStr = t.saleOrderDetails?.phoneNumber ? `"${t.saleOrderDetails.phoneNumber}"` : '-';
      const provinceStr = t.saleOrderDetails?.province ? `"${t.saleOrderDetails.province}"` : '-';
      const shipStr = t.saleOrderDetails?.shippingStatus ? `"${t.saleOrderDetails.shippingStatus}"` : '-';

      return [dateStr, timeStr, typeStr, catStr, detailStr, amtStr, statusStr, nameStr, phoneStr, provinceStr, shipStr].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ประวัติรายการบัญชี_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('ส่งออกไฟล์ CSV เรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ประวัติรายการ</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            จัดการและตรวจสอบประวัติรายการทั้งหมด
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer"
            title="ส่งออกประวัติเป็นไฟล์ CSV"
          >
            <Download size={15} />
            <span>ส่งออก CSV</span>
          </button>

          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (!isSelectionMode) setSelectedIds([]);
            }}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
              isSelectionMode 
                ? 'bg-brand text-white border-brand shadow-sm' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
            }`}
          >
            {isSelectionMode ? <CheckSquare size={16} /> : <Square size={16} />}
            <span>{isSelectionMode ? 'ยกเลิกเลือกกลุ่ม' : 'เลือกกลุ่ม'}</span>
          </button>

          {/* Group By selector */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center text-[11px] font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setGroupBy('date')}
              className={`px-3 py-1.5 rounded-lg transition-all ${groupBy === 'date' ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-xs' : 'text-gray-500 dark:text-gray-400'}`}
            >
              ตามวันที่
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('category')}
              className={`px-3 py-1.5 rounded-lg transition-all ${groupBy === 'category' ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-xs' : 'text-gray-500 dark:text-gray-400'}`}
            >
              ตามหมวดหมู่
            </button>
          </div>

          {/* Display Density Switcher */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center text-[11px] font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => updateDisplayDensity('compact')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                displayDensity === 'compact'
                  ? 'bg-white dark:bg-gray-700 text-brand shadow-xs font-black'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
              title="โหมดกระชับ (Compact) - แสดงข้อมูลแน่นขึ้น เหมาะกับจอมือถือ"
            >
              <ListCollapse size={14} />
              <span className="hidden sm:inline">กระชับ</span>
            </button>
            <button
              type="button"
              onClick={() => updateDisplayDensity('comfortable')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                displayDensity === 'comfortable'
                  ? 'bg-white dark:bg-gray-700 text-brand shadow-xs font-black'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
              title="โหมดสบายตา (Comfortable) - ระยะห่างอ่านง่าย สบายตา"
            >
              <Rows3 size={14} />
              <span className="hidden sm:inline">สบายตา</span>
            </button>
          </div>

          {/* Quick search input */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารายการ..."
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-brand dark:focus:border-brand transition-colors shadow-2xs font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowRecentActions(!showRecentActions)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center space-x-1.5 ${showRecentActions ? 'bg-brand-soft dark:bg-amber-950/30 border-brand-soft dark:border-brand text-brand dark:text-brand' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <HistoryIcon size={18} />
            {history.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand text-white text-[10px] flex items-center justify-center font-bold">
                {history.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer relative ${showFilters || activeFiltersCount > 0 ? 'bg-brand-soft dark:bg-amber-950/30 border-brand-soft dark:border-brand text-brand dark:text-brand' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            title="กรองรายการขั้นสูง"
          >
            <Filter size={18} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sync Queue Indicator Banner */}
      <div className={`rounded-2xl p-4 border transition-all shadow-2xs ${
        pendingCount > 0
          ? isOnline
            ? 'bg-brand/10 dark:bg-amber-950/30 border-brand/30 text-brand dark:text-brand-soft'
            : 'bg-orange-500/10 dark:bg-orange-950/30 border-orange-500/30 text-orange-900 dark:text-orange-200'
          : 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              pendingCount > 0
                ? 'bg-brand/20 text-brand dark:text-brand'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}>
              {pendingCount > 0 ? (
                isOnline ? (
                  <RefreshCw size={20} className="animate-spin text-brand dark:text-brand" />
                ) : (
                  <CloudOff size={20} className="text-brand dark:text-brand" />
                )
              ) : (
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm">
                  {pendingCount > 0
                    ? `คิวรอซิงค์ (Pending Queue): ${pendingCount} รายการ`
                    : 'สถานะฐานข้อมูล: ซิงค์ครบถ้วนแล้ว'}
                </span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand text-white animate-pulse">
                    Waiting Sync
                  </span>
                )}
              </div>
              <p className="text-xs opacity-85 mt-0.5">
                {pendingCount > 0
                  ? isOnline
                    ? 'กำลังส่งข้อมูลบันทึกล่าสุดไปยัง Firebase Cloud Database...'
                    : 'อุปกรณ์อยู่นอกเครือข่าย รายการถูกบันทึกลงในเครื่องไว้ชั่วคราว และจะซิงค์กับ Firebase อัตโนมัติเมื่อต่อเน็ต'
                  : 'รายการทั้งหมดบันทึกลง Firebase Cloud เรียบร้อยแล้ว (พร้อมทำงานแบบ Offline-first)'}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-black/5 dark:bg-white/10">
            {isOnline ? (
              <>
                <Wifi size={14} className="text-emerald-500" />
                <span>ออนไลน์</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="text-orange-500" />
                <span>ออฟไลน์</span>
              </>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4 transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal size={18} className="text-brand" />
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                ตัวกรองประวัติรายการ (Advanced Transaction Filters)
              </h3>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand text-white">
                  {activeFiltersCount} เงื่อนไข
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>ล้างตัวกรองทั้งหมด</span>
              </button>
            )}
          </div>

          {/* Preset Date Range Buttons */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">เลือกช่วงเวลาด่วน (Quick Date Range)</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'thisMonth', label: 'เดือนนี้' },
                { id: 'lastMonth', label: 'เดือนที่แล้ว' },
                { id: 'last7', label: '7 วันล่าสุด' },
                { id: 'last30', label: '30 วันล่าสุด' },
                { id: 'thisYear', label: 'ปีนี้' },
                { id: 'all', label: 'ทั้งหมด' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPresetDateRange(p.id as any)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand/10 hover:text-brand dark:hover:text-brand transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range picker */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ตั้งแต่วันที่ (From Date)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ถึงวันที่ (To Date)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter by Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ประเภทรายการ (Transaction Type)</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setFilterType('all')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${filterType === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${filterType === 'income' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  รายรับ
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${filterType === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  รายจ่าย
                </button>
              </div>
            </div>

            {/* Filter by Category */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">หมวดหมู่สินค้า/ค่าใช้จ่าย (Category)</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand transition-colors"
              >
                <option value="all">ทุกหมวดหมู่ ({categoriesPresent.length} หมวดหมู่)</option>
                {incomeCategoriesPresent.length > 0 && (
                  <optgroup label="--- หมวดหมู่รายรับ ---">
                    {incomeCategoriesPresent.map(cat => (
                      <option key={cat} value={cat}>🟢 {cat}</option>
                    ))}
                  </optgroup>
                )}
                {expenseCategoriesPresent.length > 0 && (
                  <optgroup label="--- หมวดหมู่รายจ่าย ---">
                    {expenseCategoriesPresent.map(cat => (
                      <option key={cat} value={cat}>🔴 {cat}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Filter by Solar Set / Product Option */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">ชุดสินค้าโซล่าเซลล์ (Product Set Option)</label>
              <select
                value={filterProductSet}
                onChange={(e) => setFilterProductSet(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand transition-colors"
              >
                <option value="all">ทุกชุดสินค้า ({productSetsPresent.length} ชุด)</option>
                {productSetsPresent.map(setOpt => (
                  <option key={setOpt} value={setOpt}>📦 {setOpt}</option>
                ))}
              </select>
            </div>

            {/* Payment Status & Tag */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">สถานะชำระเงิน (Payment Status)</label>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand transition-colors"
              >
                <option value="all">ทุกสถานะชำระเงิน</option>
                <option value="paid">✅ ชำระเงินแล้ว</option>
                <option value="unpaid">⏳ ยังไม่ชำระเงิน</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">กรองตามแท็ก / โครงการโซล่าเซลล์ (Tag)</label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand transition-colors"
              >
                <option value="all">ทุกแท็ก ({allTags.length} แท็ก)</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>#{tag}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                disabled={activeFiltersCount === 0}
                className={`w-full py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activeFiltersCount > 0
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <RotateCcw size={14} />
                <span>รีเซ็ตเงื่อนไขทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Actions Feed */}
      {showRecentActions && (
        <RecentActionsFeed
          history={history}
          onUndo={undoAction}
          onClear={clearHistory}
        />
      )}

      {/* Monthly / Filtered Range Summary Widget */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm transition-colors space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-2.5">
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-emerald-500" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              สรุปยอดตามช่วงเวลา ({format(parseISO(startDate), 'd MMM yyyy', { locale: th })} - {format(parseISO(endDate), 'd MMM yyyy', { locale: th })})
            </span>
          </div>
          <span className="text-[11px] font-medium text-gray-400">
            {filteredTransactions.length} รายการ
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Total Income */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 sm:p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
              <TrendingUp size={14} className="shrink-0" />
              <span className="text-[11px] font-semibold">รายรับรวม</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-300 truncate">
              ฿{summaryIncome.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
            </p>
          </div>

          {/* Total Expenses */}
          <div className="bg-rose-50/60 dark:bg-rose-950/30 p-2.5 sm:p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
            <div className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400 mb-1">
              <TrendingDown size={14} className="shrink-0" />
              <span className="text-[11px] font-semibold">รายจ่ายรวม</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-rose-700 dark:text-rose-300 truncate">
              ฿{summaryExpense.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
            </p>
          </div>

          {/* Net Profit */}
          <div className={`p-2.5 sm:p-3 rounded-xl border ${
            summaryNet >= 0
              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300'
              : 'bg-red-50/60 dark:bg-red-950/30 border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-300'
          }`}>
            <div className={`flex items-center space-x-1.5 mb-1 ${summaryNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              <Wallet size={14} className="shrink-0" />
              <span className="text-[11px] font-semibold">กำไรสุทธิ</span>
            </div>
            <p className="text-sm sm:text-base font-extrabold truncate">
              {summaryNet < 0 ? '-' : ''}฿{Math.abs(summaryNet).toLocaleString('th-TH', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Filter Bar (Type & Category Pills) */}
      <div className="space-y-3 pb-1">
        {/* Type selector & Active filter summary */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Transaction Type Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              ทั้งหมด ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1 ${
                filterType === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <TrendingUp size={13} />
              <span>รายรับ ({transactions.filter(t => t.type === 'income').length})</span>
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1 ${
                filterType === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <TrendingDown size={13} />
              <span>รายจ่าย ({transactions.filter(t => t.type === 'expense').length})</span>
            </button>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500">
                ผลลัพธ์ {filteredTransactions.length} รายการ
              </span>
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 rounded-lg text-xs font-bold hover:underline cursor-pointer flex items-center space-x-1"
              >
                <X size={12} />
                <span>ล้างตัวกรอง ({activeFiltersCount})</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Filter Tags Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 mr-1">กำลังกรองด้วย:</span>
            {filterType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                ประเภท: {filterType === 'income' ? 'รายรับ' : 'รายจ่าย'}
                <X size={12} className="cursor-pointer hover:text-indigo-900" onClick={() => setFilterType('all')} />
              </span>
            )}
            {filterCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                หมวดหมู่: {filterCategory}
                <X size={12} className="cursor-pointer hover:text-amber-900" onClick={() => setFilterCategory('all')} />
              </span>
            )}
            {filterProductSet !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                ชุดสินค้า: {filterProductSet}
                <X size={12} className="cursor-pointer hover:text-cyan-900" onClick={() => setFilterProductSet('all')} />
              </span>
            )}
            {filterPayment !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ชำระเงิน: {filterPayment === 'paid' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}
                <X size={12} className="cursor-pointer hover:text-emerald-900" onClick={() => setFilterPayment('all')} />
              </span>
            )}
            {filterTag !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                แท็ก: #{filterTag}
                <X size={12} className="cursor-pointer hover:text-purple-900" onClick={() => setFilterTag('all')} />
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                คำค้น: "{searchQuery}"
                <X size={12} className="cursor-pointer hover:text-slate-900" onClick={() => setSearchQuery('')} />
              </span>
            )}
          </div>
        )}

        {/* Category Chips Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-brand border-brand text-white shadow-xs shadow-brand/10'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            ทุกหมวดหมู่ ({transactions.length})
          </button>
          {categoriesPresent.map(cat => {
            const count = transactions.filter(t => t.category === cat).length;
            const isSelected = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-brand border-brand text-white shadow-xs shadow-brand/10'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {sortedKeys.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 border-dashed transition-colors">
          <p className="text-gray-500 dark:text-gray-400">ไม่มีรายการในช่วงวันที่เลือก</p>
        </div>
      ) : (
        <div className={displayDensity === 'compact' ? "space-y-4" : "space-y-6"}>
          {sortedKeys.map(keyStr => {
            const isDate = groupBy === 'date';
            let heading = keyStr;
            if (isDate) {
              try {
                heading = format(parseISO(keyStr), 'EEEE d MMMM yyyy', { locale: th });
              } catch (e) {
                heading = keyStr;
              }
            }
            return (
              <div key={keyStr} className={displayDensity === 'compact' ? "space-y-1.5" : "space-y-3"}>
                <h3 className={`text-sm font-extrabold text-slate-700 dark:text-slate-300 pl-1 border-b border-gray-200 dark:border-gray-700 transition-colors flex items-center justify-between ${
                  displayDensity === 'compact' ? 'pb-1' : 'pb-2'
                }`}>
                  <span>{heading}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold font-mono">
                    {grouped[keyStr].length} รายการ
                  </span>
                </h3>
                <div className={displayDensity === 'compact' ? "space-y-1.5" : "space-y-3"}>
                  {grouped[keyStr].map(tx => (
                    <SwipeableTransactionItem
                      key={tx.id}
                      transaction={tx}
                      density={displayDensity}
                      onEdit={setEditingTransaction}
                      onDelete={onRequestDelete}
                      onViewReceipt={setReceiptTransaction}
                      onQuickPrint={setQuickPrintTransaction}
                      onPrintSimplified={setSimplifiedReceiptTransaction}
                      onTogglePaymentStatus={handleTogglePaymentStatus}
                      canEdit={userPerms.canEditTransactions}
                      canDelete={userPerms.canDeleteTransactions}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedIds.includes(tx.id!)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Batch Action Bar */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-40 animate-slide-up w-full max-w-lg px-4">
          <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-3xl p-4 shadow-2xl border border-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3 pl-2">
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center font-black text-sm">
                {selectedIds.length}
              </div>
              <span className="text-xs font-bold hidden sm:block">เลือกแล้ว {selectedIds.length} รายการ</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBatchUpdateStatus('paid')}
                disabled={isBatchUpdating}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-[10px] transition-all flex items-center space-x-1"
              >
                <CheckCircle2 size={14} />
                <span>ชำระแล้ว</span>
              </button>
              <button
                onClick={() => handleBatchUpdateStatus('unpaid')}
                disabled={isBatchUpdating}
                className="px-3 py-2 bg-brand hover:bg-brand disabled:opacity-50 text-white font-bold rounded-xl text-[10px] transition-all flex items-center space-x-1"
              >
                <X size={14} />
                <span>ยังไม่ชำระ</span>
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={isBatchUpdating}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-[10px] transition-all flex items-center space-x-1"
              >
                <Trash size={14} />
                <span>ลบ ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <AnimatePresence>
        {editingTransaction && (
          <EditTransactionModal
            transaction={editingTransaction}
            isOpen={true}
            onClose={() => setEditingTransaction(null)}
            onSave={updateTransaction}
          />
        )}
      </AnimatePresence>

      {receiptTransaction && (
        <ReceiptGenerator
          transaction={receiptTransaction}
          shopInfo={config.shopInfo || { name: '', address: '', phone: '', receiptNote: '' }}
          onClose={() => setReceiptTransaction(null)}
        />
      )}

      {quickPrintTransaction && (
        <QuickPrintModal
          isOpen={true}
          transaction={quickPrintTransaction}
          shopInfo={config.shopInfo || { name: '', address: '', phone: '', receiptNote: '' }}
          onClose={() => setQuickPrintTransaction(null)}
        />
      )}

      {simplifiedReceiptTransaction && (
        <SimplifiedReceiptModal
          isOpen={true}
          transaction={simplifiedReceiptTransaction}
          shopInfo={config.shopInfo || { name: '', address: '', phone: '', receiptNote: '' }}
          onClose={() => setSimplifiedReceiptTransaction(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 transition-all">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/60">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">ยืนยันการลบรายการ</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">รายการนี้จะถูกลบออกจากระบบอย่างถาวร</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">{deletingTransaction.category}</span>
                <span className={`font-extrabold ${deletingTransaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {deletingTransaction.type === 'income' ? '+' : '-'}฿{Number(deletingTransaction.amount).toLocaleString()}
                </span>
              </div>
              {deletingTransaction.detail && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{deletingTransaction.detail}</p>
              )}
              <p className="text-[10px] text-slate-400">
                {format(parseISO(deletingTransaction.date), 'dd MMMM yyyy HH:mm', { locale: th })}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingTransaction(null)}
                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center space-x-2 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeleting ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>ยืนยันลบ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
