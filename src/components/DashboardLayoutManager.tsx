import React, { useState } from 'react';
import { Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw, LayoutGrid, Check, Sparkles } from 'lucide-react';
import { DashboardWidgetConfig } from '../types';
import { DEFAULT_WIDGET_CONFIG } from '../hooks/useAppConfig';
import toast from 'react-hot-toast';

interface DashboardLayoutManagerProps {
  widgets: DashboardWidgetConfig;
  onUpdateWidgetConfig: (updates: Partial<DashboardWidgetConfig>) => void;
}

const WIDGET_DETAILS: Record<string, { label: string; desc: string; category: string }> = {
  showPinnedMetrics: { label: '📌 ตัวชี้วัดสำคัญปักหมุดด่วน', desc: 'แถบตัวชี้วัดด่วนด้านบนสุดสำหรับผู้ดูแลระบบ', category: 'Executive Section' },
  showDailyRevenueGoal: { label: '🎯 เป้าหมายยอดขายรายวัน', desc: 'แสดงหลอดความคืบหน้าเทียบเป้าหมายรายวัน', category: 'Goals & Targets' },
  showSmartBudgetAlerts: { label: '⚡ การแจ้งเตือนงบประมาณอัจฉริยะ', desc: 'แจ้งเตือนสถานะงบประมาณและสุขภาพการเงิน', category: 'Alerts' },
  showTotalIncome: { label: '📈 การ์ดรายรับรวม (KPI)', desc: 'การ์ดแสดงยอดรายรับพร้อมกราฟแนวโน้ม 30 วัน', category: 'KPI Cards' },
  showTotalExpense: { label: '📉 การ์ดรายจ่ายรวม (KPI)', desc: 'การ์ดแสดงยอดรายจ่ายและสถิติรายจ่าย', category: 'KPI Cards' },
  showNetProfit: { label: '💰 การ์ดกำไรสุทธิ (KPI)', desc: 'คำนวณและแสดงกำไรสุทธิและอัตรากำไร', category: 'KPI Cards' },
  showUnpaid: { label: '⏳ การ์ดยอดค้างชำระ (KPI)', desc: 'แสดงยอดค้างชำระและรายการที่ยังไม่ชำระเงิน', category: 'KPI Cards' },
  showSolarSales: { label: '☀️ การ์ดยอดขายโซล่าเซลล์ (KPI)', desc: 'สรุปยอดขายและจำนวนระบบโซล่าเซลล์', category: 'KPI Cards' },
  showWeeklyTrend: { label: '📊 สัดส่วนรายรับ-รายจ่าย สัปดาห์นี้', desc: 'กราฟแท่งเปรียบเทียบกระแสเงินสดรายสัปดาห์', category: 'Analytics' },
  showCategorySalesSummary: { label: '🏷️ สรุปยอดขายแยกตามหมวดหมู่', desc: 'การ์ดสรุปยอดขายตามประเภทสินค้าโซล่าเซลล์', category: 'Analytics' },
  showQuickShortcuts: { label: '⚡ ทางลัดบันทึกด่วน (Quick Actions)', desc: 'ปุ่มลัดสำหรับบันทึกรายการขายหรือค่าใช้จ่าย', category: 'Operations' },
  showDueAlerts: { label: '🔔 แจ้งเตือนรายการครบกำหนด', desc: 'แจ้งเตือนบิลหรือการชำระเงินที่ใกล้ครบกำหนด', category: 'Alerts' },
  showTrendChart: { label: '📈 กราฟแนวโน้มรายรับ-รายจ่าย 30 วัน', desc: 'กราฟเส้นแสดงสถิติย้อนหลังรายวัน', category: 'Charts' },
  showCategoryBreakdown: { label: '🥧 แผนภูมิวงกลมสัดส่วนค่าใช้จ่าย', desc: 'แสดงสัดส่วนค่าใช้จ่ายตามหมวดหมู่', category: 'Charts' },
  showMonthlyBudget: { label: '📅 เป้าหมายงบประมาณรายเดือน', desc: 'สรุปงบประมาณและเป้าหมายประจำเดือน', category: 'Goals & Targets' },
  showStockInventory: { label: '📦 ตารางสต็อกสินค้าคงเหลือ', desc: 'แสดงสถานะคลังสินค้าและอุปกรณ์โซล่าเซลล์', category: 'Inventory & Notes' },
  showQuickNotes: { label: '📝 บันทึกช่วยจำด่วน (Quick Notes)', desc: 'พื้นที่จดโน้ตเตือนความจำสำหรับทีมงาน', category: 'Inventory & Notes' },
  showRecentSolarTable: { label: '☀️ ตารางออเดอร์โซล่าเซลล์ล่าสุด', desc: 'รายการ Sale order และสถานะการติดตั้ง', category: 'Recent Tables' },
  showRecentTransactionsList: { label: '📋 รายการธุรกรรมล่าสุด', desc: 'รายการบันทึกรายรับ-รายจ่ายล่าสุด', category: 'Recent Tables' },
};

