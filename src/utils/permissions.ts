export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer';

export interface UserPermissions {
  canViewDashboard: boolean;
  canAddTransactions: boolean;
  canEditTransactions: boolean;
  canDeleteTransactions: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
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
  passwordHint?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canViewDashboard: true,
    canAddTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: true,
    canViewReports: true,
    canManageSettings: true,
    canManageUsers: true,
    canViewAuditLogs: true,
  },
  manager: {
    canViewDashboard: true,
    canAddTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: true,
    canViewReports: true,
    canManageSettings: true,
    canManageUsers: false,
    canViewAuditLogs: true,
  },
  staff: {
    canViewDashboard: true,
    canAddTransactions: true,
    canEditTransactions: false,
    canDeleteTransactions: false,
    canViewReports: true,
    canManageSettings: false,
    canManageUsers: false,
    canViewAuditLogs: false,
  },
  viewer: {
    canViewDashboard: true,
    canAddTransactions: false,
    canEditTransactions: false,
    canDeleteTransactions: false,
    canViewReports: true,
    canManageSettings: false,
    canManageUsers: false,
    canViewAuditLogs: false,
  },
};

export const PERMISSION_LABELS: Record<keyof UserPermissions, { label: string; desc: string }> = {
  canViewDashboard: {
    label: 'ดูภาพรวมธุรกิจ (Dashboard)',
    desc: 'เข้าถึงหน้าภาพรวม ยอดขาย กำไร และกราฟสรุป',
  },
  canAddTransactions: {
    label: 'บันทึกรายการใหม่ (Add Transaction)',
    desc: 'เพิ่มรายการรายรับ รายจ่าย งานขายโซล่าเซลล์ และแนบสลิป',
  },
  canEditTransactions: {
    label: 'แก้ไขรายการ (Edit Transaction)',
    desc: 'ปรับปรุงรายละเอียดรายการหรือเปลี่ยนสถานะชำระเงิน',
  },
  canDeleteTransactions: {
    label: 'ลบรายการ (Delete Transaction)',
    desc: 'ยกเลิกหรือลบรายการออกจากระบบ',
  },
  canViewReports: {
    label: 'ดูรายงานสรุป (Financial Reports)',
    desc: 'เข้าถึงรายงานการเงิน รายเดือน รายปี และส่งออกข้อมูล',
  },
  canManageSettings: {
    label: 'ตั้งค่าระบบ (System Settings)',
    desc: 'จัดการหมวดหมู่สินค้า รายการประจำ และการเตือนความจำ',
  },
  canManageUsers: {
    label: 'จัดการสิทธิ์ผู้ใช้งาน (User Management)',
    desc: 'กำหนดบทบาทและเปิด/ปิดสิทธิ์ย่อยของผู้ใช้ทุกคน (Admin Only)',
  },
  canViewAuditLogs: {
    label: 'ดูประวัติการบันทึกระบบ (Audit Log)',
    desc: 'ตรวจสอบประวัติการแก้ไข ลบรายการ หรือเปลี่ยนสิทธิ์ผู้ใช้ย้อนหลัง',
  },
};

export function getUserPermissions(user: AppUser | null): UserPermissions {
  if (!user) {
    return {
      canViewDashboard: false,
      canAddTransactions: false,
      canEditTransactions: false,
      canDeleteTransactions: false,
      canViewReports: false,
      canManageSettings: false,
      canManageUsers: false,
      canViewAuditLogs: false,
    };
  }

  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.staff;
  
  // If user is suspended, return all false
  if (user.status === 'suspended') {
    return {
      canViewDashboard: false,
      canAddTransactions: false,
      canEditTransactions: false,
      canDeleteTransactions: false,
      canViewReports: false,
      canManageSettings: false,
      canManageUsers: false,
      canViewAuditLogs: false,
    };
  }

  // Admin or store owner always has full access
  if (user.role === 'admin' || user.email?.toLowerCase() === 'b.b.thodsawat@gmail.com') {
    return DEFAULT_ROLE_PERMISSIONS.admin;
  }

  if (!user.permissions) {
    return defaultPerms;
  }

  return {
    ...defaultPerms,
    ...user.permissions,
  };
}
