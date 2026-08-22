import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { getUserPermissions } from '../utils/permissions';
import { logAuditEvent } from '../lib/auditLogger';
import { clearLocalApplicationState, deleteLegacyConfigDocument, resetAppConfigToFactoryDefaults, resetBusinessData, type FactoryResetProgress } from '../lib/systemResetService';

const REQUIRED_CONFIRMATION = 'RESET';

export const SystemResetSettings: React.FC = () => {
  const { user, appUser } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [progress, setProgress] = useState<FactoryResetProgress | null>(null);
  const [completedCollections, setCompletedCollections] = useState<string[]>([]);

  const permissions = useMemo(() => getUserPermissions(appUser), [appUser]);
  const isAdminOrOwner = appUser?.role === 'admin' || appUser?.role === 'owner' || user?.email?.toLowerCase() === 'b.b.thodsawat@gmail.com';
  const canFactoryReset = Boolean(user && isAdminOrOwner && permissions.canManageDatabase && permissions.canManageSettings);

  const cancel = () => {
    if (isResetting) return;
    setIsConfirming(false);
    setConfirmText('');
    setProgress(null);
    setCompletedCollections([]);
  };

  const handleReset = async () => {
    if (!canFactoryReset) {
      toast.error('ไม่มีสิทธิ์ดำเนินการ Factory Reset');
      return;
    }
    if (confirmText.trim().toUpperCase() !== REQUIRED_CONFIRMATION) {
      toast.error('กรุณาพิมพ์คำว่า RESET เพื่อยืนยัน');
      return;
    }

    setIsResetting(true);
    setCompletedCollections([]);
    setProgress(null);
    await logAuditEvent({ action: 'factory_reset_started', category: 'system', targetName: 'Factory Reset', details: 'เริ่มต้น Factory Reset โดยผู้ดูแลระบบ', user: appUser });

    try {
      const counts = await resetBusinessData((next) => {
        setProgress(next);
        if (next.phase === 'complete') {
          setCompletedCollections((current) => current.includes(next.collection) ? current : [...current, next.collection]);
        }
      });

      setProgress({ collection: 'app_config', completed: 0, total: 1, phase: 'deleting' });
      await resetAppConfigToFactoryDefaults(user!.uid);
      await deleteLegacyConfigDocument();
      setProgress({ collection: 'app_config', completed: 1, total: 1, phase: 'complete' });
      setCompletedCollections((current) => [...current.filter((item) => item !== 'app_config'), 'app_config']);

      await clearLocalApplicationState();
      await logAuditEvent({ action: 'factory_reset_completed', category: 'system', targetName: 'Factory Reset', details: `Factory Reset สำเร็จ: ${Object.entries(counts).map(([name, count]) => `${name}=${count}`).join(', ')}`, user: appUser });

      toast.success('รีเซ็ตระบบเสร็จสมบูรณ์ — ข้อมูลธุรกิจถูกล้างและค่าระบบกลับเป็นค่าเริ่มต้นแล้ว');
      window.setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      console.error('Factory reset failed:', error);
      await logAuditEvent({ action: 'factory_reset_failed', category: 'system', targetName: 'Factory Reset', details: `Factory Reset ล้มเหลว: ${error instanceof Error ? error.message : String(error)}`, user: appUser });
      toast.error('Factory Reset ไม่สมบูรณ์ ระบบหยุดเพื่อป้องกันการแจ้งว่าสำเร็จทั้งที่ข้อมูลยังเหลืออยู่');
    } finally {
      setIsResetting(false);
      setConfirmText('');
      setIsConfirming(false);
    }
  };

  if (!canFactoryReset) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500"><ShieldAlert size={22} /></div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Factory Reset</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">เครื่องมือนี้จำกัดเฉพาะผู้ดูแลระบบระดับ Admin/Owner ที่มีสิทธิ์จัดการฐานข้อมูลและการตั้งค่าระบบเท่านั้น</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-red-200/80 dark:border-red-900/30 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl border border-red-500/20"><ShieldAlert size={22} /></div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">ตั้งค่าระบบ (System Maintenance)</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">ล้างข้อมูลธุรกิจและคืนค่าระบบสำหรับเริ่มต้นร้านใหม่</p>
          </div>
        </div>
        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">ADMIN ONLY</span>
      </div>

      <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-5 border border-red-100 dark:border-red-900/50 space-y-4">
        <h4 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2"><AlertTriangle size={18} />อันตราย: รีเซ็ตระบบ (Factory Reset)</h4>
        <p className="text-sm text-red-700/80 dark:text-red-300/80 leading-6">
          ระบบจะล้างข้อมูลธุรกิจใน Cloud ได้แก่ ธุรกรรม ลูกค้า นัดหมาย ใบรับประกัน รายการประจำ Quick Notes งบประมาณ และ settings จากนั้นคืนค่า app configuration เป็นค่าเริ่มต้น
          <strong> ข้อมูลผู้ใช้, สิทธิ์ความปลอดภัย และ Audit Log จะไม่ถูกลบ</strong> และการดำเนินการไม่สามารถย้อนกลับได้
        </p>

        {completedCollections.length > 0 && (
          <div className="bg-white/70 dark:bg-slate-900/70 rounded-xl p-4 border border-red-100 dark:border-red-900/40">
            <p className="text-xs font-black text-slate-600 dark:text-slate-300 mb-2">ความคืบหน้าล่าสุด</p>
            <div className="flex flex-wrap gap-2">
              {completedCollections.map((name) => <span key={name} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={12} />{name}</span>)}
            </div>
          </div>
        )}

        {progress && isResetting && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-red-200 dark:border-red-800 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />กำลังจัดการ {progress.collection}</span>
              <span>{progress.completed}/{progress.total}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-red-600 transition-all" style={{ width: `${progress.total ? Math.min(100, (progress.completed / progress.total) * 100) : 100}%` }} /></div>
          </div>
        )}

        {!isConfirming ? (
          <button onClick={() => setIsConfirming(true)} disabled={isResetting} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors">
            <RotateCcw size={16} />ล้างข้อมูลและคืนค่าโรงงาน
          </button>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-200 dark:border-red-800 shadow-inner space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 font-bold">พิมพ์ <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded">RESET</span> เพื่อยืนยัน</p>
            <input type="text" autoComplete="off" value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} placeholder="พิมพ์ RESET" className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-red-500" disabled={isResetting} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={handleReset} disabled={isResetting || confirmText !== REQUIRED_CONFIRMATION} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500 text-white px-5 py-3 rounded-lg font-bold text-sm transition-colors">
                {isResetting ? <><Loader2 size={16} className="animate-spin" />กำลังล้างข้อมูล...</> : 'ยืนยัน Factory Reset'}
              </button>
              <button onClick={cancel} disabled={isResetting} className="px-4 py-3 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">ยกเลิก</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
