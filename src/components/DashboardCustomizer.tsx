import { X, Eye, EyeOff, RotateCcw, Bell, BellOff, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';
import { DashboardWidgetConfig } from '../types';

interface DashboardCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidgetConfig;
  onToggle: (key: keyof DashboardWidgetConfig) => void;
  onReset: () => void;
  onMove: (key: keyof DashboardWidgetConfig, direction: 'up' | 'down') => void;
}

const WIDGET_LABELS: Record<string, string> = {
  showPinnedMetrics: '📌 ตัวชี้วัดสำคัญปักหมุดด่วน (Admin Pinned Key Metrics)',
  showDailyRevenueGoal: 'เป้าหมายยอดขายรายวัน (Daily Revenue Goal & Progress)',
  showSmartBudgetAlerts: 'การแจ้งเตือนงบประมาณอัจฉริยะ (Smart Budget Alerts)',
  showTotalIncome: 'ยอดรายรับรวม (KPI)',
  showTotalExpense: 'ยอดรายจ่ายรวม (KPI)',
  showNetProfit: 'กำไรสุทธิ (KPI)',
  showUnpaid: 'ยอดค้างชำระ (KPI)',
  showSolarSales: 'ยอดขายโซล่าเซลล์ (KPI)',
  showCategorySalesSummary: 'สรุปยอดขายแยกตามหมวดหมู่สินค้า (Modern Card)',
  showQuickShortcuts: 'ทางลัดบันทึกด่วน',
  showDueAlerts: 'การแจ้งเตือนยอดค้างชำระ',
  showTrendChart: 'กราฟแนวโน้มรายรับ-รายจ่าย',
  showCategoryBreakdown: 'แผนภูมิสัดส่วนรายจ่าย',
  showMonthlyBudget: 'เป้าหมายงบประมาณรายเดือน',
  showStockInventory: 'ตารางสต็อกสินค้า',
  showQuickNotes: 'บันทึกช่วยจำด่วน',
  showRecentSolarTable: 'ตารางออเดอร์โซล่าเซลล์ล่าสุด',
  showRecentTransactionsList: 'รายการธุรกรรมล่าสุด',
};

export default function DashboardCustomizer({ isOpen, onClose, widgets, onToggle, onReset, onMove }: DashboardCustomizerProps) {
  if (!isOpen) return null;
  const widgetOrder = widgets.widgetsOrder ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div><h2 className="text-xl font-black text-gray-900 dark:text-white">ปรับแต่งหน้าแรก</h2><p className="text-xs text-gray-500 dark:text-gray-400">เลือกแสดง/ซ่อน และจัดลำดับวิดเจ็ต</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 gap-3">
            {widgetOrder.map((key) => {
              if (!WIDGET_LABELS[key]) return null;
              const isActive = widgets[key as keyof DashboardWidgetConfig];
              return <div key={key} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isActive ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 text-gray-500'}`}>
                <button onClick={() => onToggle(key as keyof DashboardWidgetConfig)} className="flex items-center space-x-3 flex-1 text-left"><div className={`p-2 rounded-xl ${isActive ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>{isActive ? <Eye size={18} /> : <EyeOff size={18} />}</div><span className="text-sm font-bold">{WIDGET_LABELS[key]}</span></button>
                <div className="flex items-center space-x-1"><button onClick={() => onMove(key as keyof DashboardWidgetConfig, 'up')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><ArrowUp size={16}/></button><button onClick={() => onMove(key as keyof DashboardWidgetConfig, 'down')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><ArrowDown size={16}/></button></div>
              </div>;
            })}
          </div>
          <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6"><h3 className="text-sm font-black text-gray-900 dark:text-white mb-3">การแจ้งเตือน (Notifications)</h3><button onClick={() => onToggle('enableGoalNotifications')} className={`flex w-full items-center justify-between p-4 rounded-2xl border transition-all ${widgets.enableGoalNotifications ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 text-gray-500'}`}><div className="flex items-center space-x-3"><div className={`p-2 rounded-xl ${widgets.enableGoalNotifications ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>{widgets.enableGoalNotifications ? <Bell size={18} /> : <BellOff size={18} />}</div><div className="text-left"><span className="text-sm font-bold block">แจ้งเตือนเมื่อถึงเป้าหมายรายวัน</span><span className="text-xs text-gray-500 dark:text-gray-400 block">รับ Push Notification เมื่อยอดขายถึงเป้าหมาย</span></div></div><div className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${widgets.enableGoalNotifications ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${widgets.enableGoalNotifications ? 'right-1' : 'left-1'}`} /></div></button></div>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between gap-3"><button onClick={onReset} className="flex items-center space-x-2 px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><RotateCcw size={16} /><span>คืนค่าเริ่มต้น</span></button><button onClick={onClose} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-lg transition-all active:scale-95">บันทึกและปิด</button></div>
      </motion.div>
    </div>
  );
}
