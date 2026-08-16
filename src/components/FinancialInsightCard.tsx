import { useMemo } from 'react';
import { Lightbulb, Sparkles, PiggyBank, ArrowUpRight, TrendingDown, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';
import { parseISO, isThisMonth } from 'date-fns';

interface FinancialInsightCardProps {
  transactions: Transaction[];
  monthIncome: number;
  monthExpense: number;
}

export interface InsightItem {
  id: string;
  category: string;
  title: string;
  description: string;
  currentSpent: number;
  potentialSavings: number;
  type: 'warning' | 'info' | 'success';
  badge: string;
  tip: string;
}

export default function FinancialInsightCard({ transactions, monthIncome, monthExpense }: FinancialInsightCardProps) {
  const insights = useMemo(() => {
    // Group current month expenses by category
    const expenseMap: Record<string, { total: number; count: number }> = {};

    transactions.forEach((t) => {
      if (t.type === 'expense' && isThisMonth(parseISO(t.date))) {
        if (!expenseMap[t.category]) {
          expenseMap[t.category] = { total: 0, count: 0 };
        }
        expenseMap[t.category].total += Number(t.amount) || 0;
        expenseMap[t.category].count += 1;
      }
    });

    const items: InsightItem[] = [];

    // 1. Food ('ค่าอาหาร')
    const foodData = expenseMap['ค่าอาหาร'];
    if (foodData && foodData.total > 0) {
      const foodRatio = monthIncome > 0 ? (foodData.total / monthIncome) * 100 : 0;
      if (foodData.total >= 2000 || foodRatio > 8) {
        const savings = Math.round(foodData.total * 0.15);
        items.push({
          id: 'food',
          category: 'ค่าอาหาร',
          title: 'บริหารค่าเบี้ยเลี้ยง/ค่าอาหารทีมงาน',
          description: `เดือนนี้จ่ายค่าอาหารรวม ฿${foodData.total.toLocaleString()} (${foodData.count} รายการ) การกำหนดงบเหมาจ่ายต่อวันหรือจัดเตรียมเสบียงส่วนกลาง สามารถช่วยประหยัดงบผันแปรได้`,
          currentSpent: foodData.total,
          potentialSavings: savings,
          type: 'warning',
          badge: 'ลดลงได้ ~15%',
          tip: 'กำหนดเบี้ยเลี้ยงคงที่ ฿150-200/วัน/คน'
        });
      }
    }

    // 2. Travel ('ค่าเดินทาง')
    const travelData = expenseMap['ค่าเดินทาง'];
    if (travelData && travelData.total > 0) {
      const travelRatio = monthIncome > 0 ? (travelData.total / monthIncome) * 100 : 0;
      if (travelData.total >= 3000 || travelRatio > 10) {
        const savings = Math.round(travelData.total * 0.20);
        items.push({
          id: 'travel',
          category: 'ค่าเดินทาง',
          title: 'เพิ่มประสิทธิภาพการจัดส่งและค่าน้ำมัน',
          description: `มียอดค่าน้ำมัน/ค่าเดินทาง ฿${travelData.total.toLocaleString()} จัดตารางส่งมอบและติดตั้งโซล่าเซลล์ในโซนจังหวัดเดียวกันในวันเดียวกัน จะช่วยลดเที่ยวเดินทางได้มาก`,
          currentSpent: travelData.total,
          potentialSavings: savings,
          type: 'warning',
          badge: 'ประหยัดค่าน้ำมัน ~20%',
          tip: 'รวบรวมออเดอร์โซนใกล้เคียงในรอบเดียว'
        });
      }
    }

    // 3. Drinks ('ค่าเครื่องดื่ม เหล้า/เบียร์')
    const drinkData = expenseMap['ค่าเครื่องดื่ม เหล้า/เบียร์'];
    if (drinkData && drinkData.total > 0) {
      const savings = Math.round(drinkData.total * 0.40);
      items.push({
        id: 'drinks',
        category: 'ค่าเครื่องดื่ม เหล้า/เบียร์',
        title: 'ควบคุมรายจ่ายสังสรรค์ไม่จำเป็น',
        description: `มียอดค่าเครื่องดื่ม/สังสรรค์สะสม ฿${drinkData.total.toLocaleString()} การกำหนดเพดานงบส่วนนี้จะเพิ่มกระแสเงินสดสำรองให้ร้านโดยตรง`,
        currentSpent: drinkData.total,
        potentialSavings: savings,
        type: 'warning',
        badge: 'ปรับลดได้ทันที ~40%',
        tip: 'ตั้งงบสังสรรค์ไม่เกิน ฿1,000/เดือน'
      });
    }

    // 4. Advertising ('ค่าโฆษณา')
    const adData = expenseMap['ค่าโฆษณา'];
    if (adData && adData.total > 0) {
      const adRatio = monthIncome > 0 ? (adData.total / monthIncome) * 100 : 0;
      if (adRatio > 15 || adData.total >= 5000) {
        const savings = Math.round(adData.total * 0.15);
        items.push({
          id: 'ad',
          category: 'ค่าโฆษณา',
          title: 'ปรับกลุ่มเป้าหมายโฆษณาเพจโซล่าเซลล์',
          description: `ค่าโฆษณาคิดเป็น ${adRatio.toFixed(1)}% ของรายรับรวม แนะนำเจาะจงรัศมีจังหวัดรอบร้าน (เช่น ชัยภูมิ, โคราช, ขอนแก่น) เพื่อไม่ให้สิ้นเปลืองงบบรอดแคสต์`,
          currentSpent: adData.total,
          potentialSavings: savings,
          type: 'info',
          badge: 'Optimize Ads ~15%',
          tip: 'จำกัดรัศมีโฆษณาเฉพาะพื้นที่บริการ'
        });
      }
    }

    // 5. Equipment ('สั่งซื้ออุปกรณ์ประกอบชุด')
    const equipData = expenseMap['สั่งซื้ออุปกรณ์ประกอบชุด'];
    if (equipData && equipData.total >= 10000) {
      const savings = Math.round(equipData.total * 0.08);
      items.push({
        id: 'equip',
        category: 'สั่งซื้ออุปกรณ์ประกอบชุด',
        title: 'เจรจาส่วนลดซื้ออุปกรณ์ยกแพ็ก',
        description: `ยอดซื้อสายไฟ ตู้คอมบายเนอร์ และอุปกรณ์ประกอบ ฿${equipData.total.toLocaleString()} การซื้อยกร้านประจำ หรือสั่งเป็นล็อตช่วยขอกราวด์ส่วนลด 5-10% จากซัพพลายเออร์`,
        currentSpent: equipData.total,
        potentialSavings: savings,
        type: 'info',
        badge: 'ส่วนลดซื้อส่ง ~8%',
        tip: 'สั่งรวมล็อตรับส่วนลดราคาส่ง'
      });
    }

    // Fallback default insight if no high categories detected
    if (items.length === 0) {
      items.push({
        id: 'default',
        category: 'ภาพรวมรายจ่าย',
        title: 'รักษาวินัยการบันทึกและควบคุมต้นทุน',
        description: 'ระดับรายจ่ายปัจจุบันอยู่ในเกณฑ์เหมาะสม ควบคุมการบันทึกค่าน้ำมันและค่าอาหารทีมงานอย่างต่อเนื่องเพื่อรักษากระแสเงินสดหมุนเวียน',
        currentSpent: monthExpense,
        potentialSavings: Math.round(monthExpense * 0.10) || 1200,
        type: 'success',
        badge: 'การเงินสมดุลดี',
        tip: 'บันทึกบิลและใบเสร็จทุกครั้ง'
      });
    }

    const totalPotentialSavings = items.reduce((sum, item) => sum + item.potentialSavings, 0);

    return {
      items,
      totalPotentialSavings
    };
  }, [transactions, monthIncome, monthExpense]);

  return (
    <div className="bg-gradient-to-br from-emerald-900/90 via-slate-900 to-gray-900 text-white rounded-2xl p-5 shadow-xl border border-emerald-500/20 relative overflow-hidden transition-all">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-500/20 relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 flex items-center justify-center">
            <Lightbulb size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-base text-white tracking-wide">
                Financial Insights (วิเคราะห์และข้อแนะนำการประหยัด)
              </h3>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold bg-emerald-400/20 text-emerald-300 rounded-full border border-emerald-400/30">
                <Sparkles size={10} className="mr-1" /> Smart AI Algorithm
              </span>
            </div>
            <p className="text-xs text-emerald-200/70">
              วิเคราะห์พฤติกรรมรายจ่ายหมุนเวียน ประเมินจุดที่ประหยัดงบประมาณได้
            </p>
          </div>
        </div>

        {/* Total Estimated Savings Badge */}
        <div className="bg-emerald-500/15 border border-emerald-400/30 px-3.5 py-2 rounded-xl flex items-center space-x-2.5 self-start sm:self-auto shadow-inner">
          <PiggyBank size={20} className="text-emerald-400" />
          <div>
            <div className="text-[10px] text-emerald-300 font-medium uppercase tracking-wider">
              โอกาสประหยัดเงินรวม
            </div>
            <div className="text-sm font-black text-emerald-300">
              ~ ฿{insights.totalPotentialSavings.toLocaleString()} / เดือน
            </div>
          </div>
        </div>
      </div>

      {/* Insight Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4 relative z-10">
        {insights.items.map((item) => (
          <div
            key={item.id}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 rounded-xl p-3.5 transition-all duration-200 flex flex-col justify-between space-y-2.5 group"
          >
            <div>
              {/* Category & Badge */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
                  {item.category}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-400/20 text-amber-300 rounded-md border border-amber-400/30">
                  {item.badge}
                </span>
              </div>

              {/* Title & Description */}
              <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                {item.description}
              </p>
            </div>

            {/* Financial comparison & Action Tip */}
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
              <div className="text-slate-400">
                จ่ายจริง: <span className="font-semibold text-slate-200">฿{item.currentSpent.toLocaleString()}</span>
              </div>
              <div className="text-emerald-400 font-bold flex items-center">
                ประหยัดได้: ฿{item.potentialSavings.toLocaleString()}
              </div>
            </div>

            <div className="bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-800/40 text-[10px] text-emerald-300 font-medium flex items-center">
              <span className="font-bold text-emerald-400 mr-1.5">💡 คำแนะนำ:</span> {item.tip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
