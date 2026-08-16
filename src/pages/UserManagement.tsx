import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, createNewUserWithPassword, sendUserPasswordResetEmail } from '../lib/firebase';
import { AppUser, UserRole, UserPermissions } from '../types';
import { useAuth } from '../hooks/useAuth';
import { logAuditEvent } from '../lib/auditLogger';
import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_LABELS, getUserPermissions } from '../utils/permissions';
import { 
  Shield, User, Search, Settings2, CheckCircle2, XCircle, 
  UserCheck, UserX, Key, ChevronDown, ChevronUp, Lock, RefreshCw, AlertCircle,
  Plus, Edit3, Trash2, Copy, Sparkles, Eye, EyeOff, Mail, KeyRound, Check, ShieldAlert
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let pass = 'Solar#';
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export default function UserManagement() {
  const { appUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUserUid, setExpandedUserUid] = useState<string | null>(null);
  const [savingUid, setSavingUid] = useState<string | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<AppUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; email: string; pass: string } | null>(null);

  // Create User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState(generateRandomPassword());
  const [showNewPassword, setShowNewPassword] = useState(true);
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [newPermissions, setNewPermissions] = useState<UserPermissions>(DEFAULT_ROLE_PERMISSIONS.staff);
  const [newStatus, setNewStatus] = useState<'active' | 'suspended'>('active');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit User Form State
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('staff');
  const [editPermissions, setEditPermissions] = useState<UserPermissions>(DEFAULT_ROLE_PERMISSIONS.staff);
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');

  // Reset Password State
  const [resetNewPass, setResetNewPass] = useState(generateRandomPassword());
  const [showResetPass, setShowResetPass] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isPromotingSelf, setIsPromotingSelf] = useState(false);

  const handlePromoteSelfToAdmin = async () => {
    if (!appUser?.uid) return;
    try {
      setIsPromotingSelf(true);
      const userRef = doc(db, 'users', appUser.uid);
      await updateDoc(userRef, {
        role: 'admin',
        permissions: DEFAULT_ROLE_PERMISSIONS.admin,
        status: 'active'
      });
      
      await logAuditEvent({
        action: 'ROLE_CHANGE',
        category: 'user',
        targetId: appUser.uid,
        targetName: appUser.displayName || appUser.email || 'Current User',
        details: `ยกระดับบัญชีตัวเองเป็น Admin (Owner Claim)`,
        user: { uid: appUser.uid, displayName: appUser.displayName, email: appUser.email, role: 'admin' }
      });

      toast.success('ยกระดับบัญชีเป็น Admin เรียบร้อยแล้ว! กำลังรีโหลดระบบ...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Error promoting to admin:', err);
      toast.error('ไม่สามารถยกระดับสิทธิ์ได้: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setIsPromotingSelf(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(docSnap => {
        const d = docSnap.data() as AppUser;
        return {
          ...d,
          permissions: d.permissions || DEFAULT_ROLE_PERMISSIONS[d.role || 'staff'],
          status: d.status || 'active'
        };
      });
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้งานได้');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setNewUsername('');
    setNewDisplayName('');
    setNewEmail('');
    const genPass = generateRandomPassword();
    setNewPassword(genPass);
    setNewRole('staff');
    setNewPermissions(DEFAULT_ROLE_PERMISSIONS.staff);
    setNewStatus('active');
    setShowCreateModal(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = newUsername.trim().toLowerCase();
    if (!cleanUsername) {
      toast.error('กรุณาระบุชื่อผู้ใช้งาน (Username)');
      return;
    }
    if (!newDisplayName.trim()) {
      toast.error('กรุณาระบุชื่อ-นามสกุล (Display Name)');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    // Default email format if omitted
    const finalEmail = newEmail.trim() ? newEmail.trim().toLowerCase() : `${cleanUsername}@store.local`;

    // Check unique username
    const existingUser = users.find(u => u.username?.toLowerCase() === cleanUsername);
    if (existingUser) {
      toast.error(`ชื่อผู้ใช้งาน "${cleanUsername}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`);
      return;
    }

    try {
      setIsSubmittingCreate(true);
      // Create user in Firebase Auth via secondary auth instance
      const createdUid = await createNewUserWithPassword(finalEmail, newPassword);

      const newUserDoc: AppUser = {
        uid: createdUid,
        username: cleanUsername,
        displayName: newDisplayName.trim(),
        email: finalEmail,
        photoURL: null,
        role: newRole,
        permissions: newPermissions,
        status: newStatus,
        authProvider: 'password',
        passwordHint: newPassword,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', createdUid), newUserDoc);
      setUsers([...users, newUserDoc]);

      // Audit Log
      await logAuditEvent({
        action: 'USER_CREATE',
        category: 'user',
        targetId: createdUid,
        targetName: `@${cleanUsername} (${newDisplayName.trim()})`,
        details: `สร้างบัญชีผู้ใช้งานใหม่ Username: @${cleanUsername}, บทบาท: ${newRole.toUpperCase()}, อีเมล: ${finalEmail}`,
        newData: newUserDoc,
        user: appUser ? { uid: appUser.uid, displayName: appUser.displayName, email: appUser.email, role: appUser.role } : null,
      });

      setShowCreateModal(false);
      setCreatedCredentials({
        username: cleanUsername,
        email: finalEmail,
        pass: newPassword
      });

      toast.success(`สร้างผู้ใช้งาน "${cleanUsername}" เรียบร้อยแล้ว`);
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error?.code === 'auth/email-already-in-use') {
        toast.error('อีเมลนี้ถูกใช้งานในระบบแล้ว');
      } else {
        toast.error('ไม่สามารถสร้างผู้ใช้ได้: ' + (error.message || 'เกิดข้อผิดพลาด'));
      }
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleOpenEditModal = (targetUser: AppUser) => {
    setEditingUser(targetUser);
    setEditDisplayName(targetUser.displayName || '');
    setEditUsername(targetUser.username || '');
    setEditEmail(targetUser.email || '');
    setEditRole(targetUser.role || 'staff');
    setEditPermissions(getUserPermissions(targetUser));
    setEditStatus(targetUser.status || 'active');
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editingUser.uid === appUser?.uid && editRole !== 'admin') {
      toast.error('คุณไม่สามารถลดสิทธิ์ Admin ของตัวเองได้');
      return;
    }

    try {
      setSavingUid(editingUser.uid);
      const updatedFields: Partial<AppUser> = {
        displayName: editDisplayName.trim(),
        username: editUsername.trim().toLowerCase() || null,
        email: editEmail.trim().toLowerCase() || null,
        role: editRole,
        permissions: editPermissions,
        status: editStatus,
      };

      await updateDoc(doc(db, 'users', editingUser.uid), updatedFields);

      // Audit Log
      await logAuditEvent({
        action: editingUser.role !== editRole ? 'USER_ROLE_UPDATE' : 'USER_PERM_UPDATE',
        category: 'user',
        targetId: editingUser.uid,
        targetName: `@${editingUser.username || editingUser.displayName} (${editingUser.email})`,
        details: `แก้ไขข้อมูลผู้ใช้งาน: บทบาท=${editRole.toUpperCase()}, สถานะ=${editStatus}`,
        previousData: editingUser,
        newData: updatedFields,
        user: appUser ? { uid: appUser.uid, displayName: appUser.displayName, email: appUser.email, role: appUser.role } : null,
      });

      setUsers(users.map(u => u.uid === editingUser.uid ? { ...u, ...updatedFields } : u));
      setEditingUser(null);
      toast.success('อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('ไม่สามารถอัปเดตข้อมูลผู้ใช้งานได้');
    } finally {
      setSavingUid(null);
    }
  };

  const handleRolePresetChange = async (targetUser: AppUser, newRole: UserRole) => {
    if (targetUser.uid === appUser?.uid) {
      toast.error('คุณไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้');
      return;
    }

    const defaultPermsForRole = DEFAULT_ROLE_PERMISSIONS[newRole];

    try {
      setSavingUid(targetUser.uid);
      await updateDoc(doc(db, 'users', targetUser.uid), {
        role: newRole,
        permissions: defaultPermsForRole
      });

      // Audit Log
      await logAuditEvent({
        action: 'USER_ROLE_UPDATE',
        category: 'user',
        targetId: targetUser.uid,
        targetName: `@${targetUser.username || targetUser.displayName} (${targetUser.email})`,
        details: `เปลี่ยนบทบาทผู้ใช้เป็น ${newRole.toUpperCase()} (จากเดิม ${targetUser.role || 'staff'})`,
        previousData: { role: targetUser.role, permissions: targetUser.permissions },
        newData: { role: newRole, permissions: defaultPermsForRole },
        user: appUser ? { uid: appUser.uid, displayName: appUser.displayName, email: appUser.email, role: appUser.role } : null,
      });

      setUsers(users.map(u => u.uid === targetUser.uid ? {
        ...u,
        role: newRole,
        permissions: defaultPermsForRole
      } : u));

      toast.success(`เปลี่ยนบทบาทเป็น ${newRole.toUpperCase()} เรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์');
    } finally {
      setSavingUid(null);
    }
  };

  const handlePermissionToggle = async (targetUser: AppUser, permKey: keyof UserPermissions) => {
    if (targetUser.uid === appUser?.uid) {
      toast.error('คุณไม่สามารถแก้ไขสิทธิ์ของตัวเองได้');
      return;
    }

    const currentPerms = getUserPermissions(targetUser);
    const updatedPerms: UserPermissions = {
      ...currentPerms,
      [permKey]: !currentPerms[permKey]
    };

    try {
      setSavingUid(targetUser.uid);
      await updateDoc(doc(db, 'users', targetUser.uid), {
        permissions: updatedPerms
      });

      // Audit Log
      await logAuditEvent({
        action: 'USER_PERM_UPDATE',
        category: 'user',
        targetId: targetUser.uid,
        targetName: `@${targetUser.username || targetUser.displayName} (${targetUser.email})`,
        details: `แก้ไขสิทธิ์ย่อยของผู้ใช้งาน (${permKey}: ${updatedPerms[permKey] ? 'เปิด' : 'ปิด'})`,
        previousData: currentPerms,
        newData: updatedPerms,
        user: appUser ? { uid: appUser.uid, displayName: appUser.displayName, email: appUser.email, role: appUser.role } : null,
      });

      setUsers(users.map(u => u.uid === targetUser.uid ? {
        ...u,
        permissions: updatedPerms
      } : u));

      toast.success('อัปเดตสิทธิ์การใช้งานเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('ไม่สามารถอัปเดตสิทธิ์ได้');
    } finally {
      setSavingUid(null);
    }
  };

  const handleStatusToggle = async (targetUser: AppUser) => {
    if (targetUser.uid === appUser?.uid) {
      toast.error('คุณไม่สามารถระงับบัญชีของตัวเองได้');
      return;
    }

    const newStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';

    try {
      setSavingUid(targetUser.uid);
      await updateDoc(doc(db, 'users', targetUser.uid), {
        status: newStatus
      });

      // Audit Log
      await logAuditEvent({
        action: 'USER_STATUS_TOGGLE',
        category: 'user',
        targetId: targetUser.uid,
        targetName: `@${targetUser.username || targetUser.displayName} (${targetUser.email})`,
        details: `${newStatus === 'suspended' ? 'ระงับสิทธิ์การใช้งาน (Suspend Account)' : 'เปิดใช้งานบัญชีผู้ใช้ (Activate Account)'}`,
        previousData: { status: targetUser.status },
        newData: { status: newStatus },
        user: appUser ? { uid: appUser.uid, displayName: appUser.displayName, email: appUser.email, role: appUser.role } : null,
      });

      setUsers(users.map(u => u.uid === targetUser.uid ? {
        ...u,
        status: newStatus
      } : u));

      if (newStatus === 'suspended') {
        toast.error(`ระงับสิทธิ์การใช้งานของ ${targetUser.displayName || targetUser.email} เรียบร้อยแล้ว`);
      } else {
        toast.success(`เปิดใช้งานบัญชีของ ${targetUser.displayName || targetUser.email} เรียบร้อยแล้ว`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('ไม่สามารถเปลี่ยนสถานะบัญชีได้');
    } finally {
      setSavingUid(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    if (deletingUser.uid === appUser?.uid) {
      toast.error('คุณไม่สามารถลบบัญชีของตัวเองได้');
      return;
    }

    try {
      setSavingUid(deletingUser.uid);
      await deleteDoc(doc(db, 'users', deletingUser.uid));
      
      // Audit Log
      await logAuditEvent({
        action: 'USER_DELETE',
        category: 'user',
        targetId: deletingUser.uid,
        targetName: `@${deletingUser.username || deletingUser.displayName} (${deletingUser.email})`,
        details: `ลบบัญชีผู้ใช้งาน ${deletingUser.displayName || deletingUser.email} ออกจากระบบ`,
        previousData: deletingUser,
        user: appUser ? { uid: appUser.uid, displayName: appUser.displayName, email: appUser.email, role: appUser.role } : null,
      });

      setUsers(users.filter(u => u.uid !== deletingUser.uid));
      toast.success(`ลบผู้ใช้งาน ${deletingUser.displayName || deletingUser.email} ออกจากระบบเรียบร้อย`);
      setDeletingUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('ไม่สามารถลบผู้ใช้งานได้');
    } finally {
      setSavingUid(null);
    }
  };

  const handleSendResetEmail = async (targetUser: AppUser) => {
    if (!targetUser.email) {
      toast.error('ผู้ใช้รายนี้ไม่มีอีเมลสำหรับส่งลิงก์รีเซ็ต');
      return;
    }

    try {
      setIsResetting(true);
      await sendUserPasswordResetEmail(targetUser.email);
      toast.success(`ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง ${targetUser.email} เรียบร้อยแล้ว`);
      setResetPasswordUser(null);
    } catch (error: any) {
      console.error('Reset email error:', error);
      toast.error('ไม่สามารถส่งลิงก์รีเซ็ตได้: ' + (error.message || 'โปรดตรวจสอบอีเมล'));
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdateUserPasswordDirectly = async () => {
    if (!resetPasswordUser || !resetNewPass) return;
    try {
      setIsResetting(true);
      // Update passwordHint in Firestore so admin has record
      await updateDoc(doc(db, 'users', resetPasswordUser.uid), {
        passwordHint: resetNewPass
      });
      setUsers(users.map(u => u.uid === resetPasswordUser.uid ? { ...u, passwordHint: resetNewPass } : u));
      toast.success('บันทึกรหัสผ่านใหม่เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Direct password update error:', error);
      toast.error('ไม่สามารถบันทึกรหัสผ่านได้');
    } finally {
      setIsResetting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก ${label} แล้ว`);
  };

  const filteredUsers = users.filter(u => 
    (u.displayName?.toLowerCase().includes(search.toLowerCase()) || 
     u.email?.toLowerCase().includes(search.toLowerCase()) ||
     u.username?.toLowerCase().includes(search.toLowerCase()))
  );

  const activeCount = users.filter(u => u.status !== 'suspended').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <RefreshCw size={28} className="animate-spin text-amber-500" />
        <span className="text-xs font-bold text-slate-400">กำลังโหลดข้อมูลผู้ใช้งานและสิทธิ์ระบบ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 rounded-3xl border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-2xl bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20">
              <Key size={20} />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ระบบจัดการผู้ใช้และกำหนดสิทธิ์ (Admin Console)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
            รองรับการสร้างบัญชี Username/Password, ปิด/เปิดสิทธิ์, แก้ไขบทบาท และรีเซ็ตรหัสผ่านพนักงาน
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus size={16} />
            <span>สร้างผู้ใช้งานใหม่</span>
          </button>

          <button
            onClick={fetchUsers}
            className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Admin Privilege Status & Elevation Banner */}
      {appUser?.role !== 'admin' && appUser?.email?.toLowerCase() !== 'b.b.thodsawat@gmail.com' && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="font-extrabold text-amber-900 dark:text-amber-200">
                สถานะสิทธิ์ปัจจุบันของคุณ: <span className="underline uppercase">{appUser?.role || 'Staff'}</span>
              </p>
              <p className="text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                หากคุณเป็นเจ้าของร้านหรือผู้ดูแลระบบ สามารถกดปุ่มเพื่อยกระดับบัญชีนี้เป็น Admin เพื่อปลดล็อกการสร้าง User และจัดการสิทธิ์พนักงานได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={handlePromoteSelfToAdmin}
            disabled={isPromotingSelf}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-md transition-all shrink-0 cursor-pointer flex items-center space-x-1.5"
          >
            <Sparkles size={15} />
            <span>{isPromotingSelf ? 'กำลังยกระดับสิทธิ์...' : '🔑 ยกระดับบัญชีนี้เป็น Admin'}</span>
          </button>
        </div>
      )}

      {/* Quick Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <span className="text-slate-500 font-semibold">ผู้ใช้ทั้งหมด</span>
          <span className="font-black text-slate-900 dark:text-white text-base">{users.length} คน</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <span className="text-slate-500 font-semibold">ใช้งานปกติ</span>
          <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">{activeCount} คน</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <span className="text-slate-500 font-semibold">ถูกระงับสิทธิ์</span>
          <span className="font-black text-rose-600 dark:text-rose-400 text-base">{suspendedCount} คน</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <span className="text-slate-500 font-semibold">Admin / เจ้าของ</span>
          <span className="font-black text-amber-600 dark:text-amber-400 text-base">{adminCount} คน</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="ค้นหาชื่อผู้ใช้ (Username), Display Name หรืออีเมล..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all shadow-2xs"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map(u => {
          const isSelf = u.uid === appUser?.uid;
          const isExpanded = expandedUserUid === u.uid;
          const userPerms = getUserPermissions(u);
          const isSuspended = u.status === 'suspended';

          return (
            <div
              key={u.uid}
              className={`bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs border transition-all ${
                isSuspended 
                  ? 'border-rose-200 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/10' 
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 overflow-hidden border border-amber-200 dark:border-amber-800/60 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={24} />
                      )}
                    </div>
                    {isSuspended && (
                      <div className="absolute -top-1 -right-1 bg-rose-500 text-white p-0.5 rounded-full border-2 border-white dark:border-slate-900" title="บัญชีถูกระงับ">
                        <UserX size={12} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">{u.displayName || 'ผู้ใช้งานระบบ'}</p>
                      {u.username && (
                        <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          @{u.username}
                        </span>
                      )}
                      {isSelf && (
                        <span className="text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-md">
                          คุณ (ปัจจุบัน)
                        </span>
                      )}
                      {isSuspended && (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-md border border-rose-300">
                          ระงับสิทธิ์
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{u.email}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-medium pt-0.5">
                      <span>เข้าร่วม: {u.createdAt ? format(parseISO(u.createdAt), 'd MMM yyyy', { locale: th }) : '-'}</span>
                      {u.lastLoginAt && (
                        <span>• ล็อกอินล่าสุด: {format(parseISO(u.lastLoginAt), 'HH:mm น.')}</span>
                      )}
                      {u.authProvider && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                          {u.authProvider === 'password' ? '🔑 Password' : '🌐 Google OAuth'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role Selector & Action Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Role Dropdown */}
                  <div className="relative">
                    <select
                      value={u.role || 'staff'}
                      disabled={isSelf || savingUid === u.uid}
                      onChange={(e) => handleRolePresetChange(u, e.target.value as UserRole)}
                      className={`text-xs font-bold rounded-2xl px-3.5 py-2.5 border outline-none cursor-pointer pr-8 bg-no-repeat bg-right transition-colors ${
                        u.role === 'admin'
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300'
                          : u.role === 'manager'
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-800 dark:text-blue-300'
                          : u.role === 'viewer'
                          ? 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                      } ${isSelf ? 'opacity-60 cursor-not-allowed' : ''}`}
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")' }}
                    >
                      <option value="admin">Role: Admin (สิทธิ์สูงสุด)</option>
                      <option value="manager">Role: Manager (ผู้จัดการ)</option>
                      <option value="staff">Role: Staff (พนักงานหน้าร้าน)</option>
                      <option value="viewer">Role: Viewer (อ่านอย่างเดียว)</option>
                    </select>
                  </div>

                  {/* Edit User Button */}
                  <button
                    onClick={() => handleOpenEditModal(u)}
                    className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    title="แก้ไขข้อมูลผู้ใช้งาน"
                  >
                    <Edit3 size={15} />
                  </button>

                  {/* Reset Password Button */}
                  <button
                    onClick={() => {
                      setResetPasswordUser(u);
                      setResetNewPass(generateRandomPassword());
                    }}
                    className="p-2.5 rounded-2xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer"
                    title="รีเซ็ตรหัสผ่าน"
                  >
                    <KeyRound size={15} />
                  </button>

                  {/* Fine-Grained Permissions Toggle */}
                  <button
                    onClick={() => setExpandedUserUid(isExpanded ? null : u.uid)}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Settings2 size={14} className="text-amber-500" />
                    <span>สิทธิ์ย่อย</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {/* Suspend / Activate User Button */}
                  {!isSelf && (
                    <button
                      onClick={() => handleStatusToggle(u)}
                      disabled={savingUid === u.uid}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
                        isSuspended
                          ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 border-emerald-300'
                          : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 border-rose-300'
                      }`}
                      title={isSuspended ? 'ปลดระงับผู้ใช้งาน' : 'ระงับสิทธิ์การใช้งาน'}
                    >
                      {isSuspended ? <UserCheck size={16} /> : <UserX size={16} />}
                    </button>
                  )}

                  {/* Delete User Button */}
                  {!isSelf && (
                    <button
                      onClick={() => setDeletingUser(u)}
                      className="p-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer"
                      title="ลบผู้ใช้งาน"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Fine-Grained Permissions Toggle Panel */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center">
                        <Lock size={13} className="mr-1.5 text-amber-500" />
                        สิทธิ์การเข้าถึงเมนูต่างๆ (Fine-Grained Permissions)
                      </h4>
                      {isSelf && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center">
                          <AlertCircle size={12} className="mr-1" /> ไม่สามารถดัดแปลงสิทธิ์ของตัวเองขณะใช้งาน
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {(Object.keys(PERMISSION_LABELS) as Array<keyof UserPermissions>).map((permKey) => {
                        const isGranted = userPerms[permKey];
                        const permInfo = PERMISSION_LABELS[permKey];

                        return (
                          <div
                            key={permKey}
                            onClick={() => !isSelf && handlePermissionToggle(u, permKey)}
                            className={`p-3 rounded-2xl border transition-all flex items-start justify-between cursor-pointer ${
                              isGranted
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70'
                            } ${isSelf ? 'cursor-not-allowed' : 'hover:border-amber-400'}`}
                          >
                            <div className="space-y-0.5 pr-2">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {permInfo.label}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {permInfo.desc}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isSelf || savingUid === u.uid}
                              className={`p-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                                isGranted
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                              }`}
                            >
                              {isGranted ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <User size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-600 dark:text-slate-400">ไม่พบรายชื่อผู้ใช้งานที่ตรงกับการค้นหา</p>
          </div>
        )}
      </div>

      {/* MODAL 1: Create New User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-lg w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-amber-500 text-white font-bold">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">สร้างผู้ใช้งานใหม่ (Create Account)</h3>
                    <p className="text-[11px] text-slate-500">สร้างบัญชี Username / Password พร้อมกำหนดสิทธิ์การใช้งาน</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      ชื่อผู้ใช้งาน (Username) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น somchai_solar"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      ชื่อ-นามสกุล (Display Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น สมชาย สายยันต์"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    อีเมล (Email Address) <span className="text-slate-400 font-normal">(ไม่ระบุได้ ระบบจะสร้างอัตโนมัติ)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="เช่น somchai@gmail.com (หากไม่ใส่จะเป็น somchai@store.local)"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateRandomPassword())}
                      className="text-amber-600 dark:text-amber-400 font-bold text-[11px] hover:underline flex items-center cursor-pointer"
                    >
                      <Sparkles size={12} className="mr-1" /> 🎲 สุ่มรหัสผ่านปลอดภัย
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-3 pr-10 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">บทบาทหลัก (Role)</label>
                    <select
                      value={newRole}
                      onChange={(e) => {
                        const r = e.target.value as UserRole;
                        setNewRole(r);
                        setNewPermissions(DEFAULT_ROLE_PERMISSIONS[r]);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                      <option value="manager">Manager (ผู้จัดการ)</option>
                      <option value="staff">Staff (พนักงานหน้าร้าน)</option>
                      <option value="viewer">Viewer (ผู้ดูข้อมูล)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">สถานะเปิดใช้งาน</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as 'active' | 'suspended')}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="active">Active (เปิดใช้งานปกติ)</option>
                      <option value="suspended">Suspended (ระงับสิทธิ์ทันที)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCreate}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {isSubmittingCreate ? (
                      <span>กำลังสร้าง...</span>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>ยืนยันสร้างบัญชี</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Credentials Display Modal (After creation) */}
      <AnimatePresence>
        {createdCredentials && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-5 shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">สร้างบัญชีผู้ใช้งานสำเร็จแล้ว!</h3>
                <p className="text-xs text-slate-500">สามารถมอบข้อมูลเข้าสู่ระบบต่อไปนี้ให้แก่พนักงานเพื่อใช้งานระบบได้</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">ชื่อผู้ใช้ (Username):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{createdCredentials.username}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">อีเมลอ้างอิง (Email):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{createdCredentials.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">รหัสผ่าน (Password):</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{createdCredentials.pass}</span>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    const text = `ข้อมูลเข้าสู่ระบบร้านกลางนาโซล่าเซลล์:\nUsername: ${createdCredentials.username}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.pass}`;
                    copyToClipboard(text, 'ข้อมูลเข้าสู่ระบบ');
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Copy size={16} />
                  <span>คัดลอกข้อมูลเข้าสู่ระบบทั้งหมด</span>
                </button>

                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  ปิดหน้าต่างนี้
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-lg w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-slate-900 text-white font-bold">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">แก้ไขข้อมูลผู้ใช้งาน</h3>
                    <p className="text-[11px] text-slate-500">{editingUser.displayName || editingUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อผู้ใช้งาน (Username)</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">ชื่อ-นามสกุล (Display Name)</label>
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">อีเมล (Email Address)</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">บทบาทหลัก (Role)</label>
                    <select
                      value={editRole}
                      disabled={editingUser.uid === appUser?.uid}
                      onChange={(e) => {
                        const r = e.target.value as UserRole;
                        setEditRole(r);
                        setEditPermissions(DEFAULT_ROLE_PERMISSIONS[r]);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                      <option value="manager">Manager (ผู้จัดการ)</option>
                      <option value="staff">Staff (พนักงานหน้าร้าน)</option>
                      <option value="viewer">Viewer (ผู้ดูข้อมูล)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">สถานะเปิดใช้งาน</label>
                    <select
                      value={editStatus}
                      disabled={editingUser.uid === appUser?.uid}
                      onChange={(e) => setEditStatus(e.target.value as 'active' | 'suspended')}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="active">Active (เปิดใช้งานปกติ)</option>
                      <option value="suspended">Suspended (ระงับสิทธิ์)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Reset Password Modal */}
      <AnimatePresence>
        {resetPasswordUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-5 shadow-2xl"
            >
              <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/80 text-amber-600 rounded-2xl border border-amber-200">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">จัดการรหัสผ่านผู้ใช้งาน</h3>
                  <p className="text-xs text-slate-500">{resetPasswordUser.displayName || resetPasswordUser.email}</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Method 1: Direct new password generation */}
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">กำหนดยอดรหัสผ่านใหม่ (Set New Password):</span>
                    <button
                      type="button"
                      onClick={() => setResetNewPass(generateRandomPassword())}
                      className="text-amber-600 dark:text-amber-400 font-bold text-[11px] hover:underline flex items-center cursor-pointer"
                    >
                      <Sparkles size={12} className="mr-1" /> 🎲 สุ่มรหัส
                    </button>
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showResetPass ? 'text' : 'password'}
                      value={resetNewPass}
                      onChange={(e) => setResetNewPass(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-3 pr-10 py-2 text-xs font-mono font-bold outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPass(!showResetPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      {showResetPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={handleUpdateUserPasswordDirectly}
                      disabled={isResetting}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      บันทึกรหัสผ่านนี้
                    </button>
                    <button
                      onClick={() => copyToClipboard(resetNewPass, 'รหัสผ่านใหม่')}
                      className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                      title="คัดลอกรหัสผ่าน"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                {/* Method 2: Send password reset email link */}
                {resetPasswordUser.email && (
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-1.5">
                    <span className="font-bold text-amber-900 dark:text-amber-300 block">ส่งลิงก์รีเซ็ตเข้าอีเมล:</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">ส่งอีเมลสำหรับให้ผู้ใช้นี้ตั้งรหัสผ่านใหม่ด้วยตนเองไปยัง {resetPasswordUser.email}</p>
                    <button
                      onClick={() => handleSendResetEmail(resetPasswordUser)}
                      disabled={isResetting}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Mail size={14} />
                      <span>ส่งอีเมลรีเซ็ตรหัสผ่าน</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setResetPasswordUser(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ปิด
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-rose-200 dark:border-rose-950 max-w-sm w-full space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                <ShieldAlert size={28} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">ยืนยันการลบผู้ใช้งาน?</h3>
                <p className="text-xs text-slate-500">
                  คุณต้องการลบบัญชีผู้ใช้ <strong className="text-slate-900 dark:text-white">{deletingUser.displayName || deletingUser.email}</strong> ออกจากระบบหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  ยืนยันลบผู้ใช้
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
