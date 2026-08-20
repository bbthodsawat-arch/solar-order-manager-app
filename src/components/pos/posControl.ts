export type PosLayout = 'clean-grid' | 'compact-grid' | 'list-first' | 'bento';
export type PosDensity = 'compact' | 'comfortable' | 'spacious';
export type PosAccent = 'brand' | 'emerald' | 'blue' | 'amber' | 'violet';

export interface PosControlConfig {
  enabled: boolean;
  layout: PosLayout;
  density: PosDensity;
  accent: PosAccent;
  showTodaySummary: boolean;
  showRecentCustomers: boolean;
  showQuickActions: boolean;
  defaultPaymentMethod: string;
  defaultPaymentStatus: string;
  defaultShippingStatus: string;
  autoSaveSession: boolean;
  confirmBeforeSubmit: boolean;
}

export const DEFAULT_POS_CONTROL: PosControlConfig = {
  enabled: true,
  layout: 'clean-grid',
  density: 'comfortable',
  accent: 'brand',
  showTodaySummary: true,
  showRecentCustomers: true,
  showQuickActions: true,
  defaultPaymentMethod: 'เงินสด',
  defaultPaymentStatus: 'paid',
  defaultShippingStatus: 'สั่งซื้อแล้ว',
  autoSaveSession: true,
  confirmBeforeSubmit: false,
};

export function normalizePosControl(value: unknown): PosControlConfig {
  const raw = value && typeof value === 'object' ? value as Partial<PosControlConfig> : {};
  return { ...DEFAULT_POS_CONTROL, ...raw };
}
