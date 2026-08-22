import { CommandCenterShell } from '../features/command-center/CommandCenterShell';
import { BUSINESS_MIGRATION_COMMANDS, BusinessMigrationWorkspace } from '../features/command-center/BusinessMigrationWorkspace';

interface UnifiedCommandCenterProps {
  onNavigateToUsers?: () => void;
  onNavigateToAudit?: () => void;
  onLockApp?: () => void;
}

export default function UnifiedCommandCenter(props: UnifiedCommandCenterProps) {
  return (
    <CommandCenterShell additionalCommands={BUSINESS_MIGRATION_COMMANDS}>
      <BusinessMigrationWorkspace {...props} />
    </CommandCenterShell>
  );
}
