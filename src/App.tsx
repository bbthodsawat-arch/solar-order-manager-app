/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import { useTheme } from './hooks/useTheme';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { signOut } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, PlusCircle, ListOrdered, Settings, Moon, Sun, 
  Shield, Users, BarChart3, SunMedium, UserX, LogOut, Palette, UserCheck, Calendar, ShieldCheck
} from 'lucide-react';
import { QuickDesignLauncherModal } from './components/design-system/QuickDesignLauncherModal';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import History from './pages/History';
import UserManagement from './pages/UserManagement';
import AuditLogManager from './pages/AuditLogManager';
import Reports from './pages/Reports';
import CustomerCRM from './pages/CustomerCRM';
import InstallationWarrantyManager from './pages/InstallationWarrantyManager';
import DuePaymentsNotification from './components/DuePaymentsNotification';
import CloudSyncIndicator from './components/CloudSyncIndicator';
import { useAppConfig } from './hooks/useAppConfig';
import { TransactionType, TransactionCategory } from './types';
import { getUserPermissions } from './utils/permissions';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { BottomNavigationBar } from './components/navigation/BottomNavigationBar';
import { ThemeApplier } from './components/ThemeApplier';
import CommandCenter from './pages/CommandCenter';

type Tab = 'dashboard' | 'pos' | 'history' | 'reports' | 'customers' | 'installations' | 'settings' | 'users' | 'audit_logs';

