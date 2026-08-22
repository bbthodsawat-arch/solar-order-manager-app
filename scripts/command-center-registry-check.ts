import assert from 'node:assert/strict';
import { COMMAND_DOMAINS } from '../src/features/command-center/domains';
import { COMMAND_REGISTRY } from '../src/features/command-center/registry';
import { canAccessCommand } from '../src/features/command-center/permissions';
import type { AppUser } from '../src/utils/permissions';
import { getUserPermissions } from '../src/utils/permissions';

assert.equal(new Set(COMMAND_DOMAINS.map(domain => domain.id)).size, 6, 'must expose exactly six top-level domains');
assert.equal(new Set(COMMAND_REGISTRY.map(command => command.id)).size, COMMAND_REGISTRY.length, 'command IDs must be unique');
for (const command of COMMAND_REGISTRY) assert.ok(COMMAND_DOMAINS.some(domain => domain.id === command.domain), `unknown domain: ${command.domain}`);
const staff: AppUser = { uid:'staff', email:null, displayName:'Staff', photoURL:null, role:'staff', status:'active', createdAt:'' };
const admin: AppUser = { ...staff, uid:'admin', role:'admin' };
assert.equal(COMMAND_REGISTRY.some(command => command.id === 'system.maintenance' && canAccessCommand(staff, getUserPermissions(staff), command.permission)), false, 'staff must not see factory reset');
assert.equal(COMMAND_REGISTRY.some(command => command.id === 'system.maintenance' && canAccessCommand(admin, getUserPermissions(admin), command.permission)), true, 'admin should access factory reset policy');
console.log('Command Center registry and permission checks passed');
