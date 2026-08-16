import { useState } from 'react';
import { motion } from 'motion/react';
import { Sliders, Sparkles } from 'lucide-react';
import { 
  BottomNavConfig, 
  BottomNavItemConfig, 
  TransactionType, 
  TransactionCategory 
} from '../../types';
import { renderNavIcon } from './NavIconHelper';
import { BottomNavCustomizerModal } from './BottomNavCustomizerModal';
import { useAuth } from '../../hooks/useAuth';
import { getUserPermissions } from '../../utils/permissions';
import { useTheme } from '../../hooks/useTheme';
import { DEFAULT_BOTTOM_NAV_CONFIG } from '../../hooks/useAppConfig';
import toast from 'react-hot-toast';

interface BottomNavigationBarProps {
  activeTab: string;
  onNavigate: (tab: any) => void;
  config?: BottomNavConfig;
  onUpdateConfig: (newConfig: BottomNavConfig) => void;
  onResetDefaults: () => void;
  onQuickAdd?: (type: TransactionType, category: TransactionCategory, detail?: string, amount?: number) => void;
  onOpenQuickDesign?: () => void;
  onLockApp?: () => void;
  onSyncNow?: () => void;
}

export function BottomNavigationBar({
  activeTab,
  onNavigate,
  config = DEFAULT_BOTTOM_NAV_CONFIG,
  onUpdateConfig,
  onResetDefaults,
  onQuickAdd,
  onOpenQuickDesign,
  onLockApp,
  onSyncNow
}: BottomNavigationBarProps) {
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const { appUser, user } = useAuth();
  const { toggleTheme } = useTheme();
  const userPerms = getUserPermissions(appUser);
  const isAdminOrOwner = appUser?.role === 'admin' || user?.email?.toLowerCase() === 'b.b.thodsawat@gmail.com';

  const currentRole = appUser?.role || (isAdminOrOwner ? 'admin' : 'viewer');

  const items = (config?.items || DEFAULT_BOTTOM_NAV_CONFIG.items).filter(i => {
    if (!i.isActive) return false;
    if (!i.allowedRoles || i.allowedRoles.length === 0) return true;
    if (isAdminOrOwner) return true;
    return i.allowedRoles.includes(currentRole);
  });
  const styleType = config?.styleType || 'floating-capsule';
  const activeIndicator = config?.activeIndicator || 'pill';
  const labelMode = config?.labelMode || 'all';
  const iconSize = config?.iconSize || 'medium';
  const showOnDesktop = config?.showOnDesktop || false;

  const iconPx = iconSize === 'small' ? 17 : iconSize === 'large' ? 24 : 20;

  const handleItemClick = (item: BottomNavItemConfig) => {
    if (item.actionType === 'tab' && item.targetTab) {
      // Permission checks
      if (item.targetTab === 'dashboard' && !userPerms.canViewDashboard) {
        toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้าแดชบอร์ด');
        return;
      }
      if (item.targetTab === 'pos' && !userPerms.canAddTransactions) {
        toast.error('คุณไม่มีสิทธิ์เข้าถึงระบบขาย POS');
        return;
      }
      if (item.targetTab === 'reports' && !userPerms.canViewReports) {
        toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้ารายงาน');
        return;
      }
      if (item.targetTab === 'audit_logs' && !userPerms.canViewAuditLogs && !isAdminOrOwner) {
        toast.error('คุณไม่มีสิทธิ์เข้าถึง Audit Logs');
        return;
      }
      if (item.targetTab === 'users' && !isAdminOrOwner && appUser?.role !== 'manager') {
        toast.error('คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
        return;
      }

      onNavigate(item.targetTab);
      return;
    }

    if (item.actionType === 'quick_action') {
      switch (item.quickAction) {
        case 'quick_income':
          if (!userPerms.canAddTransactions) {
            toast.error('คุณไม่มีสิทธิ์เพิ่มรายการ');
            return;
          }
          if (onQuickAdd) {
            onQuickAdd('income', 'รายรับจาก Sale order', 'รายรับด่วน');
          } else {
            onNavigate('pos');
          }
          break;

        case 'quick_expense':
          if (!userPerms.canAddTransactions) {
            toast.error('คุณไม่มีสิทธิ์เพิ่มรายการ');
            return;
          }
          if (onQuickAdd) {
            onQuickAdd('expense', 'ค่าใช้จ่ายอื่นๆ', 'รายจ่ายด่วน');
          } else {
            onNavigate('pos');
          }
          break;

        case 'toggle_theme':
          toggleTheme();
          break;

        case 'quick_design':
          if (onOpenQuickDesign) {
            onOpenQuickDesign();
          } else {
            setIsCustomizerOpen(true);
          }
          break;

        case 'pin_lock':
          if (onLockApp) {
            onLockApp();
          } else {
            toast('กำลังล็อคหน้าจอ...');
          }
          break;

        case 'sync_now':
          if (onSyncNow) {
            onSyncNow();
          } else {
            toast.success('เริ่มการซิงค์ข้อมูลคลาวด์');
          }
          break;

        case 'customize_menu':
          setIsCustomizerOpen(true);
          break;

        default:
          break;
      }
    }
  };

  // Determine container styling classes based on styleType
  const getContainerStyle = () => {
    switch (styleType) {
      case 'floating-capsule':
        return 'fixed bottom-2.5 left-2.5 right-2.5 max-w-2xl mx-auto bg-slate-900/92 dark:bg-slate-900/92 text-white backdrop-blur-xl border border-slate-750/80 rounded-3xl pb-safe shadow-[0_12px_36px_rgba(0,0,0,0.35)] z-40';
      case 'dock-modern':
        return 'fixed bottom-3 left-4 right-4 max-w-xl mx-auto bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-2xl border border-slate-700/70 rounded-2xl pb-safe shadow-2xl z-40';
      case 'glassmorphism':
        return 'fixed bottom-2 left-2 right-2 max-w-2xl mx-auto bg-slate-900/75 dark:bg-slate-900/75 text-white backdrop-blur-2xl border border-white/20 rounded-3xl pb-safe shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-40';
      case 'neon-glow':
        return 'fixed bottom-2.5 left-2.5 right-2.5 max-w-2xl mx-auto bg-slate-950 text-white border border-brand/50 rounded-3xl pb-safe shadow-[0_0_25px_rgba(59,130,246,0.35)] z-40';
      case 'classic-edge':
      default:
        return 'fixed bottom-0 left-0 right-0 bg-slate-900/98 dark:bg-slate-900/98 text-white border-t border-slate-800 pb-safe shadow-2xl z-40';
    }
  };

  const visibilityClass = showOnDesktop ? 'block' : 'lg:hidden';

  return (
    <>
      <nav className={`${getContainerStyle()} ${visibilityClass} transition-all duration-300`}>
        <div className="flex items-center justify-between h-15 sm:h-16 px-1.5 sm:px-2 relative">
          
          {/* Scrollable nav items list */}
          <div className="flex-1 flex items-center justify-around overflow-x-auto no-scrollbar gap-1 py-1">
            {items.map((item) => {
              const isActive = item.actionType === 'tab' && activeTab === item.targetTab;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`relative flex flex-col items-center justify-center min-w-[50px] sm:min-w-[58px] px-1.5 py-1 rounded-2xl transition-all cursor-pointer shrink-0 ${
                    isActive 
                      ? 'text-white font-extrabold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={item.label}
                >
                  {/* Active Indicator: Pill */}
                  {isActive && activeIndicator === 'pill' && (
                    <motion.div
                      layoutId="activeBottomNavPill"
                      className="absolute inset-0 bg-brand rounded-2xl shadow-sm -z-0"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}

                  {/* Active Indicator: Glow Border */}
                  {isActive && activeIndicator === 'glow-border' && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-brand shadow-[0_0_12px_rgba(59,130,246,0.5)] -z-0" />
                  )}

                  {/* Icon & Label Container */}
                  <div className={`relative z-10 flex flex-col items-center justify-center ${
                    isActive && activeIndicator === 'scale-bounce' ? 'scale-110 text-brand' : ''
                  }`}>
                    <div 
                      className={`p-1 rounded-xl transition-all ${
                        isActive && activeIndicator !== 'pill' ? 'text-brand' : ''
                      }`}
                      style={{ color: !isActive && item.color ? item.color : undefined }}
                    >
                      {renderNavIcon(item.iconName, iconPx)}
                    </div>

                    {/* Active Indicator: Dot */}
                    {isActive && activeIndicator === 'dot' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(59,130,246,0.9)] mt-0.5" />
                    )}

                    {/* Label display based on labelMode */}
                    {(labelMode === 'all' || (labelMode === 'active-only' && isActive)) && (
                      <span className="text-[9.5px] sm:text-[10px] font-bold tracking-tight truncate max-w-[62px] leading-tight">
                        {item.label}
                      </span>
                    )}

                    {/* Optional Badge */}
                    {item.badgeText && (
                      <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-rose-500 text-white rounded-full text-[7.5px] font-black uppercase shadow-xs">
                        {item.badgeText}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mini Customize Menu Trigger Button */}
          <div className="pl-1 pr-1 border-l border-slate-700/60 shrink-0">
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-brand/20 text-slate-400 hover:text-brand transition-all border border-slate-700/60 cursor-pointer flex flex-col items-center justify-center group"
              title="จัดการและปรับแต่งเมนูแถบล่าง (Customize Bottom Navigation)"
            >
              <Sliders size={14} className="group-hover:rotate-45 transition-transform" />
              <span className="text-[7.5px] font-bold mt-0.5 opacity-60 group-hover:opacity-100 hidden sm:block">
                ปรับแต่ง
              </span>
            </button>
          </div>

        </div>
      </nav>

      {/* Interactive Bottom Nav Customizer Modal */}
      <BottomNavCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        config={config}
        onSaveConfig={onUpdateConfig}
        onResetDefaults={onResetDefaults}
      />
    </>
  );
}
