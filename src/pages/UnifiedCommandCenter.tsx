import { CommandCenterShell } from '../features/command-center/CommandCenterShell';
import { BusinessMigrationWorkspace } from '../features/command-center/BusinessMigrationWorkspace';

interface UnifiedCommandCenterProps {
  onNavigateToUsers?: () => void;
  onNavigateToAudit?: () => void;
  onLockApp?: () => void;
}

export default function UnifiedCommandCenter(props: UnifiedCommandCenterProps) {
  return (
    <CommandCenterShell>
      <BusinessMigrationWorkspace {...props} />
    </CommandCenterShell>
  );
}
