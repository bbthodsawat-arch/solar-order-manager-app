import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  RotateCcw, 
  Sliders, 
  LayoutGrid, 
  Palette, 
  Sparkles, 
  Edit3, 
  Eye, 
  EyeOff, 
  Layers, 
  ShieldCheck, 
  Users, 
  Moon, 
  Sun, 
  Lock, 
  RefreshCw, 
  Search,
  CheckCircle2,
  Smartphone,
  Monitor
} from 'lucide-react';
import { 
  BottomNavConfig, 
  BottomNavItemConfig, 
  BottomNavStyleType, 
  BottomNavActiveIndicator, 
  BottomNavLabelMode,
  BottomNavActionType,
  BottomNavQuickAction,
  UserRole
} from '../../types';
import { AVAILABLE_NAV_ICONS, renderNavIcon } from './NavIconHelper';

interface BottomNavCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BottomNavConfig;
  onSaveConfig: (newConfig: BottomNavConfig) => void;
  onResetDefaults: () => void;
}

const STYLE_OPTIONS: { id: BottomNavStyleType; title: string; desc: string; icon: string }[] = [
  { 
    id: 'floating-capsule', 
    title: 'แคปซูลลอยโมเดิร์น (Floating Capsule)', 
    desc: 'แถบลอยเหนือขอบล่าง ขอบมนนุ่มนวล ทันสมัย',
    icon: '💊'
  },
  { 
    id: 'dock-modern', 
    title: 'ด็อกทรง Mac (Modern Dock)', 
    desc: 'ทรงโค้งมนพรีเมียม สไตล์แท่นวางแอปพลิเคชัน',
    icon: '🖥️'
  },
  { 
    id: 'classic-edge', 
    title: 'แถบติดขอบเต็มจอ (Classic Edge)', 
    desc: 'แนบสนิทขอบล่างหน้าจอ ใช้งานถนัดมือบนมือถือ',
    icon: '📱'
  },
  { 
    id: 'glassmorphism', 
    title: 'กระจกเบลอโปร่งแสง (Frosted Glass)', 
    desc: 'กระจกฝ้าโปร่งแสง สวยงามหรูหราพร้อมฉากหลังเบลอ',
    icon: '✨'
  },
  { 
    id: 'neon-glow', 
    title: 'นีออนเรืองแสง (Cyber Glow)', 
    desc: 'ธีมสีมืดพรีเมียมพร้อมแสงไฟนีออนเน้นแท็บเด่นชัด',
    icon: '⚡'
  }
];

const INDICATOR_OPTIONS: { id: BottomNavActiveIndicator; title: string; desc: string }[] = [
  { id: 'pill', title: 'ป้ายมนไฮไลต์ (Pill Background)', desc: 'พื้นหลังปุ่มโค้งมนรอบไอคอน' },
  { id: 'dot', title: 'จุดเรืองแสงลอย (Glowing Dot)', desc: 'จุดเรืองแสงมินิมอลใต้อันที่เลือก' },
  { id: 'glow-border', title: 'กรอบเรืองแสง (Glow Border)', desc: 'เส้นขอบเรืองแสงรอบปุ่มที่เลือก' },
  { id: 'scale-bounce', title: 'ขยายเด่นชัด (Scale Pop)', desc: 'ขยายขนาดไอคอนและเปลี่ยนสีสด' }
];

const LABEL_MODE_OPTIONS: { id: BottomNavLabelMode; title: string; desc: string }[] = [
  { id: 'all', title: 'แสดงไอคอน + ข้อความทั้งหมด', desc: 'เห็นชื่อเมนูครบถ้วนทุกปุ่ม' },
  { id: 'active-only', title: 'แสดงข้อความเฉพาะแท็บที่เลือก', desc: 'แสดงชื่อเฉพาะเมนูที่กำลังเปิดอยู่' },
  { id: 'icon-only', title: 'แสดงเฉพาะไอคอน (Icon Only)', desc: 'สไตล์มินิมอล สะอาดตาและประหยัดพื้นที่' }
];

