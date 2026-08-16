import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, 
  Sparkles, 
  Palette, 
  LayoutGrid, 
  Plus, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Check, 
  Monitor, 
  Smartphone,
  Layers,
  Users,
  Search,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Tag,
  ArrowUpToLine,
  ArrowDownToLine,
  Filter,
  Info
} from 'lucide-react';
import { useAppConfig } from '../../hooks/useAppConfig';
import { useAuth } from '../../hooks/useAuth';
import { BottomNavCustomizerModal } from './BottomNavCustomizerModal';
import { renderNavIcon, AVAILABLE_NAV_ICONS } from './NavIconHelper';
import { 
  BottomNavConfig, 
  BottomNavItemConfig, 
  BottomNavStyleType, 
  BottomNavActiveIndicator, 
  BottomNavLabelMode,
  UserRole
} from '../../types';
import toast from 'react-hot-toast';

const PRESET_QUICK_ITEMS = [
  { label: 'ภาพรวมธุรกิจ', iconName: 'LayoutDashboard', actionType: 'tab' as const, targetTab: 'dashboard', allowedRoles: ['admin', 'manager', 'staff', 'viewer'] as UserRole[] },
  { label: 'ขาย POS ด่วน', iconName: 'ShoppingCart', actionType: 'tab' as const, targetTab: 'pos', color: '#10b981', badgeText: 'POS', allowedRoles: ['admin', 'manager', 'staff'] as UserRole[] },
  { label: 'รับเงินสด/โอน', iconName: 'PlusCircle', actionType: 'quick_action' as const, quickAction: 'quick_income' as const, color: '#059669', badgeText: '+รับ', allowedRoles: ['admin', 'manager', 'staff'] as UserRole[] },
  { label: 'จ่ายเงินด่วน', iconName: 'ArrowUpRight', actionType: 'quick_action' as const, quickAction: 'quick_expense' as const, color: '#e11d48', badgeText: '-จ่าย', allowedRoles: ['admin', 'manager'] as UserRole[] },
  { label: 'ประวัติรายการ', iconName: 'ListOrdered', actionType: 'tab' as const, targetTab: 'history', allowedRoles: ['admin', 'manager', 'staff', 'viewer'] as UserRole[] },
  { label: 'รายงานกำไร-ขาดทุน', iconName: 'BarChart3', actionType: 'tab' as const, targetTab: 'reports', color: '#8b5cf6', allowedRoles: ['admin', 'manager', 'viewer'] as UserRole[] },
  { label: 'ลูกค้า CRM', iconName: 'UserCheck', actionType: 'tab' as const, targetTab: 'customers', color: '#0ea5e9', allowedRoles: ['admin', 'manager', 'staff'] as UserRole[] },
  { label: 'นัดหมาย & ใบรับประกัน', iconName: 'Calendar', actionType: 'tab' as const, targetTab: 'installations', color: '#f59e0b', allowedRoles: ['admin', 'manager', 'staff'] as UserRole[] },
  { label: 'จัดการสิทธิ์ทีมงาน', iconName: 'Users', actionType: 'tab' as const, targetTab: 'users', color: '#6366f1', allowedRoles: ['admin', 'manager'] as UserRole[] },
  { label: 'สลับธีม/โหมดมืด', iconName: 'Palette', actionType: 'quick_action' as const, quickAction: 'quick_design' as const, allowedRoles: ['admin', 'manager', 'staff', 'viewer'] as UserRole[] },
  { label: 'ล็อกหน้าจอ PIN', iconName: 'Lock', actionType: 'quick_action' as const, quickAction: 'pin_lock' as const, allowedRoles: ['admin', 'manager', 'staff', 'viewer'] as UserRole[] },
];

