import { useState } from 'react';
import { useAppConfig, DEFAULT_WIDGET_CONFIG } from '../hooks/useAppConfig';
import { useAuth } from '../hooks/useAuth';
import { Store, Package, Tags, Palette, ShieldCheck, Bell, UserCheck, Sparkles, Settings2, Lock, LogOut, Sliders, CheckCircle2, DownloadCloud, ShieldAlert, Layers, Wrench, Building2, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ShopInfoSettings from '../components/ShopInfoSettings';
import CompanySettings from '../components/CompanySettings';
import { ProductCatalogManager } from '../components/ProductCatalogManager';
import { ProductInventoryManager } from '../components/ProductInventoryManager';
import { AssetManager } from '../components/AssetManager';
import ConfigManager from '../components/ConfigManager';
import { DesignSystemWorkspace } from '../components/design-system/DesignSystemWorkspace';
import SecurityPINSettings from '../components/SecurityPINSettings';
import DailyReminderSettings from '../components/DailyReminderSettings';
import RecurringTransactionsManager from '../components/RecurringTransactionsManager';
import DashboardCustomizer from '../components/DashboardCustomizer';
import { SystemResetSettings } from '../components/SystemResetSettings';
import DatabaseBackupSettings from '../components/DatabaseBackupSettings';
import { BottomNavSettingsTab } from '../components/navigation/BottomNavSettingsTab';
import DashboardCardCustomizerTab from '../components/dashboard/DashboardCardCustomizerTab';
import WidgetGallery from '../components/dashboard/WidgetGallery';
import DatabaseManager from '../components/DatabaseManager';
import { signOut } from '../lib/firebase';
import { DashboardWidgetConfig } from '../types';

interface SettingsWorkspaceProps { onNavigateToUsers?: () => void; onLockApp?: () => void; }

type Section = 'catalog' | 'inventory' | 'assets' | 'categories' | 'shop' | 'company_settings' | 'theme' | 'dashboard_cards' | 'widget_gallery' | 'bottom_nav' | 'security' | 'reminders' | 'databases' | 'backup' | 'account' | 'system';

export default function SettingsWorkspace({ onNavigateToUsers, onLockApp }: SettingsWorkspaceProps) {
  const { config, updateShopInfo, updateStandardSets, generateSetsFromSubcategories, updateWidgetConfig, resetToDefaultCatalog, addProductCategory, updateProductCategory, deleteProductCategory, addProductItem, updateProductItem, deleteProductItem, adjustProductStock, addAsset, updateAsset, deleteAsset, updateDashboardCardDesign, resetDashboardCardDesign, toggleDashboardCardVisibility, reorderDashboardCards, setDashboardCardCustomColor } = useAppConfig();
  const { user, appUser } = useAuth();
  const isAdminOrOwner = user?.email?.toLowerCase() === 'b.b.thodsawat@gmail.com' || appUser?.role === 'admin' || appUser?.role === 'owner';
  const [activeSection, setActiveSection] = useState<Section>('catalog');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const toggleWidget = async (key: keyof DashboardWidgetConfig) => { const currentVal = config.dashboardWidgets?.[key] ?? true; await updateWidgetConfig({ [key]: !currentVal }); };
  const totalSets = config.standardSets?.length || 0;
  const totalCategories = (config.incomeCategories?.length || 0) + (config.expenseCategories?.length || 0);
  const totalPaymentMethods = config.paymentMethods?.length || 0;
  const totalAssets = config.assets?.length || 0;
  const hasShopName = Boolean(config.shopInfo?.name && config.shopInfo.name !== 'ชื่อร้านโซล่าเซลล์ของคุณ');

  const navItems: { id: Section; title: string; subtitle: string; icon: any; badge: string; softColor: string }[] = [
    { id: 'catalog', title: 'แคตตาล็อกชุดสินค้า', subtitle: 'จัดการชุดสินค้ามาตรฐานและราคา', icon: Package, badge: `${totalSets} ชุด`, softColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
    { id: 'inventory', title: 'แคตตาล็อกสินค้า & สต็อก', subtitle: 'จัดการหมวดหมู่และสินค้าแยกรายการ', icon: Layers, badge: `${config.productCategories?.length || 0} หมวดหมู่`, softColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
    { id: 'assets', title: 'ทรัพย์สิน & ค่าเสื่อมราคา', subtitle: 'จัดการเครื่องมือช่าง', icon: Wrench, badge: `${totalAssets} ชิ้น`, softColor: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' },
    { id: 'categories', title: 'หมวดหมู่ & การชำระเงิน', subtitle: 'จัดการรายรับ/รายจ่าย/วิธีชำระ/แท็ก', icon: Tags, badge: `${totalCategories} หมวด`, softColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
    { id: 'shop', title: 'ข้อมูลร้านค้า & เอกสาร', subtitle: 'ชื่อร้าน ที่อยู่ เบอร์โทร ใบเสร็จ', icon: Store, badge: hasShopName ? 'ตั้งค่าแล้ว' : 'ยังไม่ระบุ', softColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    { id: 'company_settings', title: 'การตั้งค่าบริษัท (Firestore)', subtitle: 'ข้อมูลบริษัทและโลโก้', icon: Building2, badge: 'Firestore', softColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
    { id: 'theme', title: 'ธีม & การแสดงผล', subtitle: 'ปรับแต่ง UI และ Design System', icon: Palette, badge: 'UI', softColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
    { id: 'dashboard_cards', title: 'สไตล์การ์ดแดชบอร์ด', subtitle: 'ปรับแต่งการ์ดสรุปยอด', icon: Sparkles, badge: 'THEME', softColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
    { id: 'widget_gallery', title: 'คลังวิดเจ็ตหน้าแรก', subtitle: 'เลือกและปรับแต่งวิดเจ็ต', icon: Layers, badge: 'WIDGETS', softColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
    { id: 'bottom_nav', title: 'Navigation Manager', subtitle: 'จัดการเมนูเข้าถึง', icon: Sliders, badge: `${config.bottomNav?.items?.length || 0} เมนู`, softColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
    { id: 'security', title: 'ความปลอดภัย & รหัส PIN', subtitle: 'ล็อกแอปและสิทธิ์ผู้ใช้', icon: ShieldCheck, badge: 'SECURITY', softColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
    { id: 'reminders', title: 'การแจ้งเตือน & รายการประจำ', subtitle: 'แจ้งเตือนและรายการอัตโนมัติ', icon: Bell, badge: 'AUTO', softColor: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800' },
    { id: 'databases', title: 'Firebase Database Manager', subtitle: 'ตรวจสอบและซิงค์ Firestore', icon: Database, badge: 'FIREBASE', softColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
    { id: 'backup', title: 'สำรองข้อมูลระบบ', subtitle: 'ดาวน์โหลดข้อมูลทั้งหมด', icon: DownloadCloud, badge: 'BACKUP', softColor: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800' },
    { id: 'account', title: 'ข้อมูลบัญชีผู้ใช้', subtitle: 'โปรไฟล์และออกจากระบบ', icon: UserCheck, badge: isAdminOrOwner ? 'ADMIN' : (appUser?.role || 'STAFF'), softColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
    { id: 'system', title: 'รีเซ็ตระบบ', subtitle: 'คืนค่าโรงงาน', icon: ShieldAlert, badge: 'DANGER', softColor: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' },
  ];

  return <div className="max-w-[1600px] mx-auto space-y-6 pb-12 animate-fade-in">
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"><div><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"><Settings2 size={14}/><span>ศูนย์รวมการตั้งค่าระบบ</span></div><h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">การตั้งค่าและจัดการข้อมูลร้านค้า</h1><p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">จัดการสินค้า แคตตาล็อก หมวดหมู่ เอกสาร ความปลอดภัย และ Firebase ในที่เดียว</p></div><div className="grid grid-cols-2 sm:grid-cols-3 gap-3"><div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl"><span className="text-[10px] font-black text-slate-400">ชุดสินค้า</span><div className="text-xl font-black text-indigo-600">{totalSets}</div></div><div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl"><span className="text-[10px] font-black text-slate-400">หมวดหมู่</span><div className="text-xl font-black text-emerald-600">{totalCategories}</div></div><div className="col-span-2 sm:col-span-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl"><span className="text-[10px] font-black text-slate-400">การชำระเงิน</span><div className="text-xl font-black text-amber-600">{totalPaymentMethods}</div></div></div></div></div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6"><div className="lg:col-span-3"><div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-sm space-y-1 sticky top-6"><div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase">เมนูตั้งค่าระบบ</div>{navItems.map(item => { const Icon = item.icon; const active = activeSection === item.id; return <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}><div className="flex items-center gap-3 min-w-0"><div className={`p-2.5 rounded-xl ${active ? 'bg-white/20' : item.softColor}`}><Icon size={18}/></div><div className="min-w-0"><p className="text-xs font-black truncate">{item.title}</p><p className={`text-[10px] truncate ${active ? 'text-slate-300' : 'text-slate-400'}`}>{item.subtitle}</p></div></div><span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border shrink-0 ${active ? 'bg-white/20 border-transparent' : item.softColor}`}>{item.badge}</span></button>; })}</div></div>
      <div className="lg:col-span-9"><AnimatePresence mode="wait"><motion.div key={activeSection} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} transition={{duration:.15}} className="space-y-6">
        {activeSection === 'catalog' && <ProductCatalogManager standardSets={config.standardSets || []} onUpdateSets={updateStandardSets} incomeCategories={config.incomeCategories} onGenerateFromSubcategories={generateSetsFromSubcategories} onResetToDefaultCatalog={resetToDefaultCatalog}/>}
        {activeSection === 'inventory' && <ProductInventoryManager categories={config.productCategories || []} onAddCategory={addProductCategory} onUpdateCategory={updateProductCategory} onDeleteCategory={deleteProductCategory} onAddProduct={addProductItem} onUpdateProduct={updateProductItem} onDeleteProduct={deleteProductItem} onAdjustStock={adjustProductStock}/>}
        {activeSection === 'assets' && <AssetManager assets={config.assets || []} onAddAsset={addAsset} onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset}/>}
        {activeSection === 'categories' && <ConfigManager/>}
        {activeSection === 'shop' && <ShopInfoSettings shopInfo={config.shopInfo || {name:'',address:'',phone:'',receiptNote:''}} onUpdate={updateShopInfo}/>}
        {activeSection === 'company_settings' && <CompanySettings/>}
        {activeSection === 'theme' && <DesignSystemWorkspace/>}
        {activeSection === 'dashboard_cards' && <DashboardCardCustomizerTab designConfig={config.dashboardCardDesign} onUpdateDesign={updateDashboardCardDesign} onResetDesign={resetDashboardCardDesign} onToggleVisibility={toggleDashboardCardVisibility} onReorderCards={reorderDashboardCards} onSetCustomColor={setDashboardCardCustomColor}/>}
        {activeSection === 'widget_gallery' && <WidgetGallery widgets={config.dashboardWidgets || DEFAULT_WIDGET_CONFIG} onToggleWidget={toggleWidget}/>}
        {activeSection === 'bottom_nav' && <BottomNavSettingsTab/>}
        {activeSection === 'security' && <div className="space-y-6"><SecurityPINSettings onLockApp={onLockApp || (() => {})}/>{onNavigateToUsers && <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"><div className="flex items-center gap-4"><ShieldCheck size={24} className="text-indigo-500"/><div><h4 className="font-black">จัดการผู้ใช้งานและสิทธิ์</h4><p className="text-xs text-slate-400">อนุมัติสมาชิกและกำหนดสิทธิ์</p></div></div><button onClick={onNavigateToUsers} className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black">ไปยังระบบผู้ใช้งาน</button></div>}</div>}
        {activeSection === 'reminders' && <div className="space-y-6"><DailyReminderSettings/><RecurringTransactionsManager/></div>}
        {activeSection === 'databases' && <DatabaseManager/>}
        {activeSection === 'backup' && <DatabaseBackupSettings/>}
        {activeSection === 'account' && <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"><div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800"><div className="w-20 h-20 rounded-3xl bg-indigo-100 overflow-hidden border-2 border-indigo-200 flex items-center justify-center font-black text-2xl text-indigo-600 shrink-0">{user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer"/> : (user?.displayName?.[0] || 'U').toUpperCase()}</div><div><div className="flex items-center gap-2"><p className="font-black text-lg">{user?.displayName || 'ผู้ใช้งานระบบ'}</p><span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-200">{isAdminOrOwner ? 'ADMIN / OWNER' : (appUser?.role || 'STAFF')}</span></div><p className="text-xs font-bold text-slate-400 mt-1">{user?.email}</p></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl"><span className="text-[10px] font-black text-slate-400">สถานะบัญชี</span><p className="text-sm font-black text-emerald-600 flex items-center gap-1.5 mt-1"><CheckCircle2 size={16}/> Active</p></div><div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl"><span className="text-[10px] font-black text-slate-400">ระดับสิทธิ์</span><p className="text-sm font-black mt-1">{isAdminOrOwner ? 'Administrator' : 'Staff'}</p></div></div><div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">{onNavigateToUsers && <button onClick={onNavigateToUsers} className="px-5 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs flex items-center gap-2"><UserCheck size={16}/> จัดการสิทธิ์ & User</button>}{onLockApp && <button onClick={onLockApp} className="px-5 py-3 bg-slate-100 rounded-xl font-black text-xs flex items-center gap-2"><Lock size={16}/> ล็อกหน้าจอ</button>}<button onClick={() => signOut()} className="px-5 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-xs flex items-center gap-2"><LogOut size={16}/> ออกจากระบบ</button></div></div>}
        {activeSection === 'system' && <SystemResetSettings/>}
      </motion.div></AnimatePresence></div>
    </div>
    <DashboardCustomizer isOpen={isCustomizerOpen} onClose={() => setIsCustomizerOpen(false)} widgets={config.dashboardWidgets || DEFAULT_WIDGET_CONFIG} onToggle={toggleWidget} onReset={() => {}} onMove={() => {}}/>
  </div>;
}