export default function DashboardLayoutManager({ widgets, onUpdateWidgetConfig }: DashboardLayoutManagerProps) {
  const currentOrder = widgets.widgetsOrder && widgets.widgetsOrder.length > 0
    ? widgets.widgetsOrder
    : Object.keys(WIDGET_DETAILS);

  // Ensure all keys exist in order array
  const allKeys = Object.keys(WIDGET_DETAILS);
  const orderedKeys = Array.from(new Set([...currentOrder.filter(k => allKeys.includes(k)), ...allKeys]));

  const handleToggle = (key: string) => {
    const currentVal = Boolean((widgets as any)[key]);
    onUpdateWidgetConfig({ [key]: !currentVal });
    toast.success(`อัปเดตการแสดงผลวิดเจ็ตเรียบร้อย`, { icon: '✨' });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...orderedKeys];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    onUpdateWidgetConfig({ widgetsOrder: newOrder });
    toast.success('จัดลำดับวิดเจ็ตสำเร็จ', { icon: '🔄' });
  };

  const handleReset = () => {
    onUpdateWidgetConfig(DEFAULT_WIDGET_CONFIG);
    toast.success('คืนค่าเริ่มต้นการตั้งค่า Dashboard เรียบร้อย', { icon: '↺' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center">
              <span>ศูนย์ควบคุมการแสดงผลและลำดับหน้าแรก (Dashboard Control Center)</span>
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              กำหนดสิทธิ์การแสดงผล (Toggle Visibility) และจัดลำดับการแสดงผล (Reorder Layout) ของวิดเจ็ตทั้งหมด
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>คืนค่าเริ่มต้นระบบ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {orderedKeys.map((key, index) => {
          const detail = WIDGET_DETAILS[key];
          if (!detail) return null;
          const isVisible = Boolean((widgets as any)[key]);

          return (
            <div
              key={key}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-3 ${
                isVisible
                  ? 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-2xs'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="เลื่อนขึ้น"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === orderedKeys.length - 1}
                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="เลื่อนลง"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                  isVisible ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                  #{index + 1}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{detail.label}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {detail.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{detail.desc}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <button
                  onClick={() => handleToggle(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
                    isVisible
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                  }`}
                >
                  {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{isVisible ? 'แสดงผลอยู่ (Active)' : 'ซ่อนวิดเจ็ต (Hidden)'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start space-x-3 text-xs text-amber-800 dark:text-amber-300">
        <Sparkles size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">คำแนะนำสำหรับผู้ดูแลระบบ:</span> การเปลี่ยนแปลงลำดับและสถานะการแสดงผลจะถูกบันทึกและมีผลทันทีบนหน้าภาพรวม (Dashboard) ของผู้ใช้งานทุกคนในระบบ
        </div>
      </div>
    </div>
  );
}
