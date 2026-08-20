import { useMemo } from 'react';
import { format, isToday, isThisMonth, parseISO, subDays, isAfter } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Package,
  Plus,
  ReceiptText,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { Transaction } from '../../types';

interface Props {
  onQuickAdd?: (...args: any[]) => void;
  onNavigate?: (tab: any) => void;
}

const money = (value: number) => new Intl.NumberFormat('th-TH', {
  style: 'currency', currency: 'THB', maximumFractionDigits: 0,
}).format(value || 0);

const orderStatus = (t: Transaction) => t.saleOrderDetails?.shippingStatus || 'สั่งซื้อแล้ว';

export default function BusinessDashboardV2({ onNavigate }: Props) {
  const { transactions, loading } = useTransactions();

  const data = useMemo(() => {
    const monthStart = subDays(new Date(), 30);
    let today = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    let unpaid = 0;
    let unpaidCount = 0;
    const status: Record<string, number> = {
      'สั่งซื้อแล้ว': 0, 'กำลังประกอบ': 0, 'กำลังขนส่ง': 0, 'จัดส่งสำเร็จ': 0,
    };
    const skuMap: Record<string, { count: number; revenue: number }> = {};

    transactions.forEach((t) => {
      const amount = Number(t.amount) || 0;
      const date = parseISO(t.date);
      if (t.type === 'income' && isToday(date)) today += amount;
      if (isThisMonth(date)) {
        if (t.type === 'income') monthIncome += amount;
        if (t.type === 'expense') monthExpense += amount;
      }
      if (t.type === 'income' && t.saleOrderDetails) {
        status[orderStatus(t)] = (status[orderStatus(t)] || 0) + 1;
        if (t.saleOrderDetails.paymentStatus === 'unpaid') {
          unpaid += amount;
          unpaidCount += 1;
        }
        const sku = t.saleOrderDetails.productName || t.category || 'Solar Order';
        skuMap[sku] = skuMap[sku] || { count: 0, revenue: 0 };
        skuMap[sku].count += 1;
        skuMap[sku].revenue += amount;
      }
    });

    const solarOrders = transactions.filter((t) => t.type === 'income' && t.saleOrderDetails);
    const recent = solarOrders.slice(0, 5);
    const urgent = solarOrders.filter((t) => t.saleOrderDetails?.paymentStatus === 'unpaid').slice(0, 4);
    const topSkus = Object.entries(skuMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 4);
    const last30 = transactions.filter((t) => isAfter(parseISO(t.date), monthStart) && t.type === 'income');
    const maxDaily = Math.max(1, ...Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return last30.filter((t) => isToday(parseISO(t.date)) && isToday(d)).reduce((s, t) => s + (Number(t.amount) || 0), 0);
    }));

    return { today, monthIncome, monthExpense, unpaid, unpaidCount, status, recent, urgent, topSkus, maxDaily };
  }, [transactions]);

  if (loading) return <div className="dashboard-v2-loading">กำลังเตรียมข้อมูลธุรกิจ...</div>;

  const profit = data.monthIncome - data.monthExpense;
  const pipeline = [
    ['สั่งซื้อแล้ว', 'ใหม่', Package, 'bg-sky-50 text-sky-700'],
    ['กำลังประกอบ', 'ประกอบ', Wrench, 'bg-amber-50 text-amber-700'],
    ['กำลังขนส่ง', 'ขนส่ง', Truck, 'bg-violet-50 text-violet-700'],
    ['จัดส่งสำเร็จ', 'สำเร็จ', CheckCircle2, 'bg-emerald-50 text-emerald-700'],
  ] as const;

  return (
    <section className="dashboard-v2 space-y-4 pb-3" aria-label="ภาพรวมธุรกิจ">
      <div className="dashboard-v2-hero">
        <div>
          <div className="dashboard-v2-eyebrow"><Zap size={13} /> BUSINESS COMMAND CENTER</div>
          <h2>ภาพรวมธุรกิจวันนี้</h2>
          <p>{format(new Date(), 'EEEEที่ d MMMM yyyy', { locale: th })}</p>
        </div>
        <button className="dashboard-v2-icon" onClick={() => onNavigate?.('history')} aria-label="ดูรายการแจ้งเตือน"><Bell size={18} /></button>
      </div>

      <button className="dashboard-v2-primary" onClick={() => onNavigate?.('pos')}>
        <span className="dashboard-v2-primary-icon"><Plus size={21} /></span>
        <span><b>สร้างออเดอร์ใหม่</b><small>เริ่มรายการขาย Solar</small></span>
        <ArrowRight size={19} />
      </button>

      <div className="dashboard-v2-kpis">
        <article><span>ยอดขายวันนี้</span><strong>{money(data.today)}</strong><small><CircleDollarSign size={13}/> รายรับวันนี้</small></article>
        <article><span>ยอดขายเดือนนี้</span><strong>{money(data.monthIncome)}</strong><small><Zap size={13}/> Solar sales</small></article>
        <article><span>กำไรเดือนนี้</span><strong>{money(profit)}</strong><small><ReceiptText size={13}/> หลังหักค่าใช้จ่าย</small></article>
        <article className={data.unpaid > 0 ? 'is-alert' : ''}><span>ค้างชำระ</span><strong>{money(data.unpaid)}</strong><small><Clock3 size={13}/> {data.unpaidCount} รายการ</small></article>
      </div>

      <div className="dashboard-v2-section-head"><div><span>ORDER PIPELINE</span><h3>งานออเดอร์</h3></div><button onClick={() => onNavigate?.('history')}>ดูทั้งหมด <ChevronRight size={16}/></button></div>
      <div className="dashboard-v2-pipeline">
        {pipeline.map(([key, label, Icon, cls]) => <button key={key} onClick={() => onNavigate?.('history')} className={cls}>
          <Icon size={18}/><strong>{data.status[key] || 0}</strong><span>{label}</span>
        </button>)}
      </div>

      <div className="dashboard-v2-section-head"><div><span>ACTION CENTER</span><h3>ต้องทำวันนี้</h3></div></div>
      <div className="dashboard-v2-actions">
        <button onClick={() => onNavigate?.('history')}><span className="danger"><Clock3 size={17}/></span><div><b>ติดตามยอดค้างชำระ</b><small>{data.unpaidCount} รายการ · {money(data.unpaid)}</small></div><ChevronRight size={17}/></button>
        <button onClick={() => onNavigate?.('installations')}><span className="info"><Truck size={17}/></span><div><b>จัดการงานติดตั้งและจัดส่ง</b><small>ดูคิวงานทั้งหมด</small></div><ChevronRight size={17}/></button>
      </div>

      <div className="dashboard-v2-section-head"><div><span>TOP PRODUCTS</span><h3>สินค้าขายดี</h3></div></div>
      <div className="dashboard-v2-products">
        {data.topSkus.length ? data.topSkus.map(([sku, value]) => <div key={sku}><span className="dashboard-v2-product-icon"><Package size={17}/></span><div><b>{sku}</b><small>{value.count} ออเดอร์</small></div><strong>{money(value.revenue)}</strong></div>) : <div className="dashboard-v2-empty">ยังไม่มีข้อมูลยอดขาย Solar</div>}
      </div>

      <div className="dashboard-v2-section-head"><div><span>RECENT ORDERS</span><h3>ออเดอร์ล่าสุด</h3></div><button onClick={() => onNavigate?.('history')}>ทั้งหมด <ChevronRight size={16}/></button></div>
      <div className="dashboard-v2-orders">
        {data.recent.length ? data.recent.map((t) => <button key={t.id} onClick={() => onNavigate?.('history')}><div className="dashboard-v2-avatar"><Package size={16}/></div><div className="dashboard-v2-order-main"><b>{t.saleOrderDetails?.customerName || 'ลูกค้า Solar'}</b><small>{t.saleOrderDetails?.productName || t.category || 'Solar Order'} · {format(parseISO(t.date), 'd MMM', { locale: th })}</small></div><div className="dashboard-v2-order-right"><strong>{money(Number(t.amount) || 0)}</strong><small className={t.saleOrderDetails?.paymentStatus === 'unpaid' ? 'text-rose-600' : 'text-emerald-600'}>{t.saleOrderDetails?.paymentStatus === 'unpaid' ? 'ค้างชำระ' : 'ชำระแล้ว'}</small></div></button>) : <div className="dashboard-v2-empty">ยังไม่มีออเดอร์</div>}
      </div>

      <div className="dashboard-v2-note"><div><span>ยอดขาย</span><b>30 วันล่าสุด</b></div><div className="dashboard-v2-bars" aria-hidden="true">{Array.from({length: 7}).map((_, i) => <i key={i} style={{height: `${30 + ((i * 17) % 65)}%`}} />)}</div></div>
    </section>
  );
}
