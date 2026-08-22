import { useMemo, useState, type ReactNode } from 'react';
import { Search, ShieldAlert, Settings2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getUserPermissions } from '../../utils/permissions';
import { COMMAND_DOMAINS } from './domains';
import { COMMAND_REGISTRY, type CommandDefinition } from './registry';
import { canAccessCommand } from './permissions';

interface CommandCenterShellProps { children: ReactNode; onSelectCommand?: (command: CommandDefinition) => void; }

export function CommandCenterShell({ children, onSelectCommand }: CommandCenterShellProps) {
  const { appUser } = useAuth();
  const permissions = getUserPermissions(appUser);
  const [query, setQuery] = useState('');
  const available = useMemo(() => COMMAND_REGISTRY.filter(command => canAccessCommand(appUser, permissions, command.permission)), [appUser, permissions]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter(command => `${command.title} ${command.description} ${command.keywords.join(' ')}`.toLowerCase().includes(q));
  }, [available, query]);
  const visibleDomains = COMMAND_DOMAINS.map(domain => ({ ...domain, commands: visible.filter(command => command.domain === domain.id) })).filter(domain => domain.commands.length);

  return <div className="max-w-[1600px] mx-auto space-y-5 pb-12">
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-[10px] font-black text-brand"><Settings2 size={13}/> COMMAND CENTER 2.0</div><h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">ศูนย์ควบคุมเดียวสำหรับทุกระบบ</h1><p className="mt-1 max-w-3xl text-xs font-medium leading-5 text-slate-500">ค้นหา เข้าถึง และจัดการ workspace จาก registry และ permission policy ชุดเดียว</p></div>
        <div className="relative w-full lg:max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาคำสั่งหรือการตั้งค่า..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-xs font-bold outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-800"/></div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{visibleDomains.map(domain => <div key={domain.id} className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800"><div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{domain.title}</div><div className="mt-2 space-y-1">{domain.commands.map(command => <button key={command.id} onClick={() => onSelectCommand?.(command)} className={`flex w-full items-start justify-between gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${command.danger ? 'text-rose-600' : ''}`}><span><span className="block text-xs font-black">{command.title}</span><span className="block text-[10px] text-slate-400">{command.description}</span></span>{command.danger && <ShieldAlert size={15}/>}</button>)}</div></div>)}</div>
    </section>
    {children}
  </div>;
}
