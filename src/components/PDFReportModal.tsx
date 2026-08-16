import { useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { X, Download, Printer, FileText, CheckCircle2, Clock, TrendingUp, TrendingDown, Wallet, Percent, ShieldCheck } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { html2canvasSafe } from '../utils/html2canvasSafe';
import { toast } from 'react-hot-toast';
import { Transaction } from '../types';

interface PDFReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateInterval: { start: Date; end: Date };
  transactions: Transaction[];
  stats: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    profitMargin: string;
    transactionCount: number;
    salesBreakdown: { name: string; count: number; amount: number }[];
    paidAmount: number;
    unpaidAmount: number;
    paidCount: number;
    unpaidCount: number;
  };
}

export default function PDFReportModal({
  isOpen,
  onClose,
  dateInterval,
  transactions,
  stats
}: PDFReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  // Handle PDF Download
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    const toastId = toast.loading('กำลังสร้างไฟล์ PDF รายงาน...');

    try {
      const element = reportRef.current;
      const canvas = await html2canvasSafe(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Multi-page if content overflows A4
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `รายงานสรุปการเงิน_${format(dateInterval.start, 'yyyyMMdd')}_${format(dateInterval.end, 'yyyyMMdd')}.pdf`;
      pdf.save(fileName);

      toast.success('ดาวน์โหลดไฟล์ PDF เรียบร้อยแล้ว', { id: toastId });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้าง PDF', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  // Handle Browser Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 my-auto">
        
        {/* Modal Header Controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                ตัวอย่างรายงาน PDF (PDF Document Preview)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                พร้อมสำหรับการพิมพ์หรือดาวน์โหลดเก็บเป็นไฟล์เอกสาร PDF
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={generating}
              className="flex items-center px-4 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              <Download size={15} className="mr-1.5" />
              {generating ? 'กำลังประมวลผล...' : 'ดาวน์โหลด PDF'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Printer size={15} className="mr-1.5" />
              พิมพ์
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body - Printable Paper View */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-gray-100 dark:bg-gray-950 flex justify-center">
          
          {/* Paper Document Canvas Container (A4 Printable Layout) */}
          <div
            ref={reportRef}
            className="w-full max-w-[210mm] bg-white text-gray-900 p-8 shadow-md rounded-sm font-sans space-y-6 border border-gray-200 print:shadow-none print:p-0 print:border-none print:w-full"
            style={{ minHeight: '297mm' }}
          >
            {/* Document Header */}
            <div className="border-b-2 border-green-600 pb-4 flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 text-green-700">
                  <ShieldCheck size={28} />
                  <h1 className="text-2xl font-black tracking-tight"> Solar System & Financial Management</h1>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  ระบบบริหารจัดการบัญชีรายรับ-รายจ่าย และยอดขายระบบโซล่าเซลล์
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-md uppercase tracking-wider mb-1">
                  รายงานสรุปทางการเงิน
                </span>
                <p className="text-[11px] text-gray-500">
                  วันที่พิมพ์เอกสาร: {format(new Date(), 'd MMMM yyyy HH:mm', { locale: th })} น.
                </p>
              </div>
            </div>

            {/* Report Range Information Box */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-wrap justify-between items-center text-xs gap-2">
              <div>
                <span className="text-gray-500 font-semibold">ช่วงเวลาของรายงาน:</span>{' '}
                <strong className="text-gray-900 font-bold">
                  {format(dateInterval.start, 'd MMMM yyyy', { locale: th })} - {format(dateInterval.end, 'd MMMM yyyy', { locale: th })}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 font-semibold">จำนวนรายการทั้งหมด:</span>{' '}
                <strong className="text-green-700 font-bold">{stats.transactionCount} รายการ</strong>
              </div>
            </div>

            {/* Key KPI Financial Metrics */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                  <span className="text-[11px] font-bold">รายรับรวม</span>
                  <TrendingUp size={14} />
                </div>
                <p className="text-lg font-black text-emerald-800">
                  ฿{stats.totalIncome.toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <div className="flex items-center justify-between text-rose-700 mb-1">
                  <span className="text-[11px] font-bold">รายจ่ายรวม</span>
                  <TrendingDown size={14} />
                </div>
                <p className="text-lg font-black text-rose-800">
                  ฿{stats.totalExpense.toLocaleString()}
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${stats.netProfit >= 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold">กำไรสุทธิ</span>
                  <Wallet size={14} />
                </div>
                <p className="text-lg font-black">
                  ฿{stats.netProfit.toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold">อัตรากำไร (Margin)</span>
                  <Percent size={14} />
                </div>
                <p className="text-lg font-black">
                  {stats.profitMargin}%
                </p>
              </div>
            </div>

            {/* Sales & Payment Status Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-green-50/70 border border-green-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1 text-green-700 font-bold text-xs">
                    <CheckCircle2 size={14} />
                    <span>ยอดชำระเงินแล้ว ({stats.paidCount} ออเดอร์)</span>
                  </div>
                  <p className="text-base font-black text-green-800 mt-1">
                    ฿{stats.paidAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1 text-amber-700 font-bold text-xs">
                    <Clock size={14} />
                    <span>ยอดค้างชำระ ({stats.unpaidCount} ออเดอร์)</span>
                  </div>
                  <p className="text-base font-black text-amber-800 mt-1">
                    ฿{stats.unpaidAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Sales breakdown by Solar Set */}
            {stats.salesBreakdown.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-1">
                  สรุปยอดขายจำแนกตามรุ่น/ชุดสินค้า
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {stats.salesBreakdown.map(item => (
                    <div key={item.name} className="flex justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="font-medium text-gray-700">{item.name} ({item.count} รายการ)</span>
                      <strong className="text-green-700">฿{item.amount.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction Items Table */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-1">
                ตารางรายการทั้งหมด ({transactions.length} รายการ)
              </h3>
              
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                    <th className="p-2 w-28">วันที่-เวลา</th>
                    <th className="p-2 w-20">ประเภท</th>
                    <th className="p-2 w-36">หมวดหมู่</th>
                    <th className="p-2">รายละเอียด / ลูกค้า</th>
                    <th className="p-2 text-right w-28">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.slice(0, 50).map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-2 text-gray-600 font-mono text-[11px]">
                        {format(parseISO(t.date), 'dd/MM/yy HH:mm')}
                      </td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                        </span>
                      </td>
                      <td className="p-2 font-medium text-gray-800">
                        {t.category}
                      </td>
                      <td className="p-2 text-gray-600">
                        {t.detail || '-'}
                        {t.saleOrderDetails?.customerName && (
                          <span className="block text-[10px] text-gray-400">
                            ลูกค้า: {t.saleOrderDetails.customerName} ({t.saleOrderDetails.province}) {t.saleOrderDetails.paymentMethod ? `| รูปแบบชำระ: ${t.saleOrderDetails.paymentMethod}` : ''}
                          </span>
                        )}
                      </td>
                      <td className={`p-2 text-right font-bold ${t.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                        {t.type === 'income' ? '+' : '-'}฿{t.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {transactions.length > 50 && (
                    <tr>
                      <td colSpan={5} className="p-2 text-center text-gray-400 italic text-[11px]">
                        ...แสดง 50 รายการแรกจากทั้งหมด {transactions.length} รายการ (ส่งออก CSV สำหรับรายการทั้งหมด)...
                      </td>
                    </tr>
                  )}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-400">
                        ไม่มีข้อมูลรายการในช่วงเวลานี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Document Signature & Footer */}
            <div className="pt-8 border-t border-gray-200 mt-auto grid grid-cols-2 gap-8 text-center text-xs text-gray-500">
              <div>
                <div className="border-b border-gray-300 w-48 mx-auto h-12"></div>
                <p className="mt-2 font-medium">ผู้จัดทำรายงาน / ผู้ตรวจสอบ</p>
                <p className="text-[10px] text-gray-400">วันที่: ..... / ..... / ..........</p>
              </div>
              <div>
                <div className="border-b border-gray-300 w-48 mx-auto h-12"></div>
                <p className="mt-2 font-medium">ผู้อนุมัติ / เจ้าของกิจการ</p>
                <p className="text-[10px] text-gray-400">วันที่: ..... / ..... / ..........</p>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-[10px] text-center text-gray-400 border-t border-gray-100 pt-3">
              เอกสารฉบับนี้สร้างโดยอัตโนมัติผ่านระบบการจัดการพลังงานและบัญชี Solar Financial App
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
