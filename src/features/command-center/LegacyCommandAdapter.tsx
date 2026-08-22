import type { ReactNode } from 'react';
import type { CommandDefinition } from './registry';

interface LegacyCommandAdapterProps {
  command: CommandDefinition;
  children: ReactNode;
}

/** Transitional bridge: lets legacy Settings/CommandCenter workspaces render inside CC2.0. */
export function LegacyCommandAdapter({ command, children }: LegacyCommandAdapterProps) {
  return (
    <section data-command-id={command.id} data-legacy-section={command.legacySection ?? undefined} className="min-w-0">
      {children}
    </section>
  );
}
