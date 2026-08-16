import React, { useState, FormEvent, useMemo, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useCustomers } from '../hooks/useCustomers';
import { useAppConfig } from '../hooks/useAppConfig';
import { useAuth } from '../hooks/useAuth';
import { useActionHistory } from '../hooks/useActionHistory';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tag as TagIcon, Plus, X, User, MapPin, Phone, Package, Truck, 
  CheckCircle2, Clock, Wrench, ShoppingBag, Trash2, Search,
  LayoutGrid, List, ChevronRight, CreditCard, Info, Sparkles,
  Receipt, DollarSign, Calendar, Percent, ArrowRight, Eye, RefreshCw,
  TrendingUp, TrendingDown, UserCheck, ShieldCheck, FileText, Check, XCircle,
  QrCode, Sun, BatteryCharging, Cpu, Layers, Printer, Barcode
} from 'lucide-react';
import { TransactionType, TransactionCategory, ThaiProvinces, ShippingStatus, Transaction, ProductCatalogItem } from '../types';
import { format, isToday, parseISO } from 'date-fns';
import ReceiptCapture from '../components/ReceiptCapture';
import ReceiptGenerator from '../components/ReceiptGenerator';
import SimplifiedReceiptModal from '../components/SimplifiedReceiptModal';
import PromptPayModal from '../components/PromptPayModal';
import SpeechDictationButton from '../components/SpeechDictationButton';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { notifyReaction, soundFeedback } from '../utils/feedback';
import { suggestCategory } from '../utils/categorySuggestions';

interface AddTransactionProps {
  onSuccess: () => void;
  initialType?: TransactionType;
  initialCategory?: TransactionCategory;
  initialDetail?: string;
  initialAmount?: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  items?: { name: string; quantity: string }[];
  linkedSubcategoryId?: string;
  isCustom?: boolean;
}

type PosMode = 'solar_sale' | 'custom_sale' | 'income_entry' | 'expense_entry';

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('th-TH').format(num);
};

