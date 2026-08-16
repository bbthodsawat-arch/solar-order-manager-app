import { useState } from 'react';
import { useAppConfig } from '../hooks/useAppConfig';
import { useAuth } from '../hooks/useAuth';
import { 
  Store, 
  Package, 
  Tags, 
  Palette, 
  ShieldCheck, 
  Bell, 
  UserCheck, 
  Sparkles,
  ChevronRight,
  Settings2,
  Lock,
  LogOut,
  Sliders,
  CheckCircle2,
  ListFilter,
  DownloadCloud,
  ShieldAlert,
  Layers,
  Wrench,
  Building2,
  Database,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ShopInfoSettings from '../components/ShopInfoSettings';
import CompanySettings from '../components/CompanySettings';
import { ProductCatalogManager } from '../components/ProductCatalogManager';
import { ProductInventoryManager } from '../components/ProductInventoryManager';
import { AssetManager } from '../components/AssetManager';
import ConfigManager from '../components/ConfigManager';
import { ThemeSettings } from '../components/ThemeSettings';
import { DisplayDensitySettings } from '../components/DisplayDensitySettings';
import { DesignSystemWorkspace } from '../components/design-system/DesignSystemWorkspace';
import SecurityPINSettings from '../components/SecurityPINSettings';
import DailyReminderSettings from '../components/DailyReminderSettings';
import RecurringTransactionsManager from '../components/RecurringTransactionsManager';
import DashboardCustomizer from '../components/DashboardCustomizer';
import DashboardLayoutManager from '../components/DashboardLayoutManager';
import { DEFAULT_WIDGET_CONFIG } from '../hooks/useAppConfig';
import { SystemResetSettings } from '../components/SystemResetSettings';
import DatabaseBackupSettings from '../components/DatabaseBackupSettings';
import { SupabaseConfigManager } from '../components/SupabaseConfigManager';
import { BottomNavSettingsTab } from '../components/navigation/BottomNavSettingsTab';
import DashboardCardCustomizerTab from '../components/dashboard/DashboardCardCustomizerTab';
import WidgetGallery from '../components/dashboard/WidgetGallery';
import DatabaseManager from '../components/DatabaseManager';
import SyncHealthDashboard from '../components/SyncHealthDashboard';
import { signOut } from '../lib/firebase';
import { DashboardWidgetConfig } from '../types';

interface SettingsWorkspaceProps {
  onNavigateToUsers?: () => void;
  onLockApp?: () => void;
}

export default function SettingsWorkspace({ onNavigateToUsers, onLockApp }: SettingsWorkspaceProps) {
  const {
    config,
    updateShopInfo,
    updateTheme,
    displayDensity,
    updateDisplayDensity,
    updateStandardSets,
    generateSetsFromSubcategories,
    updateWidgetConfig,
    resetToDefaultCatalog,
    addProductCategory,
    updateProductCategory,
    deleteProductCategory,
    addProductItem,
    updateProductItem,
    deleteProductItem,
    adjustProductStock,
    addAsset,
    updateAsset,
    deleteAsset,
    updateDashboardCardDesign,
    resetDashboardCardDesign,
    toggleDashboardCardVisibility,
    reorderDashboardCards,
    setDashboardCardCustomColor
  } = useAppConfig();

  const { user, appUser } = useAuth();
  const isAdminOrOwner = user?.email?.toLowerCase() === 'b.b.thodsawat@gmail.com' || appUser?.role === 'admin' || appUser?.role === 'owner';

  const [activeSection, setActiveSection] = useState<'catalog' | 'inventory' | 'assets' | 'categories' | 'shop' | 'company_settings' | 'theme' | 'dashboard_cards' | 'widget_gallery' | 'bottom_nav' | 'security' | 'reminders' | 'databases' | 'backup' | 'account' | 'system'>('catalog');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const toggleWidget = async (key: keyof DashboardWidgetConfig) => {
    const currentVal = config.dashboardWidgets?.[key] ?? true;
    await updateWidgetConfig({ [key]: !currentVal });
  };

  // Stats calculation
  const totalSets = config.standardSets?.length || 0;
  const totalCategories = (config.incomeCategories?.length || 0) + (config.expenseCategories?.length || 0);
  const totalPaymentMethods = config.paymentMethods?.length || 0;
  const totalAssets = config.assets?.length || 0;
  const hasShopName = Boolean(config.shopInfo?.name && config.shopInfo.name !== 'ชื่อร้านโซล่าเซลล์ของคุณ');

  const navItems = [
    {
      id: 'catalog',
      title: 'แคตตาล็อกชุดสินค้า',
      subtitle: 'จัดการชุดสินค้ามาตรฐานและราคา',
      icon: Package,
      badge: `${totalSets} ชุด`,
      color: 'bg-indigo-500 text-indigo-500',
      softColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
    },
    {
      id: 'inventory',
      title: 'แคตตาล็อกสินค้า & สต็อก',
      subtitle: 'จัดการหมวดหมู่และสินค้าแยกรายการ',
      icon: Layers,
      badge: `${config.productCategories?.length || 0} หมวดหมู่`,
      color: 'bg-blue-500 text-blue-500',
      softColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    },
    {
      id: 'assets',
      title: 'ทรัพย์สิน & ค่าเสื่อมราคา',
      subtitle: 'จัดการเครื่องมือช่างและคำนวณค่าเสื่อม',
      icon: Wrench,
      badge: `${totalAssets} ชิ้น`,
      color: 'bg-cyan-500 text-cyan-500',
      softColor: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'
    },
    {
      id: 'categories',
      title: 'หมวดหมู่ & การชำระเงิน',
      subtitle: 'จัดการรายรับ/รายจ่าย/วิธีชำระ/แท็ก',
      icon: Tags,
      badge: `${totalCategories} หมวด`,
      color: 'bg-emerald-500 text-emerald-500',
      softColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    },
    {
      id: 'shop',
      title: 'ข้อมูลร้านค้า & เอกสาร',
      subtitle: 'ชื่อร้าน ที่อยู่ เบอร์โทร ใบเสร็จ',
      icon: Store,
      badge: hasShopName ? 'ตั้งค่าแล้ว' : 'ยังไม่ระบุ',
      color: 'bg-amber-500 text-amber-500',
      softColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    },
    {
      id: 'company_settings',
      title: 'การตั้งค่าบริษัท (Firestore)',
      subtitle: 'ชื่อร้าน บริษัท TH/EN และเปิด/ปิดโลโก้',
      icon: Building2,
      badge: 'Firestore',
      color: 'bg-indigo-500 text-indigo-500',
      softColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
    },
    {
      id: 'theme',
      title: 'ธีม & การแสดงผล',
      subtitle: 'สีแอป โหมดมืด ปรับหน้าแรก',
      icon: Palette,
      badge: 'ปรับแต่ง UI',
      color: 'bg-purple-500 text-purple-500',
      softColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
    },
    {
      id: 'dashboard_cards',
      title: 'สไตล์การ์ดแดชบอร์ด & สีพาสเทล',
      subtitle: 'เปลี่ยนธีมสีการ์ดสรุปยอด รายรับ รายจ่าย กำไร ยอดขาย',
      icon: Sparkles,
      badge: 'Pastel & Theme',
      color: 'bg-amber-500 text-amber-500',
      softColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    },
    {
      id: 'widget_gallery',
      title: 'คลังวิดเจ็ตหน้าแรก (Widget Gallery)',
      subtitle: 'เลือกเพิ่ม/ลบ และปรับแต่งรายการวิดเจ็ตบนแดชบอร์ด',
      icon: Layers,
      badge: 'Widget Gallery',
      color: 'bg-indigo-600 text-indigo-600',
      softColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
    },
    {
      id: 'bottom_nav',
      title: 'การจัดการเมนูเข้าถึง (Navigation Manager)',
      subtitle: 'จัดลำดับ เพิ่ม/ลบ ซ่อน และกำหนดสิทธิ์ตามบทบาทผู้ใช้',
      icon: Sliders,
      badge: `${config.bottomNav?.items?.length || 0} เมนู`,
      color: 'bg-blue-600 text-blue-600',
      softColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    },
    {
      id: 'security',
      title: 'ความปลอดภัย & รหัส PIN',
      subtitle: 'ล็อกแอป สิทธิ์ผู้ใช้ ความปลอดภัย',
      icon: ShieldCheck,
      badge: 'PIN & Roles',
      color: 'bg-rose-500 text-rose-500',
      softColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
    },
    {
      id: 'reminders',
      title: 'การแจ้งเตือน & รายการประจำ',
      subtitle: 'แจ้งเตือนประจำวัน รายการอัตโนมัติ',
      icon: Bell,
      badge: 'ระบบอัตโนมัติ',
      color: 'bg-sky-500 text-sky-500',
      softColor: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
    },
    {
      id: 'databases',
      title: 'จัดการ & ซิงค์ 3 ฐานข้อมูล',
      subtitle: 'สลับอัตโนมัติ Local/Firestore/Supabase',
      icon: Database,
      badge: 'MULTI-DB',
      color: 'bg-emerald-500 text-emerald-500',
      softColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    },
    {
      id: 'sync-health',
      title: 'รายงานสุขภาวะระบบซิงค์',
      subtitle: 'กราฟปริมาณซิงค์สำเร็จและระบบกู้ภัยย้อนหลัง 30 วัน',
      icon: Activity,
      badge: 'HEALTH',
      color: 'bg-indigo-500 text-indigo-500',
      softColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
    },
    {
      id: 'backup',
      title: 'สำรองข้อมูลระบบ',
      subtitle: 'ดาวน์โหลดข้อมูลทั้งหมดเป็น JSON',
      icon: DownloadCloud,
      badge: 'BACKUP',
      color: 'bg-teal-500 text-teal-500',
      softColor: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800'
    },
    {
      id: 'account',
      title: 'ข้อมูลบัญชีผู้ใช้',
      subtitle: 'โปรไฟล์ สิทธิ์การใช้งาน ออกจากระบบ',
      icon: UserCheck,
      badge: isAdminOrOwner ? 'ADMIN' : (appUser?.role || 'STAFF'),
      color: 'bg-blue-500 text-blue-500',
      softColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    },
    {
      id: 'system',
      title: 'รีเซ็ตระบบ (Factory Reset)',
      subtitle: 'ล้างข้อมูลทั้งหมด คืนค่าโรงงาน',
      icon: ShieldAlert,
      badge: 'DANGER',
      color: 'bg-red-500 text-red-500',
      softColor: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
    }
  ] as const;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
              <Settings2 size={14} className="text-indigo-500" />
              <span>ศูนย์รวมการตั้งค่าระบบ (System Configuration Workspace)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              การตั้งค่าและจัดการข้อมูลร้านค้า
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
              จัดการสินค้า แคตตาล็อกราคา หมวดหมู่รายรับ-รายจ่าย ข้อมูลเอกสารใบเสร็จ และระบบความปลอดภัยทั้งหมดในที่เดียว
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 p-3.5 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">สินค้าขายในคลัง</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{totalSets}</span>
                <span className="text-xs font-extrabold text-slate-500">ชุด</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 p-3.5 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">หมวดหมู่ระบบ</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{totalCategories}</span>
                <span className="text-xs font-extrabold text-slate-500">ประเภท</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 p-3.5 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ช่องทางชำระเงิน</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xl font-black text-amber-600 dark:text-amber-400">{totalPaymentMethods}</span>
                <span className="text-xs font-extrabold text-slate-500">รูปแบบ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 shadow-sm space-y-1 sticky top-6">
            <div className="px-3 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              เมนูตั้งค่าระบบ
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-[1.02]' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive 
                        ? 'bg-white/20 dark:bg-slate-900/20 text-current' 
                        : item.softColor
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate">{item.title}</p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border shrink-0 ${
                    isActive 
                      ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900 border-transparent' 
                      : item.softColor
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* 1. Catalog */}
              {activeSection === 'catalog' && (
                <ProductCatalogManager
                  standardSets={config.standardSets || []}
                  onUpdateSets={updateStandardSets}
                  incomeCategories={config.incomeCategories}
                  onGenerateFromSubcategories={generateSetsFromSubcategories}
                  onResetToDefaultCatalog={resetToDefaultCatalog}
                />
              )}

              {/* 2. Product Inventory & Stock Catalog */}
              {activeSection === 'inventory' && (
                <ProductInventoryManager
                  categories={config.productCategories || []}
                  onAddCategory={addProductCategory}
                  onUpdateCategory={updateProductCategory}
                  onDeleteCategory={deleteProductCategory}
                  onAddProduct={addProductItem}
                  onUpdateProduct={updateProductItem}
                  onDeleteProduct={deleteProductItem}
                  onAdjustStock={adjustProductStock}
                />
              )}

              {/* 3. Assets & Depreciation */}
              {activeSection === 'assets' && (
                <AssetManager
                  assets={config.assets || []}
                  onAddAsset={addAsset}
                  onUpdateAsset={updateAsset}
                  onDeleteAsset={deleteAsset}
                />
              )}

              {/* 4. Categories & Payment */}
              {activeSection === 'categories' && (
                <ConfigManager />
              )}

              {/* 3. Shop Info */}
              {activeSection === 'shop' && (
                <ShopInfoSettings
                  shopInfo={config.shopInfo || { name: '', address: '', phone: '', receiptNote: '' }}
                  onUpdate={updateShopInfo}
                />
              )}

              {/* 3.1 Company Settings (Firestore-direct) */}
              {activeSection === 'company_settings' && (
                <CompanySettings />
              )}

              {/* 4. Complete Design System & Customization */}
              {activeSection === 'theme' && (
                <DesignSystemWorkspace />
              )}

              {/* 4.1 Dashboard Metric Cards Customizer */}
              {activeSection === 'dashboard_cards' && (
                <DashboardCardCustomizerTab
                  designConfig={config.dashboardCardDesign}
                  onUpdateDesign={updateDashboardCardDesign}
                  onResetDesign={resetDashboardCardDesign}
                  onToggleVisibility={toggleDashboardCardVisibility}
                  onReorderCards={reorderDashboardCards}
                  onSetCustomColor={setDashboardCardCustomColor}
                />
              )}

              {/* 4.2 Widget Gallery Manager */}
              {activeSection === 'widget_gallery' && (
                <WidgetGallery
                  widgets={config.dashboardWidgets}
                  onToggleWidget={toggleWidget}
                />
              )}

              {/* 4.3 Bottom Navigation Manager */}
              {activeSection === 'bottom_nav' && (
                <BottomNavSettingsTab />
              )}

              {/* 5. Security & Access Control */}
              {activeSection === 'security' && (
                <div className="space-y-6">
                  <SecurityPINSettings onLockApp={onLockApp || (() => {})} />

                  {onNavigateToUsers && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                          <ShieldCheck size={24} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 dark:text-white">จัดการสิทธิ์ผู้ใช้งานและพนักงาน</h4>
                          <p className="text-xs text-slate-400 font-bold">อนุมัติสมาชิก กำหนดสิทธิ์ Admin/Staff และดูบันทึกผู้เข้าใช้งาน</p>
                        </div>
                      </div>

                      <button
                        onClick={onNavigateToUsers}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>ไปยังระบบจัดการผู้ใช้งาน</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 6. Reminders & Recurring */}
              {activeSection === 'reminders' && (
                <div className="space-y-6">
                  <DailyReminderSettings />
                  <RecurringTransactionsManager />
                </div>
              )}

              {/* 6.5 Databases Selector */}
              {activeSection === 'databases' && (
                <DatabaseManager />
              )}

              {/* 6.6 Sync Health Dashboard */}
              {activeSection === 'sync-health' && (
                <SyncHealthDashboard />
              )}

              {/* 7. Backup & Data Management */}
              {activeSection === 'backup' && (
                <div className="space-y-8">
                  <SupabaseConfigManager />
                  <DatabaseBackupSettings />
                </div>
              )}

              {/* 8. Account Profile */}
              {activeSection === 'account' && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center space-x-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-100 dark:bg-indigo-950/60 overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-black text-2xl text-indigo-600 dark:text-indigo-400 shrink-0">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        (user?.displayName?.[0] || 'U').toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-black text-lg text-slate-900 dark:text-white">{user?.displayName || 'ผู้ใช้งานระบบ'}</p>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {isAdminOrOwner ? 'ADMIN / OWNER' : (appUser?.role || 'STAFF')}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 mt-1">{user?.email}</p>
                      <p className="text-[10px] font-semibold text-slate-400 mt-1">
                        เข้าใช้งานเมื่อ: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">สถานะบัญชี</span>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                        <CheckCircle2 size={16} />
                        <span>เปิดใช้งานเรียบร้อย (Active)</span>
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ระดับสิทธิ์ (Role)</span>
                      <p className="text-sm font-black text-slate-900 dark:text-white capitalize">
                        {isAdminOrOwner ? 'ผู้ดูแลระบบสูงสุด (Administrator)' : 'พนักงานประจำร้าน (Staff)'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-end">
                    {onNavigateToUsers && (
                      <button
                        onClick={onNavigateToUsers}
                        className="px-5 py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all border border-indigo-200 dark:border-indigo-900/50 cursor-pointer"
                      >
                        <UserCheck size={16} />
                        <span>จัดการสิทธิ์ & สร้าง User</span>
                      </button>
                    )}

                    {onLockApp && (
                      <button
                        onClick={onLockApp}
                        className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                      >
                        <Lock size={16} />
                        <span>ล็อกหน้าจอทันที</span>
                      </button>
                    )}

                    <button
                      onClick={() => signOut()}
                      className="px-5 py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition-all border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 9. System Reset */}
              {activeSection === 'system' && (
                <SystemResetSettings />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dashboard Customizer Modal */}
      <DashboardCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        widgets={config.dashboardWidgets}
        onToggle={toggleWidget}
        onReset={() => {}}
        onMove={() => {}}
      />
    </div>
  );
}