const ROLE_DEFINITIONS: { id: UserRole; label: string; nameTh: string; color: string; bg: string; border: string; text: string; desc: string }[] = [
  {
    id: 'admin',
    label: '👑 Admin',
    nameTh: 'ผู้ดูแลระบบสูงสุด / เจ้าของร้าน',
    color: '#9333ea',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    desc: 'สิทธิ์สูงสุด เข้าถึงทุกฟังก์ชันในระบบ ทั้งการเงิน รายงาน และตั้งค่า'
  },
  {
    id: 'manager',
    label: '👔 Manager',
    nameTh: 'ผู้จัดการร้าน',
    color: '#2563eb',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    desc: 'บริหารจัดการการขาย ประวัติ รายงาน ลูกค้า และทีมงาน'
  },
  {
    id: 'staff',
    label: '💼 Staff',
    nameTh: 'พนักงานขาย / ช่างติดตั้ง',
    color: '#059669',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    desc: 'บันทึกรายการขาย POS จัดการลูกค้า นัดหมาย และงานติดตั้ง'
  },
  {
    id: 'viewer',
    label: '👁️ Viewer',
    nameTh: 'ผู้ดูข้อมูล (Read-Only)',
    color: '#d97706',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    desc: 'ดูข้อมูลภาพรวมและรายงานเท่านั้น ไม่สามารถเพิ่ม/ลบรายการ'
  }
];

