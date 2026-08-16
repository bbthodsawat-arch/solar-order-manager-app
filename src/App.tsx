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
  Shield, Users, BarChart3, SunMedium, UserX, LogOut, KeyRound, Sparkles, UserCheck, Calendar, ShieldCheck, Palette
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
import RecurringTransactionsManager from './components/RecurringTransactionsManager';
import ConfigManager from './components/ConfigManager';
import DailyReminderSettings from './components/DailyReminderSettings';
import SecurityPINSettings from './components/SecurityPINSettings';
import PINLockScreen from './components/PINLockScreen';
import SettingsWorkspace from './pages/SettingsWorkspace';
import { ThemeApplier } from './components/ThemeApplier';
import { ThemeSettings } from './components/ThemeSettings';
import ShopInfoSettings from './components/ShopInfoSettings';
import { ProductCatalogManager } from './components/ProductCatalogManager';
import { useAppConfig } from './hooks/useAppConfig';
import { TransactionType, TransactionCategory } from './types';
import { getUserPermissions } from './utils/permissions';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { BottomNavigationBar } from './components/navigation/BottomNavigationBar';

type Tab = 'dashboard' | 'pos' | 'history' | 'reports' | 'customers' | 'installations' | 'settings' | 'users' | 'audit_logs';

export default function App() {
  const { user, appUser, loading } = useAuth();
  const { 
    config, 
    updateTheme, 
    updateStandardSets, 
    updateShopInfo, 
    generateSetsFromSubcategories,
    updateBottomNavConfig,
    resetBottomNavConfig
  } = useAppConfig();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold border border-amber-500/20 shadow-xs">
              <SunMedium size={26} className="text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
          </div>
          <span className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400">ร้านกลางนาโซล่าเซลล์ • ตรวจสอบสิทธิ์การใช้งาน...</span>
        </motion.div>
      </div>
    );
  }

  // If user is not logged in, render Login Page
  if (!user) {
    return <Login />;
  }

  // If the application is locked by a security PIN
  if (!isUnlocked && localStorage.getItem('app_pin')) {
    return <PINLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  // If user account is suspended by Admin
  if (appUser?.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-rose-200 dark:border-rose-950 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-3xl flex items-center justify-center mx-auto border border-rose-300 dark:border-rose-800">
            <UserX size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">บัญชีผู้ใช้ถูกระงับสิทธิ์</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ผู้ดูแลระบบ (Administrator) ได้ทำการระงับสิทธิ์การเข้าถึงระบบของท่าน หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบร้านกลางนาโซล่าเซลล์
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300">
            {user.email}
          </div>

          <button
            onClick={signOut}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <LogOut size={16} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    );
  }

  // Build permitted navigation links
  const navItems: { id: Tab; label: string; icon: any }[] = [];
  if (userPerms.canViewDashboard) {
    navItems.push({ id: 'dashboard', label: 'ภาพรวมธุรกิจ', icon: LayoutDashboard });
  }
  if (userPerms.canAddTransactions) {
    navItems.push({ id: 'pos', label: 'ระบบขาย POS', icon: PlusCircle });
  }
  navItems.push({ id: 'history', label: 'ประวัติรายการ', icon: ListOrdered });
  if (userPerms.canViewReports) {
    navItems.push({ id: 'reports', label: 'รายงานการเงิน', icon: BarChart3 });
  }
  navItems.push({ id: 'customers', label: 'ลูกค้า CRM', icon: UserCheck });
  navItems.push({ id: 'installations', label: 'นัดหมาย & ใบรับประกัน', icon: Calendar });
  navItems.push({ id: 'users', label: 'จัดการสิทธิ์', icon: Users });
  if (userPerms.canViewAuditLogs || isAdminOrOwner) {
    navItems.push({ id: 'audit_logs', label: 'Audit Log', icon: ShieldCheck });
  }
  navItems.push({ id: 'settings', label: 'ศูนย์ควบคุมระบบ', icon: Settings });

  const bottomNavItems = navItems.filter(item => !['pos', 'users', 'customers', 'settings'].includes(item.id));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans selection:bg-brand-soft selection:text-brand">
      <Toaster position="top-center" />
      <ThemeApplier />
      
      {/* Top Header - Minimal Executive Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/80 sticky top-0 z-30 transition-colors shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab(navItems[0]?.id || 'history')}>
            {(config.shopInfo?.showLogo ?? true) && (
              <img
                src={config.shopInfo?.logoUrl || '/logo.jpg'}
                alt="Logo"
                className="w-10 h-10 object-contain rounded-full border border-brand bg-white p-0.5 shadow-2xs"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.jpg';
                }}
              />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {config.shopInfo?.name || 'ร้านกลางนาโซล่าเซลล์'}
                </h1>
                {(config.shopInfo?.showDeveloperCredit ?? true) && (
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-brand-soft text-brand border border-brand-soft">
                    by boy thodsawat
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-semibold hidden sm:block">
                {config.shopInfo?.systemName || 'Solar Financial & Operations Management'}
              </p>
              {(config.shopInfo?.companyNameTh || config.shopInfo?.companyNameEn) && (
                <p className="text-[8px] font-black tracking-wider text-indigo-500 uppercase">
                  {config.shopInfo.companyNameTh || config.shopInfo.companyNameEn}
                </p>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'pos') setQuickAddData(null);
                    setActiveTab(item.id);
                  }}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-600/60"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center space-x-1.5">
                    <Icon size={15} className={isActive ? 'text-brand' : ''} />
                    <span>{item.label}</span>
                    <span className="hidden xl:inline-block text-[9px] opacity-40 font-mono ml-1">
                      {item.id === 'dashboard' ? '[D]' : item.id === 'pos' ? '[P]' : item.id === 'history' ? '[H]' : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Header Action Tools */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <DuePaymentsNotification />
            
            <CloudSyncIndicator />

            {/* Quick Design Switcher Button */}
            <button
              onClick={() => setIsQuickDesignOpen(true)}
              className="p-2 rounded-xl border transition-colors flex items-center space-x-1 text-xs font-bold cursor-pointer bg-brand-soft text-brand border-brand-soft hover:bg-brand/10"
              title="สลับธีมและสไตล์ด่วน (Quick Theme & Style)"
            >
              <Palette size={16} />
              <span className="hidden md:inline text-[11px]">ธีม & ดีไซน์</span>
            </button>

            {/* Quick Direct Buttons for Admin/Users & Settings */}
            <button
              onClick={() => setActiveTab('users')}
              className={`p-2 rounded-xl border transition-colors flex items-center space-x-1 text-xs font-bold cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-brand text-white border-brand shadow-xs'
                  : 'bg-brand-soft text-brand border-brand-soft hover:bg-brand/10'
              }`}
              title="จัดการสิทธิ์ผู้ใช้งาน & แผง Admin"
            >
              <Users size={16} />
              <span className="hidden xl:inline text-[11px]">จัดการสิทธิ์ & ผู้ใช้</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="ตั้งค่าระบบ"
            >
              <Settings size={18} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
              title={theme === 'dark' ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            {/* Profile & Role Badge */}
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center space-x-2 p-1 pl-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl transition-colors border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-xs overflow-hidden shadow-2xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user.displayName?.charAt(0) || 'U'
                )}
              </div>
              <div className="hidden xl:flex flex-col text-left pr-1">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none">
                  {user.displayName?.split(' ')[0]}
                </span>
                <span className="text-[9px] font-extrabold uppercase text-brand">
                  {isAdminOrOwner ? 'ADMIN' : (appUser?.role || 'staff')}
                </span>
              </div>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-8 space-y-4">
        
        {/* Admin Quick Switch Navigation Ribbon */}
        {isAdminOrOwner && (
          <div className="bg-gradient-to-r from-brand/15 via-brand/5 to-transparent p-3 px-4 rounded-2xl border border-brand/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-brand text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center">
                <Shield size={11} className="mr-1" /> Admin Access
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                สิทธิ์ผู้ดูแลระบบ: บัญชีของคุณ ({user.email}) มีสิทธิ์จัดการระบบเต็มรูปแบบ
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users size={14} className="text-brand" />
                <span>🔑 หน้าจัดการสิทธิ์</span>
              </button>

              <button
                onClick={() => setActiveTab('audit_logs')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  activeTab === 'audit_logs'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck size={14} className="text-amber-500" />
                <span>📜 Audit Log</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Settings size={14} className="text-brand" />
                <span>⚙️ หน้าตั้งค่าระบบ</span>
              </button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'dashboard' && userPerms.canViewDashboard && (
              <Dashboard onQuickAdd={handleQuickAdd} onNavigate={setActiveTab} />
            )}

            {activeTab === 'pos' && userPerms.canAddTransactions && (
              <AddTransaction 
                onSuccess={() => {
                  setActiveTab('history');
                  setQuickAddData(null);
                }}
                initialType={quickAddData?.type}
                initialCategory={quickAddData?.category}
                initialDetail={quickAddData?.detail}
                initialAmount={quickAddData?.amount}
              />
            )}

            {activeTab === 'history' && <History />}

            {activeTab === 'reports' && userPerms.canViewReports && <Reports />}

            {activeTab === 'customers' && <CustomerCRM />}

            {activeTab === 'installations' && <InstallationWarrantyManager />}

            {activeTab === 'users' && <UserManagement />}

            {activeTab === 'audit_logs' && (userPerms.canViewAuditLogs || isAdminOrOwner) && (
              <AuditLogManager />
            )}

            {activeTab === 'settings' && (
              <SettingsWorkspace
                onNavigateToUsers={() => setActiveTab('users')}
                onLockApp={() => setIsUnlocked(false)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Dynamic & Customizable Bottom Navigation Bar */}
      <BottomNavigationBar
        activeTab={activeTab}
        onNavigate={(tab) => {
          if (tab === 'pos') setQuickAddData(null);
          setActiveTab(tab);
        }}
        config={config.bottomNav}
        onUpdateConfig={updateBottomNavConfig}
        onResetDefaults={resetBottomNavConfig}
        onQuickAdd={handleQuickAdd}
        onOpenQuickDesign={() => setIsQuickDesignOpen(true)}
        onLockApp={() => setIsUnlocked(false)}
      />

      {/* Quick Design Switcher Modal */}
      <QuickDesignLauncherModal
        isOpen={isQuickDesignOpen}
        onClose={() => setIsQuickDesignOpen(false)}
        onOpenFullSettings={() => setActiveTab('settings')}
      />
    </div>
  );
}
