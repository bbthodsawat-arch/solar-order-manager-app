import type { AppUser, UserPermissions } from '../../utils/permissions';

export type PermissionKey = keyof UserPermissions | 'system.reset';

export function canAccessCommand(user: AppUser | null, permissions: UserPermissions, permission?: PermissionKey): boolean {
  if (!user || user.status === 'suspended') return false;
  if (!permission) return true;
  if (permission === 'system.reset') {
    return (user.role === 'admin' || user.role === 'owner') && permissions.canManageDatabase && permissions.canManageSettings;
  }
  return permissions[permission] === true;
}
