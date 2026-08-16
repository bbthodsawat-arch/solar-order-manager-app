import React, { useState } from 'react';
import { AlertTriangle, Trash2, ShieldAlert, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTransactions } from '../hooks/useTransactions';
import { useCustomers } from '../hooks/useCustomers';
import { useAppConfig } from '../hooks/useAppConfig';

export const SystemResetSettings: React.FC = () => {
  const { deleteAllTransactions } = useTransactions();
  const { deleteAllCustomers } = useCustomers();
  const { resetToFactoryDefaults } = useAppConfig();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (confirmText !== 'RESET') {
      toast.error('กรุณาพิมพ์คำว่า RESET เพื่อยืนยัน');
      return;
    }
    
    setIsResetting(true);
    try {
      // 1. Delete all transactions
      await deleteAllTransactions();
      
      // 2. Delete all customers
      await deleteAllCustomers();
      
      // 3. Reset app configuration to factory defaults
      await resetToFactoryDefaults();
      
      // 4. Clear all local storage
      localStorage.clear();
      
      toast.success('รีเซ็ตระบบเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
      
      // Refresh page to clear any lingering React state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error during factory reset:', error);
      toast.error('เกิดข้อผิดพลาดในการรีเซ็ตระบบ');
    } finally {
      setIsResetting(false);
      setIsConfirming(false);
      setConfirmText('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-red-200/80 dark:border-red-900/30 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl border border-red-500/20">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">ตั้งค่าระบบ (System Maintenance)</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              ล้างข้อมูล คืนค่าโรงงานสำหรับเริ่มต้นระบบใหม่
            </p>
          </div>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-5 border border-red-100 dark:border-red-900/50">
        <h4 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2 mb-2">
          <AlertTriangle size={18} />
          อันตราย: รีเซ็ตระบบ (Factory Reset)
        </h4>
        <p className="text-sm text-red-700/80 dark:text-red-300/80 mb-4">
          การกระทำนี้จะลบข้อมูลธุรกรรมทั้งหมด, ข้อมูลลูกค้าทั้งหมด, คืนค่าการตั้งค่า, และล้างข้อมูลแคชในเครื่องทั้งหมด 
          ระบบจะกลับไปเหมือนเพิ่งติดตั้งใหม่ (เหมาะสำหรับนำไปใช้งานกับร้านอื่น) 
          <strong>การกระทำนี้ไม่สามารถย้อนกลับได้</strong>
        </p>
        
        {!isConfirming ? (
          <button 
            onClick={() => setIsConfirming(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
          >
            <RotateCcw size={16} />
            ล้างข้อมูลและคืนค่าโรงงาน
          </button>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-200 dark:border-red-800 shadow-inner">
            <p className="text-sm text-slate-700 dark:text-slate-300 font-bold mb-3">
              พิมพ์คำว่า <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded">RESET</span> เพื่อยืนยันการล้างข้อมูล
            </p>
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="พิมพ์ RESET"
                className="flex-1 max-w-[200px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isResetting}
              />
              <button 
                onClick={handleReset}
                disabled={isResetting || confirmText !== 'RESET'}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500 text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors"
              >
                {isResetting ? 'กำลังลบข้อมูล...' : 'ยืนยันการลบ'}
              </button>
              <button 
                onClick={() => {
                  setIsConfirming(false);
                  setConfirmText('');
                }}
                disabled={isResetting}
                className="px-4 py-2 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
