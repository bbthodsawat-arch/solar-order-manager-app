import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useAppConfig } from '../hooks/useAppConfig';
import { Building2, Save, Eye, EyeOff, Info, CheckCircle2, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { notifyReaction } from '../utils/feedback';

interface CompanySettingsData {
  name: string;
  companyNameTh: string;
  companyNameEn: string;
  showLogo: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_COMPANY_SETTINGS: CompanySettingsData = {
  name: 'ร้านกลางนาโซล่าเซลล์',
  companyNameTh: 'บริษัท กลางนา โซล่าเซลล์ จำกัด',
  companyNameEn: 'Klangna Solar Cell Co., Ltd.',
  showLogo: true,
};

export default function CompanySettings() {
  const { user, appUser } = useAuth();
  const { config, updateShopInfo } = useAppConfig();
  
  // Check permission: b.b.thodsawat@gmail.com (admin) or owner/admin role
  const isAdminOrOwner = 
    user?.email?.toLowerCase() === 'b.b.thodsawat@gmail.com' || 
    appUser?.role === 'admin' || 
    appUser?.role === 'owner';

  const [settings, setSettings] = useState<CompanySettingsData>(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load and listen to 'settings/company' document in Cloud Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'settings', 'company');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<CompanySettingsData>;
        setSettings({
          name: data.name || DEFAULT_COMPANY_SETTINGS.name,
          companyNameTh: data.companyNameTh || '',
          companyNameEn: data.companyNameEn || '',
          showLogo: data.showLogo ?? DEFAULT_COMPANY_SETTINGS.showLogo,
        });
      } else {
        // Document does not exist yet, we keep defaults
        setSettings(DEFAULT_COMPANY_SETTINGS);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading company settings from Firestore:', error);
      handleFirestoreError(error, OperationType.GET, 'settings/company');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle Save function
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrOwner) {
      notifyReaction('error', 'คุณไม่มีสิทธิ์แก้ไขการตั้งค่านี้ (เฉพาะผู้ดูแลระบบเท่านั้น)');
      return;
    }

    if (!settings.name.trim()) {
      notifyReaction('warning', 'กรุณาระบุชื่อร้านค้า');
      return;
    }

    setIsSaving(true);
    const docRef = doc(db, 'settings', 'company');
    
    try {
      const payload: CompanySettingsData = {
        name: settings.name.trim(),
        companyNameTh: settings.companyNameTh.trim(),
        companyNameEn: settings.companyNameEn.trim(),
        showLogo: settings.showLogo,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || 'unknown'
      };

      // 1. Save to Firestore under 'settings' collection
      await setDoc(docRef, payload);

      // 2. Also keep global config.shopInfo synchronized for system-wide integrity
      if (config.shopInfo) {
        await updateShopInfo({
          ...config.shopInfo,
          name: payload.name,
          companyNameTh: payload.companyNameTh,
          companyNameEn: payload.companyNameEn,
          showLogo: payload.showLogo
        });
      }

      notifyReaction('success', 'บันทึกข้อมูลบริษัทไปยัง Cloud Firestore สำเร็จเรียบร้อย');
    } catch (error) {
      console.error('Error saving company settings to Firestore:', error);
      handleFirestoreError(error, OperationType.WRITE, 'settings/company');
      notifyReaction('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูลไปยังฐานข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw className="animate-spin text-indigo-500 mb-3" size={32} />
        <p className="text-sm font-black text-slate-500 dark:text-slate-400">กำลังโหลดข้อมูลบริษัทจาก Cloud Firestore...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
            <Building2 size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">ข้อมูลบริษัทและการแสดงผล (Company Settings & Display)</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              จัดการข้อมูลชื่อร้าน ชื่อบริษัทภาษาไทย/อังกฤษ และเปิดปิดการแสดงโลโก้ส่วนหัวบันทึกลง Firestore (Settings Collection)
            </p>
          </div>
        </div>

        <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 shrink-0">
          <CheckCircle2 size={13} className="mr-1.5" />
          <span>Firestore Syncing (Active)</span>
        </span>
      </div>

      {!isAdminOrOwner && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start space-x-3 text-amber-800 dark:text-amber-400">
          <Lock className="shrink-0 mt-0.5" size={16} />
          <div className="text-xs font-semibold space-y-1">
            <p className="font-bold">หน้าจอนี้สำหรับผู้ดูแลระบบหรือเจ้าของกิจการเท่านั้น</p>
            <p className="text-slate-500 dark:text-slate-400">บัญชีของคุณไม่มีสิทธิ์ในการแก้ไขข้อมูลใดๆ คุณสามารถเปิดดูข้อมูลการตั้งค่าเหล่านี้ได้เท่านั้น</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Container */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
          {/* Inputs section */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                ชื่อร้านค้า / Shop Name
              </label>
              <input
                type="text"
                disabled={!isAdminOrOwner || isSaving}
                value={settings.name}
                onChange={e => setSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ระบุชื่อร้านค้า เช่น ร้านกลางนาโซล่าเซลล์"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  ชื่อบริษัท (ภาษาไทย) / Company Name (TH)
                </label>
                <input
                  type="text"
                  disabled={!isAdminOrOwner || isSaving}
                  value={settings.companyNameTh}
                  onChange={e => setSettings(prev => ({ ...prev, companyNameTh: e.target.value }))}
                  placeholder="เช่น บริษัท กลางนา โซล่าเซลล์ จำกัด"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  ชื่อบริษัท (ภาษาอังกฤษ) / Company Name (EN)
                </label>
                <input
                  type="text"
                  disabled={!isAdminOrOwner || isSaving}
                  value={settings.companyNameEn}
                  onChange={e => setSettings(prev => ({ ...prev, companyNameEn: e.target.value }))}
                  placeholder="เช่น Klangna Solar Cell Co., Ltd."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl px-4 py-3 font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Visibility / Logo Toggle */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                การตั้งค่าโลโก้และการแสดงผลส่วนหัว (Branding Toggles)
              </label>

              <div className="flex items-center justify-between p-1">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    {settings.showLogo ? <Eye size={14} className="text-emerald-500" /> : <EyeOff size={14} className="text-slate-400" />}
                    <span>แสดงโลโก้ร้านค้าบนแถบด้านบน (Header Logo Visibility)</span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-semibold">เมื่อเปิดใช้งาน โลโก้แบรนด์จะแสดงข้างหน้าชื่อร้านค้าในทุกๆ หน้าของระบบ</p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdminOrOwner || isSaving}
                    checked={settings.showLogo}
                    onChange={e => setSettings(prev => ({ ...prev, showLogo: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit button */}
          {isAdminOrOwner && (
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Save size={15} />
              <span>{isSaving ? 'กำลังบันทึกลง Firestore...' : 'บันทึกข้อมูลบริษัท'}</span>
            </button>
          )}
        </form>

        {/* Real-time preview panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-gradient-to-br from-indigo-50/30 to-slate-50 dark:from-slate-800/30 dark:to-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Info size={15} />
              <span>แสดงผลพรีวิวแบบเรียลไทม์ (Live Preview)</span>
            </h4>

            {/* Header Preview Container */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ภาพจำลองแถบหัวแอป (Navigation Bar Preview)</span>
              
              <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                {settings.showLogo && (
                  <div className="w-8 h-8 rounded-full border border-indigo-500/30 bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-[10px] text-indigo-600 dark:text-indigo-400 shrink-0">
                    LOGO
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-sm font-black text-slate-800 dark:text-white truncate">
                    {settings.name || 'ยังไม่มีชื่อร้าน'}
                  </h1>
                  {(settings.companyNameTh || settings.companyNameEn) && (
                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-wider truncate">
                      {settings.companyNameTh || settings.companyNameEn}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Details information Box */}
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
              <p className="font-bold text-slate-700 dark:text-slate-300">💡 การบันทึกข้อมูลแบบแยกส่วน (Settings Collection):</p>
              <p>
                ระบบนี้ออกแบบขึ้นมาตามข้อกำหนดความปลอดภัยของฐานข้อมูล Cloud Firestore โดยเขียนโครงสร้างและบันทึกตรงไปยังชุดเอกสาร <code className="px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">/settings/company</code> แบบแยกต่างหาก เพื่อให้อุปกรณ์ผู้ดูแลระบบสามารถเข้าถึงและแก้ไขได้อย่างแม่นยำ พร้อมทั้งส่งผลการเปลี่ยนแปลงแบบเรียลไทม์ไปยังทุกส่วนของเวิร์กสเปซระบบทันที
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
