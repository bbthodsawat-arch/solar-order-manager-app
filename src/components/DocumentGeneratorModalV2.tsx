import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileCheck, FileText, Printer, Receipt, Truck, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { Transaction, ShopInfo, DocumentType, TaxCalculationMode, WithholdingTaxRate } from '../types';
import { html2canvasSafe } from '../utils/html2canvasSafe';
import { notifyReaction } from '../utils/feedback';
import { issueDocumentNumber, previewIssuedDocumentNumber } from '../lib/documentIssuanceService';

type Props = { isOpen: boolean; transaction: Transaction; shopInfo: ShopInfo; onClose: () => void; initialDocType?: DocumentType };
const DOC_OPTIONS: Array<{ id: DocumentType; label: string; code: string; icon: React.ElementType }> = [
  { id: 'full_tax_invoice', label: 'ใบกำกับภาษีเต็มรูป', code: 'INV', icon: FileCheck },
  { id: 'abbreviated_tax_invoice', label: 'ใบกำกับภาษีอย่างย่อ', code: 'INV', icon: Receipt },
  { id: 'receipt', label: 'ใบเสร็จรับเงิน', code: 'RC', icon: Receipt },
  { id: 'quotation', label: 'ใบเสนอราคา', code: 'QT', icon: FileText },
  { id: 'delivery_order', label: 'ใบแจ้งหนี้/ใบส่งของ', code: 'DO', icon: Truck },
];
function titleFor(type: DocumentType) { switch (type) { case 'quotation': return 'ใบเสนอราคา / ใบเสนอขาย'; case 'receipt': return 'ใบเสร็จรับเงิน'; case 'delivery_order': return 'ใบแจ้งหนี้ / ใบส่งของ'; case 'abbreviated_tax_invoice': return 'ใบกำกับภาษีอย่างย่อ'; default: return 'ใบกำกับภาษี / ใบเสร็จรับเงิน'; } }

