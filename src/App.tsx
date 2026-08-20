import { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { signOut } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, PlusCircle, ListOrdered, Settings, Users, BarChart3, SunMedium, UserX, LogOut, Palette, UserCheck, Calendar, ShieldCheck } from 'lucide-react';
import { QuickDesignLauncherModal } from './components/design-system/QuickDesignLauncherModal';
import Login from './pages/Login';
import DuePaymentsNotification from './components/DuePaymentsNotification';
import CloudSyncIndicator from './components/CloudSyncIndicator';
import { useAppConfig } from './hooks/useAppConfig';
import { TransactionType, TransactionCategory } from './types';
import { getUserPermissions } from './utils/permissions';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { BottomNavigationBar } from './components/navigation/BottomNavigationBar';
import { ThemeApplier } from './components/ThemeApplier';
import BusinessDashboardV2 from './components/dashboard/BusinessDashboardV2';
import './components/dashboard/dashboard-v2.css';

const AddTransaction = lazy(() => import('./pages/AddTransaction'));
const History = lazy(() => import('./pages/History'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const AuditLogManager = lazy(() => import('./pages/AuditLogManager'));
const Reports = lazy(() => import('./pages/Reports'));
const CustomerCRM = lazy(() => import('./pages/CustomerCRM'));
const InstallationWarrantyManager = lazy(() => import('./pages/InstallationWarrantyManager'));
const CommandCenter = lazy(() => import('./pages/CommandCenter'));

const PageFallback = () => <div className="min-h-[45vh] flex items-center justify-center"><div className="flex items-center gap-3 rounded-2xl bg-white/80 border border-slate-200 px-4 py-3 shadow-sm"><SunMedium size={18} className="text-amber-500 animate-spin" style={{animationDuration:'1.6s'}}/><span className="text-xs font-bold text-slate-500">กำลังโหลดหน้านี้...</span></div></div>;
type Tab = 'dashboard' | 'pos' | 'history' | 'reports' | 'customers' | 'installations' | 'settings' | 'users' | 'audit_logs';

const POS_SESSION_KEYS = [
  'klangna_pos_cart',
  'klangna_pos_discountAmount',
  'klangna_pos_discountType',
  'klangna_pos_shippingFee',
  'klangna_pos_customer',
  'klangna_pos_shipping',
  'klangna_pos_payment',
];

function clearPosSession() {
  if (typeof window === 'undefined') return;
  POS_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

export default function App() {
 const {user,appUser,loading}=useAuth(); const {config,updateBottomNavConfig,resetBottomNavConfig}=useAppConfig(); const [activeTab,setActiveTab]=useState<Tab>('dashboard'); const [posSessionId,setPosSessionId]=useState(0); const [quickAddData,setQuickAddData]=useState<{type:TransactionType;category:TransactionCategory;detail?:string;amount?:number}|null>(null); const [isUnlocked,setIsUnlocked]=useState<boolean>(!localStorage.getItem('app_pin')); const [isQuickDesignOpen,setIsQuickDesignOpen]=useState(false); const userPerms=getUserPermissions(appUser); const isAdminOrOwner=appUser?.role==='admin'||appUser?.email?.toLowerCase()==='b.b.thodsawat@gmail.com';
 useKeyboardShortcuts(setActiveTab,setQuickAddData,userPerms);
 const openPos=()=>{clearPosSession();setQuickAddData(null);setPosSessionId(id=>id+1);setActiveTab('pos');};
 const handleQuickAdd=(type:TransactionType,category:TransactionCategory,detail?:string,amount?:number)=>{if(!userPerms.canAddTransactions)return;clearPosSession();setQuickAddData({type,category,detail,amount});setPosSessionId(id=>id+1);setActiveTab('pos')};
 useEffect(()=>{if(activeTab==='pos'){clearPosSession();}},[activeTab,posSessionId]);
 if(loading)return <div className="min-h-screen flex items-center justify-center bg-slate-50"><motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center gap-4"><SunMedium size={28} className="text-amber-500 animate-spin" style={{animationDuration:'2s'}}/><span className="text-xs font-bold text-slate-500">Solar order manager • ตรวจสอบสิทธิ์การใช้งาน...</span></motion.div></div>;
 if(!user)return <Login/>;
 if(!isUnlocked&&localStorage.getItem('app_pin'))return <div className="min-h-screen flex items-center justify-center"><button onClick={()=>setIsUnlocked(true)} className="rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-bold">ปลดล็อก</button></div>;
 if(appUser?.status==='suspended')return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4"><div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-6 border border-rose-200"><UserX size={40} className="mx-auto text-rose-500"/><h2 className="text-xl font-black">บัญชีผู้ใช้ถูกระงับสิทธิ์</h2><p className="text-xs text-slate-500">กรุณาติดต่อผู้ดูแลระบบ</p><button onClick={signOut} className="w-full py-3 bg-rose-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2"><LogOut size={16}/>ออกจากระบบ</button></div></div>;
 const navItems:{id:Tab;label:string;icon:any}[]=[]; if(userPerms.canViewDashboard)navItems.push({id:'dashboard',label:'ภาพรวมธุรกิจ',icon:LayoutDashboard}); if(userPerms.canAddTransactions)navItems.push({id:'pos',label:'ขาย / เพิ่มรายการ',icon:PlusCircle}); navItems.push({id:'history',label:'รายการ',icon:ListOrdered}); if(userPerms.canViewReports)navItems.push({id:'reports',label:'รายงาน',icon:BarChart3}); navItems.push({id:'customers',label:'ลูกค้า',icon:UserCheck}); navItems.push({id:'installations',label:'งานติดตั้ง',icon:Calendar}); navItems.push({id:'users',label:'ผู้ใช้',icon:Users}); if(userPerms.canViewAuditLogs||isAdminOrOwner)navItems.push({id:'audit_logs',label:'Audit Log',icon:ShieldCheck}); navItems.push({id:'settings',label:'ศูนย์ควบคุม',icon:Settings});
 return <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors flex flex-col font-sans"><Toaster position="top-center"/><ThemeApplier/><header className="sticky top-0 z-30 bg-white/90 backdrop-blur-2xl border-b border-slate-200/70"><div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-[60px] sm:h-16 flex items-center justify-between gap-2"><div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={()=>setActiveTab('dashboard')}>{(config.shopInfo?.showLogo??true)&&<img src={config.shopInfo?.logoUrl||'/logo.jpg'} alt="Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl border border-brand bg-white p-0.5" referrerPolicy="no-referrer"/>}<div className="min-w-0"><h1 className="text-sm sm:text-lg font-black tracking-tight truncate">Solar order manager</h1><p className="text-[9px] text-slate-400 font-semibold hidden sm:block truncate">{config.shopInfo?.systemName||'Solar order manager'}</p></div></div><div className="flex items-center gap-1"><DuePaymentsNotification/><CloudSyncIndicator/><button onClick={()=>setIsQuickDesignOpen(true)} aria-label="ธีม" className="hidden sm:flex p-2 rounded-xl border bg-brand-soft text-brand border-brand-soft"><Palette size={16}/></button>{isAdminOrOwner&&<button onClick={()=>setActiveTab('users')} aria-label="ผู้ใช้" className="hidden sm:flex p-2 rounded-xl border bg-brand-soft text-brand border-brand-soft"><Users size={16}/></button>}<button onClick={()=>setActiveTab('settings')} aria-label="ศูนย์ควบคุม" className={`p-2 rounded-xl border ${activeTab==='settings'?'bg-slate-900 text-white border-slate-900':'bg-slate-100 border-slate-200'}`}><Settings size={17}/></button></div></div><div className="lg:hidden border-t border-slate-100/80 bg-white/70"><nav aria-label="เมนูส่วนบนบนมือถือ" className="max-w-7xl mx-auto px-2 py-1.5 overflow-x-auto no-scrollbar flex gap-1.5 snap-x">{navItems.map(item=>{const Icon=item.icon;const active=activeTab===item.id;return <button key={item.id} onClick={()=>{if(item.id==='pos')openPos();else setActiveTab(item.id)}} className={`snap-start shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 ${active?'bg-slate-900 text-white shadow-sm':'text-slate-500 hover:bg-slate-100'}`}><Icon size={14}/>{item.label}</button>})}</nav></div><nav className="hidden lg:flex max-w-7xl mx-auto px-4 pb-2 items-center gap-1 overflow-x-auto no-scrollbar">{navItems.map(item=>{const Icon=item.icon;const active=activeTab===item.id;return <button key={item.id} onClick={()=>{if(item.id==='pos')openPos();else setActiveTab(item.id)}} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${active?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-100'}`}><Icon size={15}/>{item.label}</button>})}</nav></header><main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-28 lg:pb-8"><Suspense fallback={<PageFallback/>}><AnimatePresence mode="wait"><motion.div key={`${activeTab}-${activeTab==='pos'?posSessionId:0}`} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:.14}}>{activeTab==='dashboard'&&userPerms.canViewDashboard&&<BusinessDashboardV2 onQuickAdd={handleQuickAdd} onNavigate={setActiveTab}/>} {activeTab==='pos'&&userPerms.canAddTransactions&&<AddTransaction key={`pos-${posSessionId}`} onSuccess={()=>{setActiveTab('history');setQuickAddData(null)}} initialType={quickAddData?.type} initialCategory={quickAddData?.category} initialDetail={quickAddData?.detail} initialAmount={quickAddData?.amount}/>} {activeTab==='history'&&<History/>}{activeTab==='reports'&&userPerms.canViewReports&&<Reports/>}{activeTab==='customers'&&<CustomerCRM/>}{activeTab==='installations'&&<InstallationWarrantyManager/>}{activeTab==='users'&&<UserManagement/>}{activeTab==='audit_logs'&&(userPerms.canViewAuditLogs||isAdminOrOwner)&&<AuditLogManager/>}{activeTab==='settings'&&<CommandCenter onNavigateToUsers={()=>setActiveTab('users')} onNavigateToAudit={()=>setActiveTab('audit_logs')} onLockApp={()=>setIsUnlocked(false)}/>}</motion.div></AnimatePresence></Suspense></main><BottomNavigationBar activeTab={activeTab} onNavigate={tab=>{if(tab==='pos')openPos();else setActiveTab(tab)}} config={config.bottomNav} onUpdateConfig={updateBottomNavConfig} onResetDefaults={resetBottomNavConfig} onQuickAdd={handleQuickAdd} onOpenQuickDesign={()=>setIsQuickDesignOpen(true)} onLockApp={()=>setIsUnlocked(false)}/><QuickDesignLauncherModal isOpen={isQuickDesignOpen} onClose={()=>setIsQuickDesignOpen(false)} onOpenFullSettings={()=>setActiveTab('settings')}/></div>;
}
