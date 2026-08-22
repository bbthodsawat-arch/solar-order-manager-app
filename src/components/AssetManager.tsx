import React, { useState, useMemo } from 'react';
import { 
  Wrench, Plus, Trash2, Edit3, Save, X, Search, 
  Calculator, TrendingDown, DollarSign, Calendar,
  ShieldAlert, CheckCircle2, AlertCircle, Sparkles,
  Layers, MapPin, User, FileText, ArrowRight, Clock,
  RefreshCw, Info, Download, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { AssetItem } from '../types';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface AssetManagerProps {
  assets: AssetItem[];
  onAddAsset: (asset: Omit<AssetItem, 'id'>) => Promise<void>;
  onUpdateAsset: (id: string, updates: Partial<AssetItem>) => Promise<void>;
  onDeleteAsset: (id: string) => Promise<void>;
}

export const AssetManager: React.FC<AssetManagerProps> = ({
  assets = [],
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Interactive Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcPrice, setCalcPrice] = useState<number>(35000);
  const [calcSalvage, setCalcSalvage] = useState<number>(3500);
  const [calcYears, setCalcYears] = useState<number>(5);
  const [calcMethod, setCalcMethod] = useState<'straight_line' | 'declining_balance'>('straight_line');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [form, setForm] = useState<Omit<AssetItem, 'id'>>({
    name: '',
    assetCode: '',
    category: 'เครื่องมือช่าง',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    salvageValue: 0,
    usefulLifeYears: 5,
    depreciationMethod: 'straight_line',
    location: '',
    assignedTo: '',
    status: 'active',
    isActive: true,
    notes: ''
  });

  // Calculate Asset Metrics Helper
  const calculateAssetMetrics = (asset: AssetItem) => {
    const purchase = asset.purchasePrice || 0;
    const salvage = asset.salvageValue || 0;
    const years = asset.usefulLifeYears || 5;
    const depreciableBase = Math.max(0, purchase - salvage);
    
    // Monthly straight line depreciation
    const monthlyDepreciation = depreciableBase / (years * 12);
    const yearlyDepreciation = depreciableBase / years;

    // Calculate months elapsed since purchase
    const pDate = new Date(asset.purchaseDate);
    const now = new Date();
    const monthsElapsed = Math.max(0, (now.getFullYear() - pDate.getFullYear()) * 12 + (now.getMonth() - pDate.getMonth()));
    
    const maxMonths = years * 12;
    const activeMonths = Math.min(monthsElapsed, maxMonths);
    
    // Accumulated depreciation
    const accumulatedDepreciation = Math.min(depreciableBase, activeMonths * monthlyDepreciation);
    const netBookValue = Math.max(salvage, purchase - accumulatedDepreciation);
    const percentDepreciated = depreciableBase > 0 ? (accumulatedDepreciation / depreciableBase) * 100 : 100;
    const isFullyDepreciated = monthsElapsed >= maxMonths;

    return {
      monthlyDepreciation,
      yearlyDepreciation,
      accumulatedDepreciation,
      netBookValue,
      percentDepreciated: Math.min(100, percentDepreciated),
      monthsElapsed,
      isFullyDepreciated
    };
  };

  // High-level overview statistics
  const overviewStats = useMemo(() => {
    let totalInitialCost = 0;
    let totalNetBookValue = 0;
    let totalAccumulatedDepreciation = 0;
    let totalMonthlyDepreciation = 0;

    assets.forEach(asset => {
      if (asset.isActive !== false) {
        const metrics = calculateAssetMetrics(asset);
        totalInitialCost += (asset.purchasePrice || 0);
        totalNetBookValue += metrics.netBookValue;
        totalAccumulatedDepreciation += metrics.accumulatedDepreciation;
        if (asset.status === 'active' && !metrics.isFullyDepreciated) {
          totalMonthlyDepreciation += metrics.monthlyDepreciation;
        }
      }
    });

    return {
      totalInitialCost,
      totalNetBookValue,
      totalAccumulatedDepreciation,
      totalMonthlyDepreciation
    };
  }, [assets]);

  // Categories list
  const categoryOptions = [
    'เครื่องมือช่าง',
    'เครื่องมือวัดและทดสอบ',
    'อุปกรณ์ติดตั้ง',
    'ยานพาหนะ',
    'คอมพิวเตอร์และอุปกรณ์สำนักงาน',
    'อาคารและสถานที่',
    'อื่นๆ'
  ];

  // Filtered Assets
  const filteredAssets = assets.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = (item.assetCode || '').toLowerCase().includes(q);
      const matchLoc = (item.location || '').toLowerCase().includes(q);
      const matchAssign = (item.assignedTo || '').toLowerCase().includes(q);
      return matchName || matchCode || matchLoc || matchAssign;
    }

    return true;
  });

  // Modal Handlers
  const handleOpenModal = (asset?: AssetItem) => {
    if (asset) {
      setEditingAsset(asset);
      setForm({
        name: asset.name,
        assetCode: asset.assetCode || '',
        category: asset.category || 'เครื่องมือช่าง',
        purchaseDate: asset.purchaseDate || new Date().toISOString().split('T')[0],
        purchasePrice: asset.purchasePrice || 0,
        salvageValue: asset.salvageValue || 0,
        usefulLifeYears: asset.usefulLifeYears || 5,
        depreciationMethod: asset.depreciationMethod || 'straight_line',
        location: asset.location || '',
        assignedTo: asset.assignedTo || '',
        status: asset.status || 'active',
        isActive: asset.isActive ?? true,
        notes: asset.notes || ''
      });
    } else {
      setEditingAsset(null);
      const nextCodeNum = assets.length + 1;
      setForm({
        name: '',
        assetCode: `AST-${String(nextCodeNum).padStart(3, '0')}`,
        category: 'เครื่องมือช่าง',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
        salvageValue: 0,
        usefulLifeYears: 5,
        depreciationMethod: 'straight_line',
        location: 'หน้าร้าน / คลังเครื่องมือ',
        assignedTo: '',
        status: 'active',
        isActive: true,
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('กรุณาระบุชื่อสินทรัพย์/อุปกรณ์');
      return;
    }

    try {
      if (editingAsset) {
        await onUpdateAsset(editingAsset.id, {
          ...form,
          name: form.name.trim(),
          assetCode: form.assetCode?.trim()
        });
        toast.success('อัปเดตข้อมูลสินทรัพย์เรียบร้อย');
      } else {
        await onAddAsset({
          ...form,
          name: form.name.trim(),
          assetCode: form.assetCode?.trim()
        });
        toast.success('บันทึกสินทรัพย์และอุปกรณ์ใหม่เรียบร้อย');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาดในการบันทึกสินทรัพย์');
    }
  };

  const handleDelete = async (asset: AssetItem) => {
    if (confirm(`คุณต้องการลบสินทรัพย์ "${asset.name}" (${asset.assetCode || 'ไม่มีรหัส'}) หรือไม่?`)) {
      try {
        await onDeleteAsset(asset.id);
        toast.success('ลบรายการสินทรัพย์เรียบร้อย');
      } catch (err: any) {
        toast.error(err.message || 'เกิดข้อผิดพลาด');
      }
    }
  };

  // Calculator Simulation Helper
  const calcResults = useMemo(() => {
    const base = Math.max(0, calcPrice - calcSalvage);
    const monthly = base / (calcYears * 12);
    const yearly = base / calcYears;

    const yearlySchedule = [];
    let currentBookVal = calcPrice;
    for (let yr = 1; yr <= calcYears; yr++) {
      const dep = Math.min(yearly, currentBookVal - calcSalvage);
      currentBookVal -= dep;
      yearlySchedule.push({
        year: yr,
        depreciation: dep,
        endingBookValue: currentBookVal,
        monthlyDep: dep / 12
      });
    }

    return {
      depreciableBase: base,
      monthlyDepreciation: monthly,
      yearlyDepreciation: yearly,
      schedule: yearlySchedule
    };
  }, [calcPrice, calcSalvage, calcYears]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">ราคาทุนสินทรัพย์รวม</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ฿{overviewStats.totalInitialCost.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">({assets.length} รายการ)</span>
          </div>
        </div>

        {/* Net Book Value */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">มูลค่าคงเหลือสุทธิ (NBV)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ฿{Math.round(overviewStats.totalNetBookValue).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Accumulated Depreciation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">ค่าเสื่อมราคาสะสมรวม</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              ฿{Math.round(overviewStats.totalAccumulatedDepreciation).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Monthly Expense */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">ค่าเสื่อมราคาต่อเดือน</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-1">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              ฿{Math.round(overviewStats.totalMonthlyDepreciation).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">/เดือน</span>
          </div>
        </div>
      </div>

      {/* Solar Asset Depreciation Calculator Widget */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-blue-900/40 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Calculator size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">เครื่องมือจำลองคำนวณค่าเสื่อมสภาพอุปกรณ์โซล่าเซลล์</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/30 text-blue-300 border border-blue-400/30">
                  Solar Depreciation Tool
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                คำนวณค่าเสื่อมราคารายเดือน/รายปี มูลค่าซาก และตารางตัดมูลค่าตามอายุการใช้งาน
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
          >
            {showCalculator ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            <span>{showCalculator ? 'ซ่อนตัวจำลอง' : 'เปิดตัวจำลอง'}</span>
          </button>
        </div>

        {/* Calculator Body */}
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-6 space-y-6"
          >
            {/* Input Sliders & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-black/20 p-5 rounded-2xl border border-white/5">
              {/* Purchase Price */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">ราคาซื้ออุปกรณ์เริ่มต้น:</span>
                  <span className="font-mono font-black text-blue-400 text-sm">฿{calcPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="1000000"
                  step="1000"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex items-center gap-2">
                  {[10000, 35000, 100000, 300000, 600000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalcPrice(preset)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        calcPrice === preset ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {preset >= 100000 ? `${preset / 1000}k` : `${preset / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salvage Value */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">มูลค่าซาก (Salvage Value):</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">฿{calcSalvage.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={calcPrice * 0.5}
                  step="500"
                  value={calcSalvage}
                  onChange={(e) => setCalcSalvage(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                  <span>0% (฿0)</span>
                  <span>10% (฿{(calcPrice * 0.1).toLocaleString()})</span>
                  <span>20% (฿{(calcPrice * 0.2).toLocaleString()})</span>
                </div>
              </div>

              {/* Lifespan in Years */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">อายุการใช้งาน (ปี):</span>
                  <span className="font-mono font-black text-purple-400 text-sm">{calcYears} ปี ({calcYears * 12} เดือน)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={calcYears}
                  onChange={(e) => setCalcYears(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[2, 3, 5, 8, 10, 15, 20].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setCalcYears(yr)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        calcYears === yr ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {yr} ปี
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulation Results Highlight */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10px] font-black uppercase text-blue-300">ค่าเสื่อมราคารายเดือน</span>
                <p className="text-xl font-black text-blue-400 mt-1">
                  ฿{Math.round(calcResults.monthlyDepreciation).toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-400 font-medium">/เดือน (ตัดเป็นค่าใช้จ่าย)</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] font-black uppercase text-emerald-300">ค่าเสื่อมราคารายปี</span>
                <p className="text-xl font-black text-emerald-400 mt-1">
                  ฿{Math.round(calcResults.yearlyDepreciation).toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-400 font-medium">/ปี (อัตรา {(100 / calcYears).toFixed(1)}%)</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-[10px] font-black uppercase text-purple-300">ฐานคิดค่าเสื่อม (ราคาหักซาก)</span>
                <p className="text-xl font-black text-purple-400 mt-1">
                  ฿{Math.round(calcResults.depreciableBase).toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-400 font-medium">ต้นทุนที่ต้องตัดจนหมด</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] font-black uppercase text-amber-300">มูลค่าซากเมื่อหมดอายุ</span>
                <p className="text-xl font-black text-amber-400 mt-1">
                  ฿{calcSalvage.toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-400 font-medium">มูลค่าคงเหลือในบัญชี</span>
              </div>
            </div>

            {/* Schedule Table Preview */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-300">ตารางจำลองตัดค่าเสื่อมตามอายุการใช้งาน ({calcYears} ปี)</span>
              <div className="overflow-x-auto rounded-xl border border-white/10 max-h-48 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 sticky top-0 text-[10px] text-slate-400 uppercase font-black">
                    <tr>
                      <th className="py-2.5 px-3">ปีที่</th>
                      <th className="py-2.5 px-3 text-right">ค่าเสื่อมราคา/ปี</th>
                      <th className="py-2.5 px-3 text-right">ค่าเสื่อมราคา/เดือน</th>
                      <th className="py-2.5 px-3 text-right">มูลค่าคงเหลือสิ้นปี</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {calcResults.schedule.map((row) => (
                      <tr key={row.year} className="hover:bg-white/5">
                        <td className="py-2 px-3 font-bold text-white">ปีที่ {row.year}</td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-mono">฿{Math.round(row.depreciation).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-blue-400 font-mono">฿{Math.round(row.monthlyDep).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-white font-mono font-bold">฿{Math.round(row.endingBookValue).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Assets Directory & Management Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Table Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="text-blue-500" size={20} />
              <span>ทะเบียนทรัพย์สินและอุปกรณ์ช่าง (Assets Management)</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              แยกบันทึกเครื่องมือ อุปกรณ์ติดตั้ง และยานพาหนะ ออกจากสต็อกสินค้าเพื่อคำนวณสินทรัพย์และค่าเสื่อม
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>ลงทะเบียนทรัพย์สินใหม่</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อทรัพย์สิน, รหัสสินทรัพย์, สถานที่จัดเก็บ, ผู้รับผิดชอบ..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">📁 ทุกหมวดหมู่สินทรัพย์</option>
              {categoryOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">⚡ ทุกสถานะการใช้งาน</option>
              <option value="active">🟢 ใช้งานปกติ (Active)</option>
              <option value="maintenance">🟡 ส่งซ่อม/ปรับปรุง (In Repair)</option>
              <option value="retired">🔴 ตัดจำหน่าย/หมดสภาพ (Retired)</option>
              <option value="lost">⚪ สูญหาย (Lost)</option>
            </select>
          </div>
        </div>

        {/* Assets Table */}
        {filteredAssets.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
            <Wrench size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">ไม่พบข้อมูลสินทรัพย์ตามเงื่อนไข</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              คุณสามารถกดปุ่ม "ลงทะเบียนทรัพย์สินใหม่" เพื่อเริ่มบันทึกเครื่องมือช่างและอุปกรณ์ของร้าน
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>ลงทะเบียนทรัพย์สิน</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">รหัส / ชื่อสินทรัพย์</th>
                  <th className="py-3 px-3">หมวดหมู่ & จัดเก็บ</th>
                  <th className="py-3 px-3 text-right">ราคาทุนซื้อ</th>
                  <th className="py-3 px-3 text-right">มูลค่าคงเหลือ (NBV)</th>
                  <th className="py-3 px-3 text-right">ค่าเสื่อม/เดือน</th>
                  <th className="py-3 px-3 text-center">ความคืบหน้าตัดค่าเสื่อม</th>
                  <th className="py-3 px-3 text-center">สถานะ</th>
                  <th className="py-3 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredAssets.map((asset) => {
                  const metrics = calculateAssetMetrics(asset);
                  const statusColors = {
                    active: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                    maintenance: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                    retired: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800',
                    lost: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
                  };

                  return (
                    <tr 
                      key={asset.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 dark:text-white">
                          {asset.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          {asset.assetCode && (
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {asset.assetCode}
                            </span>
                          )}
                          <span>ซื้อเมื่อ: {asset.purchaseDate}</span>
                          {asset.usefulLifeYears && <span>({asset.usefulLifeYears} ปี)</span>}
                        </div>
                      </td>

                      {/* Category & Location */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          {asset.category}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                          {asset.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin size={11} /> {asset.location}
                            </span>
                          )}
                          {asset.assignedTo && (
                            <span className="flex items-center gap-0.5 text-slate-500">
                              • <User size={11} /> {asset.assignedTo}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Purchase Price */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          ฿{(asset.purchasePrice || 0).toLocaleString()}
                        </span>
                        {asset.salvageValue ? (
                          <span className="text-[10px] text-slate-400 block">
                            ซาก: ฿{asset.salvageValue.toLocaleString()}
                          </span>
                        ) : null}
                      </td>

                      {/* Net Book Value */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          ฿{Math.round(metrics.netBookValue).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          สะสม: ฿{Math.round(metrics.accumulatedDepreciation).toLocaleString()}
                        </span>
                      </td>

                      {/* Monthly Depreciation */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          ฿{Math.round(metrics.monthlyDepreciation).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">/เดือน</span>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3.5 px-3 min-w-[120px]">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              metrics.percentDepreciated >= 100 
                                ? 'bg-rose-500' 
                                : metrics.percentDepreciated >= 75 
                                  ? 'bg-amber-500' 
                                  : 'bg-blue-500'
                            }`}
                            style={{ width: `${metrics.percentDepreciated}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                          <span>{metrics.monthsElapsed} ด.</span>
                          <span>{Math.round(metrics.percentDepreciated)}%</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${statusColors[asset.status || 'active']}`}>
                          {asset.status === 'active' ? 'ใช้งานปกติ' : asset.status === 'maintenance' ? 'ส่งซ่อม' : asset.status === 'retired' ? 'ตัดจำหน่าย' : 'สูญหาย'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenModal(asset)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลสินทรัพย์"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(asset)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="ลบรายการ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Asset Modal (Add / Edit) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingAsset ? 'แก้ไขข้อมูลทรัพย์สิน' : 'ลงทะเบียนทรัพย์สินและอุปกรณ์ใหม่'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">บันทึกเครื่องมือช่างและคำนวณอัตราค่าเสื่อมสภาพ</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5">
                {/* Code & Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      รหัสทรัพย์สิน (Asset Code)
                    </label>
                    <input
                      type="text"
                      value={form.assetCode || ''}
                      onChange={(e) => setForm({ ...form, assetCode: e.target.value })}
                      placeholder="เช่น AST-TOOL-001"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      หมวดหมู่ทรัพย์สิน *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      {categoryOptions.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อทรัพย์สิน / รายการอุปกรณ์ *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="เช่น สว่านกระแทกไร้สาย 20V พร้อมกล่อง"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Purchase Date & Price & Salvage */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      วันที่ได้มา/ซื้อ *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.purchaseDate}
                      onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      ราคาซื้อ (บาท) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={form.purchasePrice}
                      onChange={(e) => setForm({ ...form, purchasePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      มูลค่าซาก (บาท)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={form.salvageValue || 0}
                      onChange={(e) => setForm({ ...form, salvageValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Useful life years & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      อายุการใช้งาน (ปี) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      required
                      value={form.usefulLifeYears}
                      onChange={(e) => setForm({ ...form, usefulLifeYears: parseInt(e.target.value) || 5 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      สถานะทรัพย์สิน
                    </label>
                    <select
                      value={form.status}
                      onChange={(e: any) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="active">🟢 ใช้งานปกติ (Active)</option>
                      <option value="maintenance">🟡 กำลังส่งซ่อม (In Repair)</option>
                      <option value="retired">🔴 ปลดระวาง/ตัดจำหน่าย (Retired)</option>
                      <option value="lost">⚪ สูญหาย (Lost)</option>
                    </select>
                  </div>
                </div>

                {/* Location & Assigned To */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      สถานที่เก็บ / รถประจำตำแหน่ง
                    </label>
                    <input
                      type="text"
                      value={form.location || ''}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="เช่น คลังช่าง 1, รถกระบะส่งของ..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      ผู้รับผิดชอบ / ผู้ถือครอง
                    </label>
                    <input
                      type="text"
                      value={form.assignedTo || ''}
                      onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                      placeholder="เช่น หัวหน้าช่างสมชาย..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    หมายเหตุ / ข้อมูลเพิ่มเติม
                  </label>
                  <textarea
                    rows={2}
                    value={form.notes || ''}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="เช่น หมายเลขเครื่อง Serial Number, วันหมดประกัน..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {editingAsset ? 'บันทึกการแก้ไข' : 'บันทึกสินทรัพย์'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AssetManager;
