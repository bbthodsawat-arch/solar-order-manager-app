import React from 'react';
import {
  ShoppingCart,
  BatteryCharging,
  Cpu,
  Coins,
  Wrench,
  Megaphone,
  Utensils,
  Beer,
  Car,
  Percent,
  Hammer,
  Brush,
  Laptop,
  Receipt,
  TrendingUp,
  TrendingDown,
  LucideProps
} from 'lucide-react';

interface CategoryConfig {
  icon: React.ComponentType<LucideProps>;
  bgClass: string;
  textClass: string;
  borderClass: string;
  label: string;
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  // Income categories
  'รายรับจาก Sale order': {
    icon: ShoppingCart,
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    textClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-100 dark:border-blue-900/30',
    label: 'คำสั่งซื้อ'
  },
  'แบตเตอรี่': {
    icon: BatteryCharging,
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-100 dark:border-emerald-900/30',
    label: 'แบตเตอรี่'
  },
  'ตู้คอมบายเนอร์+อินเวอร์เตอร์': {
    icon: Cpu,
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    borderClass: 'border-indigo-100 dark:border-indigo-900/30',
    label: 'ระบบควบคุม'
  },
  'รายได้อื่นๆ': {
    icon: Coins,
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    textClass: 'text-teal-600 dark:text-teal-400',
    borderClass: 'border-teal-100 dark:border-teal-900/30',
    label: 'รายได้อื่น'
  },

  // Expense categories
  'สั่งซื้ออุปกรณ์ประกอบชุด': {
    icon: Wrench,
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-100 dark:border-amber-900/30',
    label: 'อุปกรณ์ประกอบ'
  },
  'ค่าโฆษณา': {
    icon: Megaphone,
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    textClass: 'text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-100 dark:border-purple-900/30',
    label: 'ค่าโฆษณา'
  },
  'ค่าอาหาร': {
    icon: Utensils,
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    textClass: 'text-orange-600 dark:text-orange-400',
    borderClass: 'border-orange-100 dark:border-orange-900/30',
    label: 'ค่าอาหาร'
  },
  'ค่าเครื่องดื่ม เหล้า/เบียร์': {
    icon: Beer,
    bgClass: 'bg-pink-50 dark:bg-pink-950/40',
    textClass: 'text-pink-600 dark:text-pink-400',
    borderClass: 'border-pink-100 dark:border-pink-900/30',
    label: 'เครื่องดื่ม'
  },
  'ค่าเดินทาง': {
    icon: Car,
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    textClass: 'text-sky-600 dark:text-sky-400',
    borderClass: 'border-sky-100 dark:border-sky-900/30',
    label: 'เดินทาง/น้ำมัน'
  },
  'ค่าคอมมิชชั่น': {
    icon: Percent,
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    textClass: 'text-yellow-600 dark:text-yellow-400',
    borderClass: 'border-yellow-100 dark:border-yellow-900/30',
    label: 'ค่าคอมมิชชั่น'
  },
  'ค่าจ้างช่างรายวัน': {
    icon: Hammer,
    bgClass: 'bg-violet-50 dark:bg-violet-950/40',
    textClass: 'text-violet-600 dark:text-violet-400',
    borderClass: 'border-violet-100 dark:border-violet-900/30',
    label: 'จ้างช่างรายวัน'
  },
  'แม่บ้านรายวัน': {
    icon: Brush,
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    textClass: 'text-rose-600 dark:text-rose-400',
    borderClass: 'border-rose-100 dark:border-rose-900/30',
    label: 'แม่บ้าน'
  },
  'ค่าจ้างแอดมิน': {
    icon: Laptop,
    bgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    borderClass: 'border-cyan-100 dark:border-cyan-900/30',
    label: 'จ้างแอดมิน'
  },
  'ค่าใช้จ่ายอื่นๆ': {
    icon: Receipt,
    bgClass: 'bg-slate-50 dark:bg-slate-950/40',
    textClass: 'text-slate-600 dark:text-slate-400',
    borderClass: 'border-slate-100 dark:border-slate-900/30',
    label: 'ค่าใช้จ่ายอื่น'
  }
};

// Fallback configs
const DEFAULT_INCOME: CategoryConfig = {
  icon: TrendingUp,
  bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
  textClass: 'text-emerald-600 dark:text-emerald-400',
  borderClass: 'border-emerald-100 dark:border-emerald-900/30',
  label: 'รายรับ'
};

const DEFAULT_EXPENSE: CategoryConfig = {
  icon: TrendingDown,
  bgClass: 'bg-rose-50 dark:bg-rose-950/40',
  textClass: 'text-rose-600 dark:text-rose-400',
  borderClass: 'border-rose-100 dark:border-rose-900/30',
  label: 'รายจ่าย'
};

