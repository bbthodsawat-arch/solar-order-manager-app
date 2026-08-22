import { useState } from 'react';
import { CommandCenterShell } from '../features/command-center/CommandCenterShell';
import { BUSINESS_MIGRATION_COMMANDS, BusinessMigrationWorkspace, type BusinessMigrationCommand } from '../features/command-center/BusinessMigrationWorkspace';
import type { CommandDefinition } from '../features/command-center/registry';

interface UnifiedCommandCenterProps {
  onNavigateToUsers?: () => void;
  onNavigateToAudit?: () => void;
  onLockApp?: () => void;
}

export default function UnifiedCommandCenter(props: UnifiedCommandCenterProps) {
  const [activeCommand, setActiveCommand] = useState<BusinessMigrationCommand>('business.brand');
  const handleCommand = (command: CommandDefinition) => {
    if (BUSINESS_MIGRATION_COMMANDS.some(item => item.id === command.id)) {
      setActiveCommand(command.id as BusinessMigrationCommand);
    }
  };

  return (
    <CommandCenterShell additionalCommands={BUSINESS_MIGRATION_COMMANDS} onSelectCommand={handleCommand}>
      <BusinessMigrationWorkspace {...props} activeCommand={activeCommand} onActiveCommandChange={setActiveCommand} />
    </CommandCenterShell>
  );
}
