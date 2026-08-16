import { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { 
  subDays, addDays, parseISO, isAfter, isBefore, startOfDay, 
  format, getDate, getDaysInMonth, addMonths 
} from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  TrendingUp, TrendingDown, ArrowRight, Calendar, Sparkles, 
  AlertCircle, CheckCircle2, ShieldAlert, DollarSign, Wallet, 
  HelpCircle, ChevronDown, ChevronUp, Layers, RefreshCw, BarChart2
} from 'lucide-react';

interface CashFlowProjectionProps {
  transactions: Transaction[];
  currentBalance: number;
}

export default function CashFlowProjection({ transactions, currentBalance }: CashFlowProjectionProps) {
  const { recurringTransactions } = useRecurringTransactions();
  const [historyWindowDays, setHistoryWindowDays] = useState<30 | 60>(30);
  const [includeUnpaidReceivables, setIncludeUnpaidReceivables] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Compute 30-day forward Cash Flow Projection based on historical trends + scheduled recurring + pending receivables
  const projection = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const future30Days = addDays(today, 30);
    const historicalStart = startOfDay(subDays(today, historyWindowDays));

    // 1. Calculate historical daily averages within the selected window
    const historicalTxs = transactions.filter(t => {
      const d = parseISO(t.date);
      return (isAfter(d, historicalStart) || d.getTime() === historicalStart.getTime()) &&
             (isBefore(d, today) || d.getTime() === today.getTime());
    });

    let histIncome = 0;
    let histExpense = 0;

    historicalTxs.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') histIncome += amt;
      else if (t.type === 'expense') histExpense += amt;
    });

    const dailyAvgIncome = histIncome / historyWindowDays;
    const dailyAvgExpense = histExpense / historyWindowDays;

    const projectedBaseIncome = Math.round(dailyAvgIncome * 30);
    const projectedBaseExpense = Math.round(dailyAvgExpense * 30);

    // 2. Calculate upcoming recurring transactions in next 30 days
    let upcomingRecurringIncome = 0;
    let upcomingRecurringExpense = 0;
    const recurringList: Array<{ title: string; type: 'income' | 'expense'; amount: number; dayOfMonth: number }> = [];

    const activeRecurring = recurringTransactions.filter(r => r.isActive !== false);

    // Check each of the next 30 days to see if a recurring event fires
    for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
      const futureDate = addDays(today, dayOffset);
      const dayNum = getDate(futureDate);

      activeRecurring.forEach(r => {
        if (r.dayOfMonth === dayNum) {
          const amt = Number(r.amount) || 0;
          if (r.type === 'income') {
            upcomingRecurringIncome += amt;
          } else {
            upcomingRecurringExpense += amt;
          }
          recurringList.push({
            title: r.title,
            type: r.type,
            amount: amt,
            dayOfMonth: dayNum
          });
        }
      });
    }

    // 3. Unpaid Solar Receivables due within next 30 days
    let upcomingUnpaidReceivables = 0;
    const unpaidList: Array<{ title: string; amount: number; dateStr: string }> = [];

    if (includeUnpaidReceivables) {
      transactions.forEach(t => {
        if (t.type === 'income' && t.saleOrderDetails && t.saleOrderDetails.paymentStatus === 'unpaid') {
          const amount = Number(t.amount) || 0;
          const deliveryDateStr = t.saleOrderDetails.deliveryDate || t.date;
          const delDate = startOfDay(parseISO(deliveryDateStr));

          // Included if due date is today or within next 30 days (or slightly overdue)
          if (isBefore(delDate, future30Days)) {
            upcomingUnpaidReceivables += amount;
            unpaidList.push({
              title: t.detail || `ออเดอร์โซล่าร์ (${t.saleOrderDetails.province || 'ไม่ระบุจังหวัด'})`,
              amount,
              dateStr: format(delDate, 'dd MMM yyyy', { locale: th })
            });
          }
        }
      });
    }

    // Combined Totals
    const totalProjectedIncome = projectedBaseIncome + upcomingRecurringIncome + upcomingUnpaidReceivables;
    const totalProjectedExpense = projectedBaseExpense + upcomingRecurringExpense;
    const netProjectedCashFlow = totalProjectedIncome - totalProjectedExpense;
    const projectedEndBalance = currentBalance + netProjectedCashFlow;

    // Build 4 weekly / 10-day segment projection buckets for simple bar visualization
    const segments: Array<{ label: string; income: number; expense: number; net: number }> = [];
    for (let i = 0; i < 3; i++) {
      const segStart = i * 10 + 1;
      const segEnd = (i + 1) * 10;
      const segDailyIncome = dailyAvgIncome * 10;
      const segDailyExpense = dailyAvgExpense * 10;

      let segRecInc = 0;
      let segRecExp = 0;
      let segUnpaid = 0;

      for (let d = segStart; d <= segEnd; d++) {
        const fDate = addDays(today, d);
        const dayNum = getDate(fDate);

        activeRecurring.forEach(r => {
          if (r.dayOfMonth === dayNum) {
            const amt = Number(r.amount) || 0;
            if (r.type === 'income') segRecInc += amt;
            else segRecExp += amt;
          }
        });
      }

      const totalSegInc = Math.round(segDailyIncome + segRecInc + (includeUnpaidReceivables && i === 0 ? upcomingUnpaidReceivables : 0));
      const totalSegExp = Math.round(segDailyExpense + segRecExp);

      segments.push({
        label: `วันที่ ${segStart}-${segEnd}`,
        income: totalSegInc,
        expense: totalSegExp,
        net: totalSegInc - totalSegExp
      });
    }

    return {
      dailyAvgIncome,
      dailyAvgExpense,
      projectedBaseIncome,
      projectedBaseExpense,
      upcomingRecurringIncome,
      upcomingRecurringExpense,
      upcomingUnpaidReceivables,
      totalProjectedIncome,
      totalProjectedExpense,
      netProjectedCashFlow,
      projectedEndBalance,
      recurringList,
      unpaidList,
      segments
    };
  }, [transactions, recurringTransactions, currentBalance, historyWindowDays, includeUnpaidReceivables]);

  const isNetPositive = projection.netProjectedCashFlow >= 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 transition-all">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-cyan-500/20">
            <BarChart2 size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                ประมาณการกระแสเงินสดล่วงหน้า 30 วัน (Cash Flow Forecast)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 text-[10px] font-extrabold border border-cyan-200 dark:border-cyan-800">
                วิเคราะห์เชิงคาดการณ์
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ประเมินสภาพคล่องทางการเงินจากแนวโน้มย้อนหลัง {historyWindowDays} วัน + รายการประจำ + ยอดค้างชำระ
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* History Window Toggle */}
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center text-[11px] font-bold">
            <button
              onClick={() => setHistoryWindowDays(30)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                historyWindowDays === 30
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              อิง 30 วัน
            </button>
            <button
              onClick={() => setHistoryWindowDays(60)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                historyWindowDays === 60
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              อิง 60 วัน
            </button>
          </div>

          <button
            onClick={() => setIncludeUnpaidReceivables(!includeUnpaidReceivables)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1.5 ${
              includeUnpaidReceivables
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent'
            }`}
            title="รวมยอดค้างชำระจากลูกค้าในประมาณการรายรับ"
          >
            <CheckCircle2 size={13} className={includeUnpaidReceivables ? 'text-blue-600' : 'text-slate-400'} />
            <span className="hidden sm:inline">รวมยอดค้างชำระ</span>
          </button>
        </div>
      </div>

      {/* Main KPI Highlight Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Estimated Income */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <span>ประมาณการรายรับ (30 วัน)</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
            +฿{projection.totalProjectedIncome.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70">
            เฉลี่ยปกติ ฿{Math.round(projection.dailyAvgIncome).toLocaleString()}/วัน
          </p>
        </div>

        {/* Estimated Expense */}
        <div className="bg-rose-50/60 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-200/60 dark:border-rose-800/40 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-300">
            <span>ประมาณการรายจ่าย (30 วัน)</span>
            <TrendingDown size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400 tracking-tight">
            -฿{projection.totalProjectedExpense.toLocaleString()}
          </p>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/70">
            เฉลี่ยปกติ ฿{Math.round(projection.dailyAvgExpense).toLocaleString()}/วัน
          </p>
        </div>

        {/* Projected Net Cash Flow */}
        <div className={`p-4 rounded-2xl border space-y-1 ${
          isNetPositive
            ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/40'
            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>ผลต่างกระแสเงินสดสุทธิ</span>
            <Sparkles size={16} className={isNetPositive ? 'text-blue-500' : 'text-amber-500'} />
          </div>
          <p className={`text-2xl font-black tracking-tight ${
            isNetPositive ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'
          }`}>
            {isNetPositive ? '+' : ''}฿{projection.netProjectedCashFlow.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isNetPositive ? 'กระแสเงินสดส่วนเกินบวก' : 'กระแสเงินสดอาจติดลบ'}
          </p>
        </div>

        {/* Estimated Ending Cash Balance */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>ยอดเงินคงเหลือคาดการณ์ (อีก 30 วัน)</span>
            <Wallet size={16} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ฿{projection.projectedEndBalance.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            จากยอดปัจจุบัน ฿{currentBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 10-Day Interval Segmented Projection Bar Chart */}
      <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
          <span>แนวโน้มกระแสเงินสดแบ่งตามช่วงเวลา (ทุกๆ 10 วัน)</span>
          <span className="text-[11px] font-semibold text-slate-500">เปรียบเทียบรายรับ-รายจ่าย</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {projection.segments.map((seg, idx) => {
            const isSegPositive = seg.net >= 0;
            return (
              <div key={idx} className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{seg.label}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                    isSegPositive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}>
                    {isSegPositive ? '+' : ''}฿{seg.net.toLocaleString()}
                  </span>
                </div>

                {/* Progress bars comparison */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>รายรับ</span>
                      <span className="font-bold text-emerald-600">฿{seg.income.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((seg.income / (seg.income + seg.expense || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>รายจ่าย</span>
                      <span className="font-bold text-rose-600">฿{seg.expense.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min((seg.expense / (seg.income + seg.expense || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Toggle */}
      <div className="pt-1">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <Layers size={15} className="text-blue-500" />
            <span>ดูรายละเอียดการคำนวณและรายการที่จะเกิดขึ้นใน 30 วันข้างหน้า</span>
          </div>
          {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showBreakdown && (
          <div className="mt-3 p-4 bg-slate-50/90 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in text-xs">
            {/* Base Calculation Rule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  1. ยอดประมาณการจากแนวโน้มอดีต ({historyWindowDays} วันย้อนหลัง):
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  • รายรับฐาน: ฿{projection.projectedBaseIncome.toLocaleString()} (฿{Math.round(projection.dailyAvgIncome).toLocaleString()}/วัน)
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  • รายจ่ายฐาน: ฿{projection.projectedBaseExpense.toLocaleString()} (฿{Math.round(projection.dailyAvgExpense).toLocaleString()}/วัน)
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  2. ยอดจากรายการประจำ & ยอดค้างชำระ:
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  • รายการประจำรายรับเพิ่มเติม: ฿{projection.upcomingRecurringIncome.toLocaleString()}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  • รายการประจำรายจ่ายเพิ่มเติม: ฿{projection.upcomingRecurringExpense.toLocaleString()}
                </p>
                {includeUnpaidReceivables && (
                  <p className="text-blue-600 dark:text-blue-400 font-semibold">
                    • ยอดค้างชำระรอเก็บเงิน (โซล่าเซลล์): ฿{projection.upcomingUnpaidReceivables.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Upcoming Specific Items List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scheduled Recurring Items */}
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  รายการประจำที่จะเกิดขึ้นในเดือนนี้ ({projection.recurringList.length} รายการ):
                </span>
                {projection.recurringList.length === 0 ? (
                  <p className="text-slate-400 italic">ไม่มีรายการประจำใน 30 วันข้างหน้า</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {projection.recurringList.map((item, idx) => (
                      <div key={idx} className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{item.title}</span>
                          <span className="text-[10px] text-slate-400">ทุกวันที่ {item.dayOfMonth} ของเดือน</span>
                        </div>
                        <span className={`font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.type === 'income' ? '+' : '-'}฿{item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unpaid Receivables List */}
              {includeUnpaidReceivables && (
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                    ลูกหนี้/ยอดค้างชำระรอเก็บเงิน ({projection.unpaidList.length} รายการ):
                  </span>
                  {projection.unpaidList.length === 0 ? (
                    <p className="text-slate-400 italic">ไม่มีออเดอร์ค้างชำระในช่วงนี้</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {projection.unpaidList.map((item, idx) => (
                        <div key={idx} className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[180px]">{item.title}</span>
                            <span className="text-[10px] text-slate-400">กำหนดส่งมอบ: {item.dateStr}</span>
                          </div>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            +฿{item.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
