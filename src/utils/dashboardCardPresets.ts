import { DashboardCardId, DashboardCardThemePreset, DashboardCardColorDefinition, DashboardCardDesignConfig } from '../types';

export interface DashboardCardPresetItem {
  id: DashboardCardThemePreset;
  label: string;
  subLabel: string;
  description: string;
  tagline: string;
  badge: string;
  badgeClass: string;
  previewColors: string[];
  cards: Record<DashboardCardId, DashboardCardColorDefinition>;
}

export const CARD_METRIC_META: Record<DashboardCardId, {
  label: string;
  englishLabel: string;
  defaultUnit: string;
  iconName: string;
  description: string;
}> = {
  total_balance: {
    label: 'ยอดคงเหลือรวมทั้งหมด',
    englishLabel: 'Total Balance',
    defaultUnit: 'บาท',
    iconName: 'Wallet',
    description: 'ยอดเงินคงเหลือสะสมสุทธิทั้งหมดของธุรกิจ'
  },
  total_income: {
    label: 'รายรับรวม',
    englishLabel: 'Total Income',
    defaultUnit: 'บาท',
    iconName: 'TrendingUp',
    description: 'ยอดขายและรายได้ทั้งหมดในช่วงเวลาที่เลือก'
  },
  total_expense: {
    label: 'รายจ่ายรวม',
    englishLabel: 'Total Expense',
    defaultUnit: 'บาท',
    iconName: 'TrendingDown',
    description: 'ต้นทุน ค่าใช้จ่าย และค่าดำเนินการทั้งหมด'
  },
  net_profit: {
    label: 'กำไรสุทธิ',
    englishLabel: 'Net Profit',
    defaultUnit: 'บาท',
    iconName: 'Zap',
    description: 'ผลกำไรหลังหักรายจ่ายทั้งหมด พร้อมคำนวณ Margin %'
  },
  unpaid: {
    label: 'ยอดค้างชำระ',
    englishLabel: 'Accounts Receivable',
    defaultUnit: 'บาท',
    iconName: 'Clock',
    description: 'ยอดเงินที่รอลูกค้าชำระและออเดอร์ค้างรับ'
  },
  solar_sales: {
    label: 'ยอดขายโซล่าเซลล์',
    englishLabel: 'Solar Sales Revenue',
    defaultUnit: 'บาท',
    iconName: 'Sun',
    description: 'รายได้เฉพาะกลุ่มสินค้าและชุดอุปกรณ์โซล่าเซลล์'
  }
};