const PRESET_QUICK_ITEMS: { label: string; iconName: string; actionType: BottomNavActionType; targetTab?: string; quickAction?: BottomNavQuickAction; color?: string; badgeText?: string }[] = [
  { label: 'ภาพรวม Dashboard', iconName: 'LayoutDashboard', actionType: 'tab', targetTab: 'dashboard' },
  { label: 'ระบบขาย POS', iconName: 'PlusCircle', actionType: 'tab', targetTab: 'pos', color: '#10b981' },
  { label: '+ รับเงินด่วน', iconName: 'ArrowDownLeft', actionType: 'quick_action', quickAction: 'quick_income', color: '#10b981', badgeText: 'ด่วน' },
  { label: '- จ่ายเงินด่วน', iconName: 'ArrowUpRight', actionType: 'quick_action', quickAction: 'quick_expense', color: '#f43f5e' },
  { label: 'ประวัติรายการ', iconName: 'ListOrdered', actionType: 'tab', targetTab: 'history' },
  { label: 'รายงานการเงิน', iconName: 'BarChart3', actionType: 'tab', targetTab: 'reports', color: '#3b82f6' },
  { label: 'ลูกค้า CRM', iconName: 'UserCheck', actionType: 'tab', targetTab: 'customers', color: '#06b6d4' },
  { label: 'นัดหมาย & ประกัน', iconName: 'Calendar', actionType: 'tab', targetTab: 'installations', color: '#8b5cf6' },
  { label: 'จัดการสิทธิ์', iconName: 'Users', actionType: 'tab', targetTab: 'users', color: '#f59e0b' },
  { label: 'Audit Log', iconName: 'ShieldCheck', actionType: 'tab', targetTab: 'audit_logs', color: '#d97706' },
  { label: 'สลับธีม & ดีไซน์', iconName: 'Palette', actionType: 'quick_action', quickAction: 'quick_design', color: '#ec4899' },
  { label: 'โหมดมืด/สว่าง', iconName: 'Sun', actionType: 'quick_action', quickAction: 'toggle_theme', color: '#eab308' },
  { label: 'ล็อคหน้าจอ PIN', iconName: 'Lock', actionType: 'quick_action', quickAction: 'pin_lock', color: '#64748b' },
  { label: 'ซิงค์คลาวด์', iconName: 'RefreshCw', actionType: 'quick_action', quickAction: 'sync_now', color: '#0284c7' },
  { label: 'ตั้งค่าระบบ', iconName: 'Settings', actionType: 'tab', targetTab: 'settings' }
];

