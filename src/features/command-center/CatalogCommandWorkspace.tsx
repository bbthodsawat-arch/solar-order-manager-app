import type { ReactNode } from 'react';
import type { CommandDefinition } from './registry';
import { LegacyCommandAdapter } from './LegacyCommandAdapter';

export type CatalogCommand = 'catalog.products' | 'catalog.inventory';

export const CATALOG_NATIVE_COMMANDS: CommandDefinition[] = [
  { id: 'catalog.products', domain: 'catalog', title: 'ชุดสินค้าและราคา', description: 'ชุดมาตรฐาน ราคา และสินค้า', keywords: ['product', 'catalog', 'price', 'สินค้า', 'ราคา'], permission: 'canManageInventory', quickAction: true },
  { id: 'catalog.inventory', domain: 'catalog', title: 'สินค้าและสต็อก', description: 'สินค้า คลัง และจำนวนคงเหลือ', keywords: ['inventory', 'stock', 'สต็อก', 'คลัง'], permission: 'canManageInventory', quickAction: true },
];

interface Props {
  activeCommand: CatalogCommand;
  onActiveCommandChange: (command: CatalogCommand) => void;
  productsWorkspace: ReactNode;
  inventoryWorkspace: ReactNode;
}

/** Native control-plane host for catalog workspaces. Data ownership remains in the existing managers. */
export function CatalogCommandWorkspace({ activeCommand, onActiveCommandChange, productsWorkspace, inventoryWorkspace }: Props) {
  const command = CATALOG_NATIVE_COMMANDS.find(item => item.id === activeCommand)!;
  return (
    <div className="space-y-4" data-catalog-workspace={activeCommand}>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
        {CATALOG_NATIVE_COMMANDS.map(item => (
          <button key={item.id} type="button" onClick={() => onActiveCommandChange(item.id as CatalogCommand)} aria-pressed={activeCommand === item.id} className={`rounded-xl px-3 py-2 text-xs font-black transition ${activeCommand === item.id ? 'bg-brand text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            {item.title}
          </button>
        ))}
      </div>
      <LegacyCommandAdapter command={command}>
        {activeCommand === 'catalog.products' ? productsWorkspace : inventoryWorkspace}
      </LegacyCommandAdapter>
    </div>
  );
}