export default function AddTransaction({
  onSuccess,
  initialType = 'income',
  initialCategory,
  initialDetail,
  initialAmount,
}: AddTransactionProps) {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, restoreTransaction } = useTransactions();
  const { customers: crmCustomers, findOrCreateCustomer } = useCustomers();
  const { user } = useAuth();
  const { addAction } = useActionHistory(
    addTransaction,
    deleteTransaction,
    updateTransaction,
    restoreTransaction
  );
  const { config, paymentMethods } = useAppConfig();

  // POS Operational Modes
  const [posMode, setPosMode] = useState<PosMode>(
    initialType === 'expense' ? 'expense_entry' : 
    (initialType === 'income' && initialCategory ? 'income_entry' : 'solar_sale')
  );
  
  // View & Filter States
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inspectingSet, setInspectingSet] = useState<any | null>(null);

  // Cart & Order Calculations
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('klangna_pos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [discountAmount, setDiscountAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('klangna_pos_discountAmount');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [discountType, setDiscountType] = useState<'baht' | 'percent'>(() => {
    try {
      const saved = localStorage.getItem('klangna_pos_discountType');
      return (saved === 'baht' || saved === 'percent') ? saved : 'baht';
    } catch {
      return 'baht';
    }
  });
  const [shippingFee, setShippingFee] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('klangna_pos_shippingFee');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Custom Item Modal / Inline Form
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: '', quantity: '1' });

  // Date & Time
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));

  // Customer Details
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('klangna_pos_customer');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: '',
      name: '',
      address: '',
      district: '',
      province: ThaiProvinces[0],
      zipcode: '',
      phone: '',
      customerTaxId: '',
      customerBranch: 'สำนักงานใหญ่',
      customerEmail: '',
    };
  });

  // Delivery / Shipping
  const [shipping, setShipping] = useState<{
    status: ShippingStatus;
    deliveryDate: string;
    note: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('klangna_pos_shipping');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      status: 'สั่งซื้อแล้ว',
      deliveryDate: format(new Date(), "yyyy-MM-dd"),
      note: '',
    };
  });

  // Payment
  const [payment, setPayment] = useState(() => {
    try {
      const saved = localStorage.getItem('klangna_pos_payment');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      status: 'paid',
      method: 'เงินสด',
      date: format(new Date(), "yyyy-MM-dd"),
      receiptUrl: undefined as string | undefined,
    };
  });

  // Auto-save shopping cart session details in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('klangna_pos_cart', JSON.stringify(cart));
      localStorage.setItem('klangna_pos_discountAmount', discountAmount.toString());
      localStorage.setItem('klangna_pos_discountType', discountType);
      localStorage.setItem('klangna_pos_shippingFee', shippingFee.toString());
      localStorage.setItem('klangna_pos_customer', JSON.stringify(customer));
      localStorage.setItem('klangna_pos_shipping', JSON.stringify(shipping));
      localStorage.setItem('klangna_pos_payment', JSON.stringify(payment));
    } catch (err) {
      console.error('Error auto-saving POS cart state:', err);
    }
  }, [cart, discountAmount, discountType, shippingFee, customer, shipping, payment]);

  // Expense Form State (for expense_entry mode)
  const [expenseData, setExpenseData] = useState({
    category: initialCategory || config.expenseCategories[0]?.name || 'ค่าใช้จ่ายอื่นๆ',
    detail: initialDetail || '',
    amount: initialAmount ? initialAmount.toString() : '',
    vendor: '',
    receiptUrl: undefined as string | undefined,
  });

  // Income Form State (for income_entry mode)
  const [incomeData, setIncomeData] = useState({
    category: initialCategory || config.incomeCategories[0]?.name || 'รายรับอื่นๆ',
    detail: initialDetail || '',
    amount: initialAmount ? initialAmount.toString() : '',
    payer: '',
    paymentMethod: paymentMethods[0] || 'เงินสด',
    receiptUrl: undefined as string | undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedTransaction, setLastSubmittedTransaction] = useState<Transaction | null>(null);
  const [isPromptPayModalOpen, setIsPromptPayModalOpen] = useState(false);
  const [isPrintReceiptOpen, setIsPrintReceiptOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  // Today's POS Stats
  const posStats = useMemo(() => {
    const todayTxs = transactions.filter(t => isToday(parseISO(t.date)));
    const todaySales = todayTxs.filter(t => t.type === 'income');
    const todayTotalRevenue = todaySales.reduce((sum, t) => sum + (t.amount || 0), 0);
    const todayUnpaidCount = todaySales.filter(t => t.saleOrderDetails?.paymentStatus === 'unpaid').length;

    return {
      orderCount: todaySales.length,
      revenue: todayTotalRevenue,
      unpaidCount: todayUnpaidCount,
    };
  }, [transactions]);

  // Recent Customers for Auto-fill
  const recentCustomers = useMemo(() => {
    const customersMap = new Map<string, { name: string; phone?: string; address?: string; province?: string; zipcode?: string }>();
    transactions.forEach(t => {
      if (t.saleOrderDetails?.customerName) {
        const name = t.saleOrderDetails.customerName.trim();
        if (name && !customersMap.has(name)) {
          customersMap.set(name, {
            name,
            phone: t.saleOrderDetails.phoneNumber,
            address: t.saleOrderDetails.customerAddress,
            province: t.saleOrderDetails.province,
            zipcode: t.saleOrderDetails.zipcode,
          });
        }
      }
    });
    return Array.from(customersMap.values()).slice(0, 8);
  }, [transactions]);

  // Top 5 Most Recently Used Item Descriptions for Quick Selection
  const recentlyUsedDescriptions = useMemo(() => {
    const descriptions = new Set<string>();
    const detailsMap = new Map<string, { price?: number; subcategory?: string }>();
    
    // Filter and sort to get most recent income transactions first
    const sortedIncomes = [...transactions]
      .filter(t => t.type === 'income')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
    for (const tx of sortedIncomes) {
      // 1. Check subcategory (this is the name of standard set or custom item)
      if (tx.subcategory) {
        const sub = tx.subcategory.trim();
        // Skip generic labels
        if (sub && sub !== 'รายรับจาก Sale order' && !descriptions.has(sub)) {
          descriptions.add(sub);
          detailsMap.set(sub, { 
            price: tx.amount,
            subcategory: tx.category !== 'รายรับจาก Sale order' ? tx.category : undefined
          });
          if (descriptions.size >= 5) break;
        }
      }
      
      // 2. Also check individual items in saleOrderDetails.setOption (e.g. "ชุดคอนโทรล (x1)")
      if (tx.saleOrderDetails?.setOption) {
        const options = tx.saleOrderDetails.setOption.split(',');
        for (const opt of options) {
          // Remove quantity like (x1) or (x2)
          const cleanOpt = opt.replace(/\(x\d+\)/g, '').trim();
          if (cleanOpt && cleanOpt !== 'รายรับจาก Sale order' && !cleanOpt.startsWith('custom_') && !descriptions.has(cleanOpt)) {
            descriptions.add(cleanOpt);
            detailsMap.set(cleanOpt, {
              price: options.length === 1 ? tx.amount : undefined
            });
            if (descriptions.size >= 5) break;
          }
        }
      }

      // 3. Check general detail if it is from other categories
      if (tx.category !== 'รายรับจาก Sale order' && tx.detail) {
        // Strip out parenthesis
        const cleanDetail = tx.detail.replace(/\s*\(ผู้ชำระ:.*?\)\s*/, '').trim();
        if (cleanDetail && cleanDetail.length < 50 && !descriptions.has(cleanDetail)) {
          descriptions.add(cleanDetail);
          detailsMap.set(cleanDetail, { 
            price: tx.amount,
            subcategory: tx.category
          });
          if (descriptions.size >= 5) break;
        }
      }
      
      if (descriptions.size >= 5) break;
    }

    return Array.from(descriptions).slice(0, 5).map(desc => ({
      name: desc,
      price: detailsMap.get(desc)?.price,
      subcategory: detailsMap.get(desc)?.subcategory
    }));
  }, [transactions]);

  // Cart Subtotal & Final Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percent') {
      return (cartSubtotal * (discountAmount || 0)) / 100;
    }
    return discountAmount || 0;
  }, [cartSubtotal, discountAmount, discountType]);

  const netTotalAmount = useMemo(() => {
    const base = cartSubtotal - calculatedDiscount + (shippingFee || 0);
    return Math.max(0, base);
  }, [cartSubtotal, calculatedDiscount, shippingFee]);

  // Derived Config Collections
  const incomeCategories = config.incomeCategories.filter(c => c.isActive);
  const expenseCategories = config.expenseCategories.filter(c => c.isActive);
  const standardSets = config.standardSets || [];

  const filteredSets = useMemo(() => {
    let result = standardSets;
    if (activeCategory !== 'all') {
      result = result.filter(s => {
        return incomeCategories.some(cat => 
          cat.id === activeCategory && 
          cat.subcategories?.some(sub => sub.id === s.linkedSubcategoryId)
        );
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.items.some(i => i.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [standardSets, activeCategory, searchQuery, incomeCategories]);

  // Cart Helper Actions
  const addToCart = (set: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === set.id);
      if (existing) {
        return prev.map(item => item.id === set.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: set.id,
        name: set.name,
        price: set.price,
        quantity: 1,
        items: set.items,
        linkedSubcategoryId: set.linkedSubcategoryId,
        isCustom: false
      }];
    });
    notifyReaction('success', `เพิ่ม "${set.name}" ลงในตะกร้าเรียบร้อย`);
  };

  const handleAddCustomItem = (e: FormEvent) => {
    e.preventDefault();
    if (!customItem.name.trim()) return notifyReaction('error', 'กรุณากรอกชื่อสินค้า/บริการ');
    const priceNum = parseFloat(customItem.price) || 0;
    const qtyNum = parseInt(customItem.quantity) || 1;

    const newItem: CartItem = {
      id: `custom_${Date.now()}`,
      name: customItem.name.trim(),
      price: priceNum,
      quantity: qtyNum,
      isCustom: true
    };

    setCart(prev => [...prev, newItem]);
    setCustomItem({ name: '', price: '', quantity: '1' });
    setShowCustomItemModal(false);
    notifyReaction('success', `เพิ่ม "${newItem.name}" ลงในตะกร้าเรียบร้อย`);
  };

  const removeFromCart = (id: string, name?: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    notifyReaction('delete', `นำ "${name || 'รายการ'}" ออกจากตะกร้าเรียบร้อย`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty !== item.quantity) {
          notifyReaction('info', `ปรับจำนวน "${item.name}" เป็น ${newQty}`, { id: `qty_${id}` });
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleClearCart = () => {
    if (cart.length === 0) {
      return notifyReaction('warning', 'ไม่มีรายการในตะกร้า');
    }
    setCart([]);
    setDiscountAmount(0);
    setShippingFee(0);
    notifyReaction('delete', 'ล้างรายการในตะกร้าทั้งหมดเรียบร้อยแล้ว');
  };

  const handleCancelSale = () => {
    if (cart.length === 0 && !customer.name && !customer.phone && discountAmount === 0 && shippingFee === 0) {
      return notifyReaction('warning', 'ไม่มีรายการขายให้ยกเลิก');
    }

    if (window.confirm('คุณต้องการยกเลิกการขายและล้างข้อมูลทั้งหมดในตะกร้าใช่หรือไม่?')) {
      setCart([]);
      setDiscountAmount(0);
      setShippingFee(0);
      setCustomer({ name: '', address: '', district: '', province: ThaiProvinces[0], zipcode: '', phone: '', customerTaxId: '', customerBranch: 'สำนักงานใหญ่', customerEmail: '' });
      setPayment({
        method: paymentMethods[0] || 'เงินสด',
        status: 'paid',
        date: format(new Date(), "yyyy-MM-dd"),
        receiptUrl: undefined
      });
      setShipping({
        deliveryDate: format(new Date(), "yyyy-MM-dd"),
        status: 'สั่งซื้อแล้ว',
        note: '',
      });
      notifyReaction('delete', 'ยกเลิกการขายและล้างข้อมูลเรียบร้อยแล้ว');
    }
  };

  const handleSwitchPosMode = (mode: PosMode) => {
    setPosMode(mode);
    if (mode === 'solar_sale') notifyReaction('info', 'สลับโหมด: ขายชุดโซล่าเซลล์');
    else if (mode === 'custom_sale') notifyReaction('info', 'สลับโหมด: ขายด่วน / บริการพิเศษ');
    else if (mode === 'income_entry') notifyReaction('info', 'สลับโหมด: บันทึกรายรับทั่วไป');
    else if (mode === 'expense_entry') notifyReaction('info', 'สลับโหมด: บันทึกรายจ่ายหน้าร้าน');
  };

  const handleSwitchViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    notifyReaction('info', mode === 'grid' ? 'สลับมุมมอง: แบบการ์ด (Grid)' : 'สลับมุมมอง: แบบตาราง (Table)');
  };

  const handleCategoryFilter = (catId: string, catName: string) => {
    setActiveCategory(catId);
    notifyReaction('info', `แสดงสินค้าหมวดหมู่: ${catName}`);
  };

  const handleToggleDiscountType = () => {
    const nextType = discountType === 'baht' ? 'percent' : 'baht';
    setDiscountType(nextType);
    notifyReaction('info', `เปลี่ยนหน่วยส่วนลดเป็น ${nextType === 'baht' ? 'บาท (฿)' : 'เปอร์เซ็นต์ (%)'}`);
  };

  const handleSelectPaymentStatus = (status: 'paid' | 'unpaid') => {
    setPayment(prev => ({
      ...prev,
      status,
      date: status === 'paid' ? format(new Date(), "yyyy-MM-dd") : ''
    }));
    notifyReaction('info', status === 'paid' ? 'ระบุสถานะ: ชำระแล้ว (Paid)' : 'ระบุสถานะ: ค้างชำระ (Unpaid)');
  };

  const handleSelectPaymentMethod = (method: string) => {
    setPayment(prev => ({ ...prev, method }));
    notifyReaction('info', `เลือกวิธีชำระเงิน: ${method}`);
  };

  const handleSelectShippingStatus = (status: ShippingStatus) => {
    setShipping(prev => ({ ...prev, status }));
    notifyReaction('info', `อัปเดตสถานะจัดส่ง: ${status}`);
  };

  const handleSelectRecentCustomer = (cust: typeof recentCustomers[0]) => {
    setCustomer(prev => ({
      ...prev,
      name: cust.name || '',
      phone: cust.phone || '',
      address: cust.address || '',
      province: cust.province || ThaiProvinces[0],
      district: '',
      zipcode: cust.zipcode || '',
    }));
    notifyReaction('success', `โหลดข้อมูลลูกค้า "${cust.name}" สำเร็จ`);
  };

  const handleSelectCRMCustomer = (crmCust: any) => {
    setCustomer({
      id: crmCust.id || '',
      name: crmCust.name || '',
      phone: crmCust.phoneNumber || '',
      address: crmCust.customerAddress || '',
      district: crmCust.district || '',
      province: crmCust.province || ThaiProvinces[0],
      zipcode: crmCust.zipcode || '',
      customerTaxId: crmCust.customerTaxId || '',
      customerBranch: crmCust.customerBranch || 'สำนักงานใหญ่',
      customerEmail: crmCust.email || '',
    });
    notifyReaction('success', `เลือกข้อมูลลูกค้า "${crmCust.name}" จาก CRM แล้ว`);
  };

  // Submit Handler for POS Sale Order
  const handleCheckoutSale = async (e: FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return notifyReaction('warning', 'กรุณาเลือกสินค้าลงตะกร้าอย่างน้อย 1 รายการ');
    if (!customer.name.trim()) return notifyReaction('warning', 'กรุณากรอกชื่อลูกค้า');
    
    setIsSubmitting(true);
    try {
      // Automatically link or save customer in CRM
      let customerId = customer.id;
      try {
        customerId = await findOrCreateCustomer({
          name: customer.name.trim(),
          phoneNumber: customer.phone.trim(),
          customerAddress: customer.address.trim(),
          district: customer.district.trim(),
          province: customer.province,
          zipcode: customer.zipcode.trim(),
          customerTaxId: customer.customerTaxId.trim(),
          customerBranch: customer.customerBranch.trim(),
          email: customer.customerEmail.trim(),
        });
      } catch (crmErr) {
        console.error('CRM customer creation notice:', crmErr);
      }

      const mainSubcategory = cart[0].name;
      const detailString = cart.length > 1 
        ? `${customer.name} - ${mainSubcategory} และอื่นๆ (${cart.length} รายการ)`
        : `${customer.name} - ${mainSubcategory}`;

      const saleOrderDetails = {
        customerId: customerId || undefined,
        setOption: cart.map(c => `${c.name} (x${c.quantity}) [฿${c.price}]`).join(', '),
        customerName: customer.name,
        customerAddress: customer.address,
        district: customer.district,
        province: customer.province,
        zipcode: customer.zipcode,
        phoneNumber: customer.phone,
        customerTaxId: customer.customerTaxId || undefined,
        customerBranch: customer.customerBranch || undefined,
        customerEmail: customer.customerEmail || undefined,
        deliveryDate: new Date(shipping.deliveryDate).toISOString(),
        paymentStatus: payment.status,
        paymentReceivedDate: payment.status === 'paid' && payment.date ? new Date(payment.date).toISOString() : undefined,
        paymentMethod: payment.method,
        shippingStatus: shipping.status,
        note: shipping.note,
        discountAmount,
        discountType,
        shippingFee,
      };

      const newId = await addTransaction({
        date: new Date(date).toISOString(),
        type: 'income',
        category: 'รายรับจาก Sale order',
        subcategory: mainSubcategory,
        detail: detailString,
        amount: netTotalAmount,
        receiptUrl: payment.receiptUrl,
        saleOrderDetails
      });
      
      const finalTransaction: Transaction = {
        id: newId,
        date: new Date(date).toISOString(),
        type: 'income',
        category: 'รายรับจาก Sale order',
        subcategory: mainSubcategory,
        detail: detailString,
        amount: netTotalAmount,
        receiptUrl: payment.receiptUrl,
        createdAt: new Date().toISOString(),
        createdBy: user?.email || 'system',
        saleOrderDetails
      };
      
      addAction({
        type: 'CREATE',
        transactionId: newId,
        newData: { type: 'income', amount: netTotalAmount }
      });

      notifyReaction('cash', 'บันทึกการขายสำเร็จเรียบร้อยแล้ว!');
      setLastSubmittedTransaction(finalTransaction);
    } catch (error) {
      console.error(error);
      notifyReaction('error', 'เกิดข้อผิดพลาดในการบันทึกการขาย');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler for Store Expense Entry
  const handleCheckoutExpense = async (e: FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseData.amount);
    if (!expenseData.detail.trim()) return notifyReaction('warning', 'กรุณาระบุรายละเอียดรายจ่าย');
    if (isNaN(amountNum) || amountNum <= 0) return notifyReaction('warning', 'กรุณาระบุจำนวนเงินรายจ่ายที่ถูกต้อง');

    setIsSubmitting(true);
    try {
      const newId = await addTransaction({
        date: new Date(date).toISOString(),
        type: 'expense',
        category: expenseData.category,
        detail: expenseData.vendor ? `${expenseData.detail} (ร้านค้า/ผู้รับ: ${expenseData.vendor})` : expenseData.detail,
        amount: amountNum,
        receiptUrl: expenseData.receiptUrl,
      });

      const finalTransaction: Transaction = {
        id: newId,
        date: new Date(date).toISOString(),
        type: 'expense',
        category: expenseData.category,
        detail: expenseData.detail,
        amount: amountNum,
        receiptUrl: expenseData.receiptUrl,
        createdAt: new Date().toISOString(),
        createdBy: user?.email || 'system',
      };

      addAction({
        type: 'CREATE',
        transactionId: newId,
        newData: { type: 'expense', amount: amountNum }
      });

      notifyReaction('success', 'บันทึกรายการรายจ่ายสำเร็จ');
      setLastSubmittedTransaction(finalTransaction);
    } catch (error) {
      console.error(error);
      notifyReaction('error', 'เกิดข้อผิดพลาดในการบันทึกรายจ่าย');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler for General Income Entry
  const handleCheckoutIncome = async (e: FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(incomeData.amount);
    if (!incomeData.detail.trim()) return notifyReaction('warning', 'กรุณาระบุรายละเอียดรายรับ');
    if (isNaN(amountNum) || amountNum <= 0) return notifyReaction('warning', 'กรุณาระบุจำนวนเงินรายรับที่ถูกต้อง');

    setIsSubmitting(true);
    try {
      const detailText = incomeData.payer ? `${incomeData.detail} (ผู้ชำระ: ${incomeData.payer})` : incomeData.detail;
      const newId = await addTransaction({
        date: new Date(date).toISOString(),
        type: 'income',
        category: incomeData.category,
        detail: detailText,
        amount: amountNum,
        receiptUrl: incomeData.receiptUrl,
      });

      const finalTransaction: Transaction = {
        id: newId,
        date: new Date(date).toISOString(),
        type: 'income',
        category: incomeData.category,
        detail: incomeData.detail,
        amount: amountNum,
        receiptUrl: incomeData.receiptUrl,
        createdAt: new Date().toISOString(),
        createdBy: user?.email || 'system',
      };

      addAction({
        type: 'CREATE',
        transactionId: newId,
        newData: { type: 'income', amount: amountNum }
      });

      notifyReaction('cash', 'บันทึกรายการรายรับสำเร็จ');
      setLastSubmittedTransaction(finalTransaction);
    } catch (error) {
      console.error(error);
      notifyReaction('error', 'เกิดข้อผิดพลาดในการบันทึกรายรับ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Screen
  if (lastSubmittedTransaction) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-6 py-6"
      >
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 border-4 border-emerald-50 dark:border-emerald-900 shadow-xl">
          <CheckCircle2 size={44} />
        </div>
        <div>
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 inline-block mb-2">
            TRANSACTION COMPLETED
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            บันทึก{lastSubmittedTransaction.type === 'income' ? 'การขาย' : 'รายจ่าย'}สำเร็จเรียบร้อย!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            ข้อมูลออเดอร์ถูกจัดเก็บและซิงค์ไปยังคลาวด์แล้วเรียบร้อย
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl w-full max-w-md space-y-4 text-left">
          {lastSubmittedTransaction.saleOrderDetails?.customerName && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">ชื่อลูกค้า:</span>
              <span className="text-slate-900 dark:text-white font-black">{lastSubmittedTransaction.saleOrderDetails.customerName}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold">หมวดหมู่:</span>
            <span className="text-slate-900 dark:text-white font-black">{lastSubmittedTransaction.category}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold">รายละเอียด:</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[200px]">{lastSubmittedTransaction.detail}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-slate-500 font-bold text-xs">ยอดรวมสุทธิ:</span>
            <span className={`text-xl font-black ${lastSubmittedTransaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              ฿{lastSubmittedTransaction.amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          {lastSubmittedTransaction.type === 'income' && (
            <button 
              onClick={() => setIsPrintReceiptOpen(true)}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 hover:brightness-105 transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
            >
              <Printer size={15} />
              <span>พิมพ์ใบเสร็จ (Print Receipt)</span>
            </button>
          )}
          <button 
            onClick={() => {
              setLastSubmittedTransaction(null);
              setCart([]);
              setDiscountAmount(0);
              setShippingFee(0);
              setCustomer({ name: '', address: '', district: '', province: ThaiProvinces[0], zipcode: '', phone: '' });
              setIsPrintReceiptOpen(false);
              toast.success('พร้อมสำหรับเริ่มรายการขายถัดไป');
            }}
            className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-2xl transition-all cursor-pointer text-xs"
          >
            + เปิดรายการใหม่
          </button>
          <button 
            onClick={() => {
              toast.success('เปิดหน้ารายการประวัติทั้งหมด');
              onSuccess();
            }}
            className="flex-1 py-3.5 bg-brand text-white font-black rounded-2xl shadow-lg shadow-brand/20 hover:brightness-105 transition-all cursor-pointer text-xs"
          >
            ดูประวัติรายการทั้งหมด
          </button>
        </div>

        {/* Simplified Receipt Modal for Customers */}
        {isPrintReceiptOpen && (
          <SimplifiedReceiptModal
            isOpen={isPrintReceiptOpen}
            transaction={lastSubmittedTransaction}
            shopInfo={config.shopInfo || { name: 'ร้านค้าโซล่าเซลล์', address: '', phone: '', receiptNote: '' }}
            onClose={() => setIsPrintReceiptOpen(false)}
            cartItems={cart}
            discountAmount={discountAmount}
            discountType={discountType}
            shippingFee={shippingFee}
          />
        )}

        {/* Receipt Generator Preview */}
        {lastSubmittedTransaction.type === 'income' && (
          <div className="pt-2 w-full max-w-md">
            <ReceiptGenerator 
              transaction={lastSubmittedTransaction}
              shopInfo={config.shopInfo || { name: 'ร้านค้าโซล่าเซลล์', address: '', phone: '', receiptNote: '' }}
              onClose={() => {}}
            />
          </div>
        )}
      </motion.div>
    );
  }

  const suggestedIncomeCategory = suggestCategory(incomeData.detail, 'income');
  const suggestedExpenseCategory = suggestCategory(expenseData.detail, 'expense');

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col h-auto lg:h-[calc(100vh-125px)] overflow-hidden gap-4 pb-2">
      
      {/* POS Top Stats & Mode Bar - LOCKED HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Main Title & Live Stats */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 shrink-0">
              <ShoppingBag size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  ระบบขายหน้าร้าน (Modern POS Console)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  พร้อมขาย
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                เลือกสินค้า ออกใบขาย และบันทึกบัญชีโซล่าเซลล์ครบวงจรในที่เดียว
              </p>
            </div>
          </div>

          {/* POS Operational Mode Selector */}
          <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 gap-1">
            <button
              onClick={() => handleSwitchPosMode('solar_sale')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                posMode === 'solar_sale'
                  ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Package size={15} />
              <span>ขายชุดโซล่าเซลล์</span>
            </button>

            <button
              onClick={() => handleSwitchPosMode('custom_sale')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                posMode === 'custom_sale'
                  ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Wrench size={15} />
              <span>ขายด่วน / บริการ</span>
            </button>

            <button
              onClick={() => handleSwitchPosMode('income_entry')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                posMode === 'income_entry'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp size={15} />
              <span>บันทึกรายรับ</span>
            </button>

            <button
              onClick={() => handleSwitchPosMode('expense_entry')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                posMode === 'expense_entry'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TrendingDown size={15} />
              <span>บันทึกรายจ่าย</span>
            </button>
          </div>
        </div>

        {/* Today's Sales Banner Indicators */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              <ShoppingBag size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">ออเดอร์เปิดวันนี้</span>
              <span className="font-black text-slate-800 dark:text-slate-100">{posStats.orderCount} ออเดอร์</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <DollarSign size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">ยอดขาย POS วันนี้</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">฿{posStats.revenue.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">รอยืนยันชำระเงิน</span>
              <span className="font-black text-slate-800 dark:text-slate-100">{posStats.unpaidCount} รายการ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      {posMode === 'income_entry' ? (
        /* GENERAL INCOME MODE FORM */
        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md max-w-3xl mx-auto space-y-6"
          >
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">บันทึกรายรับทั่วไป (Store Income Entry)</h2>
              <p className="text-xs text-slate-500">บันทึกรายรับอื่นๆ, ค่ามัดจำสินค้า, ค่าบริการบำรุงรักษาสภาพ หรือเงินรับเข้าหน้าร้าน</p>
            </div>
          </div>

          <form onSubmit={handleCheckoutIncome} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">หมวดหมู่รายรับ *</label>
                <select
                  value={incomeData.category}
                  onChange={(e) => setIncomeData({...incomeData, category: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {incomeCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">จำนวนเงิน (บาท) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={incomeData.amount}
                  onChange={(e) => setIncomeData({...incomeData, amount: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">รายละเอียดรายการ *</label>
                <SpeechDictationButton
                  currentValue={incomeData.detail}
                  onTranscript={(text) => setIncomeData({...incomeData, detail: text})}
                  title="สั่งงานด้วยเสียงเพื่อพิมพ์รายละเอียดรายรับ"
                />
              </div>
              <input
                type="text"
                placeholder="ระบุรายละเอียด เช่น ค่าบริการตรวจเช็คระบบประจำปี, ค่ามัดจำสินค้าล่วงหน้า ฯลฯ"
                value={incomeData.detail}
                onChange={(e) => setIncomeData({...incomeData, detail: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />

              {suggestedIncomeCategory && suggestedIncomeCategory !== incomeData.category && (
                <div className="mt-2 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      แนะนำหมวดหมู่: <span className="font-black">"{suggestedIncomeCategory}"</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIncomeData({...incomeData, category: suggestedIncomeCategory});
                      notifyReaction('success', 'เปลี่ยนหมวดหมู่อัตโนมัติแล้ว');
                    }}
                    className="px-2.5 py-1 text-[10px] font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                  >
                    ใช้หมวดหมู่นี้
                  </button>
                </div>
              )}

              {recentlyUsedDescriptions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-500" />
                    <span>เลือกด่วนจากรายการขายซ้ำล่าสุด (Quick Select)</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {recentlyUsedDescriptions.map((desc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setIncomeData({
                            ...incomeData,
                            detail: desc.name,
                            amount: desc.price ? desc.price.toString() : incomeData.amount,
                            category: desc.subcategory || incomeData.category
                          });
                          notifyReaction('success', `เลือกรายการ "${desc.name}" เรียบร้อยแล้ว`);
                        }}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-200/50 dark:border-slate-700 cursor-pointer transition-colors max-w-full truncate text-left"
                      >
                        {desc.name} {desc.price ? `(฿${formatNumber(desc.price)})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ผู้ชำระเงิน / ลูกค้า (Payer / Customer)</label>
                <input
                  type="text"
                  placeholder="เช่น คุณสมชาย, บริษัท เอ บี ซี"
                  value={incomeData.payer}
                  onChange={(e) => setIncomeData({...incomeData, payer: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">วิธีชำระเงิน</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!incomeData.amount || parseFloat(incomeData.amount) <= 0) {
                        toast.error('กรุณาระบุจำนวนเงินก่อนสร้าง QR Code');
                        return;
                      }
                      setIsPromptPayModalOpen(true);
                    }}
                    className="text-[10px] font-black text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode size={12} />
                    <span>สร้าง QR PromptPay ตามยอด</span>
                  </button>
                </div>
                <select
                  value={incomeData.paymentMethod}
                  onChange={(e) => setIncomeData({...incomeData, paymentMethod: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {paymentMethods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">วันที่ทำรายการ</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Slip Capture */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">แนบรูปใบเสร็จ / สลิปโอนเงิน (Receipt / Slip Image)</label>
              <ReceiptCapture
                receiptUrl={incomeData.receiptUrl}
                onChange={(url) => setIncomeData({...incomeData, receiptUrl: url})}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 size={18} />
              <span>บันทึกรายรับ</span>
            </button>
          </form>
        </motion.div>
        </div>
      ) : posMode === 'expense_entry' ? (
        /* EXPENSE MODE FORM */
        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md max-w-3xl mx-auto space-y-6"
          >
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">บันทึกรายจ่ายหน้าร้าน (Store Expense Entry)</h2>
              <p className="text-xs text-slate-500">บันทึกค่าน้ำมัน, ค่าแรงช่าง, ซื้อของประกอบ หรือค่าใช้จ่ายเบิกหน้าร้าน</p>
            </div>
          </div>

          <form onSubmit={handleCheckoutExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">หมวดหมู่รายจ่าย *</label>
                <select
                  value={expenseData.category}
                  onChange={(e) => setExpenseData({...expenseData, category: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">จำนวนเงิน (บาท) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={expenseData.amount}
                  onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-black text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">รายละเอียดรายการ *</label>
                <SpeechDictationButton
                  currentValue={expenseData.detail}
                  onTranscript={(text) => setExpenseData({...expenseData, detail: text})}
                  title="สั่งงานด้วยเสียงเพื่อพิมพ์รายละเอียดรายจ่าย"
                />
              </div>
              <input
                type="text"
                placeholder="ระบุรายละเอียด เช่น ซื้อสายไฟเพิ่ม 30 เมตร, ค่าน้ำมันรถช่าง ฯลฯ"
                value={expenseData.detail}
                onChange={(e) => setExpenseData({...expenseData, detail: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />

              {suggestedExpenseCategory && suggestedExpenseCategory !== expenseData.category && (
                <div className="mt-2 flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/60 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      แนะนำหมวดหมู่: <span className="font-black">"{suggestedExpenseCategory}"</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setExpenseData({...expenseData, category: suggestedExpenseCategory});
                      notifyReaction('success', 'เปลี่ยนหมวดหมู่อัตโนมัติแล้ว');
                    }}
                    className="px-2.5 py-1 text-[10px] font-black bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                  >
                    ใช้หมวดหมู่นี้
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ร้านค้า / ผู้รับเงิน (Vendor / Recipient)</label>
                <input
                  type="text"
                  placeholder="เช่น ร้านไทวัสดุ, ปั๊ม PTT"
                  value={expenseData.vendor}
                  onChange={(e) => setExpenseData({...expenseData, vendor: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">วันที่ทำรายการ</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Slip Capture */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">แนบรูปใบเสร็จ / สลิปจ่ายเงิน (Receipt Image)</label>
              <ReceiptCapture
                receiptUrl={expenseData.receiptUrl}
                onChange={(url) => setExpenseData({...expenseData, receiptUrl: url})}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 size={18} />
              <span>บันทึกรายจ่าย</span>
            </button>
          </form>
        </motion.div>
        </div>
      ) : (
        /* POS SALE CATALOG & CART WORKSPACE */
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
          
          {/* Left Panel: Catalog & Custom Item */}
          <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 flex flex-col h-full min-h-0">
              
              {posMode === 'custom_sale' ? (
                /* CUSTOM SALE MODE HEADER */
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white">ขายด่วน / รายการพิเศษ (Quick Custom Sale)</h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">บันทึกรายการขายอุปกรณ์และค่าบริการพิเศษที่กำหนดราคาเองได้ทันที</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Filter Controls Header */
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                      <input 
                        type="text"
                        placeholder="ค้นหาชื่อชุดสินค้า, รุ่นอินเวอร์เตอร์, แผงโซล่า..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl pl-10 pr-9 py-2.5 font-bold text-xs outline-none focus:ring-2 focus:ring-brand text-slate-800 dark:text-white"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => {
                            setSearchQuery('');
                            toast.success('ล้างคำค้นหาเรียบร้อย');
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>

                    {/* View Switcher & Custom Item Trigger */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
                        <button
                          onClick={() => handleSwitchViewMode('grid')}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            viewMode === 'grid' 
                              ? 'bg-white dark:bg-slate-900 text-brand shadow-xs' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                          title="มุมมองการ์ด (Grid View)"
                        >
                          <LayoutGrid size={16} />
                        </button>
                        <button
                          onClick={() => handleSwitchViewMode('list')}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            viewMode === 'list' 
                              ? 'bg-white dark:bg-slate-900 text-brand shadow-xs' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                          title="มุมมองตาราง (Table View)"
                        >
                          <List size={16} />
                        </button>
                      </div>

                      <button
                        onClick={() => setShowCustomItemModal(true)}
                        className="px-3 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Plus size={15} />
                        <span>+ เพิ่มรายการพิเศษ</span>
                      </button>
                    </div>
                  </div>

                  {/* Category Ribbons */}
                  <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleCategoryFilter('all', 'ทั้งหมด')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                        activeCategory === 'all' 
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      ทั้งหมด ({standardSets.length})
                    </button>
                    {incomeCategories.map(cat => {
                      const count = standardSets.filter(s => 
                        cat.subcategories?.some(sub => sub.id === s.linkedSubcategoryId)
                      ).length;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryFilter(cat.id, cat.name)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                            activeCategory === cat.id 
                              ? 'bg-brand text-white shadow-md' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {cat.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Products Display (Grid vs List vs Custom Sale) */}
              <div className="flex-1 overflow-y-auto pr-1 mt-2 scrollbar-thin space-y-4">
                {posMode === 'custom_sale' ? (
                <div className="space-y-6">
                  {/* Dedicated Custom Sale Workspace */}
                  <div className="bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-900/20 dark:to-slate-950/20 rounded-2xl p-5 border border-indigo-100/80 dark:border-indigo-950/80 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="text-indigo-500" size={18} />
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">เพิ่มรายการพิเศษ / ค่าบริการ (Quick Entry)</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      กรอกรายละเอียดอุปกรณ์หรือค่าแรงติดตั้งที่ต้องการขายด่วน โดยไม่ต้องสร้างชุดสินค้าล่วงหน้าในระบบ
                    </p>

                    <form onSubmit={handleAddCustomItem} className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">ชื่อสินค้า/บริการ *</label>
                          <input
                            type="text"
                            placeholder="เช่น ค่าบริการเดินสายไฟเพิ่ม, แผงโซล่า 550W"
                            value={customItem.name}
                            onChange={e => setCustomItem({...customItem, name: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">ราคาต่อหน่วย (บาท)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={customItem.price}
                            onChange={e => setCustomItem({...customItem, price: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">จำนวน</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              value={customItem.quantity}
                              onChange={e => setCustomItem({...customItem, quantity: e.target.value})}
                              className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-800 dark:text-white text-center"
                            />
                            <button
                              type="submit"
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-sm transition-all"
                            >
                              <Plus size={14} />
                              <span>+ ใส่ตะกร้า</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* 5 Most Recently Used Item Descriptions Panel */}
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-500 animate-pulse" />
                        <span>5 รายการขายซ้ำล่าสุด (Top 5 Recently Sold Items)</span>
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        ดึงประวัติอัตโนมัติ
                      </span>
                    </div>

                    {recentlyUsedDescriptions.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {recentlyUsedDescriptions.map((desc, i) => (
                          <motion.div
                            key={i}
                            whileHover={{ y: -2 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-brand/60 hover:ring-2 hover:ring-brand/10 transition-all shadow-xs"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black uppercase text-brand tracking-widest bg-brand-soft dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                                  RECENTLY SOLD {i + 1}
                                </span>
                              </div>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2 leading-snug truncate" title={desc.name}>
                                {desc.name}
                              </h4>
                            </div>

                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 mt-2">
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">ราคาบันทึกล่าสุด</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                  {desc.price ? `฿${formatNumber(desc.price)}` : '฿0'}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const newItem: CartItem = {
                                    id: `custom_recent_${Date.now()}_${i}`,
                                    name: desc.name,
                                    price: desc.price || 0,
                                    quantity: 1,
                                    isCustom: true
                                  };
                                  setCart(prev => [...prev, newItem]);
                                  notifyReaction('success', `เพิ่ม "${desc.name}" ลงในตะกร้าเรียบร้อย`);
                                }}
                                className="px-3 py-1.5 bg-brand text-white rounded-xl text-[11px] font-black shadow-md shadow-brand/10 hover:brightness-105 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
                              >
                                <Plus size={13} />
                                <span>ใส่ตะกร้า</span>
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                          <ShoppingBag size={20} />
                        </div>
                        <p className="text-xs font-extrabold text-slate-400">ยังไม่มีประวัติการขายรายรับย่อย เพื่อนำมาประมวลผล</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : viewMode === 'grid' ? (
                (() => {
                  const solarKits = filteredSets.filter(s => s.id.startsWith('set_solar_std_'));
                  const batteryKits = filteredSets.filter(s => s.id.startsWith('set_bat_'));
                  const controlKits = filteredSets.filter(s => s.id.startsWith('set_inv_'));
                  const customKits = filteredSets.filter(s => s.id.startsWith('set_cust_'));
                  const otherKits = filteredSets.filter(s => 
                    !s.id.startsWith('set_solar_std_') && 
                    !s.id.startsWith('set_bat_') && 
                    !s.id.startsWith('set_inv_') && 
                    !s.id.startsWith('set_cust_')
                  );

                  const renderPOSGroup = (title: string, sets: typeof filteredSets, icon: React.ReactNode, bgColor: string, textColor: string, borderColor: string) => {
                    if (sets.length === 0) return null;
                    return (
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center space-x-2.5 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                          <div className={`p-1.5 rounded-xl ${bgColor} ${textColor} shrink-0 shadow-xs`}>
                            {icon}
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">
                              {title}
                            </h3>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3.5">
                          {sets.map(set => {
                            const cartItem = cart.find(i => i.id === set.id);
                            const qtyInCart = cartItem ? cartItem.quantity : 0;
                            return (
                              <motion.div
                                key={set.id}
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => addToCart(set)}
                                className={`group text-left relative flex flex-col justify-between bg-white dark:bg-slate-800 border rounded-2xl p-4 transition-all h-[155px] cursor-pointer overflow-hidden ${
                                  qtyInCart > 0 
                                    ? 'border-brand ring-2 ring-brand/20 shadow-md bg-brand-soft/20' 
                                    : 'border-slate-200/80 dark:border-slate-700/80 hover:border-brand hover:shadow-xs'
                                }`}
                              >
                                {qtyInCart > 0 && (
                                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-brand text-white text-[9px] font-black rounded-full shadow-xs">
                                    เลือกแล้ว {qtyInCart}
                                  </div>
                                )}
                                
                                <div className="w-full">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className={`p-1.5 rounded-lg ${bgColor} bg-opacity-10 dark:bg-opacity-20 ${textColor} shrink-0`}>
                                      {icon}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setInspectingSet(set);
                                      }}
                                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                                      title="เช็คอุปกรณ์ในชุด"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  </div>
                                  
                                  <h4 className="text-xs font-black text-slate-800 dark:text-white line-clamp-2 leading-snug">
                                    {set.name}
                                  </h4>
                                </div>

                                <div className="w-full flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-1">
                                  <div>
                                    <span className="text-[8px] font-bold text-slate-400 block uppercase">ราคาพิเศษ</span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">
                                      ฿{formatNumber(set.price)}
                                    </span>
                                  </div>
                                  <div className="p-1 rounded-lg bg-brand text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={11} />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="space-y-4">
                      {renderPOSGroup('ชุดโซล่ามาตรฐาน (Standard Solar Kits)', solarKits, <Sun size={15} />, 'bg-amber-50 dark:bg-amber-950/40', 'text-amber-500', 'border-amber-100')}
                      {renderPOSGroup('ชุดแบตเตอรี่ (Lithium Battery Kits)', batteryKits, <BatteryCharging size={15} />, 'bg-emerald-50 dark:bg-emerald-950/40', 'text-emerald-500', 'border-emerald-100')}
                      {renderPOSGroup('ชุดกล่องควบคุม & อินเวอร์เตอร์ (Inverter & Combiner Kits)', controlKits, <Cpu size={15} />, 'bg-purple-50 dark:bg-purple-950/40', 'text-purple-500', 'border-purple-100')}
                      {renderPOSGroup('ชุดCustom & อุปกรณ์ประกอบช่าง (Custom Solar Kits)', customKits, <Wrench size={15} />, 'bg-blue-50 dark:bg-blue-950/40', 'text-blue-500', 'border-blue-100')}
                      {renderPOSGroup('อุปกรณ์ทั่วไปอื่นๆ (General Components)', otherKits, <Layers size={15} />, 'bg-slate-50 dark:bg-slate-800/40', 'text-slate-500', 'border-slate-200')}
                    </div>
                  );
                })()
              ) : (
                /* TABLE / LIST VIEW */
                <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-3">ชื่อชุดสินค้า</th>
                        <th className="p-3">อุปกรณ์ในชุด</th>
                        <th className="p-3">ราคามาตรฐาน</th>
                        <th className="p-3 text-right">ดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredSets.map(set => {
                        const cartItem = cart.find(i => i.id === set.id);
                        return (
                          <tr key={set.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-black text-slate-900 dark:text-white">
                              {set.name}
                              {cartItem && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-brand text-white rounded-md font-extrabold">
                                  x{cartItem.quantity}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-500 font-bold max-w-xs truncate">
                              {set.items.map(i => i.name).join(', ')}
                            </td>
                            <td className="p-3 font-black text-slate-900 dark:text-white">
                              ฿{formatNumber(set.price)}
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => setInspectingSet(set)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 cursor-pointer inline-block"
                                title="ดูรายละเอียด"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => addToCart(set)}
                                className="px-3 py-1.5 bg-brand text-white font-black text-[11px] rounded-lg shadow-xs hover:brightness-105 cursor-pointer inline-flex items-center space-x-1"
                              >
                                <Plus size={13} />
                                <span>เพิ่ม</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {posMode !== 'custom_sale' && filteredSets.length === 0 && (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
                    <ShoppingBag size={28} />
                  </div>
                  <p className="text-xs font-extrabold text-slate-400">ไม่พบสินค้ามาตรฐานในหมวดหมู่นี้</p>
                </div>
              )}
              </div> {/* Close Scrollable Product Catalog Area */}
            </div>
          </div>

          {/* Right Panel: Order Cart & Checkout Drawer */}
          <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 flex flex-col h-full min-h-0 overflow-hidden">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col h-full min-h-0">
              
              {/* Cart Header */}
              <div className="p-5 bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-tight">รายการสินค้าในตะกร้า</h3>
                      <p className="text-[10px] text-slate-400 font-bold">POS ORDER BILLING</p>
                    </div>
                  </div>

                  {cart.length > 0 && (
                    <button 
                      onClick={handleClearCart}
                      className="text-[10px] font-black uppercase text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      ล้างตะกร้า
                    </button>
                  )}
                </div>

                {/* Live Amount Banner */}
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">ยอดชำระสุทธิ (Grand Total)</span>
                    <span className="text-2xl font-black text-emerald-400">฿{formatNumber(netTotalAmount)}</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-extrabold rounded-full">
                      {cart.reduce((s, i) => s + i.quantity, 0)} รายการ
                    </span>
                  </div>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="p-4 space-y-2.5 flex-1 min-h-0 overflow-y-auto border-b border-slate-100 dark:border-slate-800">
                {cart.map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center space-x-1">
                        {item.isCustom && (
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded text-[9px] font-black shrink-0">
                            กำหนดเอง
                          </span>
                        )}
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500">
                        ฿{formatNumber(item.price)} x {item.quantity} = <span className="font-black text-slate-800 dark:text-slate-200">฿{formatNumber(item.price * item.quantity)}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-brand font-black cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-900 dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-brand font-black cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id, item.name)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="py-8 text-center space-y-1 opacity-50">
                    <ShoppingBag size={32} className="mx-auto text-slate-400" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">ยังไม่มีสินค้าในตะกร้า</p>
                  </div>
                )}
              </div>

              {/* Order Adjustments (Discounts & Delivery Fee) */}
              {cart.length > 0 && (
                <div className="p-4 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Discount Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">ส่วนลด (Discount)</label>
                        <button
                          type="button"
                          onClick={handleToggleDiscountType}
                          className="text-[9px] font-black text-indigo-500 hover:underline cursor-pointer"
                        >
                          [{discountType === 'baht' ? 'บาท ฿' : 'เปอร์เซ็นต์ %'}]
                        </button>
                      </div>
                      <input
                        type="number"
                        placeholder="0"
                        value={discountAmount || ''}
                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Shipping Fee Input */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">ค่าจัดส่ง / ติดตั้ง</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={shippingFee || ''}
                        onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Price Calculation Summary Breakdown */}
                  <div className="space-y-1 text-[11px] pt-1">
                    <div className="flex justify-between text-slate-500">
                      <span>ยอดรวมสินค้า (Subtotal):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">฿{formatNumber(cartSubtotal)}</span>
                    </div>
                    {calculatedDiscount > 0 && (
                      <div className="flex justify-between text-rose-500 font-bold">
                        <span>ส่วนลด ({discountType === 'percent' ? `${discountAmount}%` : 'บาท'}):</span>
                        <span>-฿{formatNumber(calculatedDiscount)}</span>
                      </div>
                    )}
                    {shippingFee > 0 && (
                      <div className="flex justify-between text-indigo-500 font-bold">
                        <span>ค่าขนส่ง/ติดตั้ง:</span>
                        <span>+฿{formatNumber(shippingFee)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer & Shipping Form */}
              <div className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
                
                {/* CRM Customer Quick Selector */}
                {crmCustomers.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 flex items-center justify-between">
                      <span>เลือกลูกค้าจากฐานข้อมูล CRM ({crmCustomers.length} ราย)</span>
                    </label>
                    <select
                      onChange={(e) => {
                        const selected = crmCustomers.find(c => c.id === e.target.value);
                        if (selected) handleSelectCRMCustomer(selected);
                      }}
                      value={customer.id || ''}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand mb-2"
                    >
                      <option value="">-- พิมพ์ใหม่ หรือ เลือกจาก CRM --</option>
                      {crmCustomers.map(c => (
                        <option key={c.id} value={c.id}>
                          👤 {c.name} {c.phoneNumber ? `(${c.phoneNumber})` : ''} {c.customerTaxId ? `[เลขภาษี: ${c.customerTaxId}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Recent Customer Selector */}
                {recentCustomers.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">
                      เลือกลูกค้าล่าสุด (Recent Purchases)
                    </label>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {recentCustomers.map((cust, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectRecentCustomer(cust)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-brand/10 hover:text-brand text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-colors"
                        >
                          👤 {cust.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Details Form */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
                    <div className="flex items-center space-x-1.5">
                      <User size={14} className="text-brand" />
                      <span className="text-xs font-black uppercase tracking-wider">ข้อมูลผู้ซื้อ / ลูกค้า</span>
                    </div>
                    {customer.id && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        เชื่อมโยง CRM แล้ว
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="ชื่อลูกค้า *" 
                      value={customer.name}
                      onChange={e => setCustomer({...customer, name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand"
                    />
                    <input 
                      type="tel" 
                      placeholder="เบอร์โทรศัพท์" 
                      value={customer.phone}
                      onChange={e => setCustomer({...customer, phone: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">ที่อยู่จัดส่ง / ติดตั้ง</span>
                    <SpeechDictationButton
                      currentValue={customer.address}
                      onTranscript={(text) => setCustomer({...customer, address: text})}
                      title="สั่งงานด้วยเสียงเพื่อพิมพ์ที่อยู่จัดส่ง"
                    />
                  </div>
                  <textarea 
                    placeholder="ที่อยู่จัดส่ง / ติดตั้ง (เลขที่, หมู่บ้าน, ถนน, ตำบล)" 
                    rows={2}
                    value={customer.address}
                    onChange={e => setCustomer({...customer, address: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand resize-none"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={customer.province}
                      onChange={e => setCustomer({...customer, province: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-white"
                    >
                      {ThaiProvinces.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>

                    <input 
                      type="text" 
                      placeholder="รหัสไปรษณีย์" 
                      value={customer.zipcode}
                      onChange={e => setCustomer({...customer, zipcode: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Tax Invoice Info (Optional) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      ข้อมูลสำหรับออกใบกำกับภาษี (Tax Invoice Info)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="เลขประจำตัวผู้เสียภาษี (13 หลัก)"
                        value={customer.customerTaxId}
                        onChange={e => setCustomer({...customer, customerTaxId: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="สาขา (เช่น สำนักงานใหญ่)"
                        value={customer.customerBranch}
                        onChange={e => setCustomer({...customer, customerBranch: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Date & Interactive Shipping Status */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200">
                    <Truck size={14} className="text-brand" />
                    <span className="text-xs font-black uppercase tracking-wider">วันจัดส่ง & สถานะจัดส่ง</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">วันจัดส่ง / ติดตั้ง</label>
                    <input 
                      type="date" 
                      value={shipping.deliveryDate}
                      onChange={e => setShipping({...shipping, deliveryDate: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase">หมายเหตุการสั่งซื้อ / ข้อมูลช่าง</label>
                      <SpeechDictationButton
                        currentValue={shipping.note}
                        onTranscript={(text) => setShipping({...shipping, note: text})}
                        title="สั่งงานด้วยเสียงเพื่อพิมพ์หมายเหตุการสั่งซื้อ"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="เช่น ติดตั้งบนกระเบื้องลอนคู่, มัดจำล่วงหน้า 5000 บาท"
                      value={shipping.note}
                      onChange={e => setShipping({...shipping, note: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">เลือกสถานะจัดส่ง (Shipping Status)</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { status: 'สั่งซื้อแล้ว' as ShippingStatus, icon: '📦', label: 'สั่งซื้อแล้ว' },
                        { status: 'กำลังประกอบ' as ShippingStatus, icon: '🔧', label: 'กำลังประกอบ' },
                        { status: 'กำลังขนส่ง' as ShippingStatus, icon: '🚚', label: 'กำลังขนส่ง' },
                        { status: 'จัดส่งสำเร็จ' as ShippingStatus, icon: '✅', label: 'จัดส่งสำเร็จ' },
                      ].map(item => (
                        <button
                          key={item.status}
                          type="button"
                          onClick={() => handleSelectShippingStatus(item.status)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 border ${
                            shipping.status === item.status
                              ? 'bg-brand text-white border-brand shadow-sm scale-[1.02]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-brand/40'
                          }`}
                        >
                          <span className="text-sm">{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interactive Payment Options */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
                    <div className="flex items-center space-x-1.5">
                      <CreditCard size={14} className="text-indigo-500" />
                      <span className="text-xs font-black uppercase tracking-wider">วิธีชำระเงิน & สถานะการเงิน</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPromptPayModalOpen(true)}
                      className="px-2.5 py-1 bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-[11px] font-black hover:bg-purple-100 dark:hover:bg-purple-900 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <QrCode size={13} />
                      <span>สแกนจ่าย PromptPay QR</span>
                    </button>
                  </div>

                  {/* Quick Dynamic PromptPay QR Banner */}
                  <div className="p-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
                        <QrCode size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black truncate">Thai QR PromptPay</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-500/40 text-blue-200 shrink-0">
                            Dynamic
                          </span>
                        </div>
                        <p className="text-[10px] text-blue-200/80 truncate">
                          สร้าง QR Code รับเงิน ฿{formatNumber(netTotalAmount)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPromptPayModalOpen(true)}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-black rounded-xl shadow transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <QrCode size={13} />
                      <span>เปิด QR</span>
                    </button>
                  </div>

                  {/* Payment Method Interactive Buttons */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">เลือกวิธีชำระเงิน (Payment Method)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {paymentMethods.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleSelectPaymentMethod(m)}
                          className={`py-2 px-2 rounded-xl text-[11px] font-black transition-all cursor-pointer text-center border truncate ${
                            payment.method === m
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-[1.02]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Status Buttons */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">สถานะชำระเงิน (Payment Status)</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                      <button 
                        type="button"
                        onClick={() => handleSelectPaymentStatus('paid')}
                        className={`py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                          payment.status === 'paid' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <CheckCircle2 size={15} />
                        <span>ชำระแล้ว (Paid)</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleSelectPaymentStatus('unpaid')}
                        className={`py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                          payment.status === 'unpaid' ? 'bg-rose-500 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <Clock size={15} />
                        <span>ค้างชำระ (Unpaid)</span>
                      </button>
                    </div>
                  </div>

                  {/* Slip Capture Integration */}
                  <div className="pt-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">แนบสลิป/หลักฐานชำระเงิน</label>
                    <ReceiptCapture
                      receiptUrl={payment.receiptUrl}
                      onChange={(url) => setPayment({...payment, receiptUrl: url})}
                    />
                  </div>
                </div>

                {/* Action Buttons: Cancel Sale & Checkout Submit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button"
                    onClick={handleCancelSale}
                    disabled={isSubmitting || (cart.length === 0 && !customer.name && !customer.phone)}
                    className="py-3.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 disabled:opacity-40 rounded-2xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <XCircle size={16} />
                    <span>ยกเลิกการขาย</span>
                  </button>

                  <button 
                    type="button"
                    onClick={handleCheckoutSale}
                    disabled={isSubmitting || cart.length === 0}
                    className="py-3.5 px-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>บันทึกการขาย (฿{formatNumber(netTotalAmount)})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT SET ITEMS MODAL */}
      {inspectingSet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[9px] font-black uppercase text-brand">STANDARD KIT DETAILS</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{inspectingSet.name}</h3>
              </div>
              <button 
                onClick={() => setInspectingSet(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-xs font-bold text-slate-400">รายการอุปกรณ์ย่อยที่รวมในชุดนี้:</span>
              <div className="space-y-1.5">
                {inspectingSet.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs font-bold border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="px-2 py-0.5 bg-brand-soft text-brand rounded-lg text-[10px] font-black">
                      {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                ราคาชุด: ฿{formatNumber(inspectingSet.price)}
              </span>
              <button
                onClick={() => {
                  addToCart(inspectingSet);
                  setInspectingSet(null);
                }}
                className="px-4 py-2 bg-brand text-white font-black text-xs rounded-xl shadow-md hover:brightness-105 cursor-pointer"
              >
                + เพิ่มเข้าตะกร้า
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ADD CUSTOM ITEM MODAL */}
      {showCustomItemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Wrench size={18} className="text-indigo-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">เพิ่มรายการพิเศษ / บริการ</h3>
              </div>
              <button 
                onClick={() => setShowCustomItemModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-500">ชื่อรายการสินค้า/บริการ *</label>
                  <SpeechDictationButton
                    currentValue={customItem.name}
                    onTranscript={(text) => setCustomItem({...customItem, name: text})}
                    title="พูดบอกชื่อรายการสินค้าหรือบริการ"
                  />
                </div>
                <input
                  type="text"
                  placeholder="เช่น ค่าบริการเดินสายไฟเพิ่ม 15m, ค่าตรวจเช็คระบบ"
                  value={customItem.name}
                  onChange={e => setCustomItem({...customItem, name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white"
                  required
                />

                {recentlyUsedDescriptions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-500" />
                      <span>เลือกด่วนจากรายการขายล่าสุด (Quick Select)</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {recentlyUsedDescriptions.map((desc, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setCustomItem({
                              name: desc.name,
                              price: desc.price ? desc.price.toString() : '',
                              quantity: '1'
                            });
                            notifyReaction('success', `เลือกรายการ "${desc.name}" เรียบร้อยแล้ว`);
                          }}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-200/50 dark:border-slate-700 cursor-pointer transition-colors max-w-full truncate text-left"
                        >
                          {desc.name} {desc.price ? `(฿${formatNumber(desc.price)})` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">ราคาต่อหน่วย (บาท)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={customItem.price}
                    onChange={e => setCustomItem({...customItem, price: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">จำนวน</label>
                  <input
                    type="number"
                    min="1"
                    value={customItem.quantity}
                    onChange={e => setCustomItem({...customItem, quantity: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md"
                >
                  เพิ่มลงตะกร้า
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* DYNAMIC PROMPTPAY QR MODAL */}
      <PromptPayModal
        isOpen={isPromptPayModalOpen}
        onClose={() => setIsPromptPayModalOpen(false)}
        amount={posMode === 'income_entry' ? (parseFloat(incomeData.amount) || 0) : netTotalAmount}
        promptPayId={config.shopInfo?.promptPayId || '0812345678'}
        accountName={config.shopInfo?.bankAccountName || config.shopInfo?.name || 'ร้านกลางนาโซล่าเซลล์'}
        bankName={config.shopInfo?.bankName || 'พร้อมเพย์ (PromptPay)'}
        orderNumber={cart.length > 0 ? `POS-${Date.now().toString().slice(-6)}` : undefined}
        onConfirmPayment={() => {
          if (posMode === 'income_entry') {
            setIncomeData(prev => ({ ...prev, paymentMethod: 'พร้อมเพย์ (PromptPay)' }));
          } else {
            setPayment(prev => ({ ...prev, status: 'paid', method: 'พร้อมเพย์ (PromptPay)' }));
          }
          toast.success('ยืนยันสถานะชำระเงินผ่าน PromptPay เรียบร้อยแล้ว');
        }}
      />
    </div>
  );
}