export function BottomNavSettingsTab() {
  const { 
    config, 
    updateBottomNavConfig, 
    resetBottomNavConfig, 
    toggleBottomNavItemActive, 
    deleteBottomNavItem, 
    reorderBottomNavItems,
    updateBottomNavItem,
    addBottomNavItem
  } = useAppConfig();
  const { appUser, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter & Simulation states
  const [simulatedRole, setSimulatedRole] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState<string>('bn_dashboard');
  const [showAppearanceSettings, setShowAppearanceSettings] = useState(false);
  const [showPresetsLibrary, setShowPresetsLibrary] = useState(false);

  const bottomNav = config.bottomNav || {
    styleType: 'floating-capsule',
    activeIndicator: 'pill',
    labelMode: 'all',
    showOnDesktop: false,
    blurEffect: true,
    iconSize: 'medium',
    items: []
  };

  const rawItems = bottomNav.items || [];

  // Filtered items for management list
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      // Status filter
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'hidden' && item.isActive) return false;

      // Role filter
      if (roleFilter !== 'all') {
        const roles = item.allowedRoles || ['admin', 'manager', 'staff', 'viewer'];
        if (!roles.includes(roleFilter)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLabel = item.label.toLowerCase().includes(q);
        const matchTarget = item.targetTab?.toLowerCase().includes(q) || false;
        const matchAction = item.quickAction?.toLowerCase().includes(q) || false;
        const matchBadge = item.badgeText?.toLowerCase().includes(q) || false;
        if (!matchLabel && !matchTarget && !matchAction && !matchBadge) return false;
      }

      return true;
    });
  }, [rawItems, statusFilter, roleFilter, searchQuery]);

  // Items visible in the role simulator preview
  const simulatorItems = useMemo(() => {
    return rawItems.filter((item) => {
      if (!item.isActive) return false;
      if (simulatedRole === 'all') return true;
      const roles = item.allowedRoles || ['admin', 'manager', 'staff', 'viewer'];
      return roles.includes(simulatedRole);
    });
  }, [rawItems, simulatedRole]);

  // Move item up / down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const items = [...rawItems];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;

    const temp = items[index];
    items[index] = items[target];
    items[target] = temp;

    items.forEach((it, idx) => {
      it.order = idx + 1;
    });

    reorderBottomNavItems(items);
    toast.success('จัดเรียงลำดับใหม่แล้ว');
  };

  const handleMoveToTop = (index: number) => {
    if (index === 0) return;
    const items = [...rawItems];
    const [moved] = items.splice(index, 1);
    items.unshift(moved);
    items.forEach((it, idx) => {
      it.order = idx + 1;
    });
    reorderBottomNavItems(items);
    toast.success('ย้ายไปบนสุดแล้ว');
  };

  const handleMoveToBottom = (index: number) => {
    if (index === rawItems.length - 1) return;
    const items = [...rawItems];
    const [moved] = items.splice(index, 1);
    items.push(moved);
    items.forEach((it, idx) => {
      it.order = idx + 1;
    });
    reorderBottomNavItems(items);
    toast.success('ย้ายไปล่างสุดแล้ว');
  };

  // Toggle role on item
  const handleToggleItemRole = (item: BottomNavItemConfig, role: UserRole) => {
    const currentRoles = item.allowedRoles || ['admin', 'manager', 'staff', 'viewer'];
    let nextRoles: UserRole[];
    if (currentRoles.includes(role)) {
      nextRoles = currentRoles.filter(r => r !== role);
      if (nextRoles.length === 0) {
        toast.error('เมนูต้องมีอย่างน้อย 1 บทบาทที่เข้าถึงได้ (กำหนดเป็น Admin)');
        nextRoles = ['admin'];
      }
    } else {
      nextRoles = [...currentRoles, role];
    }
    updateBottomNavItem(item.id, { allowedRoles: nextRoles });
    toast.success(`อัปเดตสิทธิ์บทบาท ${role.toUpperCase()} แล้ว`);
  };

  // Toggle all roles on item
  const handleToggleAllRoles = (item: BottomNavItemConfig) => {
    const currentRoles = item.allowedRoles || ['admin', 'manager', 'staff', 'viewer'];
    if (currentRoles.length === 4) {
      updateBottomNavItem(item.id, { allowedRoles: ['admin'] });
      toast.success('จำกัดสิทธิ์เฉพาะ Admin เท่านั้น');
    } else {
      updateBottomNavItem(item.id, { allowedRoles: ['admin', 'manager', 'staff', 'viewer'] });
      toast.success('เปิดสิทธิ์สำหรับทุกคน (All Roles)');
    }
  };

  const handleReset = async () => {
    if (confirm('คุณต้องการคืนค่าเริ่มต้นของแถบเมนูด้านล่างและสิทธิ์ทั้งหมดใช่หรือไม่?')) {
      await resetBottomNavConfig();
      toast.success('คืนค่าเริ่มต้นเรียบร้อยแล้ว');
    }
  };

  const handleAddPreset = (preset: typeof PRESET_QUICK_ITEMS[0]) => {
    const newItem: BottomNavItemConfig = {
      id: `bn_${Date.now()}`,
      label: preset.label,
      iconName: preset.iconName,
      actionType: preset.actionType,
      targetTab: preset.targetTab,
      quickAction: (preset as any).quickAction,
      color: (preset as any).color,
      badgeText: (preset as any).badgeText,
      allowedRoles: preset.allowedRoles,
      isActive: true,
      order: rawItems.length + 1
    };
    addBottomNavItem(newItem);
    toast.success(`เพิ่มเมนู "${preset.label}" เรียบร้อยแล้ว`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-brand/15 via-brand/5 to-transparent border border-brand/20 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center font-bold shadow-md shadow-brand/20">
            <Sliders size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                การจัดการเมนูเข้าถึง (Navigation Manager)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand text-white uppercase tracking-wider">
                Role-Based
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              จัดลำดับ (Reorder), เพิ่ม/ลบ, ซ่อน และกำหนดสิทธิ์การมองเห็นตามบทบาท (Admin, Manager, Staff, Viewer)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAppearanceSettings(!showAppearanceSettings)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showAppearanceSettings 
                ? 'bg-brand text-white border-brand shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Palette size={14} />
            <span>ปรับสไตล์ดีไซน์</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-md hover:bg-brand/90 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>+ เพิ่ม / ปรับแต่งเมนู</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Role Simulator & Live Preview Bar */}
      <div className="p-5 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-brand/20 text-brand">
              <Sparkles size={16} />
            </span>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                เครื่องมือจำลองมุมมองตามบทบาท (Role View Simulator)
              </h3>
              <p className="text-[11px] text-slate-400">
                เลือกบทบาทด้านขวาเพื่อทดสอบว่า ผู้ใช้งานระดับนั้นจะเห็นปุ่มเมนูล่างใดบ้างแบบเรียลไทม์
              </p>
            </div>
          </div>

          {/* Role simulation tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setSimulatedRole('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                simulatedRole === 'all'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 ทั้งหมด (All)
            </button>
            {ROLE_DEFINITIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setSimulatedRole(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  simulatedRole === r.id
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Role Explanation Note */}
        <div className="px-3.5 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Info size={14} className="text-brand shrink-0" />
            <span className="text-slate-300">
              {simulatedRole === 'all'
                ? 'กำลังแสดงปุ่มทั้งหมดที่เปิดใช้งานอยู่ในระบบ (สำหรับดูภาพรวมของทุกบทบาท)'
                : `${ROLE_DEFINITIONS.find(r => r.id === simulatedRole)?.nameTh}: ${ROLE_DEFINITIONS.find(r => r.id === simulatedRole)?.desc}`}
            </span>
          </div>
          <span className="text-[11px] font-mono text-brand font-bold shrink-0 ml-2">
            {simulatorItems.length} ปุ่มที่มองเห็นได้
          </span>
        </div>

        {/* Live Bottom Navigation Dock Preview */}
        <div className="py-3 flex justify-center">
          <div className={`w-full max-w-xl transition-all duration-300 ${
            bottomNav.styleType === 'floating-capsule'
              ? 'bg-slate-900/95 text-white rounded-3xl p-1.5 border border-slate-700/80 shadow-2xl backdrop-blur-md'
              : bottomNav.styleType === 'dock-modern'
              ? 'bg-slate-850 text-white rounded-2xl p-2 border border-slate-700 shadow-2xl'
              : bottomNav.styleType === 'glassmorphism'
              ? 'bg-slate-900/60 text-white rounded-2xl p-1.5 border border-white/20 shadow-xl backdrop-blur-xl'
              : bottomNav.styleType === 'neon-glow'
              ? 'bg-slate-950 text-white rounded-3xl p-1.5 border border-brand/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
              : 'bg-slate-900 text-white rounded-none p-1.5 border-t border-slate-800'
          }`}>
            <div className="flex items-center justify-around overflow-x-auto no-scrollbar gap-1">
              {simulatorItems.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-500 font-bold">
                  ไม่มีปุ่มเมนูที่เปิดให้บทบาทนี้เข้าถึง
                </div>
              ) : (
                simulatorItems.map((item) => {
                  const isSelected = activePreviewTab === item.id;
                  const iconPx = bottomNav.iconSize === 'small' ? 16 : bottomNav.iconSize === 'large' ? 24 : 20;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePreviewTab(item.id)}
                      className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all cursor-pointer min-w-[54px] shrink-0 ${
                        isSelected 
                          ? 'text-white font-extrabold' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {/* Active Indicator Rendering */}
                      {isSelected && bottomNav.activeIndicator === 'pill' && (
                        <motion.div
                          layoutId="settingsPreviewIndicator"
                          className="absolute inset-0 bg-brand rounded-2xl shadow-sm -z-0 opacity-90"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      {isSelected && bottomNav.activeIndicator === 'glow-border' && (
                        <div className="absolute inset-0 rounded-2xl border-2 border-brand shadow-[0_0_12px_rgba(59,130,246,0.5)] -z-0" />
                      )}

                      <div className={`relative z-10 p-1 flex flex-col items-center ${
                        isSelected && bottomNav.activeIndicator === 'scale-bounce' ? 'scale-115 text-brand' : ''
                      }`}>
                        {renderNavIcon(item.iconName, iconPx, item.color ? `text-[${item.color}]` : '')}
                        
                        {/* Dot indicator */}
                        {isSelected && bottomNav.activeIndicator === 'dot' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand mt-0.5 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                        )}

                        {/* Label depending on LabelMode */}
                        {(bottomNav.labelMode === 'all' || (bottomNav.labelMode === 'active-only' && isSelected)) && (
                          <span className="text-[10px] font-bold tracking-tight truncate max-w-[68px] mt-0.5">
                            {item.label}
                          </span>
                        )}

                        {/* Badge */}
                        {item.badgeText && (
                          <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-rose-500 text-white rounded-full text-[8px] font-black uppercase shadow-xs">
                            {item.badgeText}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Appearance & Layout Settings Drawer (if toggled) */}
      <AnimatePresence>
        {showAppearanceSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Palette size={18} className="text-brand" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    ปรับแต่งสไตล์และเลย์เอาต์ (Navigation Appearance & Styles)
                  </h3>
                </div>
                <button
                  onClick={() => setShowAppearanceSettings(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
                >
                  ปิดแผงสไตล์
                </button>
              </div>

              {/* Layout Styles Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  รูปแบบโครงสร้างแถบเมนู (Layout Style)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(
                    [
                      { id: 'floating-capsule' as BottomNavStyleType, title: 'แคปซูลลอย (Floating)', desc: 'โค้งมนลอยพรีเมียม' },
                      { id: 'dock-modern' as BottomNavStyleType, title: 'Modern Dock', desc: 'ขอบเรียบหรูสไตล์ iPad' },
                      { id: 'glassmorphism' as BottomNavStyleType, title: 'กระจกฝ้า (Glass)', desc: 'โปร่งแสง Blur นุ่มนวล' },
                      { id: 'neon-glow' as BottomNavStyleType, title: 'Cyber Glow', desc: 'เรืองแสงขอบสีสันสดใส' },
                      { id: 'classic-edge' as BottomNavStyleType, title: 'Classic Edge', desc: 'ชิดขอบล่างคลาสสิก' }
                    ]
                  ).map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateBottomNavConfig({ ...bottomNav, styleType: style.id })}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        bottomNav.styleType === style.id
                          ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{style.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Indicator & Label Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ตัวบ่งชี้แท็บที่กำลังเปิด (Active Indicator)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'pill' as BottomNavActiveIndicator, title: 'พื้นหลังเม็ดยา (Pill)' },
                        { id: 'dot' as BottomNavActiveIndicator, title: 'จุดกลมด้านล่าง (Dot)' },
                        { id: 'glow-border' as BottomNavActiveIndicator, title: 'กรอบเรืองแสง (Glow)' },
                        { id: 'scale-bounce' as BottomNavActiveIndicator, title: 'ขยายขนาด (Scale Pop)' }
                      ]
                    ).map((ind) => (
                      <button
                        key={ind.id}
                        onClick={() => updateBottomNavConfig({ ...bottomNav, activeIndicator: ind.id })}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                          bottomNav.activeIndicator === ind.id
                            ? 'border-brand bg-brand text-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        {ind.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    การแสดงข้อความป้ายกำกับ (Label Display Mode)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'all' as BottomNavLabelMode, title: 'แสดงทุกปุ่ม' },
                        { id: 'active-only' as BottomNavLabelMode, title: 'เฉพาะปุ่มที่เลือก' },
                        { id: 'icon-only' as BottomNavLabelMode, title: 'ไอคอนล้วน' }
                      ]
                    ).map((lm) => (
                      <button
                        key={lm.id}
                        onClick={() => updateBottomNavConfig({ ...bottomNav, labelMode: lm.id })}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          bottomNav.labelMode === lm.id
                            ? 'border-brand bg-brand text-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        {lm.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop toggle & Icon size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Monitor size={14} className="text-brand" />
                      แสดงบนจอคอมพิวเตอร์ (Show on Desktop)
                    </label>
                    <p className="text-[10px] text-slate-400">
                      แสดงแถบเมนูล่างลอยบนหน้าจอ Desktop ด้วย
                    </p>
                  </div>
                  <button
                    onClick={() => updateBottomNavConfig({ ...bottomNav, showOnDesktop: !bottomNav.showOnDesktop })}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      bottomNav.showOnDesktop
                        ? 'bg-brand text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {bottomNav.showOnDesktop ? 'เปิดใช้งาน' : 'ปิด'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      ขนาดไอคอน (Icon Size)
                    </label>
                    <p className="text-[10px] text-slate-400">
                      ปรับความคมชัดและขนาดไอคอนบนหน้าจอ
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => updateBottomNavConfig({ ...bottomNav, iconSize: size })}
                        className={`py-1.5 px-2.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                          bottomNav.iconSize === size
                            ? 'bg-brand text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {size === 'small' ? 'เล็ก' : size === 'medium' ? 'กลาง' : 'ใหญ่'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Quick Presets Library Accordion */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap size={16} className="text-amber-500" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              คลังปุ่มเมนูสำเร็จรูป (Quick Presets)
            </h3>
          </div>
          <button
            onClick={() => setShowPresetsLibrary(!showPresetsLibrary)}
            className="text-xs font-bold text-brand hover:underline cursor-pointer"
          >
            {showPresetsLibrary ? 'ย่อคลังปุ่ม' : '+ ดูปุ่มสำเร็จรูปทั้งหมด'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {(showPresetsLibrary ? PRESET_QUICK_ITEMS : PRESET_QUICK_ITEMS.slice(0, 5)).map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleAddPreset(preset)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-brand/10 hover:border-brand border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer group"
            >
              <div 
                className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-[10px]"
                style={{ backgroundColor: (preset as any).color || '#3b82f6' }}
              >
                {renderNavIcon(preset.iconName, 12)}
              </div>
              <span className="group-hover:text-brand transition-colors">+ {preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Navigation Items List & Management Table */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Controls Toolbar: Search & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อปุ่ม, หน้าเป้าหมาย หรือคำสั่งลัด..."
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand font-medium"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ทั้งหมด ({rawItems.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-emerald-500 text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                เปิดใช้งาน ({rawItems.filter(i => i.isActive).length})
              </button>
              <button
                onClick={() => setStatusFilter('hidden')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'hidden'
                    ? 'bg-slate-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ซ่อน ({rawItems.filter(i => !i.isActive).length})
              </button>
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">ทุกสิทธิ์บทบาท</option>
              <option value="admin">เฉพาะ 👑 Admin</option>
              <option value="manager">เฉพาะ 👔 Manager</option>
              <option value="staff">เฉพาะ 💼 Staff</option>
              <option value="viewer">เฉพาะ 👁️ Viewer</option>
            </select>
          </div>
        </div>

        {/* List of items */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <Sliders size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                ไม่พบปุ่มเมนูที่ตรงกับเงื่อนไขการค้นหา
              </p>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setRoleFilter('all');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:bg-brand/90 cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const actualIndex = rawItems.findIndex(i => i.id === item.id);
              const allowedRoles = item.allowedRoles || ['admin', 'manager', 'staff', 'viewer'];
              const isAllRoles = allowedRoles.length === 4;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                    item.isActive
                      ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs hover:border-brand/40'
                      : 'bg-slate-50/70 dark:bg-slate-850/40 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {/* Left block: Reorder + Icon + Info */}
                  <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col space-y-1 shrink-0">
                      <div className="flex items-center space-x-1">
                        <button
                          disabled={actualIndex === 0}
                          onClick={() => handleMove(actualIndex, 'up')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer transition-colors"
                          title="เลื่อนขึ้น 1 ขั้น"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          disabled={actualIndex === 0}
                          onClick={() => handleMoveToTop(actualIndex)}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer transition-colors"
                          title="ย้ายไปบนสุด"
                        >
                          <ArrowUpToLine size={13} />
                        </button>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          disabled={actualIndex === rawItems.length - 1}
                          onClick={() => handleMove(actualIndex, 'down')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer transition-colors"
                          title="เลื่อนลง 1 ขั้น"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          disabled={actualIndex === rawItems.length - 1}
                          onClick={() => handleMoveToBottom(actualIndex)}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer transition-colors"
                          title="ย้ายไปล่างสุด"
                        >
                          <ArrowDownToLine size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Order badge */}
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                      #{item.order || actualIndex + 1}
                    </span>

                    {/* Icon Avatar */}
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs"
                      style={{
                        backgroundColor: item.color ? `${item.color}15` : 'var(--brand-soft)',
                        borderColor: item.color ? `${item.color}35` : 'transparent',
                        color: item.color || 'var(--brand-color)'
                      }}
                    >
                      {renderNavIcon(item.iconName, 22)}
                    </div>

                    {/* Label & Description */}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {item.label}
                        </h4>
                        {item.badgeText && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-2xs">
                            {item.badgeText}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold ${
                          item.actionType === 'tab'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {item.actionType === 'tab' ? `🔗 แท็บ: ${item.targetTab}` : `⚡ ทางลัด: ${item.quickAction}`}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        ไอคอน: <span className="font-mono">{item.iconName}</span>
                        {item.color && <span> • สี: <span className="font-mono">{item.color}</span></span>}
                      </p>
                    </div>
                  </div>

                  {/* Center/Right block: Direct Role Visibility Toggles */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">สิทธิ์:</span>
                      
                      {/* 4 Interactive Role Badges */}
                      {ROLE_DEFINITIONS.map((r) => {
                        const hasRole = allowedRoles.includes(r.id);
                        return (
                          <button
                            key={r.id}
                            onClick={() => handleToggleItemRole(item, r.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                              hasRole
                                ? `${r.bg} ${r.border} ${r.text} shadow-2xs`
                                : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 opacity-40 hover:opacity-80'
                            }`}
                            title={`คลิกเพื่อเปิด/ปิดสิทธิ์บทบาท ${r.label}`}
                          >
                            {r.label}
                          </button>
                        );
                      })}

                      {/* Toggle all */}
                      <button
                        onClick={() => handleToggleAllRoles(item)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
                        title="สลับสิทธิ์ทุกคน / เฉพาะ Admin"
                      >
                        {isAllRoles ? '🌐 ทุกคน' : '🔒 จำกัด'}
                      </button>
                    </div>

                    {/* Action buttons on item */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {/* Toggle Active Switch */}
                      <button
                        onClick={() => {
                          toggleBottomNavItemActive(item.id);
                          toast.success(item.isActive ? `ซ่อนเมนู "${item.label}" แล้ว` : `เปิดใช้งานเมนู "${item.label}" แล้ว`);
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          item.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                        title={item.isActive ? 'เปิดใช้งานอยู่ (คลิกเพื่อซ่อน)' : 'ซ่อนอยู่ (คลิกเพื่อเปิดใช้งาน)'}
                      >
                        {item.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
                        title="แก้ไขรายละเอียดและไอคอน"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (rawItems.length <= 1) {
                            toast.error('ต้องมีเมนูอย่างน้อย 1 รายการ');
                            return;
                          }
                          if (confirm(`คุณต้องการลบปุ่ม "${item.label}" ใช่หรือไม่?`)) {
                            deleteBottomNavItem(item.id);
                            toast.success(`ลบปุ่ม "${item.label}" เรียบร้อยแล้ว`);
                          }
                        }}
                        className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                        title="ลบปุ่มนี้"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Modal Instance */}
      <BottomNavCustomizerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={bottomNav}
        onSaveConfig={(newConfig) => {
          updateBottomNavConfig(newConfig);
          toast.success('บันทึกการตั้งค่าเมนูด้านล่างเรียบร้อยแล้ว');
        }}
        onResetDefaults={resetBottomNavConfig}
      />
    </div>
  );
}
