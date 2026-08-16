import React, { useRef, useState } from 'react';
import { Transaction, ShopInfo, DocumentType, TaxCalculationMode, WithholdingTaxRate } from '../types';
import { format, parseISO, addDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  Printer, Download, X, Mail, Phone, MapPin, CheckCircle2, 
  FileText, Receipt, ShieldCheck, Building, Sparkles, CreditCard,
  Truck, HelpCircle, FileCheck, DollarSign
} from 'lucide-react';
import { bahtText } from '../utils/bahttext';
import jsPDF from 'jspdf';
import { html2canvasSafe } from '../utils/html2canvasSafe';
import { toast } from 'react-hot-toast';
import { notifyReaction } from '../utils/feedback';

interface DocumentGeneratorModalProps {
  isOpen: boolean;
  transaction: Transaction;
  shopInfo: ShopInfo;
  onClose: () => void;
  initialDocType?: DocumentType;
}

export default function DocumentGeneratorModal({
  isOpen,
  transaction,
  shopInfo,
  onClose,
  initialDocType = 'full_tax_invoice'
}: DocumentGeneratorModalProps) {
  const documentRef = useRef<HTMLDivElement>(null);
  const [docType, setDocType] = useState<DocumentType>(initialDocType);
  const [taxMode, setTaxMode] = useState<TaxCalculationMode>('vat_included');
  const [withholdingTaxRate, setWithholdingTaxRate] = useState<WithholdingTaxRate>(0);
  const [isCopyStamp, setIsCopyStamp] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);

  // Editable Document Meta Details
  const details = transaction.saleOrderDetails;
  const rawDocNo = transaction.id ? transaction.id.slice(-6).toUpperCase() : '000001';
  const docDateStr = transaction.date ? format(parseISO(transaction.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

  const [docNumber, setDocNumber] = useState<string>(() => {
    if (docType === 'quotation') return `QT-${rawDocNo}`;
    if (docType === 'delivery_order') return `DO-${rawDocNo}`;
    if (docType === 'receipt') return `REC-${rawDocNo}`;
    if (docType === 'abbreviated_tax_invoice') return `ABB-${rawDocNo}`;
    return `INV-${rawDocNo}`;
  });

  const [customerTaxId, setCustomerTaxId] = useState<string>(details?.customerTaxId || '');
  const [customerBranch, setCustomerBranch] = useState<string>(details?.customerBranch || 'สำนักงานใหญ่');
  const [validityDays, setValidityDays] = useState<number>(15);
  const [noteText, setNoteText] = useState<string>(details?.note || shopInfo.receiptNote || 'ขอบคุณที่อุดหนุนสินค้าและบริการ');

  if (!isOpen) return null;

  // Amount Calculations
  const baseAmount = Number(transaction.amount) || 0;
  
  let subtotalBeforeVat = baseAmount;
  let vatAmount = 0;
  let totalWithVat = baseAmount;

  if (taxMode === 'vat_included') {
    // Amount already includes 7% VAT -> extract Subtotal & VAT
    subtotalBeforeVat = baseAmount / 1.07;
    vatAmount = baseAmount - subtotalBeforeVat;
    totalWithVat = baseAmount;
  } else if (taxMode === 'vat_excluded') {
    // Amount is Net -> Add 7% VAT
    subtotalBeforeVat = baseAmount;
    vatAmount = baseAmount * 0.07;
    totalWithVat = baseAmount + vatAmount;
  } else {
    // No VAT
    subtotalBeforeVat = baseAmount;
    vatAmount = 0;
    totalWithVat = baseAmount;
  }

  const withholdingTaxAmount = (subtotalBeforeVat * withholdingTaxRate) / 100;
  const netPayableAmount = totalWithVat - withholdingTaxAmount;

  // Document Type Title Helper
  const getDocTitle = () => {
    switch (docType) {
      case 'quotation':
        return { th: 'ใบเสนอราคา / ใบเสนอขาย', en: 'QUOTATION', code: 'QT' };
      case 'full_tax_invoice':
        return { th: 'ใบกำกับภาษี / ใบเสร็จรับเงิน', en: 'TAX INVOICE / RECEIPT', code: 'INV' };
      case 'abbreviated_tax_invoice':
        return { th: 'ใบกำกับภาษีอย่างย่อ', en: 'ABBREVIATED TAX INVOICE', code: 'ABB' };
      case 'receipt':
        return { th: 'ใบเสร็จรับเงิน', en: 'RECEIPT', code: 'REC' };
      case 'delivery_order':
        return { th: 'ใบแจ้งหนี้ / ใบส่งของ', en: 'INVOICE / DELIVERY ORDER', code: 'DO' };
      default:
        return { th: 'เอกสารการค้า', en: 'DOCUMENT', code: 'DOC' };
    }
  };

  const currentTitle = getDocTitle();

  // Print Handler
  const handlePrint = () => {
    notifyReaction('cash', 'กำลังสั่งพิมพ์เอกสาร...');
    window.print();
  };

  // PDF Export Handler
  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    setGenerating(true);
    notifyReaction('info', 'กำลังสร้างไฟล์ PDF เอกสาร...');

    try {
      const element = documentRef.current;
      const canvas = await html2canvasSafe(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const isThermal = docType === 'abbreviated_tax_invoice';

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: isThermal ? [80, 200] : 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      const fileName = `${currentTitle.code}_${docNumber}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      pdf.save(fileName);

      notifyReaction('success', 'ดาวน์โหลดไฟล์ PDF เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error generating PDF:', error);
      notifyReaction('error', 'เกิดข้อผิดพลาดในการสร้างเอกสาร PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 animate-fade-in print:p-0 print:bg-white print:backdrop-blur-none overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:shadow-none print:rounded-none print:max-h-none print:w-full border border-slate-200/80 dark:border-slate-800 my-auto">
        
        {/* Top Controls Header */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          
          {/* Document Type Tab Selectors */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-2xl">
            {[
              { id: 'full_tax_invoice', label: 'ใบกำกับภาษีเต็มรูป', icon: FileCheck },
              { id: 'abbreviated_tax_invoice', label: 'ใบกำกับภาษีอย่างย่อ (สลิป)', icon: Receipt },
              { id: 'receipt', label: 'ใบเสร็จรับเงิน', icon: CheckCircle2 },
              { id: 'quotation', label: 'ใบเสนอราคา', icon: FileText },
              { id: 'delivery_order', label: 'ใบแจ้งหนี้/ใบส่งของ', icon: Truck },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    const newType = item.id as DocumentType;
                    setDocType(newType);
                    if (newType === 'quotation') setDocNumber(`QT-${rawDocNo}`);
                    else if (newType === 'delivery_order') setDocNumber(`DO-${rawDocNo}`);
                    else if (newType === 'receipt') setDocNumber(`REC-${rawDocNo}`);
                    else if (newType === 'abbreviated_tax_invoice') setDocNumber(`ABB-${rawDocNo}`);
                    else setDocNumber(`INV-${rawDocNo}`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                    docType === item.id
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={generating}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download size={15} />
              <span>{generating ? 'กำลังสร้าง...' : 'ดาวน์โหลด PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              <Printer size={15} />
              <span>พิมพ์เอกสาร</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Secondary Document Options Bar (Collapsible Options) */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            {/* Tax Calculation Mode Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-500 dark:text-slate-400">คิดภาษี:</span>
              <select
                value={taxMode}
                onChange={e => setTaxMode(e.target.value as TaxCalculationMode)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-bold text-slate-800 dark:text-white"
              >
                <option value="vat_included">รวม VAT 7% (Vat Included)</option>
                <option value="vat_excluded">แยก VAT 7% (Vat Excluded)</option>
                <option value="no_vat">ไม่มี VAT (No Vat)</option>
              </select>
            </div>

            {/* Withholding Tax Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-500 dark:text-slate-400">หัก ณ ที่จ่าย:</span>
              <select
                value={withholdingTaxRate}
                onChange={e => setWithholdingTaxRate(Number(e.target.value) as WithholdingTaxRate)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-bold text-slate-800 dark:text-white"
              >
                <option value={0}>ไม่มีหัก (0%)</option>
                <option value={1}>1% (ค่าขนส่ง)</option>
                <option value={3}>3% (ค่าบริการ/รับจ้าง)</option>
                <option value={5}>5% (ค่าเช่า)</option>
              </select>
            </div>

            {/* Stamp Original / Copy */}
            <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isCopyStamp}
                onChange={e => setIsCopyStamp(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>ประทับตรา "สำนา" (COPY)</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="เลขผู้เสียภาษีลูกค้า (13 หลัก)"
              value={customerTaxId}
              onChange={e => setCustomerTaxId(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-white w-44"
            />
            <input
              type="text"
              placeholder="สาขา (เช่น สำนักงานใหญ่)"
              value={customerBranch}
              onChange={e => setCustomerBranch(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-white w-32"
            />
          </div>
        </div>

        {/* Document Scrollable Workspace */}
        <div className="overflow-auto flex-1 p-4 sm:p-8 bg-slate-200 dark:bg-slate-950 print:p-0 print:bg-white" id="printable-document">
          
          {docType === 'abbreviated_tax_invoice' ? (
            /* 80mm POS Thermal Slip Format */
            <div 
              ref={documentRef}
              className="w-[340px] mx-auto bg-white p-6 font-mono text-slate-900 shadow-xl rounded-2xl print:shadow-none print:w-full print:p-0 space-y-4 text-xs border border-slate-200/80"
            >
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
                <h2 className="font-black text-base uppercase">{shopInfo.name}</h2>
                <p className="text-[10px] text-slate-600">{shopInfo.address}</p>
                <p className="text-[10px]">โทร: {shopInfo.phone}</p>
                {shopInfo.taxId && <p className="text-[10px] font-bold">เลขผู้เสียภาษี: {shopInfo.taxId}</p>}
                <div className="pt-1">
                  <span className="font-black text-sm uppercase block">ใบกำกับภาษีอย่างย่อ</span>
                  <span className="text-[9px] text-slate-500 uppercase">(VAT INCLUDED / ราคารวมภาษีมูลค่าเพิ่มแล้ว)</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>เลขที่เอกสาร:</span>
                  <span className="font-bold">{docNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>วันที่:</span>
                  <span>{format(parseISO(transaction.date), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span>พนักงานขาย:</span>
                  <span>{transaction.createdBy || 'POS Admin'}</span>
                </div>
              </div>

              {/* Items */}
              <div className="py-2 border-y border-dashed border-slate-400 space-y-2">
                <div className="flex justify-between font-bold text-[10px] text-slate-500 uppercase">
                  <span>รายการ</span>
                  <span>จำนวนเงิน</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>{transaction.subcategory || transaction.category}</span>
                  <span>฿{baseAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                {transaction.detail && (
                  <p className="text-[10px] text-slate-500 italic pl-1">{transaction.detail}</p>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex justify-between font-black text-sm">
                  <span>ยอดรวมทั้งสิ้น:</span>
                  <span>฿{totalWithVat.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                {vatAmount > 0 && (
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>ภาษีมูลค่าเพิ่ม 7%:</span>
                    <span>฿{vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px]">
                  <span>ชำระโดย:</span>
                  <span>{transaction.paymentMethod || 'เงินสด'}</span>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-dashed border-slate-400 space-y-1">
                <p className="font-bold text-[10px]">{noteText}</p>
                <p className="text-[9px] text-slate-400">ขอบคุณที่ใช้บริการ • Thank you</p>
              </div>
            </div>
          ) : (
            /* Standard A4 Commercial Document Paper Format */
            <div 
              ref={documentRef}
              className="max-w-3xl mx-auto bg-white p-8 sm:p-12 text-slate-900 shadow-2xl rounded-2xl print:shadow-none print:rounded-none print:p-0 print:max-w-none space-y-8 font-sans border border-slate-200/80"
            >
              {/* Document Stamp Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div className="flex items-start space-x-4 max-w-md">
                  <img
                    src={shopInfo.logoUrl || '/logo.jpg'}
                    alt="Shop Logo"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl border-2 border-amber-400 bg-white p-0.5 shadow-xs shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.jpg';
                    }}
                  />
                  <div className="space-y-1.5">
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">{shopInfo.name || 'ร้านกลางนาโซล่าเซลล์'}</h1>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">{shopInfo.address}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-800 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone size={13} className="text-emerald-600" />
                        <span>{shopInfo.phone}</span>
                      </span>
                      {shopInfo.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={13} className="text-emerald-600" />
                          <span>{shopInfo.email}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
                      {shopInfo.taxId && <span>เลขผู้เสียภาษี: <strong className="text-slate-900">{shopInfo.taxId}</strong></span>}
                      {shopInfo.branch && <span>สาขา: <strong className="text-slate-900">{shopInfo.branch}</strong></span>}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-2 shrink-0">
                  <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-lg text-sm font-black uppercase tracking-wider">
                    {currentTitle.th}
                  </div>
                  <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{currentTitle.en}</div>
                  
                  {isCopyStamp ? (
                    <span className="inline-block border-2 border-rose-500 text-rose-600 font-black text-xs px-2.5 py-0.5 rounded uppercase rotate-[-3deg]">
                      สำเนา / COPY
                    </span>
                  ) : (
                    <span className="inline-block border-2 border-emerald-600 text-emerald-600 font-black text-xs px-2.5 py-0.5 rounded uppercase">
                      ต้นฉบับ / ORIGINAL
                    </span>
                  )}

                  <div className="pt-2 text-xs font-bold space-y-1">
                    <div className="flex justify-end gap-2">
                      <span className="text-slate-400">เลขที่ / Doc No:</span>
                      <span className="font-black text-slate-900">{docNumber}</span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <span className="text-slate-400">วันที่ / Date:</span>
                      <span>{format(parseISO(transaction.date), 'dd/MM/yyyy')}</span>
                    </div>
                    {docType === 'quotation' && (
                      <div className="flex justify-end gap-2 text-emerald-600 font-bold">
                        <span>กำหนดยืนราคา:</span>
                        <span>{validityDays} วัน (ถึง {format(addDays(parseISO(transaction.date), validityDays), 'dd/MM/yyyy')})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer & Document Meta Info */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">ลูกค้า / CUSTOMER</h3>
                  <p className="text-base font-black text-slate-900">{details?.customerName || 'ลูกค้าทั่วไป'}</p>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    {details?.customerAddress} {details?.district} {details?.province} {details?.zipcode}
                  </p>
                  {details?.phoneNumber && <p className="text-xs font-bold text-slate-800">โทร: {details.phoneNumber}</p>}
                  {customerTaxId && (
                    <p className="text-xs font-bold text-slate-700">
                      เลขผู้เสียภาษี: {customerTaxId} {customerBranch && `(${customerBranch})`}
                    </p>
                  )}
                </div>

                <div className="space-y-1 text-right">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">การชำระเงิน & จัดส่ง</h3>
                  <p className="text-xs font-bold text-slate-700">วิธีชำระ: <span className="text-slate-900 font-black">{transaction.paymentMethod || 'เงินสด'}</span></p>
                  <p className="text-xs font-bold text-slate-700">
                    สถานะการชำระ: {' '}
                    <span className={`font-black ${details?.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {details?.paymentStatus === 'paid' ? 'ชำระแล้ว (PAID)' : 'ค้างชำระ (UNPAID)'}
                    </span>
                  </p>
                  {details?.shippingStatus && (
                    <p className="text-xs font-bold text-slate-700">สถานะขนส่ง: <span className="text-blue-600 font-black">{details.shippingStatus}</span></p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-hidden rounded-xl border border-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-black uppercase">
                    <tr>
                      <th className="p-3 w-12 text-center">ลำดับ</th>
                      <th className="p-3">รายการสินค้า / Description</th>
                      <th className="p-3 text-right w-28">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-white">
                      <td className="p-3 text-center font-bold text-slate-400">1</td>
                      <td className="p-3">
                        <div className="font-black text-slate-900 text-sm mb-0.5">
                          {transaction.subcategory || transaction.category}
                        </div>
                        <div className="text-xs font-medium text-slate-500">
                          {transaction.detail || 'รายการสั่งซื้อระบบโซล่าเซลล์และอุปกรณ์'}
                        </div>
                      </td>
                      <td className="p-3 text-right font-black text-sm text-slate-900">
                        ฿{subtotalBeforeVat.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-300 font-bold">
                    <tr>
                      <td colSpan={2} className="p-3 text-right text-slate-500">จำนวนเงินรวมก่อน VAT / Subtotal:</td>
                      <td className="p-3 text-right text-slate-900">
                        ฿{subtotalBeforeVat.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {vatAmount > 0 && (
                      <tr>
                        <td colSpan={2} className="p-3 text-right text-slate-500">ภาษีมูลค่าเพิ่ม VAT 7%:</td>
                        <td className="p-3 text-right text-slate-900">
                          ฿{vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    {withholdingTaxAmount > 0 && (
                      <tr className="text-rose-600">
                        <td colSpan={2} className="p-3 text-right">หักภาษี ณ ที่จ่าย ({withholdingTaxRate}%):</td>
                        <td className="p-3 text-right">
                          -฿{withholdingTaxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-900 text-white font-black text-sm">
                      <td className="p-3.5 text-left">
                        <span className="text-xs font-normal text-slate-300">({bahtText(netPayableAmount)})</span>
                      </td>
                      <td className="p-3.5 text-right">ยอดรวมสุทธิ / Total Net:</td>
                      <td className="p-3.5 text-right text-base text-emerald-400">
                        ฿{netPayableAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Banking Info (For Quotation & Invoice) */}
              {(docType === 'quotation' || docType === 'delivery_order') && shopInfo.bankAccountNo && (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="font-black uppercase flex items-center gap-1.5">
                    <CreditCard size={14} className="text-emerald-600" />
                    <span>ข้อมูลการชำระเงินโอนผ่านธนาคาร (Bank Transfer Details)</span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 font-bold pt-0.5">
                    <span>ธนาคาร: <strong>{shopInfo.bankName}</strong></span>
                    <span>เลขที่บัญชี: <strong className="text-emerald-700">{shopInfo.bankAccountNo}</strong></span>
                    <span>ชื่อบัญชี: <strong>{shopInfo.bankAccountName || shopInfo.name}</strong></span>
                  </div>
                </div>
              )}

              {/* Note & Terms */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">หมายเหตุ / Note</span>
                <p className="text-slate-600 font-medium italic">{noteText}</p>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-center text-xs">
                <div className="space-y-8">
                  <div className="h-12 border-b border-slate-300"></div>
                  <div>
                    <p className="font-bold text-slate-900">ผู้รับบริการ / ลูกค้า</p>
                    <p className="text-[10px] text-slate-400">Customer Signature</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="h-12 border-b border-slate-300"></div>
                  <div>
                    <p className="font-bold text-slate-900">ผู้ส่งของ / ผู้จัดทำ</p>
                    <p className="text-[10px] text-slate-400">Prepared By</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="h-12 border-b border-slate-300"></div>
                  <div>
                    <p className="font-bold text-slate-900">ผู้รับเงิน / ผู้มีอำนาจลงนาม</p>
                    <p className="text-[10px] text-slate-400">Authorized Signature</p>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  Generated by {shopInfo.name} Official Accounting & POS System
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Global Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-document, #printable-document * {
            visibility: visible;
          }
          #printable-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}} />
    </div>
  );
}
