import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db, createNewUserWithPassword, sendUserPasswordResetEmail } from '../lib/firebase';
import { AppUser, UserPermissions, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { DEFAULT_ROLE_PERMISSIONS, getUserPermissions, PERMISSION_LABELS } from '../utils/permissions';
import { logAuditEvent } from '../lib/auditLogger';
import { toast } from 'react-hot-toast';
import { Check, Copy, Eye, EyeOff, KeyRound, Plus, RefreshCw, Search, ShieldCheck, UserCog, UserPlus, UserX, X } from 'lucide-react';

const OWNER_EMAIL = 'b.b.thodsawat@gmail.com';
const ROLE_META: Record<UserRole, { label: string; desc: string }> = {
  admin: { label: 'Admin', desc: 'ควบคุมระบบ ผู้ใช้ ความปลอดภัย และข้อมูลทั้งหมด' },
  manager: { label: 'Manager', desc: 'ดูแลการขาย ลูกค้า สต็อก และรายงาน' },
  staff: { label: 'Staff', desc: 'ทำงานประจำวันและจัดการรายการที่ได้รับมอบหมาย' },
  viewer: { label: 'Viewer', desc: 'ดูข้อมูลและรายงานแบบอ่านอย่างเดียว' },
};

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let value = 'Solar#';
  for (let i = 0; i < 10; i++) value += chars[Math.floor(Math.random() * chars.length)];
  return value;
}

