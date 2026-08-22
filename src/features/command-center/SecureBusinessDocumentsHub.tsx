import BusinessDocumentsHub from '../../components/BusinessDocumentsHub';
import { useAuth } from '../../hooks/useAuth';
import { getUserPermissions } from '../../utils/permissions';
import { canAccessCommand } from './permissions';
import { getCommand } from './registry';

export function SecureBusinessDocumentsHub() {
  const { appUser } = useAuth();
  const permissions = getUserPermissions(appUser);
  const command = getCommand('business.documents');

  if (!command || !canAccessCommand(appUser, permissions, command.permission)) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-800">คุณไม่มีสิทธิ์เข้าถึง Document Center</div>;
  }

  return <BusinessDocumentsHub />;
}
