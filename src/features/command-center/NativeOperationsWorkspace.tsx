import { useMemo, useState } from 'react';
import { Bell, Database, Palette, ShieldCheck, Wrench } from 'lucide-react';
import DailyReminderSettings from '../../components/DailyReminderSettings';
import DatabaseBackupSettings from '../../components/DatabaseBackupSettings';
import LoginControlCenter from '../../components/LoginControlCenter';
import { SystemResetSettings } from '../../components/SystemResetSettings';
import { QuickDesignLauncherModal } from '../../components/design-system/QuickDesignLauncherModal';
import type { CommandDefinition } from './registry';

export type NativeOperationsCommand =
  | 'experience.design'
  | 'automation.workflows'
  | 'security.access'
  | 'system.data'
  | 'system.maintenance';

export const NATIVE_OPERATIONS_COMMANDS: CommandDefinition[] = [
  { id: 'experience.design', domain: 'experience', title: 'ดีไซน์ แดชบอร์ด และเมนู', description: 'ธีม ระบบดีไซน์ และเครื่องมือปรับแต่งประสบการณ์ใช้งาน', keywords: ['theme', 'design', 'dashboard', 'navigation', 'ธีม', 'ดีไซน์'], permission: 'canManageSettings', quickAction: true, workspaceStatus: 'native' },
  { id: 'automation.workflows', domain: 'automation', title: 'การแจ้งเตือนและงานอัตโนมัติ', description: 'จัดการการเตือนประจำวันและ automation workflow', keywords: ['automation', 'reminder', 'notification', 'แจ้งเตือน'], permission: 'canManageSettings', quickAction: true, workspaceStatus: 'native' },
  { id: 'security.access', domain: 'security', title: 'ความปลอดภัยและการเข้าถึง', description: 'Login, RBAC และ policy การเข้าถึงระบบ', keywords: ['security', 'access', 'login', 'rbac', 'สิทธิ์'], permission: 'canManageSecurity', quickAction: true, workspaceStatus: 'native' },
  { id: 'system.data', domain: 'system', title: 'ข้อมูล สำรอง และสุขภาพระบบ', description: 'Backup/Restore และการดูแลข้อมูลระบบ', keywords: ['backup', 'restore', 'database', 'sync', 'สำรอง', 'ฐานข้อมูล'], permission: 'canManageDatabase', quickAction: true, workspaceStatus: 'native' },
  { id: 'system.maintenance', domain: 'system', title: 'เครื่องมือระบบขั้นสูง', description: 'Maintenance และ Factory Reset ที่มี authorization boundary', keywords: ['maintenance', 'factory', 'reset', 'รีเซ็ต'], permission: 'system.reset', danger: true, workspaceStatus: 'native' },
];

const isNativeOperationsCommand = (value: string): value is NativeOperationsCommand =>
  NATIVE_OPERATIONS_COMMANDS.some((item) => item.id === value);

interface Props {
  activeCommand?: NativeOperationsCommand;
  onActiveCommandChange?: (command: NativeOperationsCommand) => void;
}

export function NativeOperationsWorkspace({ activeCommand, onActiveCommandChange }: Props) {
  const [internalActive, setInternalActive] = useState<NativeOperationsCommand>('experience.design');
  const [designOpen, setDesignOpen] = useState(false);
  const active: NativeOperationsCommand = activeCommand ?? internalActive;
  const command = useMemo(
    () => NATIVE_OPERATIONS_COMMANDS.find((item) => item.id === active),
    [active],
  );

  const setActive = (id: string) => {
    if (!isNativeOperationsCommand(id)) return;
    setInternalActive(id);
    onActiveCommandChange?.(id);
  };

  if (!command) return null;

  return (
    <section className="space-y-4" data-native-workspace="operations">
      <div className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap gap-2">
          {NATIVE_OPERATIONS_COMMANDS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${active === item.id ? 'bg-brand text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'} ${item.danger ? 'text-rose-600' : ''}`}
            >
              <Icon id={item.id} />
              {item.title}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Native Workspace · {command.domain}</div>
            <h2 className="mt-2 text-xl font-black">{command.title}</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">{command.description}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">NATIVE</span>
        </div>
        <div className="mt-5">
          {active === 'experience.design' && <ExperienceWorkspace onOpen={() => setDesignOpen(true)} />}
          {active === 'automation.workflows' && <DailyReminderSettings />}
          {active === 'security.access' && <LoginControlCenter />}
          {active === 'system.data' && <DatabaseBackupSettings />}
          {active === 'system.maintenance' && <SystemResetSettings />}
        </div>
      </div>
      <QuickDesignLauncherModal isOpen={designOpen} onClose={() => setDesignOpen(false)} />
    </section>
  );
}

function ExperienceWorkspace({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card title="Theme Studio" description="ธีมสีและ Visual Style" icon={Palette} onClick={onOpen} />
      <Card title="Dashboard" description="ใช้ Design System เดียวกันกับทุก workspace" icon={Wrench} onClick={onOpen} />
      <Card title="Navigation" description="จัดการประสบการณ์การนำทางจาก control plane" icon={ShieldCheck} onClick={onOpen} />
    </div>
  );
}

function Card({ title, description, icon: IconComponent, onClick }: { title: string; description: string; icon: typeof Palette; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-800">
      <IconComponent size={18} className="text-brand" />
      <div className="mt-3 text-sm font-black">{title}</div>
      <div className="mt-1 text-[10px] font-medium text-slate-400">{description}</div>
    </button>
  );
}

function Icon({ id }: { id: string }) {
  const IconComponent = id.startsWith('experience')
    ? Palette
    : id.startsWith('automation')
      ? Bell
      : id.startsWith('security')
        ? ShieldCheck
        : id === 'system.data'
          ? Database
          : Wrench;
  return <IconComponent size={14} />;
}