export default function UserManagement() {
  const { appUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [created, setCreated] = useState<{ username: string; email: string; password: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState(generatePassword());
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [showPassword, setShowPassword] = useState(true);
  const [permissionsUser, setPermissionsUser] = useState<AppUser | null>(null);

  const isAdmin = appUser?.role === 'admin' || appUser?.email?.toLowerCase() === OWNER_EMAIL;

  const loadUsers = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const data = snap.docs.map((item) => {
        const value = item.data() as AppUser;
        return { ...value, uid: item.id, status: value.status || 'active', role: value.role || 'staff' };
      });
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error('ไม่สามารถโหลดผู้ใช้งานได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadUsers(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.username || ''} ${u.displayName || ''} ${u.email || ''} ${u.role}`.toLowerCase().includes(q));
  }, [users, search]);

  const resetCreate = () => {
    setNewUsername(''); setNewDisplayName(''); setNewEmail(''); setNewPassword(generatePassword()); setNewRole('staff'); setShowPassword(true);
  };

  const createUser = async () => {
    if (!isAdmin || !db) return;
    const username = newUsername.trim().toLowerCase();
    const displayName = newDisplayName.trim();
    const email = newEmail.trim().toLowerCase() || `${username}@store.local`;
    if (!username || !displayName) return toast.error('กรุณาระบุ Username และชื่อผู้ใช้งาน');
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) return toast.error('Username ต้องเป็น a-z, 0-9, จุด, ขีดกลาง หรือขีดล่าง 3–32 ตัว');
    if (newPassword.length < 8) return toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    if (users.some((u) => u.username?.toLowerCase() === username)) return toast.error('Username นี้ถูกใช้แล้ว');
    try {
      setBusy('create');
      const uid = await createNewUserWithPassword(email, newPassword);
      const profile: AppUser = {
        uid, username, displayName, email, photoURL: null, role: newRole,
        permissions: DEFAULT_ROLE_PERMISSIONS[newRole], status: 'active', authProvider: 'password', createdAt: new Date().toISOString(),
      };
      // Never persist a password or password hint in Firestore.
      await setDoc(doc(db, 'users', uid), profile);
      await logAuditEvent({ action: 'USER_CREATE', category: 'user', targetId: uid, targetName: `${username} (${displayName})`, details: `สร้างบัญชี ${newRole.toUpperCase()} ผ่าน Username/Password`, newData: { ...profile, password: undefined }, user: appUser });
      setUsers((prev) => [...prev, profile]);
      setCreated({ username, email, password: newPassword });
      setShowCreate(false);
      resetCreate();
      toast.success('สร้างผู้ใช้งานสำเร็จ');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.code === 'auth/email-already-in-use' ? 'อีเมลนี้ถูกใช้แล้ว' : `สร้างผู้ใช้ไม่สำเร็จ: ${error?.message || 'เกิดข้อผิดพลาด'}`);
    } finally { setBusy(null); }
  };

  const setRole = async (target: AppUser, role: UserRole) => {
    if (!isAdmin || !db || target.uid === appUser?.uid) return;
    try {
      setBusy(target.uid);
      const permissions = DEFAULT_ROLE_PERMISSIONS[role];
      await updateDoc(doc(db, 'users', target.uid), { role, permissions, updatedAt: new Date().toISOString() });
      setUsers((prev) => prev.map((u) => u.uid === target.uid ? { ...u, role, permissions } : u));
      await logAuditEvent({ action: 'USER_ROLE_UPDATE', category: 'user', targetId: target.uid, targetName: target.displayName || target.email || target.uid, details: `เปลี่ยนบทบาทเป็น ${role.toUpperCase()}`, previousData: { role: target.role }, newData: { role, permissions }, user: appUser });
      toast.success(`เปลี่ยนบทบาทเป็น ${role.toUpperCase()} แล้ว`);
    } catch (error) { console.error(error); toast.error('เปลี่ยนบทบาทไม่สำเร็จ'); } finally { setBusy(null); }
  };

  const toggleStatus = async (target: AppUser) => {
    if (!isAdmin || !db || target.uid === appUser?.uid) return;
    const status: 'active' | 'suspended' = target.status === 'suspended' ? 'active' : 'suspended';
    try {
      setBusy(target.uid);
      await updateDoc(doc(db, 'users', target.uid), { status, updatedAt: new Date().toISOString() });
      setUsers((prev) => prev.map((u) => u.uid === target.uid ? { ...u, status } : u));
      await logAuditEvent({ action: 'USER_STATUS_TOGGLE', category: 'user', targetId: target.uid, targetName: target.displayName || target.email || target.uid, details: status === 'suspended' ? 'ระงับบัญชี' : 'เปิดใช้งานบัญชี', previousData: { status: target.status }, newData: { status }, user: appUser });
      toast.success(status === 'suspended' ? 'ระงับบัญชีแล้ว' : 'เปิดใช้งานบัญชีแล้ว');
    } catch (error) { console.error(error); toast.error('เปลี่ยนสถานะไม่สำเร็จ'); } finally { setBusy(null); }
  };

  const updatePermission = async (target: AppUser, key: keyof UserPermissions) => {
    if (!isAdmin || !db || target.uid === appUser?.uid) return;
    const current = getUserPermissions(target);
    const permissions = { ...current, [key]: !current[key] };
    try {
      setBusy(target.uid);
      await updateDoc(doc(db, 'users', target.uid), { permissions, updatedAt: new Date().toISOString() });
      setUsers((prev) => prev.map((u) => u.uid === target.uid ? { ...u, permissions } : u));
      setPermissionsUser((u) => u ? { ...u, permissions } : u);
      await logAuditEvent({ action: 'USER_PERM_UPDATE', category: 'user', targetId: target.uid, targetName: target.displayName || target.email || target.uid, details: `แก้สิทธิ์ ${PERMISSION_LABELS[key].label}`, previousData: current, newData: permissions, user: appUser });
    } catch (error) { console.error(error); toast.error('บันทึกสิทธิ์ไม่สำเร็จ'); } finally { setBusy(null); }
  };

  const resetPassword = async (target: AppUser) => {
    if (!isAdmin || !target.email) return toast.error('บัญชีนี้ไม่มีอีเมลสำหรับรีเซ็ตรหัสผ่าน');
    try { setBusy(target.uid); const { error } = await sendUserPasswordResetEmail(target.email); if (error) throw error; toast.success('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว'); } catch (error: any) { toast.error(`ส่งลิงก์ไม่สำเร็จ: ${error?.message || 'เกิดข้อผิดพลาด'}`); } finally { setBusy(null); }
  };

  const deleteProfile = async (target: AppUser) => {
    if (!isAdmin || !db || target.uid === appUser?.uid) return;
    if (!window.confirm(`ลบโปรไฟล์ ${target.displayName || target.username || target.email} ออกจาก SOM? บัญชี Firebase Auth จะไม่ถูกลบด้วยปุ่มนี้`)) return;
    try { setBusy(target.uid); await deleteDoc(doc(db, 'users', target.uid)); setUsers((prev) => prev.filter((u) => u.uid !== target.uid)); await logAuditEvent({ action: 'USER_DELETE', category: 'user', targetId: target.uid, targetName: target.displayName || target.email || target.uid, details: 'ลบโปรไฟล์ผู้ใช้จาก SOM', previousData: target, user: appUser }); toast.success('ลบโปรไฟล์แล้ว'); } catch (error) { console.error(error); toast.error('ลบโปรไฟล์ไม่สำเร็จ'); } finally { setBusy(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-sm font-bold text-slate-400"><RefreshCw className="mr-2 animate-spin" size={20}/>กำลังโหลดผู้ใช้งาน...</div>;

  return <div className="space-y-5 max-w-6xl mx-auto">
    <section className="rounded-[28px] overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="p-5 sm:p-7 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white relative overflow-hidden"><div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl"/><div className="relative"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[10px] font-black"><ShieldCheck size={14}/> GLOBAL ACCESS CONTROL</div><h2 className="mt-3 text-2xl sm:text-3xl font-black">ผู้ใช้งานและสิทธิ์ระบบ</h2><p className="mt-1 text-xs sm:text-sm text-white/75">สร้างบัญชี กำหนดบทบาท เปิด/ปิดการใช้งาน และกำหนดสิทธิ์ย่อยจากจุดเดียว</p></div></div>
      <div className="p-4 sm:p-6"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Stat label="ทั้งหมด" value={users.length}/><Stat label="ใช้งาน" value={users.filter(u=>u.status!=='suspended').length}/><Stat label="ระงับ" value={users.filter(u=>u.status==='suspended').length}/><Stat label="Admin" value={users.filter(u=>u.role==='admin').length}/></div><div className="mt-4 flex flex-col sm:flex-row gap-2"><div className="relative flex-1"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหา Username, ชื่อ หรืออีเมล..." className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-xs font-bold outline-none"/></div><button disabled={!isAdmin} onClick={()=>{resetCreate();setShowCreate(true)}} className="rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 text-xs font-black flex items-center justify-center gap-2 disabled:opacity-40"><UserPlus size={16}/> สร้างผู้ใช้</button><button onClick={()=>void loadUsers()} className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3"><RefreshCw size={16}/></button></div></div>
    </section>

    {!isAdmin&&<div className="rounded-2xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-4 text-xs text-amber-700 dark:text-amber-300">บัญชีปัจจุบันไม่มีสิทธิ์จัดการผู้ใช้งาน • เฉพาะ Admin เท่านั้น</div>}

    <section className="space-y-3">{filtered.map((u)=><article key={u.uid} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm"><div className="flex flex-col lg:flex-row lg:items-center gap-4"><div className="flex items-center gap-3 min-w-0 flex-1"><div className="h-11 w-11 rounded-2xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 flex items-center justify-center font-black">{(u.displayName||u.username||'U').slice(0,1).toUpperCase()}</div><div className="min-w-0"><p className="text-sm font-black truncate">{u.displayName || u.username || 'ผู้ใช้'}</p><p className="text-[11px] text-slate-400 truncate">@{u.username || '—'} • {u.email || 'ไม่มีอีเมล'}</p><span className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-[9px] font-black ${u.status==='suspended'?'bg-rose-100 text-rose-600':'bg-emerald-100 text-emerald-600'}`}>{u.status==='suspended'?'SUSPENDED':'ACTIVE'}</span></div></div><div className="flex flex-wrap items-center gap-2"><select disabled={!isAdmin||u.uid===appUser?.uid||busy===u.uid} value={u.role} onChange={e=>void setRole(u,e.target.value as UserRole)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-black">{(Object.keys(ROLE_META) as UserRole[]).map(r=><option key={r} value={r}>{ROLE_META[r].label}</option>)}</select><button disabled={!isAdmin||u.uid===appUser?.uid||busy===u.uid} onClick={()=>void toggleStatus(u)} className="rounded-xl border px-3 py-2 text-xs font-black disabled:opacity-40">{u.status==='suspended'?'เปิดใช้งาน':'ระงับ'}</button><button disabled={!isAdmin||busy===u.uid} onClick={()=>void resetPassword(u)} className="rounded-xl border px-3 py-2 text-xs font-black disabled:opacity-40"><KeyRound size={14} className="inline mr-1"/>รีเซ็ตรหัสผ่าน</button><button disabled={!isAdmin||u.uid===appUser?.uid} onClick={()=>setPermissionsUser(u)} className="rounded-xl bg-indigo-600 text-white px-3 py-2 text-xs font-black disabled:opacity-40">สิทธิ์</button><button disabled={!isAdmin||u.uid===appUser?.uid||busy===u.uid} onClick={()=>void deleteProfile(u)} className="rounded-xl border border-rose-200 text-rose-600 px-3 py-2 disabled:opacity-40"><UserX size={14}/></button></div></div></article>)}</section>

    {showCreate&&<Modal title="สร้างผู้ใช้งานใหม่" onClose={()=>setShowCreate(false)}><div className="space-y-4"><Field label="Username"><input value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="เช่น sales01" className="input"/></Field><Field label="ชื่อผู้ใช้งาน"><input value={newDisplayName} onChange={e=>setNewDisplayName(e.target.value)} placeholder="ชื่อพนักงาน" className="input"/></Field><Field label="อีเมล (แนะนำสำหรับ Reset Password)"><input value={newEmail} onChange={e=>setNewEmail(e.target.value)} type="email" placeholder="name@example.com" className="input"/></Field><Field label="รหัสผ่านเริ่มต้น"><div className="relative"><input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type={showPassword?'text':'password'} className="input pr-12"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div><button type="button" onClick={()=>setNewPassword(generatePassword())} className="mt-2 text-[11px] font-black text-blue-600">สุ่มรหัสใหม่</button></Field><Field label="บทบาท"><div className="grid grid-cols-2 gap-2">{(Object.keys(ROLE_META) as UserRole[]).map(r=><button type="button" key={r} onClick={()=>setNewRole(r)} className={`rounded-xl border p-3 text-left ${newRole===r?'border-blue-500 bg-blue-50 dark:bg-blue-950/30':'border-slate-200 dark:border-slate-800'}`}><p className="text-xs font-black">{ROLE_META[r].label}</p><p className="text-[9px] text-slate-400 mt-1">{ROLE_META[r].desc}</p></button>)}</div></Field><div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 text-[10px] text-slate-500">บัญชีที่สร้างจะใช้ Firebase Authentication และรหัสผ่านจะไม่ถูกเก็บไว้ใน Firestore</div><button disabled={busy==='create'} onClick={()=>void createUser()} className="w-full rounded-2xl bg-blue-600 text-white py-3.5 text-sm font-black disabled:opacity-60">{busy==='create'?'กำลังสร้าง...':'สร้างบัญชี'}</button></div></Modal>}

    {created&&<Modal title="บัญชีถูกสร้างแล้ว" onClose={()=>setCreated(null)}><div className="space-y-3"><div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs"><p className="font-black text-emerald-700">บันทึกข้อมูลนี้ให้ผู้ใช้งาน</p><p className="mt-2">Username: <b>{created.username}</b></p><p>Email: <b>{created.email}</b></p><p>Password: <b>{created.password}</b></p></div><button onClick={()=>{navigator.clipboard.writeText(`Username: ${created.username}\nEmail: ${created.email}\nPassword: ${created.password}`);toast.success('คัดลอกข้อมูลแล้ว')}} className="w-full rounded-2xl border py-3 text-xs font-black"><Copy size={14} className="inline mr-1"/>คัดลอกข้อมูลบัญชี</button><p className="text-[10px] text-slate-400">รหัสผ่านจะแสดงครั้งนี้เท่านั้น ระบบไม่เก็บรหัสผ่านไว้ใน Firestore</p></div></Modal>}

    {permissionsUser&&<Modal title={`สิทธิ์ • ${permissionsUser.displayName || permissionsUser.username}`} onClose={()=>setPermissionsUser(null)}><div className="space-y-2">{(Object.keys(PERMISSION_LABELS) as Array<keyof UserPermissions>).map(key=>{const enabled=getUserPermissions(permissionsUser)[key];return <button key={key} disabled={!isAdmin||permissionsUser.uid===appUser?.uid||busy===permissionsUser.uid} onClick={()=>void updatePermission(permissionsUser,key)} className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-3 text-left flex items-center gap-3 disabled:opacity-50"><span className={`h-6 w-10 rounded-full p-1 ${enabled?'bg-emerald-500':'bg-slate-300 dark:bg-slate-700'}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${enabled?'translate-x-4':''}`}/></span><span className="min-w-0 flex-1"><span className="block text-xs font-black">{PERMISSION_LABELS[key].label}</span><span className="block text-[10px] text-slate-400 mt-0.5">{PERMISSION_LABELS[key].desc}</span></span>{enabled&&<Check size={16} className="text-emerald-500"/>}</button>})}</div></Modal>}
  </div>;
}

function Stat({label,value}:{label:string;value:number}){return <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-3"><p className="text-[9px] font-black text-slate-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>}
function Field({label,children}:{label:string;children:any}){return <label className="block text-xs font-black">{label}{children}</label>}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:any}){return <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/40 backdrop-blur-sm p-0 sm:p-4"><div className="w-full sm:max-w-lg max-h-[92svh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur"><h3 className="text-base font-black">{title}</h3><button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18}/></button></div><div className="p-4 sm:p-6">{children}</div></div></div>}
