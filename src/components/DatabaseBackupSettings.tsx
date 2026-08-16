import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  FileJson, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  FileUp, 
  RefreshCw, 
  Layers, 
  Users, 
  Receipt, 
  Clock, 
  Info,
  SlidersHorizontal,
  FileCheck,
  X,
  ShieldAlert,
  Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useInactivityBackupReminder } from '../hooks/useInactivityBackupReminder';

export interface BackupDataStructure {
  exportedAt: string;
  version: string;
  appName?: string;
  shopName?: string;
  summary?: {
    transactionsCount?: number;
    customersCount?: number;
    recurringCount?: number;
    quickNotesCount?: number;
    hasConfig?: boolean;
  };
  collections: {
    config?: any;
    transactions?: any[];
    recurring_transactions?: any[];
    customers?: any[];
    quick_notes?: any[];
    users?: any[];
  };
}

export default function DatabaseBackupSettings() {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const { config: inactivityConfig, updateConfig: updateInactivityConfig, daysSinceLastTransaction, daysSinceLastBackup } = useInactivityBackupReminder();
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);

  // Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [backupPayload, setBackupPayload] = useState<BackupDataStructure | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Restore options
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [selectedItems, setSelectedItems] = useState({
    config: true,
    transactions: true,
    customers: true,
    recurring: true,
    quickNotes: true
  });
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<{ step: string; percent: number } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  // 1. Export Handler
  const handleExport = async () => {
    setIsExporting(true);
    const loadingToast = toast.loading('กำลังรวบรวมข้อมูลเพื่อสำรองไฟล์...');

    try {
      // Fetch Config
      const configDocRef = doc(db, 'config', 'app');
      const configSnap = await getDoc(configDocRef);
      const configData = configSnap.exists() ? configSnap.data() : null;

      // Fetch Transactions
      const transactionsSnap = await getDocs(collection(db, 'transactions'));
      const transactionsData = transactionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch Recurring Transactions
      const recurringSnap = await getDocs(collection(db, 'recurring_transactions'));
      const recurringData = recurringSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch Customers
      const customersSnap = await getDocs(collection(db, 'customers'));
      const customersData = customersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch Quick Notes
      const notesSnap = await getDocs(collection(db, 'quick_notes'));
      const notesData = notesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const backupData: BackupDataStructure = {
        exportedAt: new Date().toISOString(),
        version: '1.2',
        appName: 'SolarShop Accounting & POS',
        shopName: configData?.shopInfo?.name || 'ร้านกลางนาโซล่าเซลล์',
        summary: {
          transactionsCount: transactionsData.length,
          customersCount: customersData.length,
          recurringCount: recurringData.length,
          quickNotesCount: notesData.length,
          hasConfig: !!configData
        },
        collections: {
          config: configData,
          transactions: transactionsData,
          recurring_transactions: recurringData,
          customers: customersData,
          quick_notes: notesData,
          users: usersData
        }
      };

      // Create JSON Blob
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `SolarShop_Backup_${dateStr}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      localStorage.setItem('solar_app_last_backup_date', new Date().toISOString());

      toast.success(`สำรองข้อมูลสำเร็จ (${transactionsData.length} ธุรกรรม, ${customersData.length} ลูกค้า)`, { id: loadingToast });
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('ไม่สามารถสำรองข้อมูลได้ กรุณาลองใหม่อีกครั้ง', { id: loadingToast });
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Process Selected File
  const processFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setParseError('ไฟล์ที่เลือกไม่ใช่ไฟล์ JSON (.json)');
      setImportedFile(null);
      setBackupPayload(null);
      return;
    }

    setImportedFile(file);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as any;

        // Validation
        if (!parsed || (!parsed.collections && !parsed.config && !parsed.transactions)) {
          throw new Error('รูปแบบไฟล์สำรองไม่ถูกต้อง (ไม่พบ collections หรือข้อมูลที่รองรับ)');
        }

        // Normalize if legacy structure
        const normalized: BackupDataStructure = {
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          version: parsed.version || '1.0',
          appName: parsed.appName || 'SolarShop Backup',
          shopName: parsed.shopName,
          summary: parsed.summary || {
            transactionsCount: parsed.collections?.transactions?.length || (Array.isArray(parsed.transactions) ? parsed.transactions.length : 0),
            customersCount: parsed.collections?.customers?.length || 0,
            recurringCount: parsed.collections?.recurring_transactions?.length || 0,
            quickNotesCount: parsed.collections?.quick_notes?.length || 0,
            hasConfig: !!(parsed.collections?.config || parsed.config)
          },
          collections: {
            config: parsed.collections?.config || parsed.config || null,
            transactions: parsed.collections?.transactions || (Array.isArray(parsed.transactions) ? parsed.transactions : []),
            recurring_transactions: parsed.collections?.recurring_transactions || [],
            customers: parsed.collections?.customers || [],
            quick_notes: parsed.collections?.quick_notes || [],
            users: parsed.collections?.users || []
          }
        };

        setBackupPayload(normalized);
        toast.success(`ตรวจสอบไฟล์ ${file.name} สำเร็จ`);
      } catch (err: any) {
        console.error('JSON parse error:', err);
        setParseError(err?.message || 'ไฟล์ JSON เสียหายหรือไม่สามารถอ่านได้');
        setBackupPayload(null);
      }
    };
    reader.onerror = () => {
      setParseError('เกิดข้อผิดพลาดในการอ่านไฟล์');
      setBackupPayload(null);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // 3. Batch Firestore Writer Helper
  const batchWriteItems = async (
    collectionName: string, 
    items: any[], 
    shouldDeleteExisting: boolean,
    onProgress: (percent: number) => void
  ) => {
    if (!items || items.length === 0) return;

    // If overwrite mode, fetch all existing docs and delete them in batches
    if (shouldDeleteExisting) {
      const snap = await getDocs(collection(db, collectionName));
      const existingDocs = snap.docs;
      const deleteChunkSize = 400;
      for (let i = 0; i < existingDocs.length; i += deleteChunkSize) {
        const chunk = existingDocs.slice(i, i + deleteChunkSize);
        const batch = writeBatch(db);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }

    // Write new items in chunks of 400
    const chunkSize = 400;
    const total = items.length;
    for (let i = 0; i < total; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      
      chunk.forEach(item => {
        const { id, ...data } = item;
        if (id) {
          const docRef = doc(db, collectionName, id);
          batch.set(docRef, data, { merge: true });
        } else {
          const docRef = doc(collection(db, collectionName));
          batch.set(docRef, data);
        }
      });

      await batch.commit();
      onProgress(Math.min(100, Math.round(((i + chunk.length) / total) * 100)));
    }
  };

  // 4. Restore Execution
  const executeRestore = async () => {
    if (!backupPayload) return;

    setShowConfirmModal(false);
    setIsRestoring(true);
    setRestoreProgress({ step: 'เตรียมการกู้คืนข้อมูล...', percent: 5 });

    const isOverwrite = restoreMode === 'overwrite';

    try {
      // Step A: Restore Config
      if (selectedItems.config && backupPayload.collections.config) {
        setRestoreProgress({ step: 'กำลังกู้คืนการตั้งค่าระบบ (Config)...', percent: 20 });
        const configDocRef = doc(db, 'config', 'app');
        const { id, ...cleanConfig } = backupPayload.collections.config;
        await setDoc(configDocRef, cleanConfig, { merge: !isOverwrite });
      }

      // Step B: Restore Transactions
      if (selectedItems.transactions && backupPayload.collections.transactions && backupPayload.collections.transactions.length > 0) {
        setRestoreProgress({ step: 'กำลังกู้คืนประวัติธุรกรรม...', percent: 40 });
        await batchWriteItems(
          'transactions',
          backupPayload.collections.transactions,
          isOverwrite,
          (pct) => setRestoreProgress({ step: `กำลังกู้คืนธุรกรรม (${pct}%)...`, percent: 40 + Math.round(pct * 0.3) })
        );
      }

      // Step C: Restore Customers
      if (selectedItems.customers && backupPayload.collections.customers && backupPayload.collections.customers.length > 0) {
        setRestoreProgress({ step: 'กำลังกู้คืนข้อมูลลูกค้า (CRM)...', percent: 75 });
        await batchWriteItems(
          'customers',
          backupPayload.collections.customers,
          isOverwrite,
          (pct) => setRestoreProgress({ step: `กำลังกู้คืนลูกค้า (${pct}%)...`, percent: 75 + Math.round(pct * 0.15) })
        );
      }

      // Step D: Restore Recurring Transactions
      if (selectedItems.recurring && backupPayload.collections.recurring_transactions && backupPayload.collections.recurring_transactions.length > 0) {
        setRestoreProgress({ step: 'กำลังกู้คืนรายการประจำเดือน...', percent: 90 });
        await batchWriteItems(
          'recurring_transactions',
          backupPayload.collections.recurring_transactions,
          isOverwrite,
          () => {}
        );
      }

      // Step E: Restore Quick Notes
      if (selectedItems.quickNotes && backupPayload.collections.quick_notes && backupPayload.collections.quick_notes.length > 0) {
        setRestoreProgress({ step: 'กำลังกู้คืนบันทึกโน้ตด่วน...', percent: 95 });
        await batchWriteItems(
          'quick_notes',
          backupPayload.collections.quick_notes,
          isOverwrite,
          () => {}
        );
      }

      setRestoreProgress({ step: 'เสร็จสมบูรณ์ 100%', percent: 100 });
      toast.success('กู้คืนข้อมูลจากไฟล์สำรองสำเร็จเรียบร้อย!');

      // Delay then reload to sync all components
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Restore error:', error);
      toast.error('เกิดข้อผิดพลาดในการกู้คืนข้อมูล กรุณาตรวจสอบสิทธิ์การเชื่อมต่อ');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleStartRestore = () => {
    if (!backupPayload) {
      toast.error('กรุณาเลือกไฟล์สำรองข้อมูล JSON ก่อน');
      return;
    }

    const hasSelection = Object.values(selectedItems).some(Boolean);
    if (!hasSelection) {
      toast.error('กรุณาเลือกข้อมูลอย่างน้อย 1 รายการเพื่อกู้คืน');
      return;
    }

    if (restoreMode === 'overwrite') {
      setConfirmInput('');
      setShowConfirmModal(true);
    } else {
      executeRestore();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-200 dark:border-teal-800">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              สำรองและกู้คืนข้อมูล (Backup & Restore)
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              ส่งออกประวัติธุรกรรมและการตั้งค่าเป็นไฟล์ JSON และนำกลับมากู้คืนได้ทุกเมื่อ
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Download size={14} />
            <span>ส่งออก (Backup)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Upload size={14} />
            <span>กู้คืน (Restore)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EXPORT */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex items-start space-x-3 text-teal-700 dark:text-teal-400">
              <Info size={20} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-black">รายการข้อมูลที่จะถูกรวบรวมลงในไฟล์ JSON:</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  ไฟล์ที่ดาวน์โหลดจะเป็นไฟล์มาตรฐาน JSON บรรจุข้อมูลทั้งหมดแบบสมบูรณ์ สามารถนำไปเปิดดู สำรองเก็บไว้ในเครื่อง หรือใช้นำเข้าเพื่อกู้คืนได้ทันที
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700 flex items-center space-x-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-brand rounded-lg">
                  <SlidersHorizontal size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">การตั้งค่าระบบ</p>
                  <p className="text-[10px] text-slate-400">หมวดหมู่, แคตตาล็อก, ร้าน</p>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700 flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
                  <Receipt size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">ประวัติธุรกรรม</p>
                  <p className="text-[10px] text-slate-400">รายรับ-รายจ่ายทั้งหมด</p>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700 flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">ข้อมูลลูกค้า CRM</p>
                  <p className="text-[10px] text-slate-400">ประวัติและข้อมูลติดต่อ</p>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700 flex items-center space-x-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-lg">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">รายการประจำเดือน</p>
                  <p className="text-[10px] text-slate-400">Recurring transactions</p>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700 flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
                  <Layers size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">บันทึกโน้ตด่วน</p>
                  <p className="text-[10px] text-slate-400">Quick notes & memos</p>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700 flex items-center space-x-3">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg">
                  <FileCheck size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">โครงสร้างสินทรัพย์</p>
                  <p className="text-[10px] text-slate-400">Assets & depreciation</p>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full sm:w-auto px-6 py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isExporting ? (
                  <span className="flex items-center space-x-2">
                    <RefreshCw size={16} className="animate-spin" />
                    <span>กำลังรวบรวมข้อมูลและสร้างไฟล์...</span>
                  </span>
                ) : (
                  <>
                    <FileJson size={18} />
                    <span>ดาวน์โหลดไฟล์สำรองข้อมูล (Export JSON)</span>
                    <Download size={16} className="ml-1 opacity-70" />
                  </>
                )}
              </button>
            </div>

            {/* 7-Day Inactivity Backup Reminder Settings Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        การแจ้งเตือนสำรองข้อมูลอัตโนมัติเมื่อหยุดนิ่ง (Inactivity Backup Reminder)
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                        7 วันแนะนำ
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                      ระบบจะแสดงแบนเนอร์แจ้งเตือนให้คุณสำรองข้อมูลทันที หากไม่มีการลงบันทึกรายการรายรับ-รายจ่ายใหม่เป็นเวลาเกินที่กำหนด
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => updateInactivityConfig({ enabled: !inactivityConfig.enabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    inactivityConfig.enabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      inactivityConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {inactivityConfig.enabled && (
                <div className="pt-2 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>จำนวนวันที่ไม่พบการลงรายการ (Threshold Days)</span>
                      <span className="text-amber-600 dark:text-amber-400 font-black">{inactivityConfig.inactivityDaysThreshold} วัน</span>
                    </label>
                    <select
                      value={inactivityConfig.inactivityDaysThreshold}
                      onChange={(e) => updateInactivityConfig({ inactivityDaysThreshold: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                    >
                      <option value={3}>3 วัน (เตือนบ่อยขึ้น)</option>
                      <option value={5}>5 วัน</option>
                      <option value={7}>7 วัน (ค่าเริ่มต้นมาตรฐาน)</option>
                      <option value={14}>14 วัน (2 สัปดาห์)</option>
                      <option value={30}>30 วัน (1 เดือน)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-center space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">ไม่ได้ลงรายการล่าสุด:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold">{daysSinceLastTransaction} วันที่แล้ว</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">สำรองไฟล์ล่าสุด:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                        {daysSinceLastBackup === null ? 'ยังไม่เคยสำรอง' : `${daysSinceLastBackup} วันที่แล้ว`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IMPORT / RESTORE */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* File Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 ${
              isDragging
                ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 ring-4 ring-teal-500/20'
                : importedFile
                ? 'border-teal-300 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-teal-400 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className={`p-4 rounded-2xl ${
              importedFile ? 'bg-teal-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              <FileUp size={28} />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {importedFile ? importedFile.name : 'ลากไฟล์ JSON มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {importedFile 
                  ? `ขนาดไฟล์: ${(importedFile.size / 1024).toFixed(1)} KB` 
                  : 'รองรับไฟล์สำรองข้อมูลนามสกุล .json จากระบบ'}
              </p>
            </div>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-center space-x-3 text-rose-700 dark:text-rose-400 text-xs font-bold">
              <AlertCircle size={18} className="shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Backup Preview & Configuration */}
          {backupPayload && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 space-y-5">
              {/* File Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/80 dark:border-slate-700">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-[10px] font-black">
                      ตรวจพบไฟล์สำรอง
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {backupPayload.shopName || backupPayload.appName}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    สำรองเมื่อ: {new Date(backupPayload.exportedAt).toLocaleString('th-TH')}
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                  <span>เวอร์ชัน: {backupPayload.version}</span>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div>
                <p className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                  ข้อมูลที่ตรวจพบในไฟล์สำรอง:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-lg font-black text-teal-600 dark:text-teal-400">
                      {backupPayload.collections.transactions?.length || 0}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">รายการธุรกรรม</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                      {backupPayload.collections.customers?.length || 0}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">ข้อมูลลูกค้า CRM</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-lg font-black text-purple-600 dark:text-purple-400">
                      {backupPayload.collections.recurring_transactions?.length || 0}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">รายการประจำเดือน</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {backupPayload.collections.config ? 'พร้อมกู้คืน' : 'ไม่มี'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">การตั้งค่าระบบ</p>
                  </div>
                </div>
              </div>

              {/* Items to Restore Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                  เลือกหัวข้อที่ต้องการกู้คืน:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center space-x-2.5 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={selectedItems.config}
                      onChange={(e) => setSelectedItems(prev => ({ ...prev, config: e.target.checked }))}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>การตั้งค่าระบบ (Config, แคตตาล็อก, หมวดหมู่)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={selectedItems.transactions}
                      onChange={(e) => setSelectedItems(prev => ({ ...prev, transactions: e.target.checked }))}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>ประวัติธุรกรรม ({backupPayload.collections.transactions?.length || 0} รายการ)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={selectedItems.customers}
                      onChange={(e) => setSelectedItems(prev => ({ ...prev, customers: e.target.checked }))}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>ข้อมูลลูกค้า ({backupPayload.collections.customers?.length || 0} รายการ)</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={selectedItems.recurring}
                      onChange={(e) => setSelectedItems(prev => ({ ...prev, recurring: e.target.checked }))}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>รายการประจำเดือน ({backupPayload.collections.recurring_transactions?.length || 0} รายการ)</span>
                  </label>
                </div>
              </div>

              {/* Restore Mode Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                  รูปแบบการกู้คืนข้อมูล:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setRestoreMode('merge')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-1 ${
                      restoreMode === 'merge'
                        ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-500 ring-2 ring-teal-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        1. ผสานข้อมูล (Merge & Update)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                        แนะนำ
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      เพิ่มรายการใหม่และอัปเดตข้อมูลตาม ID โดยไม่ลบประวัติเดิมที่มีอยู่ ปลอดภัยต่อข้อมูลปัจจุบัน
                    </p>
                  </div>

                  <div
                    onClick={() => setRestoreMode('overwrite')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-1 ${
                      restoreMode === 'overwrite'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 ring-2 ring-rose-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-700 dark:text-rose-400">
                        2. ล้างและเขียนทับ (Full Overwrite)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                        แทนที่ 100%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      ล้างข้อมูลเดิมในคอลเลกชันที่เลือกทั้งหมด แล้วแทนที่ด้วยข้อมูลจากไฟล์สำรองชุดนี้
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              {isRestoring && restoreProgress && (
                <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-800 dark:text-teal-300">
                    <span className="flex items-center space-x-2">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>{restoreProgress.step}</span>
                    </span>
                    <span>{restoreProgress.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-teal-200 dark:bg-teal-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${restoreProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleStartRestore}
                  disabled={isRestoring}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <RefreshCw size={16} className={isRestoring ? 'animate-spin' : ''} />
                  <span>{isRestoring ? 'กำลังกู้คืนข้อมูล...' : 'เริ่มกู้คืนข้อมูล (Restore Now)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImportedFile(null);
                    setBackupPayload(null);
                    setParseError(null);
                  }}
                  disabled={isRestoring}
                  className="px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Overwrite */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-200 dark:border-rose-900/50 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-base font-black">ยืนยันการเขียนทับข้อมูล</h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              คุณได้เลือกโหมด <strong className="text-rose-600 dark:text-rose-400">เขียนทับทั้งหมด (Overwrite)</strong> ซึ่งระบบจะลบข้อมูลธุรกรรมและการตั้งค่าเดิมในระบบก่อน แล้วแทนที่ด้วยไฟล์สำรองนี้ ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้
            </p>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                พิมพ์คำว่า <span className="text-rose-600 font-black">RESTORE</span> เพื่อยืนยัน:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="RESTORE"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono uppercase bg-white dark:bg-slate-900 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={executeRestore}
                disabled={confirmInput !== 'RESTORE'}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all"
              >
                ยืนยันการเขียนทับและกู้คืน
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
