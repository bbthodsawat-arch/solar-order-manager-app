import { useState } from 'react';
import BrandPaymentWorkspace from '../../components/BrandPaymentWorkspace';
import BusinessDocumentsHub from '../../components/BusinessDocumentsHub';
import CommandCenter from '../../pages/CommandCenter';
import { LegacyCommandAdapter } from './LegacyCommandAdapter';
import { getCommand } from './registry';

export type BusinessMigrationCommand = 'business.profile' | 'business.brand' | 'business.payment' | 'business.documents';

interface Props {
  onNavigateToUsers?: () => void;
  onNavigateToAudit?: () => void;
  onLockApp?: () => void;
}

export function BusinessMigrationWorkspace(props: Props) {
  const [active, setActive] = useState<BusinessMigrationCommand>('business.brand');
  const command = getCommand(active);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
        {(['business.profile', 'business.brand', 'business.payment', 'business.documents'] as BusinessMigrationCommand[]).map(id => {
          const item = getCommand(id);
          if (!item) return null;
          return <button key={id} onClick={() => setActive(id)} className={`rounded-xl px-3 py-2 text-xs font-black transition ${active === id ? 'bg-brand text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{item.title}</button>;
        })}
      </div>
      {command && (
        <LegacyCommandAdapter command={command}>
          {active === 'business.documents' ? <BusinessDocumentsHub /> : active === 'business.profile' ? <CommandCenter {...props} /> : <BrandPaymentWorkspace />}
        </LegacyCommandAdapter>
      )}
    </div>
  );
}
