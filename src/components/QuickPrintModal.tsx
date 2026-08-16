import React, { useRef, useState } from 'react';
import { Transaction, ShopInfo } from '../types';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  Printer, Download, Copy, Check, X, Zap, Receipt, 
  Phone, MapPin, User, CheckCircle2, ShieldCheck, Sparkles 
} from 'lucide-react';
import jsPDF from 'jspdf';
import { html2canvasSafe } from '../utils/html2canvasSafe';
import { toast } from 'react-hot-toast';

interface QuickPrintModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  shopInfo: ShopInfo;
  onClose: () => void;
}

export default function QuickPrintModal({
  isOpen,
  transaction,
  shopInfo,
  onClose,
}: QuickPrintModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const details = transaction?.saleOrderDetails;
  const totalAmount = Number(transaction?.amount) || 0;

  // Items breakdown parsing
  const itemsList = React.useMemo(() => {
    if (!transaction) return [];
    if (details?.setOption) {
      // Split options if multiple items
      const parts = details.setOption.split(',').map(s => s.trim()).filter(Boolean);
      return parts.map(p => {
        // Check if has qty e.g. "ชุดโซล่าเซลล์ (x2)"
        const qtyMatch = p.match(/\(x(\d+)\)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
        const cleanName = p.replace(/\(x\d+\)/, '').trim();
        return { name: cleanName, qty, price: totalAmount / parts.length };
      });
    }
    return [
      {
        name: transaction.subcategory || transaction.category || 'รายการสินค้า/บริการ',
        qty: 1,
        price: totalAmount,
      }
    ];
  }, [details?.setOption, transaction?.subcategory, transaction?.category, transaction, totalAmount]);

  if (!isOpen || !transaction) return null;

  const rawDocNo = transaction.id ? transaction.id.slice(-6).toUpperCase() : '000001';
  const receiptNo = `POS-${rawDocNo}`;
  const txDate = transaction.date ? parseISO(transaction.date) : new Date();
  const formattedDate = format(txDate, 'dd/MM/yyyy HH:mm', { locale: th });

  // Handle direct thermal print
  const handlePrint = () => {
    window.print();
  };

  // Copy plain text receipt for LINE/Chat
  const handleCopyText = () => {
    let text = `========= ${shopInfo.name || 'ร้านกลางนาโซล่าเซลล์'} =========\n`;
    text += `เลขที่สลิป: ${receiptNo}\n`;
    text += `วันที่: ${formattedDate}\n`;
    if (shopInfo.phone) text += `โทร: ${shopInfo.phone}\n`;
    text += `--------------------------------\n`;
    if (details?.customerName) {
      text += `ลูกค้า: ${details.customerName}\n`;
      if (details.phoneNumber) text += `เบอร์โทร: ${details.phoneNumber}\n`;
      if (details.province) text += `จังหวัด: ${details.province}\n`;
    }
    text += `--------------------------------\n`;
    text += `รายการสินค้า:\n`;
    itemsList.forEach((item, index) => {
      text += `${index + 1}. ${item.name} x${item.qty} = ฿${item.price.toLocaleString()}\n`;
    });
    text += `--------------------------------\n`;
    text += `ราคารวมสุทธิ: ฿${totalAmount.toLocaleString()} บาท\n`;
    text += `สถานะการชำระ: ${details?.paymentStatus === 'paid' ? 'ชำระเงินเรียบร้อยแล้ว' : 'ยังไม่ได้ชำระเงิน'}\n`;
    if (details?.paymentMethod) text += `วิธีชำระ: ${details.paymentMethod}\n`;
    text += `================================\n`;
    text += `${shopInfo.receiptNote || 'ขอบคุณที่ใช้อุดหนุนบริการของเรา'}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('คัดลอกสรุปสลิปเรียบร้อยแล้ว');
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick PDF Download
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingPdf(true);
    const toastId = toast.loading('กำลังสร้างไฟล์ PDF สลิปด่วน...');

    try {
      const element = receiptRef.current;
      const canvas = await html2canvasSafe(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const is58 = paperWidth === '58mm';
      const pdfWidth = is58 ? 58 : 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, Math.max(pdfHeight + 10, 150)]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt_${receiptNo}_${paperWidth}.pdf`);
      toast.success('ดาวน์โหลดสลิป PDF สำเร็จ', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('ไม่สามารถสร้าง PDF ได้', { id: toastId });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 animate-fade-in print:p-0 print:bg-white print:backdrop-blur-none overflow-y-auto">
      
      {/* Container */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 my-auto print:border-none print:shadow-none print:w-full">
        
        {/* Header Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Zap size={18} />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-black text-sm text-white leading-none">พิมพ์สลิปด่วน (Quick Print)</h3>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-black uppercase">POS Thermal</span>
              </div>
              <p className="text-[10px] text-slate-400">ใบเสร็จอย่างย่อสำหรับเครื่องพิมพ์ความร้อน</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Paper Size & Action Toolbar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs print:hidden">
          {/* Size selector */}
          <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setPaperWidth('80mm')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                paperWidth === '80mm'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              80 mm (มาตรฐาน)
            </button>
            <button
              onClick={() => setPaperWidth('58mm')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                paperWidth === '58mm'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              58 mm (พกพา)
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleCopyText}
              className="p-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-[11px] flex items-center space-x-1 transition-all"
              title="คัดลอกข้อความสลิปส่งไลน์"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="p-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-[11px] flex items-center space-x-1 transition-all disabled:opacity-50"
              title="ดาวน์โหลด PDF"
            >
              <Download size={14} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Print Scroll Viewport */}
        <div className="p-4 bg-slate-200 dark:bg-slate-950 flex-1 overflow-auto max-h-[65vh] flex justify-center print:p-0 print:bg-white print:max-h-none print:overflow-visible">
          
          {/* Thermal Receipt Body Container */}
          <div
            ref={receiptRef}
            id="quick-print-receipt-content"
            className={`bg-white text-slate-900 p-5 font-mono shadow-lg rounded-2xl border border-slate-300 print:border-none print:shadow-none print:rounded-none print:p-0 transition-all ${
              paperWidth === '80mm' ? 'w-[320px] text-xs' : 'w-[240px] text-[10px]'
            }`}
          >
            {/* Header / Shop Info */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl border border-slate-300 bg-white p-0.5 shadow-2xs mb-1 flex items-center justify-center overflow-hidden">
                <img
                  src={shopInfo.logoUrl || '/logo.jpg'}
                  alt="Shop Logo"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.jpg';
                  }}
                />
              </div>
              <h2 className="font-black text-sm uppercase tracking-wide">
                {shopInfo.name || 'ร้านกลางนาโซล่าเซลล์'}
              </h2>
              <p className="text-[10px] text-slate-600 leading-tight">
                {shopInfo.address || 'อำเภอเมือง จังหวัดขอนแก่น'}
              </p>
              {shopInfo.phone && <p className="text-[10px] font-bold">โทร: {shopInfo.phone}</p>}
              {shopInfo.taxId && <p className="text-[10px] text-slate-600">เลขผู้เสียภาษี: {shopInfo.taxId}</p>}
              <div className="pt-1.5">
                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-black text-xs uppercase">
                  ใบเสร็จรับเงินอย่างย่อ
                </span>
                <p className="text-[9px] text-slate-500 mt-0.5">(RECEIPT / SLIP POS)</p>
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">เลขที่:</span>
                <span className="font-bold">{receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">วันที่:</span>
                <span>{formattedDate}</span>
              </div>
              {details?.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-slate-500">วิธีชำระ:</span>
                  <span className="font-bold">{details.paymentMethod}</span>
                </div>
              )}
            </div>

            {/* Customer Details if available */}
            {details?.customerName && (
              <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px] bg-slate-50 p-2 rounded-lg my-2 border border-slate-200">
                <p className="font-bold text-slate-800 flex items-center space-x-1">
                  <User size={10} />
                  <span>ลูกค้า: {details.customerName}</span>
                </p>
                {details.phoneNumber && <p className="text-slate-600 pl-3">โทร: {details.phoneNumber}</p>}
                {details.province && <p className="text-slate-600 pl-3">ที่อยู่/จังหวัด: {details.province}</p>}
              </div>
            )}

            {/* Items List Table */}
            <div className="py-3 border-b border-dashed border-slate-400 space-y-2">
              <div className="flex justify-between font-black text-[10px] uppercase text-slate-500 border-b border-slate-200 pb-1">
                <span>รายการ</span>
                <span>จำนวน x ราคา</span>
              </div>

              {itemsList.map((item, idx) => (
                <div key={idx} className="space-y-0.5 text-[11px]">
                  <p className="font-bold text-slate-800 break-words leading-tight">{item.name}</p>
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>{item.qty} x ฿{Number(item.price).toLocaleString()}</span>
                    <span className="font-bold text-slate-900">฿{(item.qty * item.price).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="py-3 border-b border-dashed border-slate-400 space-y-1.5 text-xs">
              <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1">
                <span>ยอดรวมทั้งสิ้น</span>
                <span className="text-emerald-700">฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-[10px] text-slate-500">
                <span>สถานะชำระเงิน:</span>
                <span className={`font-bold ${details?.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {details?.paymentStatus === 'paid' ? '✓ ชำระแล้ว' : '✗ ยังไม่ชำระ'}
                </span>
              </div>
            </div>

            {/* Footer / Thank You Note */}
            <div className="pt-3 text-center space-y-1.5 text-[10px] text-slate-600">
              <p className="font-bold text-slate-800">{shopInfo.receiptNote || 'ขอบคุณที่อุดหนุนสินค้าและบริการ'}</p>
              <div className="w-full flex items-center justify-center pt-1">
                <div className="h-8 w-44 bg-slate-200 rounded flex items-center justify-center text-[9px] font-mono tracking-widest text-slate-500">
                  * {receiptNo} *
                </div>
              </div>
              <p className="text-[8px] text-slate-400">พิมพ์ด้วยระบบร้านกลางนาโซล่าเซลล์ POS</p>
            </div>

          </div>
        </div>

        {/* Modal Bottom Main Print Action */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 max-w-xs py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <Printer size={16} />
            <span>พิมพ์สลิปด่วนทันที (Print Slip)</span>
          </button>
        </div>

      </div>

      {/* Embedded CSS for Print Mode */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #quick-print-receipt-content, #quick-print-receipt-content * {
            visibility: visible !important;
          }
          #quick-print-receipt-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${paperWidth === '80mm' ? '80mm' : '58mm'} !important;
            padding: 2mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
