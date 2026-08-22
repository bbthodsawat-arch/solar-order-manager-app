import { useMemo, useState } from 'react';
import { Building2, CreditCard, Plus, Search, Pencil, Trash2, Power, Star, AlertTriangle, X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { ConfigItem } from '../types';

export type BrandItem = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
};

type Props = {
  brands: BrandItem[];
  paymentMethods: ConfigItem[];
  onAddBrand: (brand: Omit<BrandItem, 'id'>) => Promise<void>;
  onUpdateBrand: (id: string, patch: Partial<BrandItem>) => Promise<void>;
  onDeleteBrand: (id: string) => Promise<void>;
  onToggleBrand: (id: string) => Promise<void>;
  onAddPayment: (item: Omit<ConfigItem, 'id' | 'isActive'>) => Promise<void>;
  onUpdatePayment: (id: string, patch: Partial<ConfigItem>) => Promise<void>;
  onDeletePayment: (id: string) => Promise<void>;
  onTogglePayment: (id: string) => Promise<void>;
};

const normalize = (value: string) => value.trim().toLocaleLowerCase('th-TH');

export default function BrandPaymentManager(props: Props) {
  const [tab, setTab] = useState<'brands' | 'payments'>('brands');
  const [query, setQuery] = useState('');
  const [brandForm, setBrandForm] = useState<Partial<BrandItem> | null>(null);
  const [paymentForm, setPaymentForm] = useState<Partial<ConfigItem> | null>(null);
  const [busy, setBusy] = useState(false);

  const brands = useMemo(() => props.brands.filter(item => normalize(item.name).includes(normalize(query))), [props.brands, query]);
  const payments = useMemo(() => props.paymentMethods.filter(item => [item.name, item.code, item.bankName, item.accountNo, item.promptPayId].filter(Boolean).some(value => normalize(String(value)).includes(normalize(query)))), [props.paymentMethods, query]);

  const saveBrand = async () => {
    const name = brandForm?.name?.trim();
    if (!name) return toast.error('กรุณาระบุชื่อแบรนด์');
    const duplicate = props.brands.some(item => normalize(item.name) === normalize(name) && item.id !== brandForm?.id);
    if (duplicate) return toast.error('มีแบรนด์ชื่อนี้อยู่แล้ว');
    setBusy(true);
    try {
      if (brandForm?.id) await props.onUpdateBrand(brandForm.id, { name, code: brandForm.code?.trim(), description: brandForm.description?.trim() });
      else await props.onAddBrand({ name, code: brandForm?.code?.trim(), description: brandForm?.description?.trim(), isActive: true });
      setBrandForm(null); toast.success('บันทึกแบรนด์เรียบร้อยแล้ว');
    } catch (error: any) { toast.error(error?.message || 'ไม่สามารถบันทึกแบรนด์ได้'); } finally { setBusy(false); }
  };

  const savePayment = async () => {
    const name = paymentForm?.name?.trim();
    if (!name) return toast.error('กรุณาระบุชื่อช่องทางชำระเงิน');
    const duplicate = props.paymentMethods.some(item => normalize(item.name) === normalize(name) && item.id !== paymentForm?.id);
    if (duplicate) return toast.error('มีช่องทางชำระเงินชื่อนี้อยู่แล้ว');
    const next: Partial<ConfigItem> = { name, code: paymentForm?.code?.trim() || undefined, description: paymentForm?.description?.trim() || undefined, bankName: paymentForm?.bankName?.trim() || undefined, accountNo: paymentForm?.accountNo?.trim() || undefined, accountName: paymentForm?.accountName?.trim() || undefined, promptPayId: paymentForm?.promptPayId?.trim() || undefined, isDefault: Boolean(paymentForm?.isDefault) };
    setBusy(true);
    try {
      if (paymentForm?.id) await props.onUpdatePayment(paymentForm.id, next);
      else await props.onAddPayment(next as Omit<ConfigItem, 'id' | 'isActive'>);
      setPaymentForm(null); toast.success('บันทึกช่องทางชำระเงินเรียบร้อยแล้ว');
    } catch (error: any) { toast.error(error?.message || 'ไม่สามารถบันทึกช่องทางชำระเงินได้'); } finally { setBusy(false); }
  };

  const confirmDelete = async (kind: string, item: { id: string; name: string }, action: () => Promise<void>) => {
    if (!window.confirm(`ต้องการลบ${kind} “${item.name}” ใช่หรือไม่?`)) return;
    setBusy(true);
    try { await action(); toast.success('ลบรายการเรียบร้อยแล้ว'); } catch (error: any) { toast.error(error?.message || 'ไม่สามารถลบรายการได้'); } finally { setBusy(false); }
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900';
  const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition disabled:opacity-50';

  return <section className="space-y-5">
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-black">แบรนด์ & การชำระเงิน</h2><p className="mt-1 text-sm text-slate-500">จัดการข้อมูลหลักที่ใช้ร่วมกันในสินค้าและ POS</p></div>
        <button className={`${buttonClass} bg-slate-900 text-white`} onClick={() => tab === 'brands' ? setBrandForm({ name: '', code: '', description: '' }) : setPaymentForm({ name: '', code: '', description: '', bankName: '', accountNo: '', accountName: '', promptPayId: '', isDefault: false })}><Plus size={16}/>เพิ่ม{tab === 'brands' ? 'แบรนด์' : 'ช่องทาง'}</button>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800"><button onClick={() => setTab('brands')} className={`${buttonClass} ${tab === 'brands' ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}><Building2 size={16}/>แบรนด์</button><button onClick={() => setTab('payments')} className={`${buttonClass} ${tab === 'payments' ? 'bg-white shadow-sm dark:bg-slate-700' : ''}`}><CreditCard size={16}/>การชำระเงิน</button></div>
        <label className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาชื่อ รหัส ธนาคาร หรือ PromptPay" className={`${inputClass} pl-9`}/></label>
      </div>
    </div>

    {tab === 'brands' ? <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"><div className="grid grid-cols-[1fr_auto] border-b border-slate-100 px-5 py-3 text-xs font-black text-slate-400 dark:border-slate-800"><span>แบรนด์</span><span>จัดการ</span></div>{brands.length ? brands.map(item => <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 dark:border-slate-800"><div><div className="flex items-center gap-2 font-bold"><span>{item.name}</span>{!item.isActive && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">ปิดใช้งาน</span>}</div><p className="text-xs text-slate-500">{item.code || 'ไม่มีรหัส'}{item.description ? ` · ${item.description}` : ''}</p></div><div className="flex gap-1"><button title="แก้ไข" className={`${buttonClass} hover:bg-slate-100`} onClick={() => setBrandForm(item)}><Pencil size={16}/></button><button title="เปิด/ปิด" className={`${buttonClass} hover:bg-slate-100`} disabled={busy} onClick={() => props.onToggleBrand(item.id)}><Power size={16}/></button><button title="ลบ" className={`${buttonClass} text-rose-600 hover:bg-rose-50`} disabled={busy} onClick={() => confirmDelete('แบรนด์', item, () => props.onDeleteBrand(item.id))}><Trash2 size={16}/></button></div></div>) : <div className="p-12 text-center text-sm text-slate-500">ยังไม่พบแบรนด์</div>}</div> : <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"><div className="grid grid-cols-[1fr_auto] border-b border-slate-100 px-5 py-3 text-xs font-black text-slate-400 dark:border-slate-800"><span>ช่องทางชำระเงิน</span><span>จัดการ</span></div>{payments.map(item => <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 dark:border-slate-800"><div><div className="flex items-center gap-2 font-bold"><span>{item.name}</span>{item.isDefault && <Star size={14} className="fill-amber-400 text-amber-400"/>}{!item.isActive && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">ปิดใช้งาน</span>}</div><p className="text-xs text-slate-500">{[item.code, item.bankName, item.accountNo, item.promptPayId].filter(Boolean).join(' · ') || 'ยังไม่มีรายละเอียดบัญชี'}</p></div><div className="flex gap-1"><button title="แก้ไข" className={`${buttonClass} hover:bg-slate-100`} onClick={() => setPaymentForm(item)}><Pencil size={16}/></button><button title="เปิด/ปิด" className={`${buttonClass} hover:bg-slate-100`} disabled={busy} onClick={() => props.onTogglePayment(item.id)}><Power size={16}/></button><button title="ลบ" className={`${buttonClass} text-rose-600 hover:bg-rose-50`} disabled={busy} onClick={() => confirmDelete('ช่องทางชำระเงิน', item, () => props.onDeletePayment(item.id))}><Trash2 size={16}/></button></div></div>)}</div>}

    {brandForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={event => { event.preventDefault(); void saveBrand(); }} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-black">{brandForm.id ? 'แก้ไขแบรนด์' : 'เพิ่มแบรนด์'}</h3><p className="text-xs text-slate-500">ชื่อแบรนด์ต้องไม่ซ้ำ</p></div><button type="button" className={buttonClass} onClick={() => setBrandForm(null)}><X size={18}/></button></div><div className="space-y-3"><input required value={brandForm.name || ''} onChange={event => setBrandForm(current => ({ ...current, name: event.target.value }))} placeholder="ชื่อแบรนด์ *" className={inputClass}/><input value={brandForm.code || ''} onChange={event => setBrandForm(current => ({ ...current, code: event.target.value }))} placeholder="รหัสแบรนด์" className={inputClass}/><textarea value={brandForm.description || ''} onChange={event => setBrandForm(current => ({ ...current, description: event.target.value }))} placeholder="รายละเอียด" className={`${inputClass} min-h-24`}/></div><div className="mt-5 flex justify-end gap-2"><button type="button" className={`${buttonClass} border`} onClick={() => setBrandForm(null)}>ยกเลิก</button><button disabled={busy} className={`${buttonClass} bg-emerald-600 text-white`}><Check size={16}/>บันทึก</button></div></form></div>}

    {paymentForm && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4"><form onSubmit={event => { event.preventDefault(); void savePayment(); }} className="mx-auto my-8 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-black">{paymentForm.id ? 'แก้ไขช่องทางชำระเงิน' : 'เพิ่มช่องทางชำระเงิน'}</h3><p className="text-xs text-slate-500">ตั้งค่าข้อมูลที่จำเป็นต่อ POS และใบเสร็จ</p></div><button type="button" className={buttonClass} onClick={() => setPaymentForm(null)}><X size={18}/></button></div><div className="grid gap-3 sm:grid-cols-2"><input required value={paymentForm.name || ''} onChange={event => setPaymentForm(current => ({ ...current, name: event.target.value }))} placeholder="ชื่อช่องทาง *" className={inputClass}/><input value={paymentForm.code || ''} onChange={event => setPaymentForm(current => ({ ...current, code: event.target.value }))} placeholder="รหัส เช่น CASH / QR" className={inputClass}/><input value={paymentForm.bankName || ''} onChange={event => setPaymentForm(current => ({ ...current, bankName: event.target.value }))} placeholder="ธนาคาร" className={inputClass}/><input value={paymentForm.accountName || ''} onChange={event => setPaymentForm(current => ({ ...current, accountName: event.target.value }))} placeholder="ชื่อบัญชี" className={inputClass}/><input value={paymentForm.accountNo || ''} onChange={event => setPaymentForm(current => ({ ...current, accountNo: event.target.value }))} placeholder="เลขบัญชี" className={inputClass}/><input value={paymentForm.promptPayId || ''} onChange={event => setPaymentForm(current => ({ ...current, promptPayId: event.target.value }))} placeholder="PromptPay ID" className={inputClass}/><label className="flex items-center gap-2 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={Boolean(paymentForm.isDefault)} onChange={event => setPaymentForm(current => ({ ...current, isDefault: event.target.checked }))}/>ใช้เป็นช่องทางเริ่มต้น</label></div><div className="mt-5 flex justify-end gap-2"><button type="button" className={`${buttonClass} border`} onClick={() => setPaymentForm(null)}>ยกเลิก</button><button disabled={busy} className={`${buttonClass} bg-emerald-600 text-white`}><Check size={16}/>บันทึก</button></div></form></div>}

    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><AlertTriangle size={18} className="shrink-0"/><p>การลบควรถูกเชื่อมกับการตรวจสอบข้อมูลที่อ้างอิงก่อนลบจริง เช่น สินค้า POS และประวัติรายการ เพื่อป้องกันข้อมูลย้อนหลังเสียหาย</p></div>
  </section>;
}
