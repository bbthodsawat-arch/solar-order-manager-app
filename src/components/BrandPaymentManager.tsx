import React, { useMemo, useState } from 'react';
import { Building2, CreditCard, Plus, Search, Pencil, Trash2, Power, Star, X, CheckCircle2, AlertTriangle, Copy, Landmark, Smartphone, WalletCards } from 'lucide-react';
import { useAppConfig } from '../hooks/useAppConfig';
import { toast } from 'react-hot-toast';

type Brand = { id: string; name: string; code?: string; description?: string; website?: string; isActive: boolean; isPreferred?: boolean; createdAt?: string };
type PaymentKind = 'cash' | 'bank_transfer' | 'promptpay' | 'card' | 'credit' | 'cod' | 'other';
type PaymentMethod = { id: string; name: string; code?: string; description?: string; bankName?: string; accountNo?: string; accountName?: string; promptPayId?: string; isActive: boolean; isDefault?: boolean; paymentKind?: PaymentKind };

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('th-TH');
const kinds: { id: PaymentKind; label: string }[] = [
  { id: 'cash', label: 'เงินสด' }, { id: 'bank_transfer', label: 'โอนผ่านธนาคาร' }, { id: 'promptpay', label: 'PromptPay' }, { id: 'card', label: 'บัตร' }, { id: 'credit', label: 'เครดิต' }, { id: 'cod', label: 'เก็บเงินปลายทาง' }, { id: 'other', label: 'อื่น ๆ' }
];

