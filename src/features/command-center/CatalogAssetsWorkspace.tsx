import { useMemo, useState } from 'react';
import { useAppConfig } from '../../hooks/useAppConfig';
import { AssetManager } from '../../components/AssetManager';
import type { CommandDefinition } from './registry';

export type CatalogAssetsCommand = 'catalog.assets';
export const CATALOG_ASSETS_COMMANDS: CommandDefinition[] = [{
  id: 'catalog.assets', domain: 'catalog', title: 'ทรัพย์สินและค่าเสื่อม',
  description: 'ทะเบียนสินทรัพย์ อุปกรณ์ ค่าเสื่อมราคา สถานที่ และผู้รับผิดชอบ',
  keywords: ['asset','depreciation','equipment','location','ทรัพย์สิน','ค่าเสื่อม','อุปกรณ์'],
  permission: 'canManageInventory', quickAction: true, workspaceStatus: 'native'
}];

interface Props { activeCommand?: CatalogAssetsCommand; onActiveCommandChange?: (command: CatalogAssetsCommand) => void; }
export function CatalogAssetsWorkspace({ activeCommand = 'catalog.assets', onActiveCommandChange }: Props) {
  const { assets = [], addAsset, updateAsset, deleteAsset } = useAppConfig();
  const [internalActive, setInternalActive] = useState<CatalogAssetsCommand>('catalog.assets');
  const active = activeCommand ?? internalActive;
  const command = useMemo(() => CATALOG_ASSETS_COMMANDS.find(item => item.id === active)!, [active]);
  const select = (id: CatalogAssetsCommand) => { setInternalActive(id); onActiveCommandChange?.(id); };
  return <section className="space-y-4" data-native-workspace="catalog-assets">
    <div className="rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"><button type="button" onClick={() => select('catalog.assets')} className="rounded-xl bg-brand px-3 py-2 text-xs font-black text-white">{command.title}</button></div>
    <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Native Workspace · catalog</div><h2 className="mt-2 text-xl font-black">{command.title}</h2><p className="mt-1 text-xs font-medium text-slate-500">{command.description}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">NATIVE</span></div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800"><AssetManager assets={assets} onAddAsset={addAsset} onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset}/></div>
    </div>
  </section>;
}