export const DASHBOARD_CARD_PRESETS: DashboardCardPresetItem[] = [
  {
    id: 'pastel_soft',
    label: 'พาสเทลไล่ระดับละมุนตา (Soft Pastel Glow)',
    subLabel: 'Pastel Gradient & Soft Contrast',
    description: 'โทนสีพาสเทลไล่ระดับนุ่มนวล สบายตา ให้อารมณ์ทันสมัย สะอาด และเป็นมิตร',
    tagline: 'Soft Pastels, Gentle Gradients, High Legibility',
    badge: 'แนะนำยอดนิยม',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    previewColors: ['#e0e7ff', '#dcfce7', '#ffe4e6', '#f3e8ff', '#fef3c7', '#e0f2fe'],
    cards: {
      total_balance: {
        bgGradientFrom: '#e0e7ff',
        bgGradientTo: '#ede9fe',
        bgGradientVia: '#e9e8ff',
        textColor: '#312e81',
        subTextColor: '#4338ca',
        accentColor: '#4f46e5',
        borderColor: '#c7d2fe',
        darkBgGradientFrom: '#1e1b4b',
        darkBgGradientTo: '#312e81',
        darkTextColor: '#e0e7ff',
        darkBorderColor: '#3730a3',
        iconBgColor: '#c7d2fe',
        iconColor: '#3730a3',
        sparklineColor: '#6366f1'
      },
      total_income: {
        bgGradientFrom: '#e6f4ea',
        bgGradientTo: '#d1fae5',
        bgGradientVia: '#dcfce7',
        textColor: '#065f46',
        subTextColor: '#047857',
        accentColor: '#059669',
        borderColor: '#a7f3d0',
        darkBgGradientFrom: '#022c22',
        darkBgGradientTo: '#064e3b',
        darkTextColor: '#d1fae5',
        darkBorderColor: '#047857',
        iconBgColor: '#a7f3d0',
        iconColor: '#065f46',
        sparklineColor: '#059669'
      },
      total_expense: {
        bgGradientFrom: '#fce8e6',
        bgGradientTo: '#ffe4e6',
        bgGradientVia: '#ffedd5',
        textColor: '#9f1239',
        subTextColor: '#be123c',
        accentColor: '#e11d48',
        borderColor: '#fca5a5',
        darkBgGradientFrom: '#4c0519',
        darkBgGradientTo: '#881337',
        darkTextColor: '#ffe4e6',
        darkBorderColor: '#be123c',
        iconBgColor: '#fecdd3',
        iconColor: '#9f1239',
        sparklineColor: '#e11d48'
      },
      net_profit: {
        bgGradientFrom: '#f3e8ff',
        bgGradientTo: '#fce7f3',
        bgGradientVia: '#fae8ff',
        textColor: '#581c87',
        subTextColor: '#6b21a8',
        accentColor: '#7c3aed',
        borderColor: '#ddd6fe',
        darkBgGradientFrom: '#3b0764',
        darkBgGradientTo: '#581c87',
        darkTextColor: '#f3e8ff',
        darkBorderColor: '#7e22ce',
        iconBgColor: '#e9d5ff',
        iconColor: '#581c87',
        sparklineColor: '#7c3aed'
      },
      unpaid: {
        bgGradientFrom: '#fef7e0',
        bgGradientTo: '#ffedd5',
        bgGradientVia: '#fef3c7',
        textColor: '#92400e',
        subTextColor: '#b45309',
        accentColor: '#d97706',
        borderColor: '#fde68a',
        darkBgGradientFrom: '#451a03',
        darkBgGradientTo: '#78350f',
        darkTextColor: '#fef3c7',
        darkBorderColor: '#b45309',
        iconBgColor: '#fde68a',
        iconColor: '#92400e',
        sparklineColor: '#d97706'
      },
      solar_sales: {
        bgGradientFrom: '#e8f0fe',
        bgGradientTo: '#cffafe',
        bgGradientVia: '#e0f2fe',
        textColor: '#075985',
        subTextColor: '#0369a1',
        accentColor: '#0284c7',
        borderColor: '#bae6fd',
        darkBgGradientFrom: '#082f49',
        darkBgGradientTo: '#0c4a6e',
        darkTextColor: '#e0f2fe',
        darkBorderColor: '#0284c7',
        iconBgColor: '#bae6fd',
        iconColor: '#075985',
        sparklineColor: '#0284c7'
      }
    }
  },
  {
    id: 'vibrant_gradient',
    label: 'เกรเดียนท์สดใส มีชีวิตชีวา (Vibrant Gradient)',
    subLabel: 'Rich Vivid Multi-Stop Gradient Flow',
    description: 'การ์ดไล่เฉดสีสดใส มีมิติลอยเด่น คมชัด ตัวเลขสีขาวตัดพื้นหลังชัดเจนสไตล์ Executive Dashboard',
    tagline: 'Vibrant Colors, High Contrast & Executive Luxury',
    badge: 'หรูหราทรงพลัง',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    previewColors: ['#4f46e5', '#059669', '#e11d48', '#8b5cf6', '#d97706', '#0284c7'],
    cards: {
      total_balance: {
        bgGradientFrom: '#4338ca',
        bgGradientTo: '#6366f1',
        bgGradientVia: '#4f46e5',
        textColor: '#ffffff',
        subTextColor: '#e0e7ff',
        accentColor: '#818cf8',
        borderColor: '#818cf8',
        darkBgGradientFrom: '#312e81',
        darkBgGradientTo: '#4338ca',
        darkTextColor: '#ffffff',
        darkBorderColor: '#6366f1',
        iconBgColor: 'rgba(255, 255, 255, 0.2)',
        iconColor: '#ffffff',
        sparklineColor: '#ffffff'
      },
      total_income: {
        bgGradientFrom: '#047857',
        bgGradientTo: '#10b981',
        bgGradientVia: '#059669',
        textColor: '#ffffff',
        subTextColor: '#d1fae5',
        accentColor: '#34d399',
        borderColor: '#34d399',
        darkBgGradientFrom: '#064e3b',
        darkBgGradientTo: '#047857',
        darkTextColor: '#ffffff',
        darkBorderColor: '#10b981',
        iconBgColor: 'rgba(255, 255, 255, 0.2)',
        iconColor: '#ffffff',
        sparklineColor: '#ffffff'
      },
      total_expense: {
        bgGradientFrom: '#be123c',
        bgGradientTo: '#f43f5e',
        bgGradientVia: '#e11d48',
        textColor: '#ffffff',
        subTextColor: '#ffe4e6',
        accentColor: '#fb7185',
        borderColor: '#fb7185',
        darkBgGradientFrom: '#881337',
        darkBgGradientTo: '#be123c',
        darkTextColor: '#ffffff',
        darkBorderColor: '#f43f5e',
        iconBgColor: 'rgba(255, 255, 255, 0.2)',
        iconColor: '#ffffff',
        sparklineColor: '#ffffff'
      },
      net_profit: {
        bgGradientFrom: '#6d28d9',
        bgGradientTo: '#ec4899',
        bgGradientVia: '#8b5cf6',
        textColor: '#ffffff',
        subTextColor: '#f3e8ff',
        accentColor: '#c084fc',
        borderColor: '#c084fc',
        darkBgGradientFrom: '#581c87',
        darkBgGradientTo: '#7c3aed',
        darkTextColor: '#ffffff',
        darkBorderColor: '#a855f7',
        iconBgColor: 'rgba(255, 255, 255, 0.2)',
        iconColor: '#ffffff',
        sparklineColor: '#ffffff'
      },
      unpaid: {
        bgGradientFrom: '#b45309',
        bgGradientTo: '#f59e0b',
        bgGradientVia: '#d97706',
        textColor: '#ffffff',
        subTextColor: '#fef3c7',
        accentColor: '#fbbf24',
        borderColor: '#fbbf24',
        darkBgGradientFrom: '#78350f',
        darkBgGradientTo: '#b45309',
        darkTextColor: '#ffffff',
        darkBorderColor: '#f59e0b',
        iconBgColor: 'rgba(255, 255, 255, 0.2)',
        iconColor: '#ffffff',
        sparklineColor: '#ffffff'
      },
      solar_sales: {
        bgGradientFrom: '#0369a1',
        bgGradientTo: '#06b6d4',
        bgGradientVia: '#0284c7',
        textColor: '#ffffff',
        subTextColor: '#e0f2fe',
        accentColor: '#38bdf8',
        borderColor: '#38bdf8',
        darkBgGradientFrom: '#0c4a6e',
        darkBgGradientTo: '#0369a1',
        darkTextColor: '#ffffff',
        darkBorderColor: '#06b6d4',
        iconBgColor: 'rgba(255, 255, 255, 0.2)',
        iconColor: '#ffffff',
        sparklineColor: '#ffffff'
      }
    }
  },
  {
    id: 'solar_sunburst',
    label: 'พลังงานแสงอาทิตย์ (Solar Sunburst & Amber)',
    subLabel: 'Golden Rays, Solar Flare & Amber Spark',
    description: 'โทนสีทองสว่าง ผสานประกายแสงอาทิตย์และสีส้มอบอุ่น สื่อถึงธุรกิจโซล่าเซลล์โดยตรง',
    tagline: 'Solar Energy, Golden Sunlight, Warm Amber',
    badge: 'ธีมโซล่าเซลล์',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    previewColors: ['#fef3c7', '#ecfdf5', '#fff1f2', '#fdf4ff', '#fffbeb', '#f0f9ff'],
    cards: {
      total_balance: {
        bgGradientFrom: '#fffbeb',
        bgGradientTo: '#fef3c7',
        bgGradientVia: '#fef9c3',
        textColor: '#78350f',
        subTextColor: '#92400e',
        accentColor: '#d97706',
        borderColor: '#fde68a',
        darkBgGradientFrom: '#451a03',
        darkBgGradientTo: '#78350f',
        darkTextColor: '#fef3c7',
        darkBorderColor: '#b45309',
        iconBgColor: '#fde68a',
        iconColor: '#78350f',
        sparklineColor: '#d97706'
      },
      total_income: {
        bgGradientFrom: '#f0fdf4',
        bgGradientTo: '#ecfdf5',
        textColor: '#065f46',
        subTextColor: '#047857',
        accentColor: '#10b981',
        borderColor: '#a7f3d0',
        darkBgGradientFrom: '#022c22',
        darkBgGradientTo: '#064e3b',
        darkTextColor: '#ecfdf5',
        darkBorderColor: '#059669',
        iconBgColor: '#a7f3d0',
        iconColor: '#065f46',
        sparklineColor: '#10b981'
      },
      total_expense: {
        bgGradientFrom: '#fff1f2',
        bgGradientTo: '#fee2e2',
        textColor: '#9f1239',
        subTextColor: '#be123c',
        accentColor: '#f43f5e',
        borderColor: '#fecdd3',
        darkBgGradientFrom: '#4c0519',
        darkBgGradientTo: '#881337',
        darkTextColor: '#fff1f2',
        darkBorderColor: '#be123c',
        iconBgColor: '#fecdd3',
        iconColor: '#9f1239',
        sparklineColor: '#f43f5e'
      },
      net_profit: {
        bgGradientFrom: '#fff7ed',
        bgGradientTo: '#ffedd5',
        textColor: '#9a3412',
        subTextColor: '#c2410c',
        accentColor: '#ea580c',
        borderColor: '#fed7aa',
        darkBgGradientFrom: '#431407',
        darkBgGradientTo: '#7c2d12',
        darkTextColor: '#ffedd5',
        darkBorderColor: '#c2410c',
        iconBgColor: '#fed7aa',
        iconColor: '#9a3412',
        sparklineColor: '#ea580c'
      },
      unpaid: {
        bgGradientFrom: '#fefce8',
        bgGradientTo: '#fef9c3',
        textColor: '#854d0e',
        subTextColor: '#a16207',
        accentColor: '#ca8a04',
        borderColor: '#fef08a',
        darkBgGradientFrom: '#422006',
        darkBgGradientTo: '#713f12',
        darkTextColor: '#fef9c3',
        darkBorderColor: '#a16207',
        iconBgColor: '#fef08a',
        iconColor: '#854d0e',
        sparklineColor: '#ca8a04'
      },
      solar_sales: {
        bgGradientFrom: '#fef3c7',
        bgGradientTo: '#fed7aa',
        textColor: '#78350f',
        subTextColor: '#c2410c',
        accentColor: '#f59e0b',
        borderColor: '#fcd34d',
        darkBgGradientFrom: '#451a03',
        darkBgGradientTo: '#7c2d12',
        darkTextColor: '#fef3c7',
        darkBorderColor: '#f59e0b',
        iconBgColor: '#fcd34d',
        iconColor: '#78350f',
        sparklineColor: '#f59e0b'
      }
    }
  },
  {
    id: 'emerald_wealth',
    label: 'การเงินมั่งคั่ง มรกต & ทองคำ (Emerald Wealth & Gold)',
    subLabel: 'Deep Emerald & Champagne Gold',
    description: 'โทนสีมรกตแห่งความมั่งคั่ง ผสานทองคำแชมเปญ ให้ความรู้สึกมั่นคง ร่ำรวย และประสบความสำเร็จ',
    tagline: 'Prosperity, Emerald Energy & Financial Strength',
    badge: 'การเงินมั่งคั่ง',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    previewColors: ['#ecfdf5', '#d1fae5', '#fef2f2', '#f0fdfa', '#fefce8', '#ecfeff'],
    cards: {
      total_balance: {
        bgGradientFrom: '#ecfdf5',
        bgGradientTo: '#d1fae5',
        textColor: '#064e3b',
        subTextColor: '#065f46',
        accentColor: '#059669',
        borderColor: '#6ee7b7',
        darkBgGradientFrom: '#022c22',
        darkBgGradientTo: '#064e3b',
        darkTextColor: '#d1fae5',
        darkBorderColor: '#059669',
        iconBgColor: '#a7f3d0',
        iconColor: '#064e3b',
        sparklineColor: '#059669'
      },
      total_income: {
        bgGradientFrom: '#f0fdf4',
        bgGradientTo: '#bbf7d0',
        textColor: '#14532d',
        subTextColor: '#166534',
        accentColor: '#16a34a',
        borderColor: '#86efac',
        darkBgGradientFrom: '#052e16',
        darkBgGradientTo: '#14532d',
        darkTextColor: '#bbf7d0',
        darkBorderColor: '#16a34a',
        iconBgColor: '#86efac',
        iconColor: '#14532d',
        sparklineColor: '#16a34a'
      },
      total_expense: {
        bgGradientFrom: '#fef2f2',
        bgGradientTo: '#fee2e2',
        textColor: '#991b1b',
        subTextColor: '#b91c1c',
        accentColor: '#dc2626',
        borderColor: '#fca5a5',
        darkBgGradientFrom: '#450a0a',
        darkBgGradientTo: '#7f1d1d',
        darkTextColor: '#fee2e2',
        darkBorderColor: '#b91c1c',
        iconBgColor: '#fecaca',
        iconColor: '#991b1b',
        sparklineColor: '#dc2626'
      },
      net_profit: {
        bgGradientFrom: '#f0fdfa',
        bgGradientTo: '#ccfbf1',
        textColor: '#134e4a',
        subTextColor: '#115e59',
        accentColor: '#0d9488',
        borderColor: '#5eead4',
        darkBgGradientFrom: '#042f2e',
        darkBgGradientTo: '#134e4a',
        darkTextColor: '#ccfbf1',
        darkBorderColor: '#0d9488',
        iconBgColor: '#99f6e4',
        iconColor: '#134e4a',
        sparklineColor: '#0d9488'
      },
      unpaid: {
        bgGradientFrom: '#fefce8',
        bgGradientTo: '#fef08a',
        textColor: '#713f12',
        subTextColor: '#854d0e',
        accentColor: '#eab308',
        borderColor: '#fde047',
        darkBgGradientFrom: '#422006',
        darkBgGradientTo: '#713f12',
        darkTextColor: '#fef08a',
        darkBorderColor: '#ca8a04',
        iconBgColor: '#fef08a',
        iconColor: '#713f12',
        sparklineColor: '#eab308'
      },
      solar_sales: {
        bgGradientFrom: '#ecfeff',
        bgGradientTo: '#cffafe',
        textColor: '#164e63',
        subTextColor: '#155e75',
        accentColor: '#0891b2',
        borderColor: '#67e8f9',
        darkBgGradientFrom: '#083344',
        darkBgGradientTo: '#164e63',
        darkTextColor: '#cffafe',
        darkBorderColor: '#0891b2',
        iconBgColor: '#a5f3fc',
        iconColor: '#164e63',
        sparklineColor: '#0891b2'
      }
    }
  },
  {
    id: 'modern_glass',
    label: 'โมเดิร์นกระจกใสฝ้า (Frosted Glassmorphism)',
    subLabel: 'Frosted Glass & Ambient Tint Blur',
    description: 'สไตล์กระจกฝ้าโปร่งแสงล้ำสมัย มีประกายเรืองแสงรอบขอบการ์ด เข้ากับทั้งโหมดสว่างและโหมดมืด',
    tagline: 'Modern Translucency, Glass Blur & Soft Glow',
    badge: 'พรีเมียมล้ำสมัย',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    previewColors: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b'],
    cards: {
      total_balance: {
        bgGradientFrom: 'rgba(99, 102, 241, 0.08)',
        bgGradientTo: 'rgba(139, 92, 246, 0.12)',
        textColor: '#312e81',
        subTextColor: '#4338ca',
        accentColor: '#6366f1',
        borderColor: 'rgba(99, 102, 241, 0.25)',
        darkBgGradientFrom: 'rgba(99, 102, 241, 0.15)',
        darkBgGradientTo: 'rgba(139, 92, 246, 0.25)',
        darkTextColor: '#e0e7ff',
        darkBorderColor: 'rgba(99, 102, 241, 0.4)',
        iconBgColor: 'rgba(99, 102, 241, 0.15)',
        iconColor: '#4f46e5',
        sparklineColor: '#6366f1'
      },
      total_income: {
        bgGradientFrom: 'rgba(16, 185, 129, 0.08)',
        bgGradientTo: 'rgba(5, 150, 105, 0.12)',
        textColor: '#065f46',
        subTextColor: '#047857',
        accentColor: '#10b981',
        borderColor: 'rgba(16, 185, 129, 0.25)',
        darkBgGradientFrom: 'rgba(16, 185, 129, 0.15)',
        darkBgGradientTo: 'rgba(5, 150, 105, 0.25)',
        darkTextColor: '#d1fae5',
        darkBorderColor: 'rgba(16, 185, 129, 0.4)',
        iconBgColor: 'rgba(16, 185, 129, 0.15)',
        iconColor: '#059669',
        sparklineColor: '#10b981'
      },
      total_expense: {
        bgGradientFrom: 'rgba(244, 63, 94, 0.08)',
        bgGradientTo: 'rgba(225, 29, 72, 0.12)',
        textColor: '#9f1239',
        subTextColor: '#be123c',
        accentColor: '#f43f5e',
        borderColor: 'rgba(244, 63, 94, 0.25)',
        darkBgGradientFrom: 'rgba(244, 63, 94, 0.15)',
        darkBgGradientTo: 'rgba(225, 29, 72, 0.25)',
        darkTextColor: '#ffe4e6',
        darkBorderColor: 'rgba(244, 63, 94, 0.4)',
        iconBgColor: 'rgba(244, 63, 94, 0.15)',
        iconColor: '#e11d48',
        sparklineColor: '#f43f5e'
      },
      net_profit: {
        bgGradientFrom: 'rgba(168, 85, 247, 0.08)',
        bgGradientTo: 'rgba(147, 51, 234, 0.12)',
        textColor: '#581c87',
        subTextColor: '#6b21a8',
        accentColor: '#a855f7',
        borderColor: 'rgba(168, 85, 247, 0.25)',
        darkBgGradientFrom: 'rgba(168, 85, 247, 0.15)',
        darkBgGradientTo: 'rgba(147, 51, 234, 0.25)',
        darkTextColor: '#f3e8ff',
        darkBorderColor: 'rgba(168, 85, 247, 0.4)',
        iconBgColor: 'rgba(168, 85, 247, 0.15)',
        iconColor: '#9333ea',
        sparklineColor: '#a855f7'
      },
      unpaid: {
        bgGradientFrom: 'rgba(245, 158, 11, 0.08)',
        bgGradientTo: 'rgba(217, 119, 6, 0.12)',
        textColor: '#92400e',
        subTextColor: '#b45309',
        accentColor: '#f59e0b',
        borderColor: 'rgba(245, 158, 11, 0.25)',
        darkBgGradientFrom: 'rgba(245, 158, 11, 0.15)',
        darkBgGradientTo: 'rgba(217, 119, 6, 0.25)',
        darkTextColor: '#fef3c7',
        darkBorderColor: 'rgba(245, 158, 11, 0.4)',
        iconBgColor: 'rgba(245, 158, 11, 0.15)',
        iconColor: '#d97706',
        sparklineColor: '#f59e0b'
      },
      solar_sales: {
        bgGradientFrom: 'rgba(6, 182, 212, 0.08)',
        bgGradientTo: 'rgba(2, 132, 199, 0.12)',
        textColor: '#075985',
        subTextColor: '#0369a1',
        accentColor: '#06b6d4',
        borderColor: 'rgba(6, 182, 212, 0.25)',
        darkBgGradientFrom: 'rgba(6, 182, 212, 0.15)',
        darkBgGradientTo: 'rgba(2, 132, 199, 0.25)',
        darkTextColor: '#e0f2fe',
        darkBorderColor: 'rgba(6, 182, 212, 0.4)',
        iconBgColor: 'rgba(6, 182, 212, 0.15)',
        iconColor: '#0284c7',
        sparklineColor: '#06b6d4'
      }
    }
  },
  {
    id: 'candy_pop',
    label: 'ลูกกวาดพาสเทลสดใส (Candy Pop Pastel)',
    subLabel: 'Playful Bright Pastel Palette',
    description: 'โทนสีลูกกวาดสดใส มีชีวิตชีวา ผสมความน่ารัก สนุกสนาน และอ่านตัวเลขได้เด่นชัด',
    tagline: 'Sweet Pastels, Vibrant Energy, Playful Charm',
    badge: 'สดใสร่าเริง',
    badgeClass: 'bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    previewColors: ['#fce7f3', '#ccfbf1', '#fee2e2', '#ede9fe', '#fef3c7', '#e0f2fe'],
    cards: {
      total_balance: {
        bgGradientFrom: '#ede9fe',
        bgGradientTo: '#fce7f3',
        textColor: '#4c1d95',
        subTextColor: '#5b21b6',
        accentColor: '#7c3aed',
        borderColor: '#ddd6fe',
        darkBgGradientFrom: '#2e1065',
        darkBgGradientTo: '#500724',
        darkTextColor: '#ede9fe',
        darkBorderColor: '#6d28d9',
        iconBgColor: '#ddd6fe',
        iconColor: '#5b21b6',
        sparklineColor: '#7c3aed'
      },
      total_income: {
        bgGradientFrom: '#ccfbf1',
        bgGradientTo: '#dcfce7',
        textColor: '#115e59',
        subTextColor: '#0f766e',
        accentColor: '#14b8a6',
        borderColor: '#99f6e4',
        darkBgGradientFrom: '#042f2e',
        darkBgGradientTo: '#052e16',
        darkTextColor: '#ccfbf1',
        darkBorderColor: '#0d9488',
        iconBgColor: '#99f6e4',
        iconColor: '#115e59',
        sparklineColor: '#14b8a6'
      },
      total_expense: {
        bgGradientFrom: '#fce7f3',
        bgGradientTo: '#fee2e2',
        textColor: '#831843',
        subTextColor: '#9d174d',
        accentColor: '#ec4899',
        borderColor: '#fbcfe8',
        darkBgGradientFrom: '#500724',
        darkBgGradientTo: '#450a0a',
        darkTextColor: '#fce7f3',
        darkBorderColor: '#be185d',
        iconBgColor: '#fbcfe8',
        iconColor: '#831843',
        sparklineColor: '#ec4899'
      },
      net_profit: {
        bgGradientFrom: '#fae8ff',
        bgGradientTo: '#f3e8ff',
        textColor: '#701a75',
        subTextColor: '#86198f',
        accentColor: '#d946ef',
        borderColor: '#f5d0fe',
        darkBgGradientFrom: '#4a044e',
        darkBgGradientTo: '#3b0764',
        darkTextColor: '#fae8ff',
        darkBorderColor: '#a21caf',
        iconBgColor: '#f5d0fe',
        iconColor: '#701a75',
        sparklineColor: '#d946ef'
      },
      unpaid: {
        bgGradientFrom: '#ffedd5',
        bgGradientTo: '#fef3c7',
        textColor: '#7c2d12',
        subTextColor: '#9a3412',
        accentColor: '#f97316',
        borderColor: '#fed7aa',
        darkBgGradientFrom: '#431407',
        darkBgGradientTo: '#451a03',
        darkTextColor: '#ffedd5',
        darkBorderColor: '#c2410c',
        iconBgColor: '#fed7aa',
        iconColor: '#7c2d12',
        sparklineColor: '#f97316'
      },
      solar_sales: {
        bgGradientFrom: '#e0f2fe',
        bgGradientTo: '#ccfbf1',
        textColor: '#0c4a6e',
        subTextColor: '#0369a1',
        accentColor: '#0ea5e9',
        borderColor: '#bae6fd',
        darkBgGradientFrom: '#082f49',
        darkBgGradientTo: '#042f2e',
        darkTextColor: '#e0f2fe',
        darkBorderColor: '#0284c7',
        iconBgColor: '#bae6fd',
        iconColor: '#0c4a6e',
        sparklineColor: '#0ea5e9'
      }
    }
  },
  {
    id: 'nordic_frost',
    label: 'สแกนดิเนเวีย ไอซ์แลนด์ (Nordic Frost & Slate)',
    subLabel: 'Glacial Blue, Cool Slate & Polar Mint',
    description: 'โทนสีเย็น สงบ สะอาด สไตล์สแกนดิเนเวียน เรียบหรู ไม่ฉูดฉาด เหมาะสำหรับวิเคราะห์ข้อมูลยาวนาน',
    tagline: 'Nordic Minimalism, Glacial Slate & Pure Clarity',
    badge: 'มินิมอลสุขุม',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    previewColors: ['#f1f5f9', '#e2e8f0', '#f8fafc', '#e0f2fe', '#f0fdf4', '#ede9fe'],
    cards: {
      total_balance: {
        bgGradientFrom: '#f1f5f9',
        bgGradientTo: '#e2e8f0',
        textColor: '#0f172a',
        subTextColor: '#334155',
        accentColor: '#475569',
        borderColor: '#cbd5e1',
        darkBgGradientFrom: '#0f172a',
        darkBgGradientTo: '#1e293b',
        darkTextColor: '#f8fafc',
        darkBorderColor: '#334155',
        iconBgColor: '#cbd5e1',
        iconColor: '#0f172a',
        sparklineColor: '#475569'
      },
      total_income: {
        bgGradientFrom: '#f0fdf4',
        bgGradientTo: '#e2e8f0',
        textColor: '#14532d',
        subTextColor: '#166534',
        accentColor: '#15803d',
        borderColor: '#bbf7d0',
        darkBgGradientFrom: '#052e16',
        darkBgGradientTo: '#1e293b',
        darkTextColor: '#dcfce7',
        darkBorderColor: '#166534',
        iconBgColor: '#bbf7d0',
        iconColor: '#14532d',
        sparklineColor: '#15803d'
      },
      total_expense: {
        bgGradientFrom: '#fef2f2',
        bgGradientTo: '#e2e8f0',
        textColor: '#7f1d1d',
        subTextColor: '#991b1b',
        accentColor: '#b91c1c',
        borderColor: '#fecaca',
        darkBgGradientFrom: '#450a0a',
        darkBgGradientTo: '#1e293b',
        darkTextColor: '#fee2e2',
        darkBorderColor: '#991b1b',
        iconBgColor: '#fecaca',
        iconColor: '#7f1d1d',
        sparklineColor: '#b91c1c'
      },
      net_profit: {
        bgGradientFrom: '#f5f3ff',
        bgGradientTo: '#e2e8f0',
        textColor: '#3b0764',
        subTextColor: '#581c87',
        accentColor: '#6d28d9',
        borderColor: '#ddd6fe',
        darkBgGradientFrom: '#2e1065',
        darkBgGradientTo: '#1e293b',
        darkTextColor: '#f3e8ff',
        darkBorderColor: '#581c87',
        iconBgColor: '#ddd6fe',
        iconColor: '#3b0764',
        sparklineColor: '#6d28d9'
      },
      unpaid: {
        bgGradientFrom: '#fffbeb',
        bgGradientTo: '#e2e8f0',
        textColor: '#713f12',
        subTextColor: '#854d0e',
        accentColor: '#a16207',
        borderColor: '#fef08a',
        darkBgGradientFrom: '#422006',
        darkBgGradientTo: '#1e293b',
        darkTextColor: '#fef9c3',
        darkBorderColor: '#854d0e',
        iconBgColor: '#fef08a',
        iconColor: '#713f12',
        sparklineColor: '#a16207'
      },
      solar_sales: {
        bgGradientFrom: '#f0f9ff',
        bgGradientTo: '#e2e8f0',
        textColor: '#082f49',
        subTextColor: '#075985',
        accentColor: '#0369a1',
        borderColor: '#bae6fd',
        darkBgGradientFrom: '#082f49',
        darkBgGradientTo: '#1e293b',
        darkTextColor: '#e0f2fe',
        darkBorderColor: '#0369a1',
        iconBgColor: '#bae6fd',
        iconColor: '#082f49',
        sparklineColor: '#0369a1'
      }
    }
  },
  {
    id: 'cyber_neon',
    label: 'ไซเบอร์นีออน ไฮเทคล้ำยุค (Cyber Neon Glow)',
    subLabel: 'Obsidian Stealth & Glowing Laser Neon',
    description: 'พื้นหลังมืดสไตล์สตีลท์ ตัดด้วยเส้นนีออนเรืองแสงสีม่วง ชมพู ฟ้า และทอง อารมณ์เทคโนโลยีแห่งอนาคต',
    tagline: 'Cyberpunk Futuristic Neon, Glowing Borders & Laser Badges',
    badge: 'ไซเบอร์ไฮเทค',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    previewColors: ['#0f172a', '#1e1b4b', '#064e3b', '#4c0519', '#451a03', '#082f49'],
    cards: {
      total_balance: {
        bgGradientFrom: '#0f172a',
        bgGradientTo: '#1e1b4b',
        textColor: '#818cf8',
        subTextColor: '#a5b4fc',
        accentColor: '#6366f1',
        borderColor: '#6366f1',
        darkBgGradientFrom: '#020617',
        darkBgGradientTo: '#0f172a',
        darkTextColor: '#818cf8',
        darkBorderColor: '#6366f1',
        iconBgColor: 'rgba(99, 102, 241, 0.25)',
        iconColor: '#818cf8',
        sparklineColor: '#818cf8'
      },
      total_income: {
        bgGradientFrom: '#0f172a',
        bgGradientTo: '#064e3b',
        textColor: '#34d399',
        subTextColor: '#6ee7b7',
        accentColor: '#10b981',
        borderColor: '#10b981',
        darkBgGradientFrom: '#020617',
        darkBgGradientTo: '#064e3b',
        darkTextColor: '#34d399',
        darkBorderColor: '#10b981',
        iconBgColor: 'rgba(16, 185, 129, 0.25)',
        iconColor: '#34d399',
        sparklineColor: '#34d399'
      },
      total_expense: {
        bgGradientFrom: '#0f172a',
        bgGradientTo: '#4c0519',
        textColor: '#fb7185',
        subTextColor: '#fda4af',
        accentColor: '#f43f5e',
        borderColor: '#f43f5e',
        darkBgGradientFrom: '#020617',
        darkBgGradientTo: '#4c0519',
        darkTextColor: '#fb7185',
        darkBorderColor: '#f43f5e',
        iconBgColor: 'rgba(244, 63, 94, 0.25)',
        iconColor: '#fb7185',
        sparklineColor: '#fb7185'
      },
      net_profit: {
        bgGradientFrom: '#0f172a',
        bgGradientTo: '#3b0764',
        textColor: '#c084fc',
        subTextColor: '#d8b4fe',
        accentColor: '#a855f7',
        borderColor: '#a855f7',
        darkBgGradientFrom: '#020617',
        darkBgGradientTo: '#3b0764',
        darkTextColor: '#c084fc',
        darkBorderColor: '#a855f7',
        iconBgColor: 'rgba(168, 85, 247, 0.25)',
        iconColor: '#c084fc',
        sparklineColor: '#c084fc'
      },
      unpaid: {
        bgGradientFrom: '#0f172a',
        bgGradientTo: '#451a03',
        textColor: '#fbbf24',
        subTextColor: '#fde68a',
        accentColor: '#f59e0b',
        borderColor: '#f59e0b',
        darkBgGradientFrom: '#020617',
        darkBgGradientTo: '#451a03',
        darkTextColor: '#fbbf24',
        darkBorderColor: '#f59e0b',
        iconBgColor: 'rgba(245, 158, 11, 0.25)',
        iconColor: '#fbbf24',
        sparklineColor: '#fbbf24'
      },
      solar_sales: {
        bgGradientFrom: '#0f172a',
        bgGradientTo: '#082f49',
        textColor: '#38bdf8',
        subTextColor: '#7dd3fc',
        accentColor: '#0ea5e9',
        borderColor: '#0ea5e9',
        darkBgGradientFrom: '#020617',
        darkBgGradientTo: '#082f49',
        darkTextColor: '#38bdf8',
        darkBorderColor: '#0ea5e9',
        iconBgColor: 'rgba(14, 165, 233, 0.25)',
        iconColor: '#38bdf8',
        sparklineColor: '#38bdf8'
      }
    }
  },
  {
    id: 'minimal_clean',
    label: 'มินิมอลโมเดิร์นคลีน (Clean Slate & Line)',
    subLabel: 'Crisp White Slate & 2px Accent Border',
    description: 'เน้นความสะอาด โปร่ง โล่ง พื้นหลังสีขาวนวลหรือดำด้าน พร้อมแถบสีเน้นที่ชัดเจนแบบโมเดิร์น',
    tagline: 'Pure White Canvas, Sharp Borders & Typographic Hierarchy',
    badge: 'เรียบหรูคลาสสิก',
    badgeClass: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    previewColors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    cards: {
      total_balance: {
        bgGradientFrom: '#ffffff',
        bgGradientTo: '#f8fafc',
        textColor: '#1e293b',
        subTextColor: '#475569',
        accentColor: '#4f46e5',
        borderColor: '#4f46e5',
        darkBgGradientFrom: '#0f172a',
        darkBgGradientTo: '#1e293b',
        darkTextColor: '#f8fafc',
        darkBorderColor: '#6366f1',
        iconBgColor: '#e0e7ff',
        iconColor: '#4338ca',
        sparklineColor: '#4f46e5'
      },
      total_income: {
        bgGradientFrom: '#ffffff',
        bgGradientTo: '#f8fafc',
        textColor: '#1e293b',
        subTextColor: '#475569',
        accentColor: '#059669',
        borderColor: '#059669',
        darkBgGradientFrom: '#0f172a',
        darkBgGradientTo: '#1e293b',
        darkTextColor: '#f8fafc',
        darkBorderColor: '#10b981',
        iconBgColor: '#d1fae5',
        iconColor: '#065f46',
        sparklineColor: '#059669'
      },
      total_expense: {
        bgGradientFrom: '#ffffff',
        bgGradientTo: '#f8fafc',
        textColor: '#1e293b',
        subTextColor: '#475569',
        accentColor: '#e11d48',
        borderColor: '#e11d48',
        darkBgGradientFrom: '#0f172a',
        darkBgGradientTo: '#1e293b',
        darkTextColor: '#f8fafc',
        darkBorderColor: '#f43f5e',
        iconBgColor: '#ffe4e6',
        iconColor: '#9f1239',
        sparklineColor: '#e11d48'
      },
      net_profit: {
        bgGradientFrom: '#ffffff',
        bgGradientTo: '#f8fafc',
        textColor: '#1e293b',
        subTextColor: '#475569',
        accentColor: '#7c3aed',
        borderColor: '#7c3aed',
        darkBgGradientFrom: '#0f172a',
        darkBgGradientTo: '#1e293b',
        darkTextColor: '#f8fafc',
        darkBorderColor: '#8b5cf6',
        iconBgColor: '#ede9fe',
        iconColor: '#5b21b6',
        sparklineColor: '#7c3aed'
      },
      unpaid: {
        bgGradientFrom: '#ffffff',
        bgGradientTo: '#f8fafc',
        textColor: '#1e293b',
        subTextColor: '#475569',
        accentColor: '#d97706',
        borderColor: '#d97706',
        darkBgGradientFrom: '#0f172a',
        darkBgGradientTo: '#1e293b',
        darkTextColor: '#f8fafc',
        darkBorderColor: '#f59e0b',
        iconBgColor: '#fef3c7',
        iconColor: '#92400e',
        sparklineColor: '#d97706'
      },
      solar_sales: {
        bgGradientFrom: '#ffffff',
        bgGradientTo: '#f8fafc',
        textColor: '#1e293b',
        subTextColor: '#475569',
        accentColor: '#0284c7',
        borderColor: '#0284c7',
        darkBgGradientFrom: '#0f172a',
        darkBgGradientTo: '#1e293b',
        darkTextColor: '#f8fafc',
        darkBorderColor: '#0ea5e9',
        iconBgColor: '#e0f2fe',
        iconColor: '#0369a1',
        sparklineColor: '#0284c7'
      }
    }
  }
];

