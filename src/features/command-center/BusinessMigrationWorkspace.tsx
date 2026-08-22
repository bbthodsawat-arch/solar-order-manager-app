import { useState } from 'react';
import type { CommandDefinition } from './registry';
import BrandPaymentWorkspace from '../../components/BrandPaymentWorkspace';
import BusinessDocumentsHub from '../../components/BusinessDocumentsHub';
import CommandCenter from '../../pages/CommandCenter';
import { LegacyCommandAdapter } from './LegacyCommandAdapter';

export type BusinessMigrationCommand = 'business.profile' | 'business.brand' | 'business.payment' | 'business.documents';

export const BUSINESS_MIGRATION_COMMANDS: CommandDefinition[] = [
  { id:'business.profile', domain:'business', title:'ข้อมูลธุรกิจ', description:'ข้อมูลกิจการ บริษัท ที่อยู่ และข้อมูลพื้นฐาน', keywords:['business','company','profile','บริษัท'], permission:'canManageSettings', legacySection:'business' },
  { id:'business.brand', domain:'business', title:'แบรนด์และอัตลักษณ์', description:'จัดการแบรนด์ โลโก้ และข้อมูลที่ใช้กับสินค้า', keywords:['brand','branding','logo','แบรนด์','โลโก้'], permission:'canManageSettings', legacySection:'branding', quickAction:true },
  { id:'business.payment', domain:'business', title:'ช่องทางการชำระเงิน', description:'จัดการช่องทางชำระเงินและค่าเริ่มต้น', keywords:['payment','payments','ชำระเงิน'], permission:'canManageSettings', legacySection:'branding', quickAction:true },
  { id:'business.documents', domain:'business', title:'ศูนย์เอกสารธุรกิจ', description:'Template เลขที่เอกสาร workflow และ archive', keywords:['document','template','numbering','workflow','archive','เอกสาร'], permission:'canManageDatabase', legacySection:'templates' },
];

interface Props {
  onNavigateToUsers?: () => void;
  onNavigateToAudit?: () => void;
  onLockApp?: () => void;
  activeCommand?: BusinessMigrationCommand;
  onActiveCommandChange?: (command: BusinessMigrationCommand) => void;
}

export function BusinessMigrationWorkspace({ activeCommand, onActiveCommandChange, ...props }: Props) {
  const [internalActive, setInternalActive] = useState<BusinessMigrationCommand>('business.brand');
  const active = activeCommand ?? internalActive;
  const setActive = (command: BusinessMigrationCommand) => {
    setInternalActive(command);
    onActiveCommandChange?.(command);
  };
  const command = BUSINESS_MIGRATION_COMMANDS.find(item => item.id === active);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
        {BUSINESS_MIGRATION_COMMANDS.map(item => <button key={item.id} onClick={() => setActive(item.id as BusinessMigrationCommand)} className={`rounded-xl px-3 py-2 text-xs font-black transition ${active === item.id ? 'bg-brand text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{item.title}</button>)}
      </div>
      {command && (
        <LegacyCommandAdapter command={command}>
          {active === 'business.documents' ? <BusinessDocumentsHub /> : active === 'business.profile' ? <CommandCenter {...props} /> : <BrandPaymentWorkspace />}
        </LegacyCommandAdapter>
      )}
    </div>
  );
}