export default function BrandPaymentManager() {
  const { config, saveConfig, loading } = useAppConfig();
  const [tab, setTab] = useState<'brands' | 'payments'>('brands');
  const [query, setQuery] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [brandDraft, setBrandDraft] = useState<Partial<Brand> | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<Partial<PaymentMethod> | null>(null);

  const brands = (((config as any).brands || []) as Brand[]);
  const payments = ((config.paymentMethods || []) as PaymentMethod[]);
  const activeBrands = brands.filter(x => x.isActive).length;
  const activePayments = payments.filter(x => x.isActive).length;

  const filteredBrands = useMemo(() => brands.filter(item => {
    if (!showInactive && !item.isActive) return false;
    const haystack = `${item.name} ${item.code || ''} ${item.description || ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  }), [brands, query, showInactive]);
  const filteredPayments = useMemo(() => payments.filter(item => {
    if (!showInactive && !item.isActive) return false;
    const haystack = `${item.name} ${item.code || ''} ${item.bankName || ''} ${item.accountNo || ''} ${item.promptPayId || ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  }), [payments, query, showInactive]);

  const saveBrands = async (next: Brand[]) => {
    await saveConfig({ ...(config as any), brands: next } as any);
  };
  const savePayments = async (next: PaymentMethod[]) => {
    const activeDefault = next.filter(x => x.isActive && x.isDefault);
    const normalized = activeDefault.length > 1 ? next.map((x, i) => x.isDefault && x.isActive ? { ...x, isDefault: x.id === activeDefault[0].id } : x) : next;
    await saveConfig({ ...(config as any), paymentMethods: normalized } as any);
  };

  const submitBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandDraft?.name?.trim()) return toast.error('กรุณาระบุชื่อแบรนด์');
    const name = brandDraft.name.trim();
    const duplicate = brands.some(x => x.id !== brandDraft.id && normalize(x.name) === normalize(name));
    if (duplicate) return toast.error('มีแบรนด์ชื่อนี้อยู่แล้ว');
    const item: Brand = { id: brandDraft.id || `brand_${Date.now()}`, name, code: brandDraft.code?.trim().toUpperCase() || undefined, description: brandDraft.description?.trim() || undefined, website: brandDraft.website?.trim() || undefined, isActive: brandDraft.isActive !== false, isPreferred: Boolean(brandDraft.isPreferred), createdAt: brandDraft.createdAt || new Date().toISOString() };
    const next = brands.some(x => x.id === item.id) ? brands.map(x => x.id === item.id ? item : (item.isPreferred ? { ...x, isPreferred: false } : x)) : [...brands.map(x => item.isPreferred ? { ...x, isPreferred: false } : x), item];
    await saveBrands(next);
    setBrandDraft(null); toast.success('บันทึกแบรนด์เรียบร้อยแล้ว');
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDraft?.name?.trim()) return toast.error('กรุณาระบุชื่อช่องทางชำระเงิน');
    const kind = paymentDraft.paymentKind || 'other';
    if ((kind === 'bank_transfer' || kind === 'card') && !paymentDraft.bankName?.trim()) return toast.error('กรุณาระบุธนาคาร/ผู้ให้บริการ');
    if (kind === 'bank_transfer' && !paymentDraft.accountNo?.trim()) return toast.error('กรุณาระบุเลขบัญชี');
    if (kind === 'promptpay' && !paymentDraft.promptPayId?.trim()) return toast.error('กรุณาระบุ PromptPay ID');
    const name = paymentDraft.name.trim();
    const duplicate = payments.some(x => x.id !== paymentDraft.id && normalize(x.name) === normalize(name));
    if (duplicate) return toast.error('มีช่องทางชำระเงินชื่อนี้อยู่แล้ว');
    const item: PaymentMethod = { id: paymentDraft.id || `pm_${Date.now()}`, name, code: paymentDraft.code?.trim().toUpperCase() || undefined, description: paymentDraft.description?.trim() || undefined, bankName: paymentDraft.bankName?.trim() || undefined, accountNo: paymentDraft.accountNo?.trim() || undefined, accountName: paymentDraft.accountName?.trim() || undefined, promptPayId: paymentDraft.promptPayId?.trim() || undefined, isActive: paymentDraft.isActive !== false, isDefault: Boolean(paymentDraft.isDefault), paymentKind: kind };
    if (item.isDefault && !item.isActive) return toast.error('ช่องทางเริ่มต้นต้องเปิดใช้งาน');
    const next = payments.some(x => x.id === item.id) ? payments.map(x => x.id === item.id ? item : (item.isDefault ? { ...x, isDefault: false } : x)) : [...payments.map(x => item.isDefault ? { ...x, isDefault: false } : x), item];
    await savePayments(next); setPaymentDraft(null); toast.success('บันทึกช่องทางชำระเงินเรียบร้อยแล้ว');
  };

  const removeBrand = async (id: string) => { if (!window.confirm('ลบแบรนด์นี้ใช่หรือไม่? ข้อมูลสินค้าที่เคยบันทึกไว้จะไม่ถูกลบ')) return; await saveBrands(brands.filter(x => x.id !== id)); toast.success('ลบแบรนด์แล้ว'); };
  const removePayment = async (id: string) => { const item = payments.find(x => x.id === id); if (!item) return; if (item.isDefault) return toast.error('ไม่สามารถลบช่องทางเริ่มต้น กรุณาเลือกช่องทางอื่นเป็นค่าเริ่มต้นก่อน'); if (!window.confirm('ลบช่องทางชำระเงินนี้ใช่หรือไม่?')) return; await savePayments(payments.filter(x => x.id !== id)); toast.success('ลบช่องทางชำระเงินแล้ว'); };
  const toggleBrand = async (id: string) => saveBrands(brands.map(x => x.id === id ? { ...x, isActive: !x.isActive } : x));
  const togglePayment = async (id: string) => { const item = payments.find(x => x.id === id); if (item?.isDefault && item.isActive) return toast.error('ไม่สามารถปิดใช้งานช่องทางเริ่มต้น'); await savePayments(payments.map(x => x.id === id ? { ...x, isActive: !x.isActive, isDefault: x.isActive ? x.isDefault : false } : x)); };
  const makeDefault = async (id: string) => savePayments(payments.map(x => ({ ...x, isDefault: x.id === id, isActive: x.id === id ? true : x.isActive })));
  const duplicateBrand = (item: Brand) => setBrandDraft({ ...item, id: undefined, name: `${item.name} (สำเนา)`, isPreferred: false });
  const duplicatePayment = (item: PaymentMethod) => setPaymentDraft({ ...item, id: undefined, name: `${item.name} (สำเนา)`, isDefault: false });

  if (loading) return <div className="p-8 text-sm text-slate-500">กำลังโหลดการตั้งค่า…</div>;
  const isBrand = tab === 'brands';
  return <div className="space-y-5">
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"><Building2 size={14}/> COMMAND CENTER</div><h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">แบรนด์ & การชำระเงิน</h2><p className="mt-1 text-sm text-slate-500">จัดการข้อมูลหลักที่ใช้ซ้ำในสินค้าและ POS พร้อม validation และสถานะเริ่มต้น</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><div className="text-[10px] font-black text-slate-400">แบรนด์ใช้งาน</div><div className="text-xl font-black text-indigo-600">{activeBrands}/{brands.length}</div></div><div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><div className="text-[10px] font-black text-slate-400">การชำระเงิน</div><div className="text-xl font-black text-emerald-600">{activePayments}/{payments.length}</div></div></div></div>
      <div className="mt-6 flex flex-wrap gap-2"><button onClick={() => { setTab('brands'); setQuery(''); }} className={`rounded-xl px-4 py-2 text-sm font-black ${isBrand ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>แบรนด์</button><button onClick={() => { setTab('payments'); setQuery(''); }} className={`rounded-xl px-4 py-2 text-sm font-black ${!isBrand ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>ช่องทางชำระเงิน</button></div>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={isBrand ? 'ค้นหาชื่อแบรนด์ รหัส หรือรายละเอียด…' : 'ค้นหาช่องทาง ธนาคาร เลขบัญชี…'} className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-800 dark:bg-slate-900"/></div><button onClick={() => setShowInactive(v => !v)} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-black dark:border-slate-800">{showInactive ? 'ซ่อนรายการปิดใช้งาน' : 'แสดงรายการปิดใช้งาน'}</button><button onClick={() => isBrand ? setBrandDraft({ name: '', isActive: true }) : setPaymentDraft({ name: '', isActive: true, paymentKind: 'cash' })} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white"><Plus size={17}/>เพิ่ม{isBrand ? 'แบรนด์' : 'ช่องทาง'}</button></div>
    <div className="grid gap-3">{(isBrand ? filteredBrands : filteredPayments).map((item: any) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/40">{isBrand ? <Building2 size={20}/> : item.paymentKind === 'promptpay' ? <Smartphone size={20}/> : item.paymentKind === 'bank_transfer' ? <Landmark size={20}/> : <WalletCards size={20}/>}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black text-slate-900 dark:text-white">{item.name}</h3>{item.isDefault && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">DEFAULT</span>}<span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.isActive ? 'ใช้งาน' : 'ปิด'}</span></div><p className="truncate text-xs text-slate-500">{isBrand ? [item.code, item.description].filter(Boolean).join(' • ') || 'ยังไม่มีรายละเอียด' : [item.paymentKind, item.bankName, item.accountNo, item.promptPayId].filter(Boolean).join(' • ') || item.description || 'ยังไม่มีรายละเอียด'}</p></div></div><div className="flex flex-wrap gap-2"><button onClick={() => isBrand ? duplicateBrand(item) : duplicatePayment(item)} title="คัดลอก" className="rounded-xl border p-2 dark:border-slate-700"><Copy size={16}/></button>{!isBrand && <button onClick={() => makeDefault(item.id)} title="ตั้งเป็นค่าเริ่มต้น" className="rounded-xl border p-2 dark:border-slate-700"><Star size={16}/></button>}<button onClick={() => isBrand ? setBrandDraft(item) : setPaymentDraft(item)} className="rounded-xl border p-2 dark:border-slate-700"><Pencil size={16}/></button><button onClick={() => isBrand ? toggleBrand(item.id) : togglePayment(item.id)} className="rounded-xl border p-2 dark:border-slate-700"><Power size={16}/></button><button onClick={() => isBrand ? removeBrand(item.id) : removePayment(item.id)} className="rounded-xl border border-rose-200 p-2 text-rose-600"><Trash2 size={16}/></button></div></div>)}{(isBrand ? filteredBrands : filteredPayments).length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">ยังไม่มีรายการที่ตรงกับการค้นหา</div>}</div>
    {brandDraft && <Modal title={brandDraft.id ? 'แก้ไขแบรนด์' : 'เพิ่มแบรนด์'} onClose={() => setBrandDraft(null)}><form onSubmit={submitBrand} className="space-y-3"><Field label="ชื่อแบรนด์" value={brandDraft.name || ''} onChange={v => setBrandDraft({ ...brandDraft, name: v })} required/><div className="grid gap-3 sm:grid-cols-2"><Field label="รหัสย่อ" value={brandDraft.code || ''} onChange={v => setBrandDraft({ ...brandDraft, code: v })}/><Field label="เว็บไซต์" value={brandDraft.website || ''} onChange={v => setBrandDraft({ ...brandDraft, website: v })}/></div><Field label="รายละเอียด" value={brandDraft.description || ''} onChange={v => setBrandDraft({ ...brandDraft, description: v })}/><CheckRow label="เปิดใช้งาน" checked={brandDraft.isActive !== false} onChange={v => setBrandDraft({ ...brandDraft, isActive: v })}/><CheckRow label="ตั้งเป็นแบรนด์แนะนำ" checked={Boolean(brandDraft.isPreferred)} onChange={v => setBrandDraft({ ...brandDraft, isPreferred: v })}/><Actions onCancel={() => setBrandDraft(null)}/></form></Modal>}
    {paymentDraft && <Modal title={paymentDraft.id ? 'แก้ไขช่องทางชำระเงิน' : 'เพิ่มช่องทางชำระเงิน'} onClose={() => setPaymentDraft(null)}><form onSubmit={submitPayment} className="space-y-3"><Field label="ชื่อช่องทาง" value={paymentDraft.name || ''} onChange={v => setPaymentDraft({ ...paymentDraft, name: v })} required/><label className="block text-xs font-black text-slate-600 dark:text-slate-300">ประเภท<select value={paymentDraft.paymentKind || 'other'} onChange={e => setPaymentDraft({ ...paymentDraft, paymentKind: e.target.value as PaymentKind })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">{kinds.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><Field label="รหัส" value={paymentDraft.code || ''} onChange={v => setPaymentDraft({ ...paymentDraft, code: v })}/><Field label="ธนาคาร/ผู้ให้บริการ" value={paymentDraft.bankName || ''} onChange={v => setPaymentDraft({ ...paymentDraft, bankName: v })}/><Field label="เลขบัญชี" value={paymentDraft.accountNo || ''} onChange={v => setPaymentDraft({ ...paymentDraft, accountNo: v })}/><Field label="ชื่อบัญชี" value={paymentDraft.accountName || ''} onChange={v => setPaymentDraft({ ...paymentDraft, accountName: v })}/></div><Field label="PromptPay ID" value={paymentDraft.promptPayId || ''} onChange={v => setPaymentDraft({ ...paymentDraft, promptPayId: v })}/><Field label="รายละเอียด" value={paymentDraft.description || ''} onChange={v => setPaymentDraft({ ...paymentDraft, description: v })}/><CheckRow label="เปิดใช้งาน" checked={paymentDraft.isActive !== false} onChange={v => setPaymentDraft({ ...paymentDraft, isActive: v })}/><CheckRow label="ตั้งเป็นช่องทางเริ่มต้น" checked={Boolean(paymentDraft.isDefault)} onChange={v => setPaymentDraft({ ...paymentDraft, isDefault: v })}/><Actions onCancel={() => setPaymentDraft(null)}/></form></Modal>}
  </div>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 sm:items-center"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900"><div className="mb-5 flex items-center justify-between"><h2 className="font-black text-slate-900 dark:text-white">{title}</h2><button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18}/></button></div>{children}</div></div>; }
function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) { return <label className="block text-xs font-black text-slate-600 dark:text-slate-300">{label}<input required={required} value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900"/></label>; }
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) { return <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}/>{label}</label>; }
function Actions({ onCancel }: { onCancel: () => void }) { return <div className="flex justify-end gap-2 pt-3"><button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-sm font-black text-slate-500">ยกเลิก</button><button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-black text-white"><CheckCircle2 size={16}/>บันทึก</button></div>; }
