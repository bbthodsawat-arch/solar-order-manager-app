import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { COMMAND_DOMAINS } from '../src/features/command-center/domains';
import { COMMAND_REGISTRY } from '../src/features/command-center/registry';
import { canAccessCommand } from '../src/features/command-center/permissions';
import type { AppUser } from '../src/utils/permissions';
import { getUserPermissions } from '../src/utils/permissions';

assert.equal(new Set(COMMAND_DOMAINS.map(domain => domain.id)).size, 6, 'must expose exactly six top-level domains');
assert.equal(new Set(COMMAND_REGISTRY.map(command => command.id)).size, COMMAND_REGISTRY.length, 'command IDs must be unique');
for (const command of COMMAND_REGISTRY) assert.ok(COMMAND_DOMAINS.some(domain => domain.id === command.domain), `unknown domain: ${command.domain}`);
for (const id of ['business.profile', 'business.brand', 'business.documents']) assert.ok(COMMAND_REGISTRY.some(command => command.id === id), `missing business migration command: ${id}`);
assert.ok(COMMAND_REGISTRY.every(command => command.workspaceStatus), 'every command must declare workspace migration status');
assert.ok(COMMAND_REGISTRY.some(command => command.workspaceStatus === 'native'), 'registry must contain at least one native workspace');
assert.ok(COMMAND_REGISTRY.some(command => command.workspaceStatus === 'legacy'), 'registry must contain legacy workspaces while migration is in progress');
assert.ok(COMMAND_REGISTRY.some(command => command.workspaceStatus === 'planned'), 'registry must expose planned high-risk workspaces');
assert.equal(COMMAND_REGISTRY.filter(command => command.workspaceStatus === 'native').length, 3, 'business migration commands must be the three native workspaces');
assert.equal(COMMAND_REGISTRY.filter(command => command.workspaceStatus === 'planned').length, 1, 'only system maintenance is planned');
assert.equal(existsSync('src/pages/CommandCenter.tsx'), false, 'superseded legacy CommandCenter must remain removed');
assert.equal(existsSync('src/pages/SettingsWorkspace.tsx'), false, 'superseded legacy SettingsWorkspace must remain removed');

const staff: AppUser = { uid:'staff', email:null, displayName:'Staff', photoURL:null, role:'staff', status:'active', createdAt:'' };
const admin: AppUser = { ...staff, uid:'admin', role:'admin' };
const staffPermissions = getUserPermissions(staff);
const adminPermissions = getUserPermissions(admin);
for (const id of ['business.profile', 'business.brand', 'business.documents', 'system.maintenance']) {
  const command = COMMAND_REGISTRY.find(item => item.id === id)!;
  assert.equal(canAccessCommand(staff, staffPermissions, command.permission), false, `staff must not access ${id}`);
  assert.equal(canAccessCommand(admin, adminPermissions, command.permission), true, `admin should access ${id}`);
}
console.log(`Command Center registry and permission checks passed (${COMMAND_REGISTRY.length} commands; native=${COMMAND_REGISTRY.filter(c => c.workspaceStatus === 'native').length}, legacy=${COMMAND_REGISTRY.filter(c => c.workspaceStatus === 'legacy').length}, planned=${COMMAND_REGISTRY.filter(c => c.workspaceStatus === 'planned').length})`);