import React, { useState } from 'react';
import { useInventory, StockItem } from '../hooks/useInventory';
import { 
  Package, Search, Plus, Minus, AlertTriangle, 
  CheckCircle2, RotateCcw, Box, SlidersHorizontal, 
  Palette, Settings2, Sparkles, Check, ChevronDown, Eye 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useAppConfig } from '../hooks/useAppConfig';
import { useTheme } from '../hooks/useTheme';
import type { DashboardCardDesignConfig, DashboardCardThemePreset, DashboardCardBorderRadius, DashboardCardShadow } from '../types';
import { getComputedCardColor, DEFAULT_DASHBOARD_CARD_DESIGN } from '../utils/dashboardCardPresets';

export default function StockReportCard() {
  const { items, updateQuantity, setStockQuantity, addStockItem, resetInventory, outOfStockCount, lowStockCount } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempQty, setTempQty] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Individual stock card style config (persisted in localStorage)
  const [stockDesign, setStockDesign] = useState<{
    themePreset: string;
    borderRadius: string;
    shadowStyle: string;
    headerAccentStyle: string;
    enableHoverScale: boolean;
    useKPISync: boolean;
  }>(() => {
    const saved = localStorage.getItem('solar_app_stock_card_design');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      themePreset: 'solar_sunburst',
      borderRadius: 'rounded-3xl',
      shadowStyle: 'soft',
      headerAccentStyle: 'gradient-top',
      enableHoverScale: true,
      useKPISync: true
    };
  });

  const updateStockDesign = (updates: Partial<typeof stockDesign>) => {
    setStockDesign(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('solar_app_stock_card_design', JSON.stringify(next));
      return next;
    });
  };

  const { config } = useAppConfig();
  const kpiDesign = config?.dashboardCardDesign || DEFAULT_DASHBOARD_CARD_DESIGN;
  const { isDarkMode } = useTheme();

  const activeDesign: DashboardCardDesignConfig = stockDesign.useKPISync ? kpiDesign : {
    ...DEFAULT_DASHBOARD_CARD_DESIGN,
    themePreset: stockDesign.themePreset as DashboardCardThemePreset,
    borderRadius: stockDesign.borderRadius as DashboardCardBorderRadius,
    shadowStyle: stockDesign.shadowStyle as DashboardCardShadow,
    enableHoverScale: stockDesign.enableHoverScale,
  };

  const cardColors = getComputedCardColor('solar_sales', activeDesign, isDarkMode);

  const bgGradientFrom = isDarkMode ? (cardColors.darkBgGradientFrom || cardColors.bgGradientFrom) : cardColors.bgGradientFrom;
  const bgGradientTo = isDarkMode ? (cardColors.darkBgGradientTo || cardColors.bgGradientTo) : cardColors.bgGradientTo;
  const textColor = isDarkMode ? (cardColors.darkTextColor || '#1e293b') : cardColors.textColor;
  const borderColor = isDarkMode ? (cardColors.darkBorderColor || cardColors.borderColor) : cardColors.borderColor;
  const accentColor = cardColors.accentColor || '#f59e0b';

  // Compute three-point gradients or fallback
  const bgGradientVia = cardColors.bgGradientVia;
  const backgroundStyle = bgGradientVia
    ? `linear-gradient(135deg, ${bgGradientFrom}, ${bgGradientVia}, ${bgGradientTo})`
    : `linear-gradient(135deg, ${bgGradientFrom}, ${bgGradientTo})`;

  const bgStyle = {
    backgroundImage: backgroundStyle,
    color: textColor,
    borderColor: borderColor,
  };

  // Resolve border radius class
  const radiusClass = 
    activeDesign.borderRadius === 'rounded-xl' ? 'rounded-xl' :
    activeDesign.borderRadius === 'rounded-2xl' ? 'rounded-2xl' :
    activeDesign.borderRadius === 'rounded-full-pill' ? 'rounded-[2rem]' : 'rounded-3xl';

  // Resolve shadow class
  const shadowClass = 
    activeDesign.shadowStyle === 'glow' ? `shadow-lg ring-1 ring-${accentColor}/30` :
    activeDesign.shadowStyle === 'floating' ? 'shadow-xl -translate-y-0.5' :
    activeDesign.shadowStyle === 'flat' ? 'shadow-none border-2' : 'shadow-md';

  // Hover scale
  const hoverClass = activeDesign.enableHoverScale ? 'hover:scale-[1.005] hover:shadow-lg transition-all duration-300' : 'transition-all duration-300';

  // Form states for new item
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('ตัว');

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEdit = (item: StockItem) => {
    setEditingId(item.id);
    setTempQty(item.quantity.toString());
  };

  const handleSaveEdit = (id: string) => {
    const val = parseInt(tempQty, 10);
    if (!isNaN(val)) {
      setStockQuantity(id, val);
      toast.success('อัปเดตจำนวนสินค้าเรียบร้อย');
    }
    setEditingId(null);
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('กรุณากรอกชื่อสินค้า');
      return;
    }
    const skuCode = newSku.trim() || `SKU${(items.length + 1).toString().padStart(3, '0')}`;
    const qtyVal = parseInt(newQty, 10) || 0;

    addStockItem({
      sku: skuCode,
      name: newName.trim(),
      quantity: qtyVal,
      unit: newUnit.trim() || 'ตัว',
      minAlert: 2
    });

    toast.success('เพิ่มรายการสินค้าใหม่สำเร็จ');
    setShowAddModal(false);
    setNewName('');
    setNewSku('');
    setNewQty('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden transition-all duration-300 ${radiusClass} ${shadowClass} ${hoverClass} p-5 sm:p-6 border`}
      style={bgStyle}
    >
      {/* Soft pastel decorative gradient header accent */}
      {stockDesign.headerAccentStyle === 'gradient-top' && (
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-200 via-orange-300 to-amber-200 dark:from-amber-600 dark:via-orange-500 dark:to-amber-600" />
      )}
      {stockDesign.headerAccentStyle === 'solid-top' && (
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: accentColor }} />
      )}

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pt-1">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold border shadow-sm transition-all shrink-0"
              style={{ 
                backgroundColor: cardColors.iconBgColor || 'rgba(245, 158, 11, 0.1)',
                color: cardColors.iconColor || accentColor,
                borderColor: cardColors.borderColor 
              }}
            >
              <Box size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight" style={{ color: textColor }}>
                รายงานตารางสินค้าคงเหลือ
              </h3>
              <p className="text-[11px] font-medium opacity-80">
                เช็กสต็อกคลังอุปกรณ์โซล่าเซลล์ อะไหล่ และระบบควบคุม ({items.length} รายการ)
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls, Search & Style Settings */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า / SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white/85 dark:bg-slate-900/85 border rounded-xl outline-none text-slate-900 dark:text-white w-36 sm:w-44 transition-colors font-medium shadow-2xs focus:ring-1 focus:ring-amber-500/35"
              style={{ borderColor: borderColor }}
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center shadow-sm transition-all hover:shadow active:scale-95 cursor-pointer"
          >
            <Plus size={14} className="mr-1" />
            เพิ่มสินค้า
          </button>

          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all border shadow-2xs active:scale-95 cursor-pointer ${
              showCustomizer 
                ? 'bg-amber-500 text-white border-amber-500' 
                : 'bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            style={{ borderColor: showCustomizer ? 'transparent' : borderColor }}
            title="ปรับปรุงสไตล์และธีม"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Style Customizer Drawer */}
      <AnimatePresence>
        {showCustomizer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5 text-xs font-medium"
            transition={{ duration: 0.25 }}
          >
            <div className="p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs rounded-2xl border space-y-4 shadow-2xs text-slate-800 dark:text-slate-200" style={{ borderColor: borderColor }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Palette size={16} className="text-amber-500" />
                  <span className="font-black">ปรับแต่งสไตล์และธีมตารางสต็อก</span>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-xl font-bold border border-amber-500/20 text-[11px] select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={stockDesign.useKPISync}
                    onChange={(e) => updateStockDesign({ useKPISync: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
                  />
                  <span>ซิงค์แบบเรียลไทม์กับการ์ด KPI</span>
                </label>
              </div>

              {!stockDesign.useKPISync ? (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/40 dark:border-slate-800/40"
                >
                  {/* Theme preset selector */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">ชุดสีธีม (Theme Palette)</label>
                    <select
                      value={stockDesign.themePreset}
                      onChange={(e) => updateStockDesign({ themePreset: e.target.value })}
                      className="w-full px-3 py-2 bg-white/90 dark:bg-slate-900/90 border rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none text-xs"
                      style={{ borderColor: borderColor }}
                    >
                      <option value="pastel_soft">Soft Pastel Glow (พาสเทลละมุน)</option>
                      <option value="vibrant_gradient">Vibrant Gradient (เกรเดียนท์สดใส)</option>
                      <option value="solar_sunburst">Solar Sunburst (พลังแสงอาทิตย์)</option>
                      <option value="emerald_wealth">Emerald Wealth (มรกตมั่งคั่ง)</option>
                      <option value="modern_glass">Frosted Glass (กระจกใสฝ้า)</option>
                      <option value="nordic_frost">Nordic Slate (สแกนดิเนเวีย)</option>
                      <option value="cyber_neon">Cyber Neon (นีออนไซเบอร์)</option>
                      <option value="minimal_clean">Minimal Clean (คลีนขาวสะอาด)</option>
                    </select>
                  </div>

                  {/* Border radius selector */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">ขอบมุมโค้ง (Border Radius)</label>
                    <select
                      value={stockDesign.borderRadius}
                      onChange={(e) => updateStockDesign({ borderRadius: e.target.value })}
                      className="w-full px-3 py-2 bg-white/90 dark:bg-slate-900/90 border rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none text-xs"
                      style={{ borderColor: borderColor }}
                    >
                      <option value="rounded-xl">Rounded XL (โค้งเหลี่ยมโมเดิร์น)</option>
                      <option value="rounded-2xl">Rounded 2XL (โค้งมนสมดุล)</option>
                      <option value="rounded-3xl">Rounded 3XL (โค้งมนสมบูรณ์แบบ)</option>
                      <option value="rounded-full-pill">Rounded Pill (ขอบแบบแคปซูล)</option>
                    </select>
                  </div>

                  {/* Shadow style selector */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">สไตล์เงา & มิติ (Shadow & Depth)</label>
                    <select
                      value={stockDesign.shadowStyle}
                      onChange={(e) => updateStockDesign({ shadowStyle: e.target.value })}
                      className="w-full px-3 py-2 bg-white/90 dark:bg-slate-900/90 border rounded-xl font-bold text-slate-800 dark:text-slate-200 outline-none text-xs"
                      style={{ borderColor: borderColor }}
                    >
                      <option value="flat">Flat Design (เรียบสไตล์มินิมอล)</option>
                      <option value="soft">Soft Ambient (เงามิติละมุนตา)</option>
                      <option value="glow">Neon Glow (เรืองแสงสีนีออน)</option>
                      <option value="floating">Floating (ลอยกึ่งนูนกึ่งจม)</option>
                    </select>
                  </div>
                </motion.div>
              ) : (
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 flex items-center gap-2 text-[11px] font-bold">
                  <Sparkles size={14} className="animate-pulse" />
                  <span>ระบบกำลังเชื่อมข้อมูลสไตล์สี เกรเดียนท์ ขอบมน และมิติเงา ตามค่าที่คุณปรับแต่งในการ์ด KPI กลางโดยตรง!</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/40 dark:border-slate-800/40 text-[11px]">
                <div className="flex items-center flex-wrap gap-4">
                  <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-600 dark:text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={stockDesign.enableHoverScale}
                      onChange={(e) => updateStockDesign({ enableHoverScale: e.target.checked })}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>เอฟเฟกต์ซูมยกตัวเมื่อวางเมาส์ (Hover Lift Effect)</span>
                  </label>
                  
                  <div className="flex items-center space-x-1.5 font-bold text-slate-600 dark:text-slate-400">
                    <span className="text-[10px] uppercase text-slate-400 font-extrabold">แถบประดับด้านบน:</span>
                    <select
                      value={stockDesign.headerAccentStyle}
                      onChange={(e) => updateStockDesign({ headerAccentStyle: e.target.value })}
                      className="px-2 py-1 bg-white/90 dark:bg-slate-900/90 border rounded-lg font-bold outline-none"
                      style={{ borderColor: borderColor }}
                    >
                      <option value="gradient-top">สไตล์เกรเดียนท์</option>
                      <option value="solid-top">สีพื้นแบนเนอร์</option>
                      <option value="none">ไม่มีแถบ</option>
                    </select>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const defaultDesign = {
                      themePreset: 'solar_sunburst',
                      borderRadius: 'rounded-3xl',
                      shadowStyle: 'soft',
                      headerAccentStyle: 'gradient-top',
                      enableHoverScale: true,
                      useKPISync: true
                    };
                    setStockDesign(defaultDesign);
                    localStorage.setItem('solar_app_stock_card_design', JSON.stringify(defaultDesign));
                    toast.success('รีเซ็ตสไตล์สินค้าคงเหลือเรียบร้อยแล้ว');
                  }}
                  className="text-slate-400 hover:text-rose-500 font-bold hover:underline self-end sm:self-auto shrink-0 transition-colors"
                >
                  คืนค่าสไตล์เริ่มต้น
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Quick Alert Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs border shadow-2xs" style={{ borderColor: borderColor, color: textColor }}>
          📦 รวม {items.reduce((s, i) => s + i.quantity, 0)} ชิ้น/ตัว
        </span>
        {outOfStockCount > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 shadow-2xs animate-pulse">
            <AlertTriangle size={13} className="mr-1 text-rose-500" />
            สินค้าหมด {outOfStockCount} รายการ
          </span>
        )}
        {lowStockCount > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shadow-2xs">
            ⚠️ สินค้าใกล้หมด {lowStockCount} รายการ
          </span>
        )}
      </div>

      {/* Stock Items Table */}
      <div 
        className="overflow-x-auto rounded-2xl border shadow-2xs bg-white/75 dark:bg-slate-900/75 backdrop-blur-xs transition-all"
        style={{ borderColor: borderColor }}
      >
        <table className="w-full text-xs text-left whitespace-nowrap">
          <thead>
            <tr 
              className="border-b"
              style={{ 
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.45)',
                borderColor: borderColor 
              }}
            >
              <th className="py-2.5 px-4 font-black w-12 text-center text-slate-500 dark:text-slate-400">ลำดับ</th>
              <th className="py-2.5 px-3 font-black text-slate-700 dark:text-slate-300">รายการสินค้า (SKU)</th>
              <th className="py-2.5 px-3 font-black text-center text-slate-700 dark:text-slate-300">สถานะ</th>
              <th className="py-2.5 px-3 font-black text-right text-slate-700 dark:text-slate-300">คงเหลือ</th>
              <th className="py-2.5 px-4 font-black text-center w-28 text-slate-700 dark:text-slate-300">จัดการสต็อก</th>
            </tr>
          </thead>
          <tbody className="divide-y text-slate-700 dark:text-slate-300" style={{ borderColor: borderColor }}>
            {filteredItems.map((item, index) => {
              const isZero = item.quantity === 0;
              const isLow = item.quantity <= item.minAlert && item.quantity > 0;

              return (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-500/5 dark:hover:bg-slate-400/5 transition-colors"
                >
                  <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-xs font-bold">
                    {index + 1}
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {item.name} <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px] font-mono">({item.sku})</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    {isZero ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        🔴 สินค้าหมด
                      </span>
                    ) : isLow ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        🟡 ใกล้หมด
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        🟢 มีสินค้า
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    {editingId === item.id ? (
                      <div className="flex items-center justify-end space-x-1.5">
                        <input
                          type="number"
                          value={tempQty}
                          onChange={(e) => setTempQty(e.target.value)}
                          className="w-16 px-2 py-1 text-center font-black text-xs bg-white dark:bg-slate-800 border border-amber-500 rounded-lg outline-none text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500/50"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(item.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow-2xs transition-all active:scale-95"
                        >
                          บันทึก
                        </button>
                      </div>
                    ) : (
                      <span 
                        onClick={() => handleStartEdit(item)}
                        className={`font-black text-xs sm:text-sm cursor-pointer hover:underline border-b border-dashed border-slate-300 dark:border-slate-700 pb-0.5 ${
                          isZero ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                        title="คลิกเพื่อแก้ไขจำนวนสต็อกโดยตรง"
                      >
                        {item.quantity} {item.unit}
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 0}
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                        title="ลดจำนวนลง 1 ชิ้น"
                      >
                        <Minus size={13} />
                      </button>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 transition-all active:scale-90"
                        title="เพิ่มจำนวนขึ้น 1 ชิ้น"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-500/5">
                  ไม่พบรายการสินค้าที่ตรงตามเงื่อนไขการค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Reset & Helper */}
      <div className="flex items-center justify-between pt-3 mt-4 text-[11px] text-slate-400 border-t" style={{ borderColor: borderColor }}>
        <span className="opacity-80">💡 คลิกที่ตัวเลขจำนวนเพื่อแก้ไขจำนวนรวมได้ทันที</span>
        <button
          onClick={() => {
            if (confirm('คุณต้องการรีเซ็ตตารางสต็อกกลับเป็นค่าเริ่มต้นตามรายงานหรือไม่?')) {
              resetInventory();
              toast.success('รีเซ็ตตารางสต็อกสำเร็จ');
            }
          }}
          className="text-amber-600 dark:text-amber-400 font-extrabold hover:underline flex items-center transition-all hover:scale-102"
        >
          <RotateCcw size={12} className="mr-1" />
          รีเซ็ตตารางสต็อก
        </button>
      </div>

      {/* Add New Stock Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-black text-base text-slate-900 dark:text-white flex items-center">
                  <Box size={18} className="mr-2 text-amber-500" />
                  เพิ่มสินค้าเข้าตารางสต็อก
                </h4>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddNewItem} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    ชื่อสินค้า <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น แผงโซล่าเซลล์ 550W, สายไฟ PV"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      รหัส SKU (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      placeholder={`SKU${(items.length + 1).toString().padStart(3, '0')}`}
                      value={newSku}
                      onChange={(e) => setNewSku(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      จำนวนตั้งต้น
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newQty}
                      onChange={(e) => setNewQty(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    หน่วยนับ
                  </label>
                  <input
                    type="text"
                    placeholder="ตัว, ชิ้น, ชุด, ม้วน"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-amber-500 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md cursor-pointer"
                  >
                    + บันทึกรายการ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