export const DEFAULT_DASHBOARD_CARD_DESIGN: DashboardCardDesignConfig = {
  themePreset: 'pastel_soft',
  layoutStyle: 'standard_grid',
  borderRadius: 'rounded-3xl',
  shadowStyle: 'soft',
  showSparklines: true,
  showTrendSubtext: true,
  showIconBadge: true,
  enableHoverScale: true,
  glassBackdropBlur: true,
  cardOrders: [
    'total_balance',
    'total_income',
    'total_expense',
    'net_profit',
    'unpaid',
    'solar_sales'
  ],
  cardVisibility: {
    total_balance: true,
    total_income: true,
    total_expense: true,
    net_profit: true,
    unpaid: true,
    solar_sales: true
  }
};

/**
 * Resolves full color & style object for a single metric card
 */
export function getComputedCardColor(
  cardId: DashboardCardId,
  config?: DashboardCardDesignConfig,
  isDark = false
): DashboardCardColorDefinition {
  const currentConfig = config || DEFAULT_DASHBOARD_CARD_DESIGN;
  const preset = DASHBOARD_CARD_PRESETS.find(p => p.id === currentConfig.themePreset) || DASHBOARD_CARD_PRESETS[0];
  const defaultColors = preset.cards[cardId];
  
  if (currentConfig.themePreset === 'custom' && currentConfig.customColors?.[cardId]) {
    return {
      ...defaultColors,
      ...currentConfig.customColors[cardId]
    };
  }

  return defaultColors;
}
