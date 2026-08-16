import { useRef, useState } from 'react';
import { WarrantyCard, ShopInfo } from '../types';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  X, Download, Printer, ShieldCheck, Sun, CheckCircle2, 
  Sparkles, Award, Phone, MapPin, Calendar, Cpu, Wrench
} from 'lucide-react';
import jsPDF from 'jspdf';
import { html2canvasSafe } from '../utils/html2canvasSafe';
import { toast } from 'react-hot-toast';

interface WarrantyCardModalProps {
  isOpen: boolean;
  warranty: WarrantyCard | null;
  shopInfo: ShopInfo;
  onClose: () => void;
}

export default function WarrantyCardModal({
  isOpen,
  warranty,
  shopInfo,
  onClose
}: WarrantyCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !warranty) return null;

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'dd MMMM yyyy', { locale: th });
    } catch {
      return dateStr;
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    const toastId = toast.loading('กำลังสร้างไฟล์ PDF ใบรับประกัน...');

    try {
      const element = cardRef.current;
      const canvas = await html2canvasSafe(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Warranty_${warranty.warrantyNumber}_${warranty.customerName}.pdf`);

      toast.success('ดาวน์โหลดใบรับประกันเรียบร้อยแล้ว!', { id: toastId });
    } catch (err) {
      console.error('Failed to generate PDF warranty card:', err);
      toast.error('ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่อีกครั้ง', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full my-8 overflow-hidden print:shadow-none print:border-none print:max-w-none print:m-0">
        
        {/* Header Bar - Hidden on print */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>ใบรับประกันสินค้าและงานติดตั้งโซล่าเซลล์</span>
                <span className="text-amber-400 font-mono text-xs">#{warranty.warrantyNumber}</span>
              </h3>
              <p className="text-[11px] text-slate-400">ร้านกลางนาโซล่าเซลล์ • Official Warranty Certificate</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              <span>{isDownloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
            >
              <Printer size={14} />
              <span>พิมพ์</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate Container (A4 Ratio Compatible) */}
        <div className="p-6 sm:p-10 bg-white text-slate-900 overflow-x-auto print:p-0">
          <div 
            ref={cardRef} 
            className="w-full max-w-[800px] mx-auto bg-white p-8 sm:p-10 rounded-2xl border-4 border-amber-500/40 relative font-sans shadow-lg print:shadow-none print:border-amber-500"
            style={{ minHeight: '1080px' }}
          >
            {/* Background Watermark & Ornaments */}
            <div className="absolute inset-2 border border-amber-400/30 rounded-xl pointer-events-none" />
            <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
              <Sun size={240} className="text-amber-500" />
            </div>

            {/* Shop Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-200 gap-4">
              <div className="flex items-center space-x-4">
                <img
                  src={shopInfo.logoUrl || '/logo.jpg'}
                  alt="Shop Logo"
                  className="w-16 h-16 object-contain rounded-2xl border-2 border-amber-500 p-0.5 bg-white shadow-xs"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg'; }}
                />
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>{shopInfo.name || 'ร้านกลางนาโซล่าเซลล์'}</span>
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">{shopInfo.address}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium mt-1">
                    <span className="flex items-center gap-1"><Phone size={12} className="text-amber-600" /> {shopInfo.phone}</span>
                    {shopInfo.taxId && <span>| เลขผู้เสียภาษี: {shopInfo.taxId}</span>}
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right bg-amber-50/80 border border-amber-200 p-3 rounded-2xl">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 mb-1">
                  SOLAR WARRANTY CERTIFICATE
                </span>
                <div className="text-lg font-black text-slate-900 font-mono">
                  {warranty.warrantyNumber}
                </div>
                <div className="text-[11px] font-bold text-amber-800 flex items-center justify-end gap-1">
                  <Award size={13} />
                  <span>ใบรับประกันระบบและอุปกรณ์โซล่าเซลล์</span>
                </div>
              </div>
            </div>

            {/* Title Ribbon */}
            <div className="my-6 text-center py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black rounded-xl uppercase tracking-widest text-sm shadow-xs flex items-center justify-center space-x-2">
              <ShieldCheck size={18} />
              <span>หนังสือรับประกันคุณภาพสินค้าและการบริการติดตั้ง</span>
              <ShieldCheck size={18} />
            </div>

            {/* Customer & System Specs Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-extrabold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center text-xs">
                  <Sparkles size={14} className="mr-1.5 text-amber-500" /> ข้อมูลลูกค้าและการติดตั้ง
                </h4>
                <div className="space-y-1 text-slate-700">
                  <p><span className="font-bold text-slate-900">ชื่อลูกค้า:</span> {warranty.customerName}</p>
                  <p><span className="font-bold text-slate-900">เบอร์โทรศัพท์:</span> {warranty.customerPhone || '-'}</p>
                  <p><span className="font-bold text-slate-900">สถานที่ติดตั้ง:</span> {warranty.customerAddress || '-'} {warranty.province || ''}</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2">
                <h4 className="font-extrabold text-amber-900 border-b border-amber-200 pb-1.5 flex items-center text-xs">
                  <Calendar size={14} className="mr-1.5 text-amber-600" /> ระยะเวลารับประกัน & การดูแล
                </h4>
                <div className="space-y-1 text-slate-800">
                  <p><span className="font-bold">วันที่เริ่มรับประกัน:</span> {formatDateStr(warranty.warrantyStartDate)}</p>
                  <p><span className="font-bold">ประกันงานติดตั้ง/ระบบ:</span> <span className="text-amber-700 font-extrabold">{warranty.systemWarrantyYears} ปี</span> (ดูแลตรวจเช็คฟรี)</p>
                  <p><span className="font-bold">โควตาล้างแผงฟรี:</span> {warranty.freeCleaningCountPerYear || 1} ครั้ง/ปี</p>
                  <p><span className="font-bold text-amber-900">กำหนดล้างแผงรอบถัดไป:</span> <span className="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded">{formatDateStr(warranty.nextCleaningDate)}</span></p>
                </div>
              </div>
            </div>

            {/* System Package Summary Header */}
            {warranty.solarSystemPackage && (
              <div className="mb-4 p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <Sun size={15} className="text-amber-400" />
                  ระบบโซล่าเซลล์: {warranty.solarSystemPackage}
                </span>
                {warranty.systemCapacityKw && (
                  <span className="font-extrabold text-amber-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    ขนาดติดตั้ง {warranty.systemCapacityKw} kW
                  </span>
                )}
              </div>
            )}

            {/* Serial Numbers & Equipment Table */}
            <div className="my-6">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Cpu size={14} className="text-amber-600" />
                รายการอุปกรณ์หลักและหมายเลขซีเรียล (Serial Numbers)
              </h4>
              <div className="overflow-hidden border border-slate-300 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-extrabold uppercase border-b border-slate-300 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">ประเภทอุปกรณ์</th>
                      <th className="py-2.5 px-3">รุ่น / แบรนด์ (Model)</th>
                      <th className="py-2.5 px-3 font-mono">หมายเลขซีเรียล (Serial No.)</th>
                      <th className="py-2.5 px-3 text-center">จำนวน</th>
                      <th className="py-2.5 px-3 text-right">ประกันอุปกรณ์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {warranty.equipments && warranty.equipments.length > 0 ? (
                      warranty.equipments.map((eq, idx) => (
                        <tr key={eq.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {eq.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">{eq.brandModel || '-'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 bg-amber-50/50 rounded px-1">{eq.serialNumber || '-'}</td>
                          <td className="py-2.5 px-3 text-center font-bold">{eq.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-black text-amber-700">{eq.warrantyYears} ปี</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400 text-xs">
                          ไม่มีข้อมูลซีเรียลอุปกรณ์
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] leading-relaxed text-slate-600 space-y-1.5">
              <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                <Wrench size={13} className="text-amber-600" />
                เงื่อนไขการรับประกันและการให้บริการ (Warranty Terms):
              </h5>
              <ol className="list-decimal list-inside space-y-1 font-medium">
                <li>บริษัทรับประกันงานติดตั้งและอุปกรณ์ตามระยะเวลาที่ระบุไว้ข้างต้น นับตั้งแต่วันที่เริ่มรับประกัน</li>
                <li>การรับประกันครอบคลุมกรณีอุปกรณ์ชำรุดเสียหายอันเนื่องมาจากกระบวนการผลิตหรือการติดตั้งของทีมช่าง</li>
                <li>ไม่ครอบคลุมความเสียหายอันเกิดจากภัยธรรมชาติ (ฟ้าผ่า, น้ำท่วม), การดัดแปลงแก้ไขระบบโดยบุคคลอื่น หรือการใช้งานผิดวิธี</li>
                <li>กรุณาเก็บบัตรรับประกันนี้ไว้เพื่อใช้อ้างอิงในการรับบริการตรวจเช็คระบบหรือล้างแผงประจำปี</li>
              </ol>
            </div>

            {/* Signature Block */}
            <div className="mt-12 pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-10">
                <div className="h-10 border-b border-dashed border-slate-400 max-w-[200px] mx-auto flex items-end justify-center pb-1">
                  <span className="text-[10px] text-slate-400 italic">ลงนามช่างผู้ตรวจรับ</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">({warranty.certifiedTechnicianName || 'ช่างบอย / ทีมงานกลางนาโซล่าเซลล์'})</p>
                  <p className="text-[10px] text-slate-500 font-medium">วิศวกร / ช่างติดตั้งผู้เชี่ยวชาญ</p>
                </div>
              </div>

              <div className="space-y-10">
                <div className="h-10 border-b border-dashed border-slate-400 max-w-[200px] mx-auto flex items-end justify-center pb-1">
                  <span className="text-[10px] text-slate-400 italic">ลงนามลูกค้า</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">({warranty.customerName})</p>
                  <p className="text-[10px] text-slate-500 font-medium">ผู้รับมอบงานและบัตรรับประกัน</p>
                </div>
              </div>
            </div>

            {/* Official Stamp badge */}
            <div className="mt-8 text-center border-t border-slate-100 pt-3">
              <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>Verified & Issued by {shopInfo.name || 'ร้านกลางนาโซล่าเซลล์'}</span>
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
