import { useMemo, useState } from 'react';
import ConfigManager from '../../components/ConfigManager';
import type { CommandDefinition } from './registry';

export type BusinessConfigurationCommand = 'business.configuration';
export const BUSINESS_CONFIGURATION_COMMANDS: CommandDefinition[] = [{
  id: 'business.configuration', domain: 'business', title: 'หมวดหมู่ การชำระเงิน และแท็ก',
  description: 'จัดการหมวดหมู่รายรับ รายจ่าย รูปแบบและสถานะการชำระเงิน และแท็กระบบ',
  keywords: ['category','income','expense','payment','status','tag','หมวดหมู่','ชำระเงิน','แท็ก'],
  permission: 'canManageSettings', quickAction: true, workspaceStatus: 'native'
}];

interface Props { activeCommand?: BusinessConfigurationCommand; onActiveCommandChange?: (command: BusinessConfigurationCommand) => void; }
export function BusinessConfigurationWorkspace({ activeCommand = 'business.configuration', onActiveCommandChange }: Props) {
  const [internalActive, setInternalActive] = useState<BusinessConfigurationCommand>('business.configuration');
  const active = activeCommand ?? internalActive;
  const command = useMemo(() => BUSINESS_CONFIGURATION_COMMANDS.find(item => item.id === active)!, [active]);
  const select = (id: BusinessConfigurationCommand) => { setInternalActive(id); onActiveCommandChange?.(id); };
  return <section className="space-y-4" data-native-workspace="business-configuration">
    <div className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
      <button type="button" onClick={() => select('business.configuration')} className="rounded-xl bg-brand px-3 py-2 text-xs font-black text-white">{command.title}</button>
    </div>
    <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Native Workspace · business</div><h2 className="mt-2 text-xl font-black">{command.title}</h2><p className="mt-1 text-xs font-medium text-slate-500">{command.description}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">NATIVE</span></div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800"><ConfigManager /></div>
    </div>
  </section>;
}
