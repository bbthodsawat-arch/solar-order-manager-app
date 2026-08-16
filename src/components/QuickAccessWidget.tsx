import { ShoppingBag, Users, UserCheck, Settings, Wrench, Sparkles } from 'lucide-react';

interface QuickAccessWidgetProps {
  onNavigate: (tab: any) => void;
}

export default function QuickAccessWidget({ onNavigate }: QuickAccessWidgetProps) {
  const actions = [
    { id: 'pos', label: 'ระบบขาย POS', icon: ShoppingBag, color: 'emerald' },
    { id: 'customers', label: 'ลูกค้า CRM', icon: UserCheck, color: 'sky' },
    { id: 'users', label: 'จัดการสิทธิ์ User', icon: Users, color: 'purple' },
    { id: 'settings', label: 'ศูนย์ควบคุมระบบ', icon: Wrench, color: 'slate' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Sparkles size={20} className="text-brand" />
        เมนูเข้าถึงด่วน
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 gap-2 cursor-pointer"
            >
              <div className={`p-3 rounded-full bg-${action.color}-100 text-${action.color}-600 dark:bg-${action.color}-900/50 dark:text-${action.color}-400`}>
                <Icon size={24} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-center">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
