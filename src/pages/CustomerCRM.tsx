import React, { useState, useMemo } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { useTransactions } from '../hooks/useTransactions';
import { useAppConfig } from '../hooks/useAppConfig';
import { Customer, Transaction, DocumentType } from '../types';
import DocumentGeneratorModal from '../components/DocumentGeneratorModal';
import { 
  Users, UserPlus, Search, Phone, Mail, MapPin, Building, FileText, 
  Receipt, ShoppingBag, CreditCard, Edit3, Trash2, X, Check, Filter, 
  ArrowUpDown, Calendar, ChevronRight, AlertCircle, DollarSign, ExternalLink,
  ShieldCheck, FileCheck, Plus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { notifyReaction } from '../utils/feedback';

interface CustomerCRMProps {
  onNavigateToAddTransactionWithCustomer?: (customer: Customer) => void;
}

export default function CustomerCRM({ onNavigateToAddTransactionWithCustomer }: CustomerCRMProps) {
  const { customers, loading: customersLoading, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { transactions } = useTransactions();
  const { config } = useAppConfig();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'has_orders' | 'has_unpaid' | 'has_tax_id'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'total_spent' | 'order_count' | 'recent'>('recent');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);

  // Document Generator Modal for a selected transaction
  const [selectedTxForDoc, setSelectedTxForDoc] = useState<Transaction | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('full_tax_invoice');

  // Form State
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
    name: '',
    phoneNumber: '',
    email: '',
    customerTaxId: '',
    customerBranch: 'สำนักงานใหญ่',
    customerAddress: '',
    district: '',
    province: 'กรุงเทพมหานคร',
    zipcode: '',
    note: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate customer purchase history mapping
  const customerStatsMap = useMemo(() => {
    const map = new Map<string, {
      orders: Transaction[];
      totalSpent: number;
      paidAmount: number;
      unpaidAmount: number;
      lastOrderDate: string | null;
    }>();

    transactions.forEach(tx => {
      const details = tx.saleOrderDetails;
      const amt = Number(tx.amount) || 0;
      const isPaid = details?.paymentStatus === 'paid';

      // Match by customerId, tax ID, phone, or exact name
      customers.forEach(c => {
        if (!c.id) return;

        const isMatched = 
          (details?.customerId && details.customerId === c.id) ||
          (c.customerTaxId && details?.customerTaxId && c.customerTaxId.trim() === details.customerTaxId.trim()) ||
          (c.phoneNumber && details?.phoneNumber && c.phoneNumber.replace(/\D/g, '') === details.phoneNumber.replace(/\D/g, '')) ||
          (c.name && details?.customerName && c.name.trim().toLowerCase() === details.customerName.trim().toLowerCase());

        if (isMatched) {
          const current = map.get(c.id) || {
            orders: [],
            totalSpent: 0,
            paidAmount: 0,
            unpaidAmount: 0,
            lastOrderDate: null
          };

          current.orders.push(tx);
          current.totalSpent += amt;
          if (isPaid) current.paidAmount += amt;
          else current.unpaidAmount += amt;

          if (!current.lastOrderDate || tx.date > current.lastOrderDate) {
            current.lastOrderDate = tx.date;
          }

          map.set(c.id, current);
        }
      });
    });

    return map;
  }, [customers, transactions]);

  // Overall CRM Analytics
  const analytics = useMemo(() => {
    let totalSpentSum = 0;
    let totalUnpaidSum = 0;
    let customersWithOrders = 0;

    customers.forEach(c => {
      if (!c.id) return;
      const stat = customerStatsMap.get(c.id);
      if (stat && stat.orders.length > 0) {
        customersWithOrders++;
        totalSpentSum += stat.totalSpent;
        totalUnpaidSum += stat.unpaidAmount;
      }
    });

    return {
      totalCustomers: customers.length,
      customersWithOrders,
      totalSpentSum,
      totalUnpaidSum
    };
  }, [customers, customerStatsMap]);

  // Filter & Sort Customer List
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        c.name.toLowerCase().includes(search) ||
        (c.phoneNumber && c.phoneNumber.includes(search)) ||
        (c.customerTaxId && c.customerTaxId.includes(search)) ||
        (c.province && c.province.toLowerCase().includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search));

      if (!matchesSearch) return false;

      const stat = c.id ? customerStatsMap.get(c.id) : null;
      const orderCount = stat?.orders.length || 0;
      const unpaid = stat?.unpaidAmount || 0;

      if (filterType === 'has_orders' && orderCount === 0) return false;
      if (filterType === 'has_unpaid' && unpaid === 0) return false;
      if (filterType === 'has_tax_id' && (!c.customerTaxId || !c.customerTaxId.trim())) return false;

      return true;
    }).sort((a, b) => {
      const statA = a.id ? customerStatsMap.get(a.id) : null;
      const statB = b.id ? customerStatsMap.get(b.id) : null;

      if (sortBy === 'total_spent') {
        return (statB?.totalSpent || 0) - (statA?.totalSpent || 0);
      }
      if (sortBy === 'order_count') {
        return (statB?.orders.length || 0) - (statA?.orders.length || 0);
      }
      if (sortBy === 'recent') {
        const dateA = statA?.lastOrderDate || a.createdAt || '';
        const dateB = statB?.lastOrderDate || b.createdAt || '';
        return dateB.localeCompare(dateA);
      }
      return a.name.localeCompare(b.name, 'th');
    });
  }, [customers, searchTerm, filterType, sortBy, customerStatsMap]);

  // Form Handlers
  const handleOpenAddForm = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phoneNumber: '',
      email: '',
      customerTaxId: '',
      customerBranch: 'สำนักงานใหญ่',
      customerAddress: '',
      district: '',
      province: 'กรุงเทพมหานคร',
      zipcode: '',
      note: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phoneNumber: customer.phoneNumber || '',
      email: customer.email || '',
      customerTaxId: customer.customerTaxId || '',
      customerBranch: customer.customerBranch || 'สำนักงานใหญ่',
      customerAddress: customer.customerAddress || '',
      district: customer.district || '',
      province: customer.province || 'กรุงเทพมหานคร',
      zipcode: customer.zipcode || '',
      note: customer.note || ''
    });
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      notifyReaction('warning', 'กรุณาระบุชื่อลูกค้าหรือชื่อบริษัท');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCustomer && editingCustomer.id) {
        await updateCustomer(editingCustomer.id, formData);
        notifyReaction('success', 'อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว');
      } else {
        await addCustomer(formData);
        notifyReaction('success', 'บันทึกข้อมูลลูกค้าใหม่เรียบร้อยแล้ว');
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error(error);
      notifyReaction('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลูกค้า');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบลูกค้ารายนี้ "${name}"?`)) {
      try {
        await deleteCustomer(id);
        notifyReaction('delete', 'ลบข้อมูลลูกค้าเรียบร้อยแล้ว');
      } catch (error) {
        notifyReaction('error', 'ไม่สามารถลบข้อมูลลูกค้าได้');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-900 dark:to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl text-xs font-black border border-emerald-500/30">
              <Users size={14} />
              <span>CUSTOMER CRM & TAX DATABASE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              ฐานข้อมูลลูกค้า & ประวัติสั่งซื้อ
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              จัดเก็บรายชื่อ เบอร์โทรศัพท์ เลขประจำตัวผู้เสียภาษี 13 หลัก และเชื่อมโยงประวัติสั่งซื้อโซล่าเซลล์/ใบกำกับภาษีของลูกค้ารายบุคคลได้อย่างแม่นยำ
            </p>
          </div>

          <button
            onClick={handleOpenAddForm}
            className="self-start md:self-center px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <UserPlus size={18} />
            <span>+ เพิ่มลูกค้ารายใหม่</span>
          </button>
        </div>

        {/* Decorative Background Icon */}
        <Users className="absolute -right-6 -bottom-6 text-white/5 w-64 h-64 pointer-events-none" />
      </div>

      {/* Analytics KPI Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ลูกค้าในระบบ</span>
              <span className="text-xl font-black text-slate-900 dark:text-white block mt-0.5">
                {analytics.totalCustomers.toLocaleString()} ราย
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <ShoppingBag size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ลูกค้าที่มีออเดอร์</span>
              <span className="text-xl font-black text-slate-900 dark:text-white block mt-0.5">
                {analytics.customersWithOrders.toLocaleString()} ราย
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ยอดสั่งซื้อสะสม</span>
              <span className="text-lg font-black text-slate-900 dark:text-white block mt-0.5">
                ฿{analytics.totalSpentSum.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
              <AlertCircle size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ยอดค้างชำระรวม</span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400 block mt-0.5">
                ฿{analytics.totalUnpaidSum.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, บริษัท, เบอร์โทร, เลขผู้เสียภาษี 13 หลัก, จังหวัด..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills & Sort Selector */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2">
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'has_orders', label: 'มีประวัติซื้อ' },
                { id: 'has_unpaid', label: 'ค้างชำระ' },
                { id: 'has_tax_id', label: 'มีเลขผู้เสียภาษี' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    filterType === f.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl px-3 py-2 outline-none"
            >
              <option value="recent">เรียงตามรายการล่าสุด</option>
              <option value="total_spent">เรียงตามยอดซื้อสูงสุด</option>
              <option value="order_count">เรียงตามจำนวนออเดอร์</option>
              <option value="name">เรียงตามชื่อ (ก-ฮ)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Customer Directory Grid */}
      {customersLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="text-xs font-bold text-slate-400">กำลังโหลดข้อมูลลูกค้า...</span>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Users size={40} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">ไม่พบรายชื่อลูกค้าตรงตามเงื่อนไข</h3>
          <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหา หรือเพิ่มลูกค้ารายใหม่เข้าสู่ระบบ CRM</p>
          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center space-x-1.5"
          >
            <UserPlus size={14} />
            <span>+ เพิ่มลูกค้ารายใหม่</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const stat = customer.id ? customerStatsMap.get(customer.id) : null;
            const orderCount = stat?.orders.length || 0;
            const totalSpent = stat?.totalSpent || 0;
            const unpaidAmount = stat?.unpaidAmount || 0;

            return (
              <div
                key={customer.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top Customer Badges & Title */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-black text-base uppercase shrink-0 shadow-2xs">
                        {customer.name.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {customer.name}
                        </h3>
                        {customer.customerBranch && (
                          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block">
                            สาขา: {customer.customerBranch}
                          </span>
                        )}
                      </div>
                    </div>

                    {customer.customerTaxId && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-200 dark:border-emerald-800 shrink-0 flex items-center space-x-1">
                        <ShieldCheck size={11} />
                        <span>TAX VAT</span>
                      </span>
                    )}
                  </div>

                  {/* Customer Info Lines */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {customer.phoneNumber && (
                      <div className="flex items-center space-x-2">
                        <Phone size={13} className="text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-900 dark:text-white">{customer.phoneNumber}</span>
                      </div>
                    )}

                    {customer.customerTaxId && (
                      <div className="flex items-center space-x-2">
                        <FileText size={13} className="text-slate-400 shrink-0" />
                        <span>เลขผู้เสียภาษี: <strong className="text-slate-800 dark:text-slate-200">{customer.customerTaxId}</strong></span>
                      </div>
                    )}

                    {(customer.customerAddress || customer.province) && (
                      <div className="flex items-start space-x-2 text-[11px] text-slate-500 leading-relaxed">
                        <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {[customer.customerAddress, customer.district, customer.province, customer.zipcode].filter(Boolean).join(' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase Stats Pill */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400 text-[11px]">ประวัติการซื้อขาย:</span>
                    <span className="text-slate-900 dark:text-white font-black">{orderCount} รายการ</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">ยอดสะสม:</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      ฿{totalSpent.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                    </span>
                  </div>

                  {unpaidAmount > 0 && (
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-700 dark:text-rose-400">ค้างชำระ:</span>
                      <span className="font-black text-rose-600 dark:text-rose-400">฿{unpaidAmount.toLocaleString('th-TH')}</span>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="pt-2 flex items-center space-x-1.5">
                    <button
                      onClick={() => setSelectedCustomerForHistory(customer)}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Receipt size={13} />
                      <span>ประวัติ & ออกเอกสาร</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditForm(customer)}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="แก้ไขข้อมูลลูกค้า"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      onClick={() => customer.id && handleDelete(customer.id, customer.name)}
                      className="p-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="ลบลูกค้ารายนี้"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT CUSTOMER */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users size={20} className="text-emerald-400" />
                <h3 className="text-base font-black">
                  {editingCustomer ? 'แก้ไขข้อมูลลูกค้า / องค์กร' : 'ลงทะเบียนลูกค้าใหม่ในระบบ CRM'}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  ชื่อลูกค้า / ชื่อบริษัท / ร้านค้า *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น บริษัท กลางนาโซล่าเซลล์ จำกัด หรือ คุณสมชาย ใจดี"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    placeholder="08X-XXX-XXXX"
                    value={formData.phoneNumber || ''}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    placeholder="customer@email.com"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Tax Details */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-500" />
                  <span>ข้อมูลภาษีสำหรับออกใบกำกับภาษีเต็มรูปแบบ</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      เลขประจำตัวผู้เสียภาษี (13 หลัก)
                    </label>
                    <input
                      type="text"
                      placeholder="01055XXXXXXXX"
                      value={formData.customerTaxId || ''}
                      onChange={e => setFormData({ ...formData, customerTaxId: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      สาขา
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น สำนักงานใหญ่"
                      value={formData.customerBranch || ''}
                      onChange={e => setFormData({ ...formData, customerBranch: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Address Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    ที่อยู่ (บ้านเลขที่, ถนน, หมู่บ้าน)
                  </label>
                  <input
                    type="text"
                    placeholder="123/45 หมู่ 2 ถ.มิตรภาพ"
                    value={formData.customerAddress || ''}
                    onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ตำบล / อำเภอ</label>
                    <input
                      type="text"
                      placeholder="ต.ในเมือง อ.เมือง"
                      value={formData.district || ''}
                      onChange={e => setFormData({ ...formData, district: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">จังหวัด *</label>
                    <input
                      type="text"
                      required
                      placeholder="ขอนแก่น"
                      value={formData.province}
                      onChange={e => setFormData({ ...formData, province: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">รหัสไปรษณีย์</label>
                    <input
                      type="text"
                      placeholder="40000"
                      value={formData.zipcode || ''}
                      onChange={e => setFormData({ ...formData, zipcode: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  หมายเหตุ / สเปกโซล่าเซลล์ที่ลูกค้าสนใจ
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น สนใจชุด Hybrid On-grid 5kW, โครงสร้างหลังคาซีแพค"
                  value={formData.note || ''}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลลูกค้า'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: CUSTOMER PURCHASE HISTORY & DOCUMENT GENERATION */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-500 text-slate-950 font-black rounded-xl flex items-center justify-center text-sm">
                  {selectedCustomerForHistory.name.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    <span>{selectedCustomerForHistory.name}</span>
                    {selectedCustomerForHistory.customerBranch && (
                      <span className="text-xs font-normal text-slate-300">({selectedCustomerForHistory.customerBranch})</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {selectedCustomerForHistory.phoneNumber} • {selectedCustomerForHistory.province}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerForHistory(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Summary Strip */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">เลขผู้เสียภาษี:</span>
                <span className="font-black text-slate-800 dark:text-slate-200">
                  {selectedCustomerForHistory.customerTaxId || 'ไม่ได้ระบุ'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">อีเมล:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {selectedCustomerForHistory.email || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">ที่อยู่จัดส่ง:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {[selectedCustomerForHistory.customerAddress, selectedCustomerForHistory.province].filter(Boolean).join(' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">ยอดสั่งซื้อสะสม:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  ฿{(customerStatsMap.get(selectedCustomerForHistory.id || '')?.totalSpent || 0).toLocaleString('th-TH')}
                </span>
              </div>
            </div>

            {/* History Table Scrollable Area */}
            <div className="p-5 overflow-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                  <ShoppingBag size={16} className="text-emerald-500" />
                  <span>รายการสั่งซื้อ & ออกใบกำกับภาษี ({customerStatsMap.get(selectedCustomerForHistory.id || '')?.orders.length || 0} ออเดอร์)</span>
                </h4>
              </div>

              {(!customerStatsMap.get(selectedCustomerForHistory.id || '') || customerStatsMap.get(selectedCustomerForHistory.id || '')?.orders.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs">
                  ยังไม่มีประวัติการสั่งซื้อสำหรับลูกค้ารายนี้
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="bg-slate-900 text-white font-black uppercase">
                      <tr>
                        <th className="p-3">วันที่</th>
                        <th className="p-3">รายการ / สเปกโซล่าเซลล์</th>
                        <th className="p-3 text-right">จำนวนเงิน</th>
                        <th className="p-3 text-center">สถานะชำระ</th>
                        <th className="p-3 text-center">พิมพ์ / ออกใบกำกับภาษี</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {customerStatsMap.get(selectedCustomerForHistory.id || '')?.orders.map(tx => {
                        const amt = Number(tx.amount) || 0;
                        const isPaid = tx.saleOrderDetails?.paymentStatus === 'paid';

                        return (
                          <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-bold text-slate-500">
                              {format(parseISO(tx.date), 'dd/MM/yyyy HH:mm')}
                            </td>
                            <td className="p-3">
                              <div className="font-black text-slate-900 dark:text-white">
                                {tx.subcategory || tx.category}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {tx.detail || '-'}
                              </div>
                            </td>
                            <td className="p-3 text-right font-black text-slate-900 dark:text-white text-sm">
                              ฿{amt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {isPaid ? 'ชำระแล้ว' : 'ค้างชำระ'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => {
                                    setSelectedTxForDoc(tx);
                                    setSelectedDocType('full_tax_invoice');
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[11px] cursor-pointer flex items-center space-x-1"
                                >
                                  <FileCheck size={12} />
                                  <span>ใบกำกับภาษี</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTxForDoc(tx);
                                    setSelectedDocType('quotation');
                                  }}
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-black text-[11px] cursor-pointer flex items-center space-x-1"
                                >
                                  <FileText size={12} />
                                  <span>ใบเสนอราคา</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCustomerForHistory(null)}
                className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DOCUMENT GENERATOR MODAL */}
      {selectedTxForDoc && (
        <DocumentGeneratorModal
          isOpen={Boolean(selectedTxForDoc)}
          transaction={selectedTxForDoc}
          shopInfo={config.shopInfo || { name: 'ร้านค้าโซล่าเซลล์', address: '', phone: '', receiptNote: '' }}
          onClose={() => setSelectedTxForDoc(null)}
          initialDocType={selectedDocType}
        />
      )}

    </div>
  );
}
