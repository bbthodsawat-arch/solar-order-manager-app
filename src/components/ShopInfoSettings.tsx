import React, { useState } from 'react';
import { ShopInfo } from '../types';
import { Store, MapPin, Phone, Mail, FileText, Save, Info, Eye, CheckCircle2, Receipt, Image as ImageIcon, Upload, RotateCcw, XCircle, Sliders } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { notifyReaction } from '../utils/feedback';

interface ShopInfoSettingsProps {
  shopInfo: ShopInfo;
  onUpdate: (info: ShopInfo) => Promise<void>;
}

export default function ShopInfoSettings({ shopInfo, onUpdate }: ShopInfoSettingsProps) {
  const [info, setInfo] = useState<ShopInfo>({
    ...shopInfo,
    logoUrl: shopInfo.logoUrl || '/logo.jpg',
    showLogo: shopInfo.showLogo ?? true,
    systemName: shopInfo.systemName || 'Solar Financial & Operations Management',
    companyNameTh: shopInfo.companyNameTh || '',
    companyNameEn: shopInfo.companyNameEn || '',
    showDeveloperCredit: shopInfo.showDeveloperCredit ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      notifyReaction('warning', 'ไฟล์ภาพโลโก้มีขนาดใหญ่เกินไป (กรุณาใช้ไฟล์ขนาดไม่เกิน 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setInfo(prev => ({ ...prev, logoUrl: base64 }));
        notifyReaction('success', 'อัปโหลดโลโก้ร้านค้าสำเร็จ');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdate(info);
      notifyReaction('success', 'บันทึกข้อมูลและโลโก้ร้านค้าสำเร็จเรียบร้อย');
    } catch (error) {
      notifyReaction('error', 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20">
            <Store size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">ข้อมูลตัวตนร้านค้า (Shop Identity & Logo)</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              กำหนดรายละเอียดชื่อร้าน โลโก้ร้านค้า เบอร์โทร ที่อยู่ออกใบเสร็จ และข้อความท้ายเอกสาร
            </p>
          </div>
        </div>

        <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
          <CheckCircle2 size={13} className="mr-1.5" />
          <span>ระบบพิมพ์ใบเสร็จพร้อมใช้งาน</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          
          {/* System & Company Brand Settings */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-slate-50 dark:from-slate-800/40 dark:to-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-4">
            <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders size={15} />
              <span>การตั้งค่าระบบและบริษัท (System & Company Settings)</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  ชื่อระบบการทำงาน / System Name
                </label>
                <input
                  type="text"
                  value={info.systemName || ''}
                  onChange={e => setInfo({ ...info, systemName: e.target.value })}
                  placeholder="เช่น Solar Financial & Operations Management"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  ชื่อบริษัท (ไทย) / Company Name (TH)
                </label>
                <input
                  type="text"
                  value={info.companyNameTh || ''}
                  onChange={e => setInfo({ ...info, companyNameTh: e.target.value })}
                  placeholder="เช่น บริษัท กลางนา โซล่าเซลล์ จำกัด"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  ชื่อบริษัท (อังกฤษ) / Company Name (EN)
                </label>
                <input
                  type="text"
                  value={info.companyNameEn || ''}
                  onChange={e => setInfo({ ...info, companyNameEn: e.target.value })}
                  placeholder="เช่น Klangna Solar Cell Co., Ltd."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  การแสดงแบรนด์และโลโก้ / Brand Visibility
                </label>
                <div className="space-y-2 mt-1">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={info.showLogo ?? true}
                      onChange={e => setInfo({ ...info, showLogo: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      แสดงโลโก้ร้านค้าในแถบเมนู (Show Header Logo)
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={info.showDeveloperCredit ?? true}
                      onChange={e => setInfo({ ...info, showDeveloperCredit: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      แสดงผู้พัฒนา "by boy thodsawat"
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Logo Manager */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon size={15} className="text-amber-500" />
                <span>โลโก้ร้านค้า (Shop Logo)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setInfo(prev => ({ ...prev, logoUrl: '/logo.jpg' }));
                  toast.success('รีเซ็ตโลโก้เป็นค่าเริ่มต้นแล้ว');
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>ใช้โลโก้มาตรฐาน</span>
              </button>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Logo Preview Avatar */}
              <div className="relative w-20 h-20 rounded-2xl border-2 border-amber-400 bg-white p-1 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={info.logoUrl || '/logo.jpg'}
                  alt="Shop Logo Preview"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.jpg';
                  }}
                />
              </div>

              {/* Upload controls */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex gap-2">
                  <label className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all shadow-xs active:scale-95">
                    <Upload size={14} />
                    <span>อัปโหลดโลโก้ใหม่</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={info.logoUrl || ''}
                  onChange={e => setInfo({ ...info, logoUrl: e.target.value })}
                  placeholder="หรือระบุ URL รูปภาพโลโก้ (เช่น /logo.jpg หรือ https://...)"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-1.5 text-[11px] font-medium outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                ชื่อร้านค้า / Shop Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Store size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={info.name}
                  onChange={e => setInfo({ ...info, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl pl-12 pr-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                  placeholder="เช่น ร้านกลางนาโซล่าเซลล์"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                เบอร์โทรศัพท์ติดต่อ / Phone <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={info.phone}
                  onChange={e => setInfo({ ...info, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl pl-12 pr-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                  placeholder="08X-XXX-XXXX"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
              ที่อยู่ออกเอกสารและใบเสร็จ / Address
            </label>
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-3.5 text-slate-400" />
              <textarea
                rows={3}
                value={info.address}
                onChange={e => setInfo({ ...info, address: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl pl-12 pr-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all resize-none"
                placeholder="เลขที่... หมู่... ถนน... ตำบล/แขวง... อำเภอ/เขต... จังหวัด..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                อีเมลร้านค้า (Email)
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={info.email || ''}
                  onChange={e => setInfo({ ...info, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl pl-12 pr-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                  placeholder="klangnasolar@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                เลขประจำตัวผู้เสียภาษี (Tax ID)
              </label>
              <div className="relative">
                <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={info.taxId || ''}
                  onChange={e => setInfo({ ...info, taxId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl pl-12 pr-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                  placeholder="01055XXXXXXXX (13 หลัก)"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                สาขา / Branch
              </label>
              <input
                type="text"
                value={info.branch || ''}
                onChange={e => setInfo({ ...info, branch: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                placeholder="เช่น สำนักงานใหญ่ หรือ สาขาที่ 00001"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                สถานะภาษีมูลค่าเพิ่ม (VAT 7%)
              </label>
              <label className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-4 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={info.taxRegistered ?? true}
                  onChange={e => setInfo({ ...info, taxRegistered: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {info.taxRegistered ?? true ? 'จดทะเบียนภาษีมูลค่าเพิ่ม (VAT Registered)' : 'ไม่ได้จดภาษีมูลค่าเพิ่ม (Non-VAT)'}
                </span>
              </label>
            </div>
          </div>

          {/* Banking Details for Invoices & Quotations */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt size={15} className="text-emerald-500" />
              <span>ข้อมูลบัญชีธนาคารรับชำระเงิน (สำหรับแสดงในใบเสนอราคา / ใบแจ้งหนี้)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">ธนาคาร</label>
                <input
                  type="text"
                  value={info.bankName || ''}
                  onChange={e => setInfo({ ...info, bankName: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-xs text-slate-800 dark:text-white"
                  placeholder="เช่น กสิกรไทย, กสิกร, กรุงไทย"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">เลขที่บัญชี</label>
                <input
                  type="text"
                  value={info.bankAccountNo || ''}
                  onChange={e => setInfo({ ...info, bankAccountNo: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-xs text-slate-800 dark:text-white"
                  placeholder="XXX-X-XXXXX-X"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">ชื่อบัญชี</label>
                <input
                  type="text"
                  value={info.bankAccountName || ''}
                  onChange={e => setInfo({ ...info, bankAccountName: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-xs text-slate-800 dark:text-white"
                  placeholder="ชื่อบัญชีบริษัท หรือ ชื่อร้าน"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
              ข้อความหมายเหตุ / ท้ายใบเสร็จ (Receipt Footer Note)
            </label>
            <input
              type="text"
              value={info.receiptNote || ''}
              onChange={e => setInfo({ ...info, receiptNote: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
              placeholder="เช่น ขอบคุณที่ไว้วางใจร้านกลางนาโซล่าเซลล์ • รับประกันงานติดตั้ง 1 ปีเต็ม"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <span className="flex items-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </span>
              ) : (
                <>
                  <Save size={18} />
                  <span>บันทึกข้อมูลร้านค้า</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Live Document Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Eye size={15} className="text-indigo-500" />
              <span>พรีวิวตัวอย่างใบเสร็จจริง (Live Preview)</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
              Receipt Paper
            </span>
          </div>

          {/* Visual Receipt Paper Card */}
          <div className="bg-amber-50/40 dark:bg-slate-950/80 border-2 border-dashed border-amber-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 text-slate-800 dark:text-slate-200 relative overflow-hidden shadow-inner">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

            {/* Header */}
            <div className="text-center space-y-1.5 pb-4 border-b border-dashed border-slate-300 dark:border-slate-800">
              <div className="w-14 h-14 mx-auto rounded-2xl border-2 border-amber-400 bg-white p-1 shadow-md mb-2 flex items-center justify-center overflow-hidden">
                <img
                  src={info.logoUrl || '/logo.jpg'}
                  alt="Logo Preview"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.jpg';
                  }}
                />
              </div>
              <h4 className="font-black text-base text-slate-900 dark:text-white tracking-tight">
                {info.name || 'ชื่อร้านค้าของคุณ'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight max-w-xs mx-auto">
                {info.address || 'เลขที่... ถนน... แขวง/ตำบล... อำเภอ/เขต... จังหวัด...'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 pt-1">
                <span>โทร: {info.phone || '08X-XXX-XXXX'}</span>
                {info.taxId && <span>• เลขผู้เสียภาษี: {info.taxId}</span>}
              </div>
            </div>

            {/* Fake Item Table Sample */}
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between font-black text-slate-400 uppercase tracking-wider text-[9px] pb-1 border-b border-slate-200 dark:border-slate-800">
                <span>รายการ (Item)</span>
                <span>จำนวนเงิน (THB)</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>ชุดโซล่าเซลล์ Hybrid 5kW</span>
                <span>85,000.00</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>ค่าบริการติดตั้งมาตรฐาน</span>
                <span>12,000.00</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-black text-xs text-slate-900 dark:text-white">
                <span>ยอดรวมสุทธิ (TOTAL)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">฿97,000.00</span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-800 text-center space-y-1">
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 italic">
                "{info.receiptNote || 'ขอบคุณที่ใช้บริการ ติดต่อสอบถามได้ตลอดเวลา'}"
              </p>
              <p className="text-[9px] text-slate-400 font-medium">
                เอกสารนี้ออกโดยระบบบริหารงานร้านกลางนาโซล่าเซลล์
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 flex items-start space-x-2.5">
            <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 leading-relaxed">
              เมื่อคุณสร้างและออกใบเสร็จในระบบ ข้อมูลหัวกระดาษและท้ายกระดาษข้างต้นจะถูกจัดวางลงในเอกสารสำหรับพิมพ์ (PDF / Print) โดยอัตโนมัติ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

