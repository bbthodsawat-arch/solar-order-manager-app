import { useState } from 'react';
import type { CommandDefinition } from './registry';
import BrandPaymentWorkspace from '../../components/BrandPaymentWorkspace';
import CompanySettings from '../../components/CompanySettings';
import { SecureBusinessDocumentsHub } from './SecureBusinessDocumentsHub';
import { LegacyCommandAdapter } from './LegacyCommandAdapter';
import { useAuth } from '../../hooks/useAuth';
import { getUserPermissions } from '../../utils/permissions';
import { canAccessCommand } from './permissions';
import { getCommand } from './registry';

export type BusinessMigrationCommand = 'business.profile' | 'business.brand' | 'business.documents';

export const BUSINESS_MIGRATION_COMMANDS: CommandDefinition[] = [
  getCommand('business.profile')!,
  getCommand('business.brand')!,
  getCommand('business.documents')!,
].filter(Boolean);

interface Props {
  activeCommand?: BusinessMigrationCommand;
  onActiveCommandChange?: (command: BusinessMigrationCommand) => void;
}

export function BusinessMigrationWorkspace({ activeCommand, onActiveCommandChange }: Props) {
  const { appUser } = useAuth();
  const permissions = getUserPermissions(appUser);
  const [internalActive, setInternalActive] = useState<BusinessMigrationCommand>('business.brand');
  const active = activeCommand ?? internalActive;
  const setActive = (command: BusinessMigrationCommand) => {
    setInternalActive(command);
    onActiveCommandChange?.(command);
  };
  const command = getCommand(active);
  const canRenderActive = command ? canAccessCommand(appUser, permissions, command.permission) : false;
  const visibleCommands = BUSINESS_MIGRATION_COMMANDS.filter(item => canAccessCommand(appUser, permissions, item.permission));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
        {visibleCommands.map(item => (
          <button key={item.id} onClick={() => setActive(item.id as BusinessMigrationCommand)} className={`rounded-xl px-3 py-2 text-xs font-black transition ${active === item.id ? 'bg-brand text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            {item.title}
          </button>
        ))}
      </div>
      {command && canRenderActive && (
        <LegacyCommandAdapter command={command}>
          {active === 'business.profile' ? <CompanySettings /> : active === 'business.documents' ? <SecureBusinessDocumentsHub /> : <BrandPaymentWorkspace />}
        </LegacyCommandAdapter>
      )}
      {command && !canRenderActive && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800">คุณไม่มีสิทธิ์เข้าถึง workspace นี้</div>}
    </div>
  );
}
