import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { COMMAND_DOMAINS } from '../src/features/command-center/domains';
import { COMMAND_REGISTRY, getRegistryHealth } from '../src/features/command-center/registry';
import { canAccessCommand } from '../src/features/command-center/permissions';
import { CATALOG_NATIVE_COMMANDS } from '../src/features/command-center/CatalogCommandWorkspace';
import { NATIVE_OPERATIONS_COMMANDS } from '../src/features/command-center/NativeOperationsWorkspace';
import { BUSINESS_CONFIGURATION_COMMANDS } from '../src/features/command-center/BusinessConfigurationWorkspace';
import { CATALOG_ASSETS_COMMANDS } from '../src/features/command-center/CatalogAssetsWorkspace';
import type { AppUser } from '../src/utils/permissions';
import { getUserPermissions } from '../src/utils/permissions';

assert.equal(new Set(COMMAND_DOMAINS.map(domain => domain.id)).size, 6);
assert.equal(new Set(COMMAND_REGISTRY.map(command => command.id)).size, COMMAND_REGISTRY.length);
for (const command of COMMAND_REGISTRY) assert.ok(COMMAND_DOMAINS.some(domain => domain.id === command.domain), `unknown domain: ${command.domain}`);
assert.ok(COMMAND_REGISTRY.every(command => command.workspaceStatus));
assert.equal(COMMAND_REGISTRY.filter(command => command.workspaceStatus === 'native').length, 13);
assert.equal(COMMAND_REGISTRY.filter(command => command.workspaceStatus === 'legacy').length, 0);
assert.equal(COMMAND_REGISTRY.filter(command => command.workspaceStatus === 'planned').length, 0);
assert.deepEqual(CATALOG_NATIVE_COMMANDS.map(command => command.id).sort(), ['catalog.inventory','catalog.products']);
assert.deepEqual(NATIVE_OPERATIONS_COMMANDS.map(command => command.id).sort(), ['automation.workflows','experience.design','security.access','system.data','system.maintenance']);
assert.deepEqual(BUSINESS_CONFIGURATION_COMMANDS.map(command => command.id), ['business.configuration']);
assert.deepEqual(CATALOG_ASSETS_COMMANDS.map(command => command.id), ['catalog.assets']);
for (const path of ['src/features/command-center/CatalogCommandWorkspace.tsx','src/features/command-center/NativeOperationsWorkspace.tsx','src/features/command-center/BusinessConfigurationWorkspace.tsx','src/features/command-center/CatalogAssetsWorkspace.tsx','src/components/ConfigManager.tsx','src/components/AssetManager.tsx']) assert.ok(existsSync(path), `missing workspace implementation: ${path}`);
assert.equal(existsSync('src/pages/CommandCenter.tsx'), false);
assert.equal(existsSync('src/pages/SettingsWorkspace.tsx'), false);
const unified = readFileSync('src/pages/UnifiedCommandCenter.tsx', 'utf8');
for (const token of ['BusinessConfigurationWorkspace','CatalogAssetsWorkspace','NativeOperationsWorkspace']) assert.ok(unified.includes(token), `UnifiedCommandCenter must mount ${token}`);
const shell = readFileSync('src/features/command-center/CommandCenterShell.tsx', 'utf8');
assert.ok(shell.includes('getRegistryHealth')); assert.ok(shell.includes('ไม่มีคำสั่งที่ได้รับอนุญาต'));
const overview = readFileSync('src/features/command-center/CommandCenterOverview.tsx', 'utf8'); assert.ok(overview.includes('data-registry-health'));
const healthy = getRegistryHealth(COMMAND_REGISTRY); assert.equal(healthy.status, 'healthy'); assert.deepEqual(healthy.duplicateIds, []); assert.deepEqual(healthy.invalidDomains, []); assert.deepEqual(healthy.missingWorkspaceStatus, []);
const degradedFixture = [...COMMAND_REGISTRY,{...COMMAND_REGISTRY[0],id:'business.profile.duplicate'},{...COMMAND_REGISTRY[1],id:'business.brand.duplicate',domain:'invalid' as never},{...COMMAND_REGISTRY[2],id:'business.documents.missing-status',workspaceStatus:undefined}];
const degraded=getRegistryHealth(degradedFixture); assert.equal(degraded.status,'degraded'); assert.ok(degraded.invalidDomains.includes('business.brand.duplicate')); assert.ok(degraded.missingWorkspaceStatus.includes('business.documents.missing-status')); assert.equal(getRegistryHealth([...COMMAND_REGISTRY,COMMAND_REGISTRY[0]]).duplicateIds.includes('business.profile'),true);
const staff: AppUser={uid:'staff',email:null,displayName:'Staff',photoURL:null,role:'staff',status:'active',createdAt:''}; const admin:AppUser={...staff,uid:'admin',role:'admin'}; const staffPermissions=getUserPermissions(staff); const adminPermissions=getUserPermissions(admin);
for(const id of ['business.profile','business.brand','business.documents','business.configuration','catalog.assets','system.maintenance','security.access']){const command=COMMAND_REGISTRY.find(item=>item.id===id)!;assert.equal(canAccessCommand(staff,staffPermissions,command.permission),false,`staff must not access ${id}`);assert.equal(canAccessCommand(admin,adminPermissions,command.permission),true,`admin should access ${id}`);}
for(const id of ['catalog.products','catalog.inventory','automation.workflows']){const command=COMMAND_REGISTRY.find(item=>item.id===id)!;assert.equal(canAccessCommand(staff,staffPermissions,command.permission),true,`staff should access ${id}`);assert.equal(canAccessCommand(admin,adminPermissions,command.permission),true,`admin should access ${id}`);}
console.log(`Command Center registry/native workspace/health/permission checks passed (${COMMAND_REGISTRY.length} commands; native=${COMMAND_REGISTRY.filter(c=>c.workspaceStatus==='native').length}, legacy=${COMMAND_REGISTRY.filter(c=>c.workspaceStatus==='legacy').length}, planned=${COMMAND_REGISTRY.filter(c=>c.workspaceStatus==='planned').length})`);
