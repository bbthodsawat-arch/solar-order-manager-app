import type { CommandDefinition } from './registry';

const VALID_DOMAINS = new Set(['business', 'catalog', 'experience', 'automation', 'security', 'system']);

export interface RegistryHealth {
  status: 'healthy' | 'degraded';
  commandCount: number;
  duplicateIds: string[];
  invalidDomains: string[];
  quickActionCount: number;
}

export function summarizeRegistryHealth(registry: CommandDefinition[]): RegistryHealth {
  const ids = new Set<string>();
  const duplicateIds = new Set<string>();
  const invalidDomains = new Set<string>();

  for (const command of registry) {
    if (ids.has(command.id)) duplicateIds.add(command.id);
    ids.add(command.id);
    if (!VALID_DOMAINS.has(command.domain)) invalidDomains.add(command.domain);
  }

  const duplicates = [...duplicateIds];
  const invalid = [...invalidDomains];
  return {
    status: duplicates.length || invalid.length ? 'degraded' : 'healthy',
    commandCount: registry.length,
    duplicateIds: duplicates,
    invalidDomains: invalid,
    quickActionCount: registry.filter(command => command.quickAction).length,
  };
}

// Backward-compatible export for callers from the previous registry-health API.
export function getCommandRegistryHealth(registry: CommandDefinition[]): RegistryHealth {
  return summarizeRegistryHealth(registry);
}