export default function App() {
  const { user, appUser, loading } = useAuth();
  const { config, updateBottomNavConfig, resetBottomNavConfig } = useAppConfig();
  const { theme, toggleTheme } = useTheme();
  const isOnline = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [quickAddData, setQuickAddData] = useState<{ type: TransactionType; category: TransactionCategory; detail?: string; amount?: number } | null>(null);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(!localStorage.getItem('app_pin'));
  const [isQuickDesignOpen, setIsQuickDesignOpen] = useState(false);

  const userPerms = getUserPermissions(appUser);
  const isAdminOrOwner = appUser?.role === 'admin' || appUser?.email?.toLowerCase() === 'b.b.thodsawat@gmail.com';
  useKeyboardShortcuts(setActiveTab, setQuickAddData, userPerms);

  const handleQuickAdd = (type: TransactionType, category: TransactionCategory, detail?: string, amount?: number) => {
    if (!userPerms.canAddTransactions) return;
    setQuickAddData({ type, category, detail, amount });
    setActiveTab('pos');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center gap-4"><SunMedium size={28} className="text-amber-500 animate-spin" style={{animationDuration:'8s'}}/><span className="text-xs font-bold text-slate-500">ร้านกลางนาโซล่าเซลล์ • ตรวจสอบสิทธิ์การใช้งาน...</span></motion.div></div>;
  if (!user) return <Login />;
  if (!isUnlocked && localStorage.getItem('app_pin')) return <div className="min-h-screen flex items-center justify-center"><button onClick={()=>setIsUnlocked(true)} className="rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-bold">ปลดล็อก</button></div>;
  if (appUser?.status === 'suspended') return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4"><div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 text-center space-y-6 border border-rose-200"><UserX size={40} className="mx-auto text-rose-500"/><h2 className="text-xl font-black">บัญชีผู้ใช้ถูกระงับสิทธิ์</h2><p className="text-xs text-slate-500">กรุณาติดต่อผู้ดูแลระบบ</p><button onClick={signOut} className="w-full py-3 bg-rose-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2"><LogOut size={16}/>ออกจากระบบ</button></div></div>;

  const navItems: { id: Tab; label: string; icon: any }[] = [];
  if (userPerms.canViewDashboard) navItems.push({ id:'dashboard', label:'ภาพรวมธุรกิจ', icon:LayoutDashboard });
  if (userPerms.canAddTransactions) navItems.push({ id:'pos', label:'ระบบขาย POS', icon:PlusCircle });
  navItems.push({ id:'history', label:'ประวัติรายการ', icon:ListOrdered });
  if (userPerms.canViewReports) navItems.push({ id:'reports', label:'รายงานการเงิน', icon:BarChart3 });
  navItems.push({ id:'customers', label:'ลูกค้า CRM', icon:UserCheck });
  navItems.push({ id:'installations', label:'นัดหมาย & ใบรับประกัน', icon:Calendar });
  navItems.push({ id:'users', label:'จัดการผู้ใช้', icon:Users });
  if (userPerms.canViewAuditLogs || isAdminOrOwner) navItems.push({ id:'audit_logs', label:'Audit Log', icon:ShieldCheck });
  navItems.push({ id:'settings', label:'Command Center', icon:Settings });
  const bottomNavItems = navItems.filter(item => !['pos','users','customers','settings'].includes(item.id));

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
    <Toaster position="top-center"/><ThemeApplier/>
    <header className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={()=>setActiveTab(navItems[0]?.id || 'history')}>
          {(config.shopInfo?.showLogo ?? true) && <img src={config.shopInfo?.logoUrl || '/logo.jpg'} alt="Logo" className="w-10 h-10 object-contain rounded-full border border-brand bg-white p-0.5" referrerPolicy="no-referrer"/>}
          <div><h1 className="text-base sm:text-lg font-black tracking-tight">{config.shopInfo?.name || 'ร้านกลางนาโซล่าเซลล์'}</h1><p className="text-[10px] text-slate-400 font-semibold hidden sm:block">{config.shopInfo?.systemName || 'Solar Financial & Operations Management'}</p></div>
        </div>
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          {navItems.map(item=>{const Icon=item.icon; const active=activeTab===item.id; return <button key={item.id} onClick={()=>{if(item.id==='pos')setQuickAddData(null);setActiveTab(item.id)}} className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${active?'bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white':'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}><Icon size={15} className={active?'text-brand':''}/><span>{item.label}</span></button>})}
        </nav>
        <div className="flex items-center gap-1.5">
          <DuePaymentsNotification/><CloudSyncIndicator/>
          <button onClick={()=>setIsQuickDesignOpen(true)} className="p-2 rounded-xl border bg-brand-soft text-brand border-brand-soft" title="ธีมและดีไซน์"><Palette size={16}/></button>
          {isAdminOrOwner && <button onClick={()=>setActiveTab('users')} className="p-2 rounded-xl border bg-brand-soft text-brand border-brand-soft" title="จัดการผู้ใช้"><Users size={16}/></button>}
          <button onClick={()=>setActiveTab('settings')} className={`p-2 rounded-xl border ${activeTab==='settings'?'bg-slate-900 text-white border-slate-900':'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`} title="ศูนย์ควบคุม"><Settings size={17}/></button>
          <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">{theme==='dark'?<Sun size={17} className="text-amber-400"/>:<Moon size={17}/>}</button>
        </div>
      </div>
    </header>

    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-8">
      <AnimatePresence mode="wait"><motion.div key={activeTab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.16}}>
        {activeTab==='dashboard' && userPerms.canViewDashboard && <Dashboard onQuickAdd={handleQuickAdd} onNavigate={setActiveTab}/>} 
        {activeTab==='pos' && userPerms.canAddTransactions && <AddTransaction onSuccess={()=>{setActiveTab('history');setQuickAddData(null)}} initialType={quickAddData?.type} initialCategory={quickAddData?.category} initialDetail={quickAddData?.detail} initialAmount={quickAddData?.amount}/>} 
        {activeTab==='history' && <History/>}
        {activeTab==='reports' && userPerms.canViewReports && <Reports/>}
        {activeTab==='customers' && <CustomerCRM/>}
        {activeTab==='installations' && <InstallationWarrantyManager/>}
        {activeTab==='users' && <UserManagement/>}
        {activeTab==='audit_logs' && (userPerms.canViewAuditLogs || isAdminOrOwner) && <AuditLogManager/>}
        {activeTab==='settings' && <CommandCenter onNavigateToUsers={()=>setActiveTab('users')} onNavigateToAudit={()=>setActiveTab('audit_logs')} onLockApp={()=>setIsUnlocked(false)}/>} 
      </motion.div></AnimatePresence>
    </main>

    <BottomNavigationBar activeTab={activeTab} onNavigate={(tab)=>{if(tab==='pos')setQuickAddData(null);setActiveTab(tab)}} config={config.bottomNav} onUpdateConfig={updateBottomNavConfig} onResetDefaults={resetBottomNavConfig} onQuickAdd={handleQuickAdd} onOpenQuickDesign={()=>setIsQuickDesignOpen(true)} onLockApp={()=>setIsUnlocked(false)}/>
    <QuickDesignLauncherModal isOpen={isQuickDesignOpen} onClose={()=>setIsQuickDesignOpen(false)} onOpenFullSettings={()=>setActiveTab('settings')}/>
  </div>;
}
