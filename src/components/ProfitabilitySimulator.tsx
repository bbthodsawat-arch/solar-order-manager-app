import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator, Sliders, TrendingUp, TrendingDown, Percent, Sparkles,
  RefreshCw, Save, Trash2, ArrowRight, CheckCircle2, AlertTriangle,
  Scale, Target, DollarSign, Layers, BarChart3, LineChart as LineChartIcon,
  HelpCircle, ChevronRight, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ReferenceLine
} from 'recharts';
import { toast } from 'react-hot-toast';

interface ProfitabilitySimulatorProps {
  baseIncome: number;
  baseExpense: number;
  expenseCategories?: Record<string, number>;
  incomeCategories?: Record<string, number>;
}

interface SavedScenario {
  id: string;
  name: string;
  priceAdjPercent: number;
  costAdjPercent: number;
  overheadAdjPercent: number;
  volumeMultiplier: number;
  projectedIncome: number;
  projectedExpense: number;
  projectedProfit: number;
  projectedMargin: number;
  createdAt: string;
}

export default function ProfitabilitySimulator({
  baseIncome,
  baseExpense,
  expenseCategories = {},
  incomeCategories = {}
}: ProfitabilitySimulatorProps) {
  // If baseline income is 0, allow setting a default demo baseline
  const activeBaseIncome = baseIncome > 0 ? baseIncome : 500000;
  const activeBaseExpense = baseExpense > 0 ? baseExpense : 350000;
  const activeBaseProfit = activeBaseIncome - activeBaseExpense;
  const activeBaseMargin = activeBaseIncome > 0 ? (activeBaseProfit / activeBaseIncome) * 100 : 0;

  // Simulation Sliders / Inputs State
  const [priceAdjPercent, setPriceAdjPercent] = useState<number>(0);
  const [costAdjPercent, setCostAdjPercent] = useState<number>(0);
  const [overheadAdjPercent, setOverheadAdjPercent] = useState<number>(0);
  const [volumeMultiplier, setVolumeMultiplier] = useState<number>(1.0);
  const [customPriceBaht, setCustomPriceBaht] = useState<number>(0);

  // Target Margin Mode
  const [targetMarginGoal, setTargetMarginGoal] = useState<number>(25);

  // Saved scenarios state from localStorage
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    try {
      const stored = localStorage.getItem('what_if_saved_scenarios');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [scenarioNameInput, setScenarioNameInput] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'sensitivity' | 'saved_comparison'>('simulation');

  // Breakdown base expense into Direct Costs (Materials/Equipment) vs Overhead
  const { baseMaterialCost, baseOverheadCost } = useMemo(() => {
    let materialSum = 0;
    let overheadSum = 0;

    Object.entries(expenseCategories).forEach(([cat, val]) => {
      const catLower = cat.toLowerCase();
      if (
        catLower.includes('วัสดุ') ||
        catLower.includes('อุปกรณ์') ||
        catLower.includes('เเบตเตอรี่') ||
        catLower.includes('แบตเตอรี่') ||
        catLower.includes('อินเวอร์เตอร์') ||
        catLower.includes('สินค้า') ||
        catLower.includes('สั่งซื้อ') ||
        catLower.includes('โซล่า')
      ) {
        materialSum += val;
      } else {
        overheadSum += val;
      }
    });

    // If no specific breakdown found, estimate 70% direct materials / 30% overhead
    if (materialSum === 0 && overheadSum === 0) {
      materialSum = activeBaseExpense * 0.7;
      overheadSum = activeBaseExpense * 0.3;
    }

    return { baseMaterialCost: materialSum, baseOverheadCost: overheadSum };
  }, [expenseCategories, activeBaseExpense]);

  // Dynamic Calculated Results
  const simulationResult = useMemo(() => {
    // Income adjustment
    const incomePriceMultiplier = 1 + priceAdjPercent / 100;
    const projectedUnitIncome = (activeBaseIncome * incomePriceMultiplier + customPriceBaht);
    const projectedIncome = projectedUnitIncome * volumeMultiplier;

    // Costs adjustment
    const materialCostMultiplier = 1 + costAdjPercent / 100;
    const overheadCostMultiplier = 1 + overheadAdjPercent / 100;

    const projectedMaterialCost = baseMaterialCost * materialCostMultiplier * volumeMultiplier;
    const projectedOverheadCost = baseOverheadCost * overheadCostMultiplier * volumeMultiplier;
    const projectedExpense = projectedMaterialCost + projectedOverheadCost;

    const projectedProfit = projectedIncome - projectedExpense;
    const projectedMargin = projectedIncome > 0 ? (projectedProfit / projectedIncome) * 100 : 0;

    const profitDelta = projectedProfit - activeBaseProfit;
    const profitDeltaPercent = activeBaseProfit !== 0 ? (profitDelta / Math.abs(activeBaseProfit)) * 100 : 0;
    const marginDelta = projectedMargin - activeBaseMargin;

    // Break-even revenue calculation for this scenario
    const variableCostRatio = projectedIncome > 0 ? projectedMaterialCost / projectedIncome : 0.7;
    const contributionMarginRatio = 1 - variableCostRatio;
    const breakEvenRevenue = contributionMarginRatio > 0 ? projectedOverheadCost / contributionMarginRatio : 0;

    return {
      projectedIncome,
      projectedExpense,
      projectedMaterialCost,
      projectedOverheadCost,
      projectedProfit,
      projectedMargin,
      profitDelta,
      profitDeltaPercent,
      marginDelta,
      breakEvenRevenue
    };
  }, [
    activeBaseIncome, activeBaseExpense, activeBaseProfit, activeBaseMargin,
    baseMaterialCost, baseOverheadCost, priceAdjPercent, costAdjPercent,
    overheadAdjPercent, volumeMultiplier, customPriceBaht
  ]);

  // Calculate required price adjustment to hit target margin goal
  const requiredPriceAdjForTargetMargin = useMemo(() => {
    // TargetMargin = (Income - Expense) / Income => Income * (1 - TargetMargin) = Expense
    // Income = Expense / (1 - TargetMargin/100)
    const targetMarginDec = targetMarginGoal / 100;
    if (targetMarginDec >= 1) return 0;

    const reqExpense = (baseMaterialCost * (1 + costAdjPercent / 100) + baseOverheadCost * (1 + overheadAdjPercent / 100)) * volumeMultiplier;
    const reqIncome = reqExpense / (1 - targetMarginDec);
    const reqBaseIncome = reqIncome / volumeMultiplier;
    const requiredPercent = ((reqBaseIncome - activeBaseIncome) / activeBaseIncome) * 100;
    return requiredPercent;
  }, [targetMarginGoal, baseMaterialCost, baseOverheadCost, costAdjPercent, overheadAdjPercent, volumeMultiplier, activeBaseIncome]);

  // Reset sliders to baseline
  const handleReset = () => {
    setPriceAdjPercent(0);
    setCostAdjPercent(0);
    setOverheadAdjPercent(0);
    setVolumeMultiplier(1.0);
    setCustomPriceBaht(0);
    toast.success('รีเซ็ตค่าจำลองกลับสู่ค่าปัจจุบันเรียบร้อย');
  };

  // Preset Presets
  const applyPreset = (presetKey: string) => {
    switch (presetKey) {
      case 'price_up_10':
        setPriceAdjPercent(10);
        setCostAdjPercent(0);
        setOverheadAdjPercent(0);
        setVolumeMultiplier(1.0);
        toast.success('ปรับปรุงราคาบริการ +10%');
        break;
      case 'cost_down_5':
        setPriceAdjPercent(0);
        setCostAdjPercent(-5);
        setOverheadAdjPercent(0);
        setVolumeMultiplier(1.0);
        toast.success('ปรับลดต้นทุนอุปกรณ์ -5%');
        break;
      case 'inflation_15':
        setPriceAdjPercent(0);
        setCostAdjPercent(15);
        setOverheadAdjPercent(10);
        setVolumeMultiplier(1.0);
        toast.success('จำลองภาวะเงินเฟ้อ/วัสดุแพงขึ้น +15%');
        break;
      case 'volume_scale_50':
        setPriceAdjPercent(-3); // Give 3% discount for volume
        setCostAdjPercent(-4); // Bulk discount on materials
        setOverheadAdjPercent(15); // Fixed cost increase slightly
        setVolumeMultiplier(1.5);
        toast.success('ขยายสเกลงาน +50% (ให้ส่วนลด 3% ได้ส่วนลดวัสดุ 4%)');
        break;
      case 'optimized_best':
        setPriceAdjPercent(8);
        setCostAdjPercent(-6);
        setOverheadAdjPercent(-2);
        setVolumeMultiplier(1.2);
        toast.success('ปรับแผนกำไรสูงสุด (Price +8%, Material -6%, Volume +20%)');
        break;
      default:
        break;
    }
  };

  // Save Current Scenario
  const handleSaveScenario = () => {
    if (!scenarioNameInput.trim()) {
      toast.error('กรุณาระบุชื่อสถานการณ์');
      return;
    }

    const newScenario: SavedScenario = {
      id: Date.now().toString(),
      name: scenarioNameInput.trim(),
      priceAdjPercent,
      costAdjPercent,
      overheadAdjPercent,
      volumeMultiplier,
      projectedIncome: simulationResult.projectedIncome,
      projectedExpense: simulationResult.projectedExpense,
      projectedProfit: simulationResult.projectedProfit,
      projectedMargin: simulationResult.projectedMargin,
      createdAt: new Date().toLocaleDateString('th-TH'),
    };

    const updated = [newScenario, ...savedScenarios];
    setSavedScenarios(updated);
    localStorage.setItem('what_if_saved_scenarios', JSON.stringify(updated));
    setScenarioNameInput('');
    setShowSaveModal(false);
    toast.success(`บันทึกสถานการณ์ "${newScenario.name}" เรียบร้อยแล้ว`);
  };

  const handleDeleteScenario = (id: string) => {
    const updated = savedScenarios.filter((s) => s.id !== id);
    setSavedScenarios(updated);
    localStorage.setItem('what_if_saved_scenarios', JSON.stringify(updated));
    toast.success('ลบสถานการณ์ที่บันทึกไว้เรียบร้อยแล้ว');
  };

  const handleLoadScenario = (sc: SavedScenario) => {
    setPriceAdjPercent(sc.priceAdjPercent);
    setCostAdjPercent(sc.costAdjPercent);
    setOverheadAdjPercent(sc.overheadAdjPercent);
    setVolumeMultiplier(sc.volumeMultiplier);
    toast.success(`โหลดสถานการณ์ "${sc.name}" เรียบร้อยแล้ว`);
  };

  // Sensitivity Chart Data (Price change vs Profit Margin %)
  const sensitivityData = useMemo(() => {
    const steps = [-20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30];
    return steps.map((pStep) => {
      const incPriceMult = 1 + pStep / 100;
      const projInc = activeBaseIncome * incPriceMult * volumeMultiplier;

      const matMult = 1 + costAdjPercent / 100;
      const ovhMult = 1 + overheadAdjPercent / 100;
      const projExp = (baseMaterialCost * matMult + baseOverheadCost * ovhMult) * volumeMultiplier;

      const projProf = projInc - projExp;
      const projMarg = projInc > 0 ? (projProf / projInc) * 100 : 0;

      return {
        priceChange: `${pStep > 0 ? '+' : ''}${pStep}%`,
        profitMargin: Number(projMarg.toFixed(1)),
        netProfit: Math.round(projProf),
        income: Math.round(projInc),
      };
    });
  }, [
    activeBaseIncome, volumeMultiplier, costAdjPercent,
    overheadAdjPercent, baseMaterialCost, baseOverheadCost
  ]);

  // Recharts Data comparing Baseline vs Current What-If
  const barChartData = [
    {
      name: 'ปัจจุบัน (Actual)',
      'รายรับรวม': Math.round(activeBaseIncome),
      'รายจ่ายรวม': Math.round(activeBaseExpense),
      'กำไรสุทธิ': Math.round(activeBaseProfit),
    },
    {
      name: 'จำลอง (What-If)',
      'รายรับรวม': Math.round(simulationResult.projectedIncome),
      'รายจ่ายรวม': Math.round(simulationResult.projectedExpense),
      'กำไรสุทธิ': Math.round(simulationResult.projectedProfit),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Simulation Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-brand-soft text-xs font-bold border border-white/10">
              <Sparkles size={14} className="text-amber-400" />
              <span>Financial What-If Profitability Simulator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Calculator className="text-brand-soft" size={30} />
              เครื่องมือจำลองผลกำไรสุทธิ (What-If Analysis)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              ทดลองปรับเปลี่ยนราคาค่าบริการ ต้นทุนอุปกรณ์ หรือปริมาณงานโครงการล่วงหน้า เพื่อคาดการณ์ผลกระทบต่อ **อัตรากำไรสุทธิ (Net Profit Margin %)** และ **จุดคุ้มทุน (Break-even Point)** ได้อย่างเที่ยงตรงก่อนเริ่มงานจริง
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleReset}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-all border border-white/15 flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>รีเซ็ตค่าจำลอง</span>
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Save size={15} />
              <span>บันทึกแผนงานนี้</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <Zap size={15} className="text-amber-500" />
          <span>สถานการณ์จำลองยอดนิยม (Quick Presets):</span>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => applyPreset('price_up_10')}
            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60 transition-all whitespace-nowrap flex items-center space-x-1 cursor-pointer"
          >
            <TrendingUp size={13} />
            <span>ปรับราคาบริการ +10%</span>
          </button>
          <button
            onClick={() => applyPreset('cost_down_5')}
            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200/60 dark:border-blue-800/60 transition-all whitespace-nowrap flex items-center space-x-1 cursor-pointer"
          >
            <TrendingDown size={13} />
            <span>เจรจาลดต้นทุนอุปกรณ์ -5%</span>
          </button>
          <button
            onClick={() => applyPreset('inflation_15')}
            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200/60 dark:border-rose-800/60 transition-all whitespace-nowrap flex items-center space-x-1 cursor-pointer"
          >
            <AlertTriangle size={13} />
            <span>ภาวะวัสดุแพงขึ้น +15%</span>
          </button>
          <button
            onClick={() => applyPreset('volume_scale_50')}
            className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold border border-purple-200/60 dark:border-purple-800/60 transition-all whitespace-nowrap flex items-center space-x-1 cursor-pointer"
          >
            <Layers size={13} />
            <span>ขยายสเกลงาน +50% (Volume 1.5x)</span>
          </button>
          <button
            onClick={() => applyPreset('optimized_best')}
            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200/60 dark:border-amber-800/60 transition-all whitespace-nowrap flex items-center space-x-1 cursor-pointer"
          >
            <Sparkles size={13} />
            <span>แผนกำไรสูงสุด (Optimized Plan)</span>
          </button>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('simulation')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'simulation'
              ? 'border-brand text-brand dark:text-brand'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders size={16} />
          <span>กระดานปรับแต่งค่า (Interactive Controls)</span>
        </button>
        <button
          onClick={() => setActiveTab('sensitivity')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'sensitivity'
              ? 'border-brand text-brand dark:text-brand'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LineChartIcon size={16} />
          <span>วิเคราะห์ความไวต่อราคา (Price Sensitivity Curve)</span>
        </button>
        <button
          onClick={() => setActiveTab('saved_comparison')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'saved_comparison'
              ? 'border-brand text-brand dark:text-brand'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Scale size={16} />
          <span>เปรียบเทียบแผนงานที่บันทึก ({savedScenarios.length})</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE SIMULATION */}
      {activeTab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Sliders & Controls */}
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="text-brand" size={18} />
                  ปรับเปลี่ยนพารามิเตอร์การเงิน (Simulation Controls)
                </h3>
                <span className="text-[11px] font-bold text-slate-400 font-mono">Real-time Recalculation</span>
              </div>

              {/* 1. Service Fee / Price Adjustment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <DollarSign size={14} className="text-emerald-500" />
                    <span>ปรับราคาค่าบริการ / ค่าติดตั้งโครงการ:</span>
                  </label>
                  <span className={`text-xs font-black font-mono ${priceAdjPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {priceAdjPercent > 0 ? `+${priceAdjPercent}%` : `${priceAdjPercent}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={50}
                  step={1}
                  value={priceAdjPercent}
                  onChange={(e) => setPriceAdjPercent(Number(e.target.value))}
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>-30% (ลดราคา)</span>
                  <span>0% (ราคาเดิม)</span>
                  <span>+50% (เพิ่มราคา)</span>
                </div>
              </div>

              {/* 2. Direct Material / Project Equipment Cost Adjustment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Layers size={14} className="text-amber-500" />
                    <span>ปรับต้นทุนวัสดุ / อุปกรณ์โซล่าเซลล์ (Direct Costs):</span>
                  </label>
                  <span className={`text-xs font-black font-mono ${costAdjPercent <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {costAdjPercent > 0 ? `+${costAdjPercent}%` : `${costAdjPercent}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={50}
                  step={1}
                  value={costAdjPercent}
                  onChange={(e) => setCostAdjPercent(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>-30% (ได้ส่วนลดล็อตใหญ่)</span>
                  <span>0% (ต้นทุนเดิม)</span>
                  <span>+50% (ต้นทุนแพงขึ้น)</span>
                </div>
              </div>

              {/* 3. Operational Overhead Adjustment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <BarChart3 size={14} className="text-indigo-500" />
                    <span>ปรับค่าใช้จ่ายดำเนินงาน / ค่าแรงช่าง (Overhead):</span>
                  </label>
                  <span className={`text-xs font-black font-mono ${overheadAdjPercent <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {overheadAdjPercent > 0 ? `+${overheadAdjPercent}%` : `${overheadAdjPercent}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={50}
                  step={1}
                  value={overheadAdjPercent}
                  onChange={(e) => setOverheadAdjPercent(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>-30% (ประหยัดค่าแรง)</span>
                  <span>0% (ปกติ)</span>
                  <span>+50% (เพิ่มทีมงาน)</span>
                </div>
              </div>

              {/* 4. Project Volume Scale Multiplier */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Scale size={14} className="text-purple-500" />
                    <span>ตัวคูณปริมาณงานโครงการ (Volume Multiplier):</span>
                  </label>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400 font-mono">
                    {volumeMultiplier.toFixed(1)}x ({Math.round(volumeMultiplier * 100)}%)
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={volumeMultiplier}
                  onChange={(e) => setVolumeMultiplier(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.5x (ลดครึ่งหนึ่ง)</span>
                  <span>1.0x (จำนวนงานเท่าเดิม)</span>
                  <span>3.0x (ขยายงาน 3 เท่า)</span>
                </div>
              </div>

              {/* Target Profit Margin Solver */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Target size={15} className="text-brand" />
                    <span>คำนวณราคาที่ต้องตั้งตามเป้ากำไรสุทธิ (Target Margin Solver)</span>
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs font-medium text-slate-500">เป้ากำไร:</span>
                    <input
                      type="number"
                      min={5}
                      max={80}
                      value={targetMarginGoal}
                      onChange={(e) => setTargetMarginGoal(Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-extrabold text-center text-slate-900 dark:text-white"
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">%</span>
                  </div>
                  <button
                    onClick={() => setPriceAdjPercent(Number(requiredPriceAdjForTargetMargin.toFixed(1)))}
                    className="flex-1 py-1.5 px-3 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>ปรับราคาเป็น {requiredPriceAdjForTargetMargin > 0 ? `+${requiredPriceAdjForTargetMargin.toFixed(1)}%` : `${requiredPriceAdjForTargetMargin.toFixed(1)}%`}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Projected Impact Cards & Visual Chart */}
          <div className="lg:col-span-6 space-y-5">
            {/* Impact Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Projected Profit Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">กำไรสุทธิคาดการณ์ (Projected Profit)</span>
                <div className={`text-2xl font-black font-num ${simulationResult.projectedProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  ฿{Math.round(simulationResult.projectedProfit).toLocaleString()}
                </div>
                <div className="flex items-center space-x-1 text-xs font-bold">
                  {simulationResult.profitDelta >= 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                      <TrendingUp size={14} className="mr-0.5" /> +฿{Math.round(simulationResult.profitDelta).toLocaleString()} ({simulationResult.profitDeltaPercent.toFixed(1)}%)
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center">
                      <TrendingDown size={14} className="mr-0.5" /> -฿{Math.round(Math.abs(simulationResult.profitDelta)).toLocaleString()} ({simulationResult.profitDeltaPercent.toFixed(1)}%)
                    </span>
                  )}
                  <span className="text-slate-400 font-normal">เทียบปัจจุบัน</span>
                </div>
              </div>

              {/* Projected Margin Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">อัตรากำไรคาดการณ์ (Profit Margin %)</span>
                <div className="text-2xl font-black text-brand font-num">
                  {simulationResult.projectedMargin.toFixed(1)}%
                </div>
                <div className="flex items-center space-x-1 text-xs font-bold">
                  <span className={simulationResult.marginDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                    {simulationResult.marginDelta >= 0 ? `+${simulationResult.marginDelta.toFixed(1)}%` : `${simulationResult.marginDelta.toFixed(1)}%`}
                  </span>
                  <span className="text-slate-400 font-normal">จากเดิม {activeBaseMargin.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Comparison Bar Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 size={15} className="text-brand" />
                  เปรียบเทียบการเงิน: ปัจจุบัน vs แบบจำลอง What-If
                </h4>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(val: any) => [`฿${Number(val).toLocaleString()}`, '']}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px', padding: '8px 12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="รายรับรวม" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="รายจ่ายรวม" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="กำไรสุทธิ" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Dynamic Executive Insight Text */}
              <div className="p-3.5 bg-brand-soft/30 dark:bg-brand/10 border border-brand/20 rounded-2xl text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-brand" />
                  <span>การวิเคราะห์สรุปสำหรับผู้บริหาร (Executive Insights):</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {simulationResult.profitDelta >= 0
                    ? `แผนงานนี้ทำให้รายรับรวมเพิ่มเป็น ฿${Math.round(simulationResult.projectedIncome).toLocaleString()} และจะส่งผลให้ **กำไรสุทธิเพิ่มขึ้น +฿${Math.round(simulationResult.profitDelta).toLocaleString()}** โดยมีอัตรากำไรอยู่ที่ ${simulationResult.projectedMargin.toFixed(1)}%`
                    : `คำเตือน: การปรับเปลี่ยนนี้ทำให้ **กำไรสุทธิติดลบ/ลดลง -฿${Math.round(Math.abs(simulationResult.profitDelta)).toLocaleString()}** อัตรากำไรลดลงเหลือ ${simulationResult.projectedMargin.toFixed(1)}% ควรพิจารณาปรับราคาเพิ่มขึ้นเพื่อรักษามาร์จิ้น`}
                </p>
                <div className="pt-1 text-[11px] font-mono text-slate-500">
                  จุดคุ้มทุนรายรับขั้นต่ำที่ต้องทำได้ (Break-even Revenue): <span className="font-bold text-slate-800 dark:text-slate-200">฿{Math.round(simulationResult.breakEvenRevenue).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRICE SENSITIVITY CURVE */}
      {activeTab === 'sensitivity' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <LineChartIcon className="text-brand" size={20} />
                เส้นโค้งความไวต่อการปรับราคา (Price Sensitivity Curve)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                แสดงการเปลี่ยนแปลงของ **อัตรากำไรสุทธิ (%)** เมื่อราคาบริการถูกปรับเปลี่ยนระหว่าง -20% ถึง +30%
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensitivityData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="priceChange" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'profitMargin' ? `${val}%` : `฿${Number(val).toLocaleString()}`,
                    name === 'profitMargin' ? 'อัตรากำไรสุทธิ (%)' : 'รายรับคาดการณ์'
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'จุดเท่าทุน 0%', fill: '#f43f5e', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="profitMargin"
                  name="profitMargin"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {sensitivityData.filter((_, i) => i % 3 === 0).map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 block">ปรับราคา {item.priceChange}</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-num block">{item.profitMargin}% Margin</span>
                <span className="text-[10px] text-slate-500 font-mono">กำไร ฿{item.netProfit.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SAVED SCENARIOS COMPARISON */}
      {activeTab === 'saved_comparison' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="text-brand" size={20} />
              ตารางเปรียบเทียบแผนงานที่บันทึกไว้ (Saved Scenarios Comparison)
            </h3>
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-3.5 py-1.5 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-all flex items-center space-x-1 cursor-pointer"
            >
              <Save size={14} />
              <span>บันทึกสถานการณ์ปัจจุบัน</span>
            </button>
          </div>

          {savedScenarios.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Calculator className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">ยังไม่มีแผนงานที่บันทึกไว้</p>
              <p className="text-xs text-slate-400">
                คุณสามารถปรับพารามิเตอร์ในกระดานจำลอง แล้วกดปุ่ม "บันทึกแผนงานนี้" เพื่อนำมาเปรียบเทียบเคียงข้างกันได้ที่นี่
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">ชื่อแผนงาน</th>
                    <th className="py-3.5 px-4">ปรับราคา</th>
                    <th className="py-3.5 px-4">ปรับต้นทุน</th>
                    <th className="py-3.5 px-4">ปริมาณงาน</th>
                    <th className="py-3.5 px-4">รายรับคาดการณ์</th>
                    <th className="py-3.5 px-4">กำไรสุทธิ</th>
                    <th className="py-3.5 px-4">Margin %</th>
                    <th className="py-3.5 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {savedScenarios.map((sc) => (
                    <tr key={sc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {sc.name}
                        <div className="text-[10px] text-slate-400 font-normal font-mono">{sc.createdAt}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        {sc.priceAdjPercent > 0 ? `+${sc.priceAdjPercent}%` : `${sc.priceAdjPercent}%`}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-600">
                        {sc.costAdjPercent > 0 ? `+${sc.costAdjPercent}%` : `${sc.costAdjPercent}%`}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-600">
                        {sc.volumeMultiplier}x
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        ฿{Math.round(sc.projectedIncome).toLocaleString()}
                      </td>
                      <td className={`py-3.5 px-4 font-mono font-black ${sc.projectedProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        ฿{Math.round(sc.projectedProfit).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-brand">
                        {sc.projectedMargin.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleLoadScenario(sc)}
                          className="px-2.5 py-1 bg-brand-soft/40 dark:bg-brand/20 text-brand rounded-lg text-[11px] font-bold hover:bg-brand-soft transition-colors cursor-pointer"
                        >
                          โหลดแผนนี้
                        </button>
                        <button
                          onClick={() => handleDeleteScenario(sc.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Save Scenario Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Save className="text-brand" size={18} />
                  บันทึกแบบจำลองการเงิน (Save Scenario)
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ตั้งชื่อสถานการณ์จำลอง:
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ปรับราคา Q3 +8% และได้ลดต้นทุน 5%"
                    value={scenarioNameInput}
                    onChange={(e) => setScenarioNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">การปรับราคา:</span>
                    <span className="font-bold text-emerald-600">{priceAdjPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">การปรับต้นทุน:</span>
                    <span className="font-bold text-amber-600">{costAdjPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">กำไรสุทธิคาดการณ์:</span>
                    <span className="font-bold text-brand">฿{Math.round(simulationResult.projectedProfit).toLocaleString()} ({simulationResult.projectedMargin.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveScenario}
                  className="px-5 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-all cursor-pointer"
                >
                  ยืนยันบันทึก
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
