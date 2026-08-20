import { useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, CalendarDays } from 'lucide-react';
import { useAppConfig } from '../../hooks/useAppConfig';

const HIDE_MARK = 'data-som-dashboard-hidden';

function hideDashboardCardByText(text: string) {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,span,div'));
  const match = nodes.find((node) => node.textContent?.replace(/\s+/g, ' ').trim().includes(text));
  if (!match) return;

  let current: HTMLElement | null = match;
  for (let i = 0; i < 7 && current; i += 1) {
    const cls = current.className || '';
    if (typeof cls === 'string' && cls.includes('rounded-3xl') && cls.includes('border')) {
      current.style.display = 'none';
      current.setAttribute(HIDE_MARK, '1');
      return;
    }
    current = current.parentElement;
  }
}

/**
 * Premium Mobile Dashboard shell.
 * Keeps the existing dashboard analytics intact while removing legacy duplicate
 * business selectors and the two dashboard widgets explicitly retired by product design.
 */
export default function PremiumMobileDashboardShell() {
  const { config } = useAppConfig();
  const shop = (config.shopInfo || {}) as any;
  const storeName = shop.name || 'Solar order manager';
  const companyThai = shop.companyNameThai || shop.companyThai || 'โซล่าออเดอร์ เมเนเจอร์';
  const companyEnglish = shop.companyNameEnglish || shop.companyEnglish || 'Solar order manager';
  const address = shop.address || '';
  const phone = shop.phone || '';
  const email = shop.email || '';

  useEffect(() => {
    const applyCleanup = () => {
      hideDashboardCardByText('ระบบบริหารการเงินและยอดขาย (Dashboard)');
      hideDashboardCardByText('ยอดคงเหลือรวมทั้งหมด (Total Balance)');
      hideDashboardCardByText('รายงานตารางสินค้าคงเหลือ');
    };

    applyCleanup();
    const observer = new MutationObserver(applyCleanup);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="mb-4 sm:mb-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-4 py-5 sm:px-6 sm:py-6 text-white">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Building2 size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Business Dashboard</div>
            <h2 className="mt-1 truncate text-xl font-black tracking-tight sm:text-2xl">{storeName}</h2>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-300">{companyEnglish}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/8 px-3 py-2.5 ring-1 ring-white/10">
            <div className="text-[10px] font-semibold text-slate-400">ชื่อบริษัท</div>
            <div className="mt-0.5 truncate text-sm font-bold">{companyThai}</div>
          </div>
          <div className="rounded-2xl bg-white/8 px-3 py-2.5 ring-1 ring-white/10">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400"><CalendarDays size={11} /> วันนี้</div>
            <div className="mt-0.5 text-sm font-bold">{new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-slate-100 px-4 py-1 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6">
        <div className="flex items-center gap-2 py-3 sm:pr-4">
          <MapPin size={15} className="shrink-0 text-slate-400" />
          <span className="truncate text-xs font-medium text-slate-600">{address || 'ยังไม่ได้ตั้งค่าที่อยู่ธุรกิจ'}</span>
        </div>
        <div className="flex items-center gap-2 py-3 sm:px-4">
          <Phone size={15} className="shrink-0 text-slate-400" />
          <span className="truncate text-xs font-medium text-slate-600">{phone || 'ยังไม่ได้ตั้งค่าโทรศัพท์'}</span>
        </div>
        <div className="flex items-center gap-2 py-3 sm:pl-4">
          <Mail size={15} className="shrink-0 text-slate-400" />
          <span className="truncate text-xs font-medium text-slate-600">{email || 'ยังไม่ได้ตั้งค่าอีเมล'}</span>
        </div>
      </div>
    </section>
  );
}