/**
 * Find the most appropriate CategoryConfig for a given category name and transaction type.
 * Supports partial keyword matching for user-defined/custom categories.
 */
export function getCategoryConfig(category: string | undefined, type: 'income' | 'expense'): CategoryConfig {
  if (!category) {
    return type === 'income' ? DEFAULT_INCOME : DEFAULT_EXPENSE;
  }

  // 1. Try exact match
  if (CATEGORY_MAP[category]) {
    return CATEGORY_MAP[category];
  }

  // 2. Try soft matching by keywords
  const catLower = category.toLowerCase();

  if (type === 'income') {
    if (catLower.includes('sale') || catLower.includes('ขาย') || catLower.includes('ออเดอร์') || catLower.includes('ใบสั่งซื้อ')) {
      return CATEGORY_MAP['รายรับจาก Sale order'];
    }
    if (catLower.includes('แบต') || catLower.includes('battery') || catLower.includes('ลิเธียม')) {
      return CATEGORY_MAP['แบตเตอรี่'];
    }
    if (catLower.includes('คอมบาย') || catLower.includes('อินเวอร์เตอร์') || catLower.includes('inverter') || catLower.includes('ตู้ไฟ') || catLower.includes('แผง')) {
      return CATEGORY_MAP['ตู้คอมบายเนอร์+อินเวอร์เตอร์'];
    }
    if (catLower.includes('ดอกเบี้ย') || catLower.includes('เงินปันผล') || catLower.includes('แถม') || catLower.includes('กำไร')) {
      return CATEGORY_MAP['รายได้อื่นๆ'];
    }
    return DEFAULT_INCOME;
  } else {
    if (catLower.includes('ซื้ออุปกรณ์') || catLower.includes('สายไฟ') || catLower.includes('น็อต') || catLower.includes('ราง') || catLower.includes('เครื่องมือ') || catLower.includes('วัสดุ')) {
      return CATEGORY_MAP['สั่งซื้ออุปกรณ์ประกอบชุด'];
    }
    if (catLower.includes('โฆษณา') || catLower.includes('เฟส') || catLower.includes('ยิงแอด') || catLower.includes('facebook') || catLower.includes('ads') || catLower.includes('marketing')) {
      return CATEGORY_MAP['ค่าโฆษณา'];
    }
    if (catLower.includes('ข้าว') || catLower.includes('อาหาร') || catLower.includes('ส้มตำ') || catLower.includes('ก๋วยเตี๋ยว') || catLower.includes('บุฟเฟต์') || catLower.includes('หมูกระทะ')) {
      return CATEGORY_MAP['ค่าอาหาร'];
    }
    if (catLower.includes('เบียร์') || catLower.includes('เหล้า') || catLower.includes('เครื่องดื่ม') || catLower.includes('ไวน์') || catLower.includes('สังสรรค์') || catLower.includes('ฉลอง')) {
      return CATEGORY_MAP['ค่าเครื่องดื่ม เหล้า/เบียร์'];
    }
    if (catLower.includes('เดินทาง') || catLower.includes('น้ำมัน') || catLower.includes('รถ') || catLower.includes('ทางด่วน') || catLower.includes('ค่าเรือ') || catLower.includes('ตั๋ว')) {
      return CATEGORY_MAP['ค่าเดินทาง'];
    }
    if (catLower.includes('คอมมิชชั่น') || catLower.includes('นายหน้า') || catLower.includes('ค่านายหน้า') || catLower.includes('commission')) {
      return CATEGORY_MAP['ค่าคอมมิชชั่น'];
    }
    if (catLower.includes('ช่าง') || catLower.includes('ติดตั้ง') || catLower.includes('ค่าแรงช่าง') || catLower.includes('ช่างไฟ')) {
      return CATEGORY_MAP['ค่าจ้างช่างรายวัน'];
    }
    if (catLower.includes('กวาด') || catLower.includes('แม่บ้าน') || catLower.includes('ทำความสะอาด') || catLower.includes('ถู')) {
      return CATEGORY_MAP['แม่บ้านรายวัน'];
    }
    if (catLower.includes('แอดมิน') || catLower.includes('ตอบแชท') || catLower.includes('admin') || catLower.includes('จ้างตอบ')) {
      return CATEGORY_MAP['ค่าจ้างแอดมิน'];
    }
    return DEFAULT_EXPENSE;
  }
}

interface CategoryIconProps {
  category: string | undefined;
  type: 'income' | 'expense';
  size?: number;
  className?: string;
}

/**
 * A beautiful visual element displaying the category-specific icon
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  type,
  size = 20,
  className = ''
}) => {
  const config = getCategoryConfig(category, type);
  const IconComponent = config.icon;

  return <IconComponent size={size} className={className} />;
};
