import { ArrowRight, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import type { CommandDefinition } from './registry';

interface Props {
  command: CommandDefinition | null;
  onOpen?: (command: CommandDefinition) => void;
}

/** Keeps every registry command actionable while legacy workspaces are migrated incrementally. */
export function CommandCenterSelectionPanel({ command, onOpen }: Props) {
  if (!command) {
    return (
      <section className="rounded-[28px] border border-dashed border-slate-200 bg-white p-6 text-sm font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-900">
        เลือกคำสั่งจาก Registry เพื่อเปิด workspace
      </section>
    );
  }

  return (
    <section
      data-selected-command={command.id}
      className="rounded-[28px] border border-brand/20 bg-white p-5 shadow-sm dark:bg-slate-900 sm:p-7"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-soft px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand">
              {command.domain}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck size={12} /> Permission checked
            </span>
          </div>
          <h3 className="mt-3 text-xl font-black tracking-tight">{command.title}</h3>
          <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-slate-500">{command.description}</p>
        </div>
        <button
          type="button"
          onClick={() => onOpen?.(command)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white dark:text-slate-900"
        >
          เปิดคำสั่ง
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <Meta icon={CheckCircle2} label="Registry" value="Registered" />
        <Meta icon={ShieldCheck} label="Access" value={command.permission ?? 'Public'} />
        <Meta icon={Clock3} label="Workspace" value={command.legacySection ? 'Migration-ready' : 'Native'} />
      </div>
    </section>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
        <Icon size={12} /> {label}
      </div>
      <div className="mt-1 truncate text-xs font-black" title={value}>{value}</div>
    </div>
  );
}
