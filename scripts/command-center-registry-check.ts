import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { COMMAND_DOMAINS } from '../src/features/command-center/domains';
import { COMMAND_REGISTRY, getRegistryHealth } from '../src/features/command-center/registry';
import { canAccessCommand } from '../src/features/command-center/permissions';
import { CATALOG_NATIVE_COMMANDS } from '../src/features/command-center/CatalogCommandWorkspace';
import { NATIVE_OPERATIONS_COMMANDS } from '../src/features/command-center/NativeOperationsWorkspace';
import type { AppUser } from '../src/utils/permissions';
import { getUserPermissions } from '../src/utils/permissions';

assert.equal(new Set(COMMAND_DOMAINS.map(domain => domain.id)).size, 6, 'must expose exactly six top-level domains');
assert.equal(new Set(COMMAND_REGISTRY.map(command => command.id)).size, COMMAND_REGISTRY.length, 'command IDs must be unique');
for (const command of COMMAND_REGISTRY) assert.ok(COMMAND_DOMAINS.some(domain => domain.id === command.domain), `unknown domain: ${command.domain}`);
for (const id of ['business.profile','business.brand','business.documents','catalog.products','catalog.inventory','experience.design','automation.workflows','security.access','security.login','system.data','system.maintenance']) assert.ok(COMMAND_REGISTRY.some(command => command.id === id), `missing native command: ${id}`);
assert.ok(COMMAND_REGISTRY.every(command => command.workspaceStatus), 'every command must declare workspace migration status');
assert.equal(COMMAND_REGISTRY.filter(command => command.workspaceStatus === 'native').length, 11, 'business, catalog, experience, automation, security, and system core workspaces must be native');
assert.equal(COMMAND_REGISTRY.filter(command => command.workspaceStatus === 'legacy').length, 2, 'only business configuration and catalog assets remain legacy');
assert.equal(COMMAND_REGISTRY.filter(command => command.workspaceStatus === 'planned').length, 0, 'no command should remain planned after native operations migration');
assert.deepEqual(CATALOG_NATIVE_COMMANDS.map(command => command.id).sort(), ['catalog.inventory','catalog.products']);
assert.deepEqual(NATIVE_OPERATIONS_COMMANDS.map(command => command.id).sort(), ['automation.workflows','experience.design','security.access','system.data','system.maintenance']);
assert.ok(existsSync('src/features/command-center/CatalogCommandWorkspace.tsx'), 'catalog workspace host must exist');
assert.ok(existsSync('src/features/command-center/NativeOperationsWorkspace.tsx'), 'native operations workspace host must exist');
assert.ok(existsSync('src/components/ProductCatalogManager.tsx'), 'product catalog manager must remain the data UI');
assert.ok(existsSync('src/components/ProductInventoryManager.tsx'), 'product inventory manager must remain the data UI');
assert.ok(existsSync('src/components/DailyReminderSettings.tsx'), 'automation workspace must have a real implementation');
assert.ok(existsSync('src/components/LoginControlCenter.tsx'), 'security workspace must have a real implementation');
assert.ok(existsSync('src/components/DatabaseBackupSettings.tsx'), 'system data workspace must have a real implementation');
assert.ok(existsSync('src/components/SystemResetSettings.tsx'), 'system maintenance workspace must have a real implementation');
assert.equal(existsSync('src/pages/CommandCenter.tsx'), false, 'superseded legacy CommandCenter must remain removed');
assert.equal(existsSync('src/pages/SettingsWorkspace.tsx'), false, 'superseded legacy SettingsWorkspace must remain removed');
const unified = readFileSync('src/pages/UnifiedCommandCenter.tsx', 'utf8');
for (const token of ['NativeOperationsWorkspace','NATIVE_OPERATIONS_COMMANDS','DailyReminderSettings','LoginControlCenter','DatabaseBackupSettings','SystemResetSettings']) assert.ok(readFileSync('src/features/command-center/NativeOperationsWorkspace.tsx','utf8').includes(token), `native workspace must wire ${token}`);
assert.ok(unified.includes('NativeOperationsWorkspace'), 'UnifiedCommandCenter must mount native operations');
const shell = readFileSync('src/features/command-center/CommandCenterShell.tsx', 'utf8');
assert.ok(shell.includes('getRegistryHealth'), 'shell must surface deterministic registry health');
assert.ok(shell.includes('ไม่มีคำสั่งที่ได้รับอนุญาต'), 'shell must render a recoverable permission-empty state');
const overview = readFileSync('src/features/command-center/CommandCenterOverview.tsx', 'utf8');
assert.ok(overview.includes('data-registry-health'), 'overview must expose registry health state');

const healthy = getRegistryHealth(COMMAND_REGISTRY);
assert.equal(healthy.status, 'healthy', 'production registry fixture must be healthy');
assert.deepEqual(healthy.duplicateIds, []); assert.deepEqual(healthy.invalidDomains, []); assert.deepEqual(healthy.missingWorkspaceStatus, []);
const degradedFixture = [...COMMAND_REGISTRY,{...COMMAND_REGISTRY[0],id:'business.profile.duplicate'},{...COMMAND_REGISTRY[1],id:'business.brand.duplicate',domain:'invalid' as never},{...COMMAND_REGISTRY[2],id:'business.documents.missing-status',workspaceStatus:undefined}];
const degraded = getRegistryHealth(degradedFixture); assert.equal(degraded.status,'degraded','degraded fixture must be detected'); assert.ok(degraded.invalidDomains.includes('business.brand.duplicate')); assert.ok(degraded.missingWorkspaceStatus.includes('business.documents.missing-status'));
assert.equal(getRegistryHealth([...COMMAND_REGISTRY,COMMAND_REGISTRY[0]]).duplicateIds.includes('business.profile'),true,'duplicate command IDs must be detected');

const staff: AppUser = { uid:'staff', email:null, displayName:'Staff', photoURL:null, role:'staff', status:'active', createdAt:'' }; const admin: AppUser = {...staff,uid:'admin',role:'admin'};
const staffPermissions=getUserPermissions(staff); const adminPermissions=getUserPermissions(admin);
for(const id of ['business.profile','business.brand','business.documents','system.maintenance','security.access']) { const command=COMMAND_REGISTRY.find(item=>item.id===id)!; assert.equal(canAccessCommand(staff,staffPermissions,command.permission),false,`staff must not access ${id}`); assert.equal(canAccessCommand(admin,adminPermissions,command.permission),true,`admin should access ${id}`); }
for(const id of ['catalog.products','catalog.inventory','automation.workflows']) { const command=COMMAND_REGISTRY.find(item=>item.id===id)!; assert.equal(canAccessCommand(staff,staffPermissions,command.permission),true,`staff should access ${id}`); assert.equal(canAccessCommand(admin,adminPermissions,command.permission),true,`admin should access ${id}`); }
console.log(`Command Center registry, native workspace, health, and permission checks passed (${COMMAND_REGISTRY.length} commands; health=${healthy.status}; native=${COMMAND_REGISTRY.filter(c=>c.workspaceStatus==='native').length}, legacy=${COMMAND_REGISTRY.filter(c=>c.workspaceStatus==='legacy').length}, planned=${COMMAND_REGISTRY.filter(c=>c.workspaceStatus==='planned').length})`);
