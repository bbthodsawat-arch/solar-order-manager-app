export type UserRole = 'admin' | 'owner' | 'manager' | 'staff' | 'viewer';

export interface UserPermissions {
  canViewDashboard: boolean;
  canAddTransactions: boolean;
  canEditTransactions: boolean;
  canDeleteTransactions: boolean;
  canViewReports: boolean;
  canManageCustomers: boolean;
  canManageInventory: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
  canManageSecurity: boolean;
  canManageDatabase: boolean;
  canExportData: boolean;
  canViewAuditLogs: boolean;
}

export interface AppUser {
  uid: string;
  email: string | null;
  username?: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  permissions?: UserPermissions;
  status?: 'active' | 'suspended';
  authProvider?: 'google' | 'password';
  /** @deprecated Never store plaintext passwords. Kept only for backward-compatible reads of old documents. */
  passwordHint?: string;
  createdAt: string;
  lastLoginAt?: string;
}

const ALL: UserPermissions = {
  canViewDashboard: true,
  canAddTransactions: true,
  canEditTransactions: true,
  canDeleteTransactions: true,
  canViewReports: true,
  canManageCustomers: true,
  canManageInventory: true,
  canManageSettings: true,
  canManageUsers: true,
  canManageSecurity: true,
  canManageDatabase: true,
  canExportData: true,
  canViewAuditLogs: true,
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: ALL,
  owner: ALL,
  manager: {
    canViewDashboard: true,
    canAddTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: true,
    canViewReports: true,
    canManageCustomers: true,
    canManageInventory: true,
    canManageSettings: true,
    canManageUsers: false,
    canManageSecurity: false,
    canManageDatabase: false,
    canExportData: true,
    canViewAuditLogs: true,
  },
  staff: {
    canViewDashboard: true,
    canAddTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: false,
    canViewReports: true,
    canManageCustomers: true,
    canManageInventory: true,
    canManageSettings: false,
    canManageUsers: false,
    canManageSecurity: false,
    canManageDatabase: false,
    canExportData: false,
    canViewAuditLogs: false,
  },
  viewer: {
    canViewDashboard: true,
    canAddTransactions: false,
    canEditTransactions: false,
    canDeleteTransactions: false,
    canViewReports: true,
    canManageCustomers: false,
    canManageInventory: false,
    canManageSettings: false,
    canManageUsers: false,
    canManageSecurity: false,
    canManageDatabase: false,
    canExportData: false,
    canViewAuditLogs: false,
  },
};

export const PERMISSION_LABELS: Record<keyof UserPermissions, { label: string; desc: string }> = {
  canViewDashboard: { label: 'ดูภาพรวมธุรกิจ', desc: 'เข้าถึง Dashboard ยอดขาย กำไร และภาพรวมการดำเนินงาน' },
  canAddTransactions: { label: 'สร้างรายการใหม่', desc: 'เพิ่มออเดอร์ รายรับ รายจ่าย และรายการขาย' },
  canEditTransactions: { label: 'แก้ไขรายการ', desc: 'แก้ไขรายละเอียดรายการและสถานะการชำระเงิน' },
  canDeleteTransactions: { label: 'ลบรายการ', desc: 'ลบหรือยกเลิกรายการที่ไม่ต้องการ' },
  canViewReports: { label: 'ดูรายงานและการวิเคราะห์', desc: 'เข้าถึงรายงาน การเงิน Forecast และสรุปผล' },
  canManageCustomers: { label: 'จัดการลูกค้าและ CRM', desc: 'สร้าง แก้ไข และดูข้อมูลลูกค้า' },
  canManageInventory: { label: 'จัดการสินค้าและสต็อก', desc: 'สินค้า ชุดสินค้า คลัง และทรัพย์สิน' },
  canManageSettings: { label: 'ตั้งค่าระบบ', desc: 'หมวดหมู่ ธีม Dashboard เมนู และการตั้งค่าธุรกิจ' },
  canManageUsers: { label: 'จัดการผู้ใช้งาน', desc: 'สร้างบัญชี กำหนดบทบาท เปิด/ปิด และจัดการสิทธิ์' },
  canManageSecurity: { label: 'จัดการความปลอดภัย', desc: 'PIN วิธี Login และนโยบายการเข้าถึง' },
  canManageDatabase: { label: 'จัดการข้อมูลระบบ', desc: 'สำรองข้อมูล ตรวจสอบ Sync และเครื่องมือฐานข้อมูล' },
  canExportData: { label: 'ส่งออกข้อมูล', desc: 'ส่งออกข้อมูลธุรกิจและรายงาน' },
  canViewAuditLogs: { label: 'ดู Audit Log', desc: 'ตรวจสอบประวัติการเปลี่ยนแปลงและกิจกรรมสำคัญ' },
};

const DENIED: UserPermissions = Object.keys(ALL).reduce((out, key) => {
  (out as any)[key] = false;
  return out;
}, {} as UserPermissions);

export function getUserPermissions(user: AppUser | null): UserPermissions {
  if (!user || user.status === 'suspended') return DENIED;
  if (user.role === 'admin' || user.role === 'owner' || user.email?.toLowerCase() === 'b.b.thodsawat@gmail.com') return DEFAULT_ROLE_PERMISSIONS.admin;
  const defaults = DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.staff;
  return { ...defaults, ...(user.permissions || {}) };
}
