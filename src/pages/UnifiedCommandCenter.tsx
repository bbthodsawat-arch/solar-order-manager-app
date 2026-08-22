import CommandCenter from './CommandCenter';
import POSCommandCenterPanel from '../components/pos/POSCommandCenterPanel';
import BrandPaymentWorkspace from '../components/BrandPaymentWorkspace';
import { CommandCenterShell } from '../features/command-center/CommandCenterShell';
import { LegacyCommandAdapter } from '../features/command-center/LegacyCommandAdapter';
import { getCommand } from '../features/command-center/registry';

interface UnifiedCommandCenterProps {
  onNavigateToUsers?: () => void;
  onNavigateToAudit?: () => void;
  onLockApp?: () => void;
}

export default function UnifiedCommandCenter(props: UnifiedCommandCenterProps) {
  const businessCommand = getCommand('business.profile');
  const catalogCommand = getCommand('catalog.products');
  return (
    <CommandCenterShell>
      <div className="space-y-5">
        <LegacyCommandAdapter command={businessCommand!}>
          <BrandPaymentWorkspace />
        </LegacyCommandAdapter>
        <LegacyCommandAdapter command={catalogCommand!}>
          <POSCommandCenterPanel />
        </LegacyCommandAdapter>
        <LegacyCommandAdapter command={businessCommand!}>
          <CommandCenter {...props} />
        </LegacyCommandAdapter>
      </div>
    </CommandCenterShell>
  );
}