export default function DocumentGeneratorModalV2({ isOpen, transaction, shopInfo, onClose, initialDocType = 'full_tax_invoice' }: Props) {
  const documentRef = useRef<HTMLDivElement>(null);
  const [docType, setDocType] = useState<DocumentType>(initialDocType);
  const [docNumber, setDocNumber] = useState('กำลังโหลดเลขเอกสาร…');
  const [taxMode, setTaxMode] = useState<TaxCalculationMode>('vat_included');
  const [withholdingTaxRate, setWithholdingTaxRate] = useState<WithholdingTaxRate>(0);
  const [customerTaxId, setCustomerTaxId] = useState(transaction.saleOrderDetails?.customerTaxId || '');
  const [customerBranch, setCustomerBranch] = useState(transaction.saleOrderDetails?.customerBranch || 'สำนักงานใหญ่');
  const [noteText, setNoteText] = useState(transaction.saleOrderDetails?.note || shopInfo.receiptNote || 'ขอบคุณที่อุดหนุนสินค้าและบริการ');
  const [generating, setGenerating] = useState(false);
  const details = transaction.saleOrderDetails;
  const detailsAny = details as any;
  const baseAmount = Number(transaction.amount) || 0;
  const subtotalBeforeVat = taxMode === 'vat_included' ? baseAmount / 1.07 : baseAmount;
  const vatAmount = taxMode === 'vat_included' ? baseAmount - subtotalBeforeVat : taxMode === 'vat_excluded' ? baseAmount * 0.07 : 0;
  const totalWithVat = taxMode === 'vat_excluded' ? baseAmount + vatAmount : baseAmount;
  const withholdingTaxAmount = subtotalBeforeVat * withholdingTaxRate / 100;
  const netPayableAmount = totalWithVat - withholdingTaxAmount;
  const selected = useMemo(() => DOC_OPTIONS.find(option => option.id === docType) || DOC_OPTIONS[0], [docType]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setDocNumber('กำลังโหลดเลขเอกสาร…');
    void previewIssuedDocumentNumber(docType).then(number => { if (!cancelled) setDocNumber(number); }).catch(() => { if (!cancelled) setDocNumber(`${selected.code}-00001`); });
    return () => { cancelled = true; };
  }, [isOpen, docType, selected.code]);

  useEffect(() => {
    if (!isOpen) return;
    setCustomerTaxId(transaction.saleOrderDetails?.customerTaxId || '');
    setCustomerBranch(transaction.saleOrderDetails?.customerBranch || 'สำนักงานใหญ่');
    setNoteText(transaction.saleOrderDetails?.note || shopInfo.receiptNote || 'ขอบคุณที่อุดหนุนสินค้าและบริการ');
  }, [isOpen, transaction.id, shopInfo.receiptNote]);

  if (!isOpen) return null;

  const ensureIssuedNumber = async () => {
    const issued = await issueDocumentNumber({ type: docType, transactionId: transaction.id || `${transaction.date}-${transaction.amount}`, orderId: detailsAny?.orderId, customerId: detailsAny?.customerId, customerName: detailsAny?.customerName, amount: baseAmount });
    setDocNumber(issued.number);
    return issued.number;
  };

  const handlePrint = async () => {
    setGenerating(true);
    try { const number = await ensureIssuedNumber(); notifyReaction('cash', `กำลังสั่งพิมพ์ ${number}...`); window.print(); }
    catch (error) { console.error('Document issuance failed:', error); notifyReaction('error', 'ไม่สามารถออกเลขเอกสารได้ จึงยังไม่สั่งพิมพ์'); }
    finally { setGenerating(false); }
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    setGenerating(true);
    try {
      const number = await ensureIssuedNumber();
      const canvas = await html2canvasSafe(documentRef.current, { scale: 2.5, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: docType === 'abbreviated_tax_invoice' ? [80, 200] : 'a4' });
      const width = pdf.internal.pageSize.getWidth();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, (canvas.height * width) / canvas.width);
      pdf.save(`${selected.code}_${number}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      notifyReaction('success', `สร้าง ${number} และดาวน์โหลด PDF เรียบร้อยแล้ว`);
    } catch (error) { console.error('Document generation failed:', error); notifyReaction('error', 'ไม่สามารถออกเลขหรือสร้างเอกสาร PDF ได้'); }
    finally { setGenerating(false); }
  };

  const documentDate = transaction.date ? format(parseISO(transaction.date), 'dd/MM/yyyy', { locale: th }) : format(new Date(), 'dd/MM/yyyy', { locale: th });
  const lineDescription = detailsAny?.detail || detailsAny?.productName || detailsAny?.description || 'สินค้า/บริการ Solar';
  const customerName = detailsAny?.customerName || 'ลูกค้าทั่วไป';
  const customerPhone = detailsAny?.customerPhone || '';
  const customerAddress = detailsAny?.customerAddress || '';
  const orderId = detailsAny?.orderId || transaction.id || '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:w-full print:rounded-none">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex flex-wrap gap-1.5 bg-slate-200 p-1 rounded-2xl">{DOC_OPTIONS.map(option => { const Icon = option.icon; return <button key={option.id} disabled={generating} onClick={() => setDocType(option.id)} className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 ${docType === option.id ? 'bg-emerald-500 text-white' : 'text-slate-600 hover:bg-white'}`}><Icon size={14}/>{option.label}</button>; })}</div>
          <div className="flex items-center gap-2"><button disabled={generating} onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black disabled:opacity-50"><Download size={15}/>{generating ? 'กำลังสร้าง…' : 'ดาวน์โหลด PDF'}</button><button disabled={generating} onClick={handlePrint} className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black disabled:opacity-50"><Printer size={15}/>พิมพ์เอกสาร</button><button onClick={onClose} className="p-2 text-slate-400"><X size={20}/></button></div>
        </div>
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3 text-xs print:hidden">
          <label className="flex items-center gap-2 font-bold text-slate-500">คิดภาษี:<select value={taxMode} onChange={e => setTaxMode(e.target.value as TaxCalculationMode)} className="rounded-lg border px-2 py-1 font-bold"><option value="vat_included">รวม VAT 7%</option><option value="vat_excluded">แยก VAT 7%</option><option value="no_vat">ไม่มี VAT</option></select></label>
          <label className="flex items-center gap-2 font-bold text-slate-500">หัก ณ ที่จ่าย:<select value={withholdingTaxRate} onChange={e => setWithholdingTaxRate(Number(e.target.value) as WithholdingTaxRate)} className="rounded-lg border px-2 py-1 font-bold"><option value={0}>0%</option><option value={1}>1%</option><option value={3}>3%</option><option value={5}>5%</option></select></label>
          <input value={customerTaxId} onChange={e => setCustomerTaxId(e.target.value)} placeholder="เลขผู้เสียภาษีลูกค้า" className="rounded-lg border px-2.5 py-1 font-bold"/><input value={customerBranch} onChange={e => setCustomerBranch(e.target.value)} placeholder="สาขา" className="rounded-lg border px-2.5 py-1 font-bold w-32"/>
        </div>
        <div className="overflow-auto flex-1 p-4 sm:p-8 bg-slate-200 print:bg-white print:p-0">
          <div ref={documentRef} className={`mx-auto bg-white text-slate-900 shadow-xl print:shadow-none ${docType === 'abbreviated_tax_invoice' ? 'w-[340px] p-6 font-mono text-xs' : 'max-w-[794px] p-8 sm:p-12'}`}>
            <div className="flex items-start justify-between gap-6 border-b-2 border-slate-900 pb-5"><div><div className="text-xl font-black">{shopInfo.companyNameTh || shopInfo.name}</div><div className="text-sm font-bold text-slate-500">{shopInfo.companyNameEn || shopInfo.systemName || 'Solar order manager'}</div><div className="text-xs mt-2 whitespace-pre-line">{shopInfo.address}</div><div className="text-xs">โทร {shopInfo.phone} {shopInfo.taxId ? `· Tax ID ${shopInfo.taxId}` : ''}</div></div><div className="text-right"><div className="text-lg font-black">{titleFor(docType)}</div><div className="text-sm font-black mt-2">เลขที่ {docNumber}</div><div className="text-xs text-slate-500">วันที่ {documentDate}</div></div></div>
            <div className="grid sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-sm"><div><div className="text-[10px] font-black text-slate-400">ลูกค้า</div><div className="font-black">{customerName}</div><div>{customerPhone}</div><div>{customerAddress}</div></div><div><div className="text-[10px] font-black text-slate-400">ข้อมูลอ้างอิง</div><div>Order: {orderId}</div><div>เลขผู้เสียภาษี: {customerTaxId || '-'}</div><div>สาขา: {customerBranch}</div></div></div>
            <div className="py-6"><div className="grid grid-cols-[1fr_auto] gap-4 py-3 border-b border-slate-200 font-black"><span>รายการ</span><span>จำนวนเงิน</span></div><div className="grid grid-cols-[1fr_auto] gap-4 py-5"><span>{lineDescription}</span><span className="font-black">{baseAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</span></div></div>
            <div className="ml-auto max-w-sm space-y-2 text-sm"><div className="flex justify-between"><span>ก่อน VAT</span><b>{subtotalBeforeVat.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</b></div><div className="flex justify-between"><span>VAT</span><b>{vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</b></div><div className="flex justify-between"><span>หัก ณ ที่จ่าย</span><b>-{withholdingTaxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</b></div><div className="flex justify-between border-t-2 border-slate-900 pt-3 text-lg"><span className="font-black">ยอดสุทธิ</span><b>{netPayableAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</b></div></div>
            <div className="mt-10 pt-5 border-t border-slate-200 text-xs text-slate-500 whitespace-pre-line">{noteText}</div><div className="mt-12 grid grid-cols-2 gap-10 text-center text-xs"><div className="border-t border-slate-300 pt-2">ผู้จัดทำ / ผู้ขาย</div><div className="border-t border-slate-300 pt-2">ผู้รับเอกสาร / ลูกค้า</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
