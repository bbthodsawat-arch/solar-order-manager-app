import { Activity, AlertTriangle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import type { CommandDefinition, RegistryHealth } from './registry';
import type { AppUser } from '../../utils/permissions';

interface Props {
  user: AppUser | null;
  commands: CommandDefinition[];
  registryHealth: RegistryHealth;
  onSelectCommand?: (command: CommandDefinition) => void;
}

export function CommandCenterOverview({ user, commands, registryHealth, onSelectCommand }: Props) {
  const status = user && user.status !== 'suspended' ? 'พร้อมใช้งาน' : 'ต้องตรวจสอบสิทธิ์';
  const quickActions = commands.filter(command => command.quickAction).slice(0, 4);
  const healthMessage = registryHealth.status === 'healthy'
    ? 'Registry ตรวจสอบแล้ว ไม่มี command ID ซ้ำหรือ domain ที่ไม่รู้จัก'
    : 'Registry ต้องตรวจสอบก่อนใช้งานบางคำสั่ง';

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Activity size={13}/> CONTROL PLANE OVERVIEW</div>
          <h2 className="mt-3 text-xl font-black sm:text-2xl">ศูนย์ควบคุมพร้อมใช้งาน</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">เข้าถึงคำสั่งตามสิทธิ์จาก Registry เดียว และใช้ Workspace เดียวทั้ง Desktop และ Mobile</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Status label="Access" value={status} icon={ShieldCheck}/>
          <Status label="Commands" value={`${commands.length}`} icon={Zap}/>
          <Status label="Policy" value="Active" icon={CheckCircle2}/>
        </div>
      </div>

      <div role="status" data-registry-health={registryHealth.status} className={`mt-5 rounded-2xl border p-3 ${registryHealth.status === 'healthy' ? 'border-emerald-100 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20' : 'border-amber-100 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20'}`}>
        <div className="flex items-start gap-2">
          {registryHealth.status === 'healthy' ? <CheckCircle2 size={15} className="mt-0.5 text-emerald-600"/> : <AlertTriangle size={15} className="mt-0.5 text-amber-600"/>}
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wider">Registry Health · {registryHealth.status}</div>
            <div className="mt-0.5 text-[10px] font-medium text-slate-500">{healthMessage}</div>
          </div>
        </div>
        {registryHealth.status === 'degraded' && <div className="mt-2 text-[10px] font-bold text-amber-700 dark:text-amber-300">duplicate: {registryHealth.duplicateIds.length} · invalid domain: {registryHealth.invalidDomains.length} · missing status: {registryHealth.missingWorkspaceStatus.length}</div>}
      </div>

      <div className="mt-5">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Actions</div>
        {quickActions.length > 0 ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{quickActions.map(command => <button key={command.id} type="button" onClick={() => onSelectCommand?.(command)} className="rounded-2xl border border-slate-200 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-800"><div className="text-xs font-black">{command.title}</div><div className="mt-1 text-[10px] font-medium text-slate-400">{command.description}</div></button>)}</div> : <div role="status" className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-xs font-bold text-slate-400 dark:border-slate-700">ไม่มี Quick Actions ที่ตรงกับสิทธิ์ปัจจุบัน · ใช้ Registry search เพื่อดูคำสั่งที่ได้รับอนุญาต</div>}
      </div>
    </section>
  );
}

function Status({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Activity }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60"><div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400"><Icon size={12}/>{label}</div><div className="mt-1 text-xs font-black">{value}</div></div>;
}