export function BottomNavCustomizerModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetDefaults
}: BottomNavCustomizerModalProps) {
  const [localConfig, setLocalConfig] = useState<BottomNavConfig>(config);
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'design'>('items');
  const [previewTab, setPreviewTab] = useState<string>(config.items[0]?.id || 'bn_dashboard');
  const [previewRole, setPreviewRole] = useState<'all' | UserRole>('admin');
  const [editingItem, setEditingItem] = useState<BottomNavItemConfig | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [iconCategory, setIconCategory] = useState<string>('ทั้งหมด');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...localConfig.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });

    setLocalConfig({ ...localConfig, items: newItems });
  };

  const handleToggleItemActive = (id: string) => {
    const newItems = localConfig.items.map(item => 
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    setLocalConfig({ ...localConfig, items: newItems });
  };

  const handleDeleteItem = (id: string) => {
    if (localConfig.items.length <= 1) {
      alert('ต้องมีเมนูอย่างน้อย 1 รายการ');
      return;
    }
    const newItems = localConfig.items.filter(item => item.id !== id);
    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setLocalConfig({ ...localConfig, items: newItems });
  };

  const handleSaveItemEdit = (updatedItem: BottomNavItemConfig) => {
    if (isAddingNew) {
      const newItems = [...localConfig.items, { ...updatedItem, id: `bn_${Date.now()}`, order: localConfig.items.length + 1 }];
      setLocalConfig({ ...localConfig, items: newItems });
      setIsAddingNew(false);
    } else {
      const newItems = localConfig.items.map(item => item.id === updatedItem.id ? updatedItem : item);
      setLocalConfig({ ...localConfig, items: newItems });
    }
    setEditingItem(null);
  };

  const handleAddPreset = (preset: typeof PRESET_QUICK_ITEMS[0]) => {
    const newItem: BottomNavItemConfig = {
      id: `bn_${Date.now()}`,
      label: preset.label,
      iconName: preset.iconName,
      actionType: preset.actionType,
      targetTab: preset.targetTab,
      quickAction: preset.quickAction,
      color: preset.color,
      badgeText: preset.badgeText,
      isActive: true,
      order: localConfig.items.length + 1
    };
    setLocalConfig({ ...localConfig, items: [...localConfig.items, newItem] });
  };

  // Categories for icon picker
  const categories = ['ทั้งหมด', ...Array.from(new Set(AVAILABLE_NAV_ICONS.map(i => i.category)))];
  const filteredIcons = AVAILABLE_NAV_ICONS.filter(i => {
    const matchesCategory = iconCategory === 'ทั้งหมด' || i.category === iconCategory;
    const matchesSearch = !iconSearch.trim() || 
      i.name.toLowerCase().includes(iconSearch.toLowerCase()) || 
      i.label.toLowerCase().includes(iconSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-850">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-soft text-brand flex items-center justify-center border border-brand-soft font-bold shadow-xs">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>จัดการและปรับแต่งเมนูแถบด้านล่าง</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-bold">Bottom Navigation</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เพิ่ม ลบ แก้ไข จัดลำดับปุ่มเมนู และปรับแต่งสไตล์ดีไซน์แถบเมนูด้านล่างได้อย่างอิสระ
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (confirm('คุณต้องการรีเซ็ตการตั้งค่าเมนูด้านล่างเป็นค่าเริ่มต้นใช่หรือไม่?')) {
                  onResetDefaults();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="คืนค่าเริ่มต้น"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">คืนค่าเริ่มต้น</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Live Interactive Preview Box with Role Switcher */}
        <div className="p-4 bg-slate-950 text-white border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles size={13} className="text-brand" /> แสดงผลตัวอย่างสด (Live Interactive Preview)
            </span>
            
            {/* Role Simulation Switcher */}
            <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold px-1.5 flex items-center gap-1">
                <Users size={11} /> จำลองบทบาท:
              </span>
              {(
                [
                  { id: 'all', label: 'ทั้งหมด (All)', color: 'text-slate-200' },
                  { id: 'admin', label: '👑 Admin', color: 'text-purple-400' },
                  { id: 'manager', label: '👔 Manager', color: 'text-blue-400' },
                  { id: 'staff', label: '💼 Staff', color: 'text-emerald-400' },
                  { id: 'viewer', label: '👁️ Viewer', color: 'text-amber-400' },
                ] as const
              ).map((roleOpt) => (
                <button
                  key={roleOpt.id}
                  onClick={() => setPreviewRole(roleOpt.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    previewRole === roleOpt.id
                      ? 'bg-brand text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {roleOpt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Render Preview Bar */}
          <div className="py-2 flex justify-center">
            <div className={`w-full max-w-lg transition-all duration-300 ${
              localConfig.styleType === 'floating-capsule'
                ? 'bg-slate-900/90 text-white rounded-3xl p-1.5 border border-slate-700/80 shadow-xl backdrop-blur-md'
                : localConfig.styleType === 'dock-modern'
                ? 'bg-slate-850 text-white rounded-2xl p-2 border border-slate-700 shadow-2xl'
                : localConfig.styleType === 'glassmorphism'
                ? 'bg-slate-900/60 text-white rounded-2xl p-1.5 border border-white/20 shadow-xl backdrop-blur-xl'
                : localConfig.styleType === 'neon-glow'
                ? 'bg-slate-950 text-white rounded-3xl p-1.5 border border-brand/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                : 'bg-slate-900 text-white rounded-none p-1.5 border-t border-slate-800'
            }`}>
              <div className="flex items-center justify-around overflow-x-auto no-scrollbar gap-1">
                {localConfig.items
                  .filter((item) => {
                    if (!item.isActive) return false;
                    if (previewRole === 'all') return true;
                    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
                    return item.allowedRoles.includes(previewRole);
                  })
                  .map((item) => {
                    const isSelected = previewTab === item.id;
                    const iconPx = localConfig.iconSize === 'small' ? 16 : localConfig.iconSize === 'large' ? 24 : 20;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setPreviewTab(item.id)}
                        className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer min-w-[54px] shrink-0 ${
                          isSelected 
                            ? 'text-white font-extrabold' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {/* Active Indicator Rendering */}
                        {isSelected && localConfig.activeIndicator === 'pill' && (
                          <motion.div
                            layoutId="previewIndicator"
                            className="absolute inset-0 bg-brand rounded-2xl shadow-sm -z-0 opacity-90"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          />
                        )}
                        {isSelected && localConfig.activeIndicator === 'glow-border' && (
                          <div className="absolute inset-0 rounded-2xl border-2 border-brand shadow-[0_0_12px_rgba(59,130,246,0.5)] -z-0" />
                        )}

                        <div className={`relative z-10 p-1 flex flex-col items-center ${
                          isSelected && localConfig.activeIndicator === 'scale-bounce' ? 'scale-115 text-brand' : ''
                        }`}>
                          {renderNavIcon(item.iconName, iconPx, item.color ? `text-[${item.color}]` : '')}
                          
                          {/* Dot indicator */}
                          {isSelected && localConfig.activeIndicator === 'dot' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand mt-0.5 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                          )}

                          {/* Label depending on LabelMode */}
                          {(localConfig.labelMode === 'all' || (localConfig.labelMode === 'active-only' && isSelected)) && (
                            <span className="text-[10px] font-bold tracking-tight truncate max-w-[64px] mt-0.5">
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
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 sm:px-6">
          <button
            onClick={() => setActiveSubTab('items')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'items'
                ? 'border-brand text-brand font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid size={15} />
            <span>จัดการปุ่มเมนู ({localConfig.items.length} รายการ)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('design')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'design'
                ? 'border-brand text-brand font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Palette size={15} />
            <span>รูปแบบ & ดีไซน์ (Styles & Layout)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeSubTab === 'items' ? (
            <div className="space-y-6">
              {/* Top Action Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">รายการปุ่มในแถบเมนูด้านล่าง</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    เปิด/ปิด การแสดงผล, สลับตำแหน่งขึ้น-ลง, แก้ไขชื่อ/ไอคอน หรือลบเมนูที่ไม่ต้องการ
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingItem({
                      id: `bn_${Date.now()}`,
                      label: 'เมนูใหม่',
                      iconName: 'Sparkles',
                      actionType: 'tab',
                      targetTab: 'dashboard',
                      isActive: true,
                      order: localConfig.items.length + 1
                    });
                    setIsAddingNew(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-bold flex items-center space-x-1.5 shadow-md hover:bg-brand/90 transition-all cursor-pointer"
                >
                  <Plus size={15} />
                  <span>+ เพิ่มปุ่มเมนูใหม่</span>
                </button>
              </div>

              {/* Items List Table/Cards */}
              <div className="space-y-2">
                {localConfig.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                      item.isActive
                        ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs'
                        : 'bg-slate-100/60 dark:bg-slate-850/40 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Move buttons */}
                      <div className="flex flex-col space-y-1">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveItem(index, 'up')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                          title="เลื่อนขึ้น"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          disabled={index === localConfig.items.length - 1}
                          onClick={() => handleMoveItem(index, 'down')}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                          title="เลื่อนลง"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>

                      {/* Icon preview */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: item.color ? `${item.color}15` : 'var(--brand-soft)',
                          borderColor: item.color ? `${item.color}40` : 'transparent',
                          color: item.color || 'var(--brand-color)'
                        }}
                      >
                        {renderNavIcon(item.iconName, 20)}
                      </div>

                      {/* Item Details */}
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                            {item.label}
                          </h4>
                          {item.badgeText && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-800">
                              {item.badgeText}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.actionType === 'tab' 
                            ? `🔗 แท็บหน้า: ${item.targetTab}` 
                            : `⚡ ทางลัดด่วน: ${item.quickAction}`}
                          {` • ลำดับที่ ${item.order}`}
                        </p>

                        {/* Role Visibility Badges */}
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {(!item.allowedRoles || item.allowedRoles.length === 4) ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                              🌐 ทุกคน
                            </span>
                          ) : (
                            item.allowedRoles.map((r) => (
                              <span
                                key={r}
                                className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${
                                  r === 'admin'
                                    ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                                    : r === 'manager'
                                    ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                    : r === 'staff'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                {r === 'admin' ? '👑 Admin' : r === 'manager' ? '👔 Manager' : r === 'staff' ? '💼 Staff' : '👁️ Viewer'}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions on Item */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {/* Toggle Active Button */}
                      <button
                        onClick={() => handleToggleItemActive(item.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          item.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}
                        title={item.isActive ? 'เปิดใช้งานอยู่ (คลิกเพื่อซ่อน)' : 'ซ่อนอยู่ (คลิกเพื่อเปิด)'}
                      >
                        {item.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsAddingNew(false);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        title="แก้ไขปุ่มนี้"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                        title="ลบปุ่มนี้"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Template Preset Buttons */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  เพิ่มเมนูจากแม่แบบทางลัดสำเร็จรูป (Quick Add Presets)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {PRESET_QUICK_ITEMS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddPreset(preset)}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      {renderNavIcon(preset.iconName, 13)}
                      <span>+ {preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Design & Styles */
            <div className="space-y-6">
              {/* 1. Bar Style Layout */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>1. รูปแบบโครงสร้างแถบเมนู (Bar Layout Style)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {STYLE_OPTIONS.map((opt) => {
                    const isSelected = localConfig.styleType === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setLocalConfig({ ...localConfig, styleType: opt.id })}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-md'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-2xl mb-2">{opt.icon}</span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center">
                              <Check size={12} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {opt.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Active Indicator */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  2. ตัวบ่งชี้แท็บที่กำลังเปิด (Active Indicator Style)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INDICATOR_OPTIONS.map((opt) => {
                    const isSelected = localConfig.activeIndicator === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setLocalConfig({ ...localConfig, activeIndicator: opt.id })}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {opt.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {opt.desc}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Label Display Mode */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  3. การแสดงข้อความป้ายกำกับ (Label Display Mode)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LABEL_MODE_OPTIONS.map((opt) => {
                    const isSelected = localConfig.labelMode === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setLocalConfig({ ...localConfig, labelMode: opt.id })}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                        }`}
                      >
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          {opt.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {opt.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Icon Size & Desktop Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    ขนาดไอคอน (Icon Size)
                  </label>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setLocalConfig({ ...localConfig, iconSize: size })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                          localConfig.iconSize === size
                            ? 'bg-brand text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {size === 'small' ? 'เล็ก (16px)' : size === 'medium' ? 'กลาง (20px)' : 'ใหญ่ (24px)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Monitor size={14} className="text-brand" />
                      แสดงแถบล่างบนหน้าจอคอมพิวเตอร์ (Show on Desktop)
                    </label>
                    <p className="text-[10px] text-slate-400">
                      ปกติแถบล่างจะแสดงบนมือถือและแท็บเล็ต หากเปิดตัวเลือกนี้จะแสดงลอยบนจอคอมพิวเตอร์ด้วย
                    </p>
                  </div>
                  <button
                    onClick={() => setLocalConfig({ ...localConfig, showOnDesktop: !localConfig.showOnDesktop })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      localConfig.showOnDesktop
                        ? 'bg-brand text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{localConfig.showOnDesktop ? 'เปิดใช้งานบน Desktop' : 'ปิดใช้งานบน Desktop (แสดงเฉพาะมือถือ)'}</span>
                    <CheckCircle2 size={15} className={localConfig.showOnDesktop ? 'opacity-100' : 'opacity-40'} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ยกเลิก (Cancel)
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-2xl bg-brand hover:bg-brand/90 text-white text-xs font-bold shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Check size={16} />
            <span>บันทึกการตั้งค่าเมนู</span>
          </button>
        </div>
      </motion.div>

      {/* Edit / Add Menu Item Sub-Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 size={16} className="text-brand" />
                  <span>{isAddingNew ? 'เพิ่มปุ่มเมนูใหม่' : 'แก้ไขปุ่มเมนู'}</span>
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                {/* 1. Label */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ชื่อปุ่มเมนู (Label) *
                  </label>
                  <input
                    type="text"
                    value={editingItem.label}
                    onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand font-bold"
                    placeholder="เช่น ภาพรวม, ขาย POS, รายงาน"
                  />
                </div>

                {/* 2. Action Type & Target */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      ประเภทการทำงาน
                    </label>
                    <select
                      value={editingItem.actionType}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        actionType: e.target.value as BottomNavActionType,
                        targetTab: e.target.value === 'tab' ? 'dashboard' : undefined,
                        quickAction: e.target.value === 'quick_action' ? 'quick_income' : undefined
                      })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
                    >
                      <option value="tab">🔗 สลับไปยังหน้าแท็บ (Page Tab)</option>
                      <option value="quick_action">⚡ คำสั่งลัดด่วน (Quick Action)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {editingItem.actionType === 'tab' ? 'เลือกหน้าแท็บเป้าหมาย' : 'เลือกคำสั่งลัดด่วน'}
                    </label>
                    {editingItem.actionType === 'tab' ? (
                      <select
                        value={editingItem.targetTab || 'dashboard'}
                        onChange={(e) => setEditingItem({ ...editingItem, targetTab: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
                      >
                        <option value="dashboard">ภาพรวมธุรกิจ (Dashboard)</option>
                        <option value="pos">ระบบขาย POS (POS)</option>
                        <option value="history">ประวัติรายการ (History)</option>
                        <option value="reports">รายงานการเงิน (Reports)</option>
                        <option value="customers">ลูกค้า CRM (Customers)</option>
                        <option value="installations">นัดหมาย & ใบรับประกัน (Installations)</option>
                        <option value="users">จัดการสิทธิ์ผู้ใช้งาน (Users)</option>
                        <option value="audit_logs">Audit Log ตรวจสอบระบบ (Audit Logs)</option>
                        <option value="settings">ศูนย์ควบคุมระบบ (Settings)</option>
                      </select>
                    ) : (
                      <select
                        value={editingItem.quickAction || 'quick_income'}
                        onChange={(e) => setEditingItem({ ...editingItem, quickAction: e.target.value as BottomNavQuickAction })}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
                      >
                        <option value="quick_income">+ รับเงินด่วน (Quick Income)</option>
                        <option value="quick_expense">- จ่ายเงินด่วน (Quick Expense)</option>
                        <option value="quick_design">🎨 สลับธีม & ดีไซน์ (Theme Modal)</option>
                        <option value="toggle_theme">🌓 สลับโหมดมืด/สว่าง (Toggle Theme)</option>
                        <option value="pin_lock">🔒 ล็อคหน้าจอด้วย PIN (PIN Lock)</option>
                        <option value="sync_now">🔄 ซิงค์ข้อมูลคลาวด์ (Sync Now)</option>
                        <option value="customize_menu">⚙️ เปิดหน้าต่างปรับแต่งเมนูล่าง</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* 3. Badge Text & Accent Color */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      ป้ายข้อความกำกับ (Badge เช่น NEW, HOT)
                    </label>
                    <input
                      type="text"
                      value={editingItem.badgeText || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, badgeText: e.target.value || undefined })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
                      placeholder="เช่น NEW, ด่วน (เว้นว่างได้)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      สีไอคอนเฉพาะปุ่ม (Accent Color)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editingItem.color || '#3b82f6'}
                        onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                        className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 p-0.5 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={editingItem.color || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value || undefined })}
                        placeholder="ตามธีมหลัก"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Role Visibility Permissions */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Users size={14} className="text-brand" />
                        กำหนดสิทธิ์การมองเห็น (Role-based Visibility)
                      </label>
                      <p className="text-[10px] text-slate-400">
                        เลือกบทบาทที่สามารถมองเห็นและใช้งานปุ่มเมนูนี้ได้
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const allRoles: UserRole[] = ['admin', 'manager', 'staff', 'viewer'];
                        const isAllSelected = editingItem.allowedRoles && editingItem.allowedRoles.length === 4;
                        setEditingItem({
                          ...editingItem,
                          allowedRoles: isAllSelected ? ['admin'] : allRoles
                        });
                      }}
                      className="text-[10px] text-brand font-bold hover:underline cursor-pointer"
                    >
                      {editingItem.allowedRoles && editingItem.allowedRoles.length === 4 ? 'เลือกเฉพาะ Admin' : 'เลือกทั้งหมด (ทุกคน)'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {(
                      [
                        { id: 'admin' as UserRole, label: '👑 Admin (ผู้ดูแลระบบ)', color: 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300' },
                        { id: 'manager' as UserRole, label: '👔 Manager (ผู้จัดการ)', color: 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300' },
                        { id: 'staff' as UserRole, label: '💼 Staff (พนักงาน/ช่าง)', color: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300' },
                        { id: 'viewer' as UserRole, label: '👁️ Viewer (ผู้ดูข้อมูล)', color: 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300' },
                      ]
                    ).map((r) => {
                      const currentRoles = editingItem.allowedRoles || ['admin', 'manager', 'staff', 'viewer'];
                      const isChecked = currentRoles.includes(r.id);

                      return (
                        <label
                          key={r.id}
                          className={`flex items-center space-x-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                            isChecked
                              ? `${r.color} shadow-2xs`
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 bg-white dark:bg-slate-800 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let nextRoles = [...currentRoles];
                              if (e.target.checked) {
                                if (!nextRoles.includes(r.id)) nextRoles.push(r.id);
                              } else {
                                nextRoles = nextRoles.filter(role => role !== r.id);
                                if (nextRoles.length === 0) nextRoles = ['admin']; // At least admin
                              }
                              setEditingItem({ ...editingItem, allowedRoles: nextRoles });
                            }}
                            className="rounded text-brand focus:ring-brand accent-brand cursor-pointer"
                          />
                          <span className="truncate">{r.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Icon Selector Grid */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>เลือกไอคอน (Selected:</span>
                      <span className="text-brand font-extrabold flex items-center gap-1">
                        {renderNavIcon(editingItem.iconName, 15)} {editingItem.iconName}
                      </span>
                      <span>)</span>
                    </label>
                  </div>

                  {/* Icon Search & Filter */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        placeholder="ค้นหาไอคอน..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                    <select
                      value={iconCategory}
                      onChange={(e) => setIconCategory(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Icon Grid */}
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    {filteredIcons.map((ic) => {
                      const isSelected = editingItem.iconName === ic.name;
                      const IconComp = ic.icon;
                      return (
                        <button
                          key={ic.name}
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, iconName: ic.name })}
                          className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand text-white shadow-xs scale-105'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                          }`}
                          title={ic.label}
                        >
                          <IconComp size={18} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sub Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveItemEdit(editingItem)}
                  className="px-5 py-2 rounded-xl bg-brand text-white text-xs font-bold shadow-md hover:bg-brand/90 cursor-pointer"
                >
                  ตกลง (บันทึกปุ่มนี้)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
