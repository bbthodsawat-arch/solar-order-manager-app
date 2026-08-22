import CommandCenter from './CommandCenter';
import POSCommandCenterPanel from '../components/pos/POSCommandCenterPanel';
import BrandPaymentWorkspace from '../components/BrandPaymentWorkspace';

interface UnifiedCommandCenterProps {
  onNavigateToUsers?: () => void;
  onNavigateToAudit?: () => void;
  onLockApp?: () => void;
}

export default function UnifiedCommandCenter(props: UnifiedCommandCenterProps) {
  return <div className="space-y-5">
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 sm:p-7">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-brand">Unified Control Plane</div>
          <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">POS + Command Center</h2>
          <p className="mt-1 max-w-3xl text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">ศูนย์กลางเดียวสำหรับควบคุมดีไซน์ รูปแบบ ข้อมูลแบรนด์ ช่องทางชำระเงิน และค่าเริ่มต้นของ POS พร้อมเชื่อมต่อกับเครื่องมือระบบทั้งหมดที่มีอยู่แล้ว</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-[9px] font-black text-slate-500 dark:border-slate-700 dark:bg-slate-800/80">Single Source of Truth</div>
      </div>
    </section>
    <BrandPaymentWorkspace />
    <POSCommandCenterPanel />
    <CommandCenter {...props} />
  </div>;
}
