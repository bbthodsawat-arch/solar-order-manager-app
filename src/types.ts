import { UserRole } from './utils/permissions';
export type { UserRole, UserPermissions, AppUser } from './utils/permissions';

export type TransactionType = 'income' | 'expense';

export const IncomeCategories = [
  'รายรับจาก Sale order',
  'แบตเตอรี่',
  'ตู้คอมบายเนอร์+อินเวอร์เตอร์',
  'รายได้อื่นๆ',
] as const;

export const ExpenseCategories = [
  'สั่งซื้ออุปกรณ์ประกอบชุด',
  'ค่าโฆษณา',
  'ค่าอาหาร',
  'ค่าเครื่องดื่ม เหล้า/เบียร์',
  'ค่าเดินทาง',
  'ค่าคอมมิชชั่น',
  'ค่าจ้างช่างรายวัน',
  'แม่บ้านรายวัน',
  'ค่าจ้างแอดมิน',
  'ค่าใช้จ่ายอื่นๆ',
] as const;

export type IncomeCategory = string;
export type ExpenseCategory = string;
export type TransactionCategory = string;

export interface ConfigItem {
  id: string;
  name: string;
  isActive: boolean;
  type?: 'income' | 'expense'; // For categories
  subcategories?: ConfigItem[];
  color?: string;
  icon?: string;
  description?: string;
  isDefault?: boolean;
  code?: string;
  order?: number;
  bankName?: string;
  accountNo?: string;
  accountName?: string;
  promptPayId?: string;
  badgeStyle?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
}

export interface DashboardWidgetConfig {
  showPinnedMetrics?: boolean;
  pinnedMetrics?: string[];
  showDailyRevenueGoal?: boolean;
  showSmartBudgetAlerts?: boolean;
  showTotalIncome: boolean;
  showTotalExpense: boolean;
  showNetProfit: boolean;
  showUnpaid: boolean;
  showSolarSales: boolean;
  showWeeklyTrend?: boolean;
  showCategorySalesSummary: boolean;
  showQuickShortcuts: boolean;
  showDueAlerts: boolean;
  showTrendChart: boolean;
  showCategoryBreakdown: boolean;
  showMonthlyBudget: boolean;
  showStockInventory: boolean;
  showQuickNotes: boolean;
  showRecentSolarTable: boolean;
  showRecentTransactionsList: boolean;
  widgetsOrder?: string[];
  enableGoalNotifications?: boolean;
}

export type DashboardCardId = 
  | 'total_balance' 
  | 'total_income' 
  | 'total_expense' 
  | 'net_profit' 
  | 'unpaid' 
  | 'solar_sales';

export type DashboardCardThemePreset = 
  | 'pastel_soft'       // พาสเทลละมุนตา (Soft Pastel Glow)
  | 'vibrant_gradient'  // เกรเดียนท์สดใส มีชีวิตชีวา (Vibrant Gradient)
  | 'modern_glass'      // กระจกฝ้าโมเดิร์น พรีเมียม (Modern Frosted Glass)
  | 'minimal_clean'     // มินิมอลเรียบหรู ขอบเส้นบาง (Minimal Clean Slate)
  | 'emerald_wealth'    // การเงินมั่งคั่ง มรกต & ทองคำ (Emerald & Gold Wealth)
  | 'solar_sunburst'    // พลังงานแสงอาทิตย์ ส้มทองเรืองรอง (Solar Sunburst)
  | 'cyber_neon'        // ไซเบอร์นีออน ไฮเทคล้ำยุค (Cyber Neon Glow)
  | 'candy_pop'         // ลูกกวาดพาสเทล สดใสน่ารัก (Candy Pop Pastel)
  | 'nordic_frost'      // สแกนดิเนเวีย โทนฟ้าไอซ์แลนด์ (Nordic Frost & Slate)
  | 'custom';           // กำหนดสีเองอิสระ (Custom Per Card)

export type DashboardCardLayoutStyle = 
  | 'standard_grid'     // กริดมาตรฐาน (5-6 คอลัมน์)
  | 'bento_hero'        // เบนโตะฮีโร่ (ยอดคงเหลือ & กำไรสุทธิโดดเด่น)
  | 'compact_dense'     // กะทัดรัด ประหยัดพื้นที่
  | 'two_column';       // 2 คอลัมน์ใหญ่ อ่านง่าย

export type DashboardCardBorderRadius = 
  | 'rounded-2xl'       // ขอบมนมาตรฐาน (16px)
  | 'rounded-3xl'       // ขอบมนละมุน (24px)
  | 'rounded-xl'        // ขอบมนมินิมอล (12px)
  | 'rounded-full-pill'; // ขอบมนแคปซูล (Pill Style)

export type DashboardCardShadow = 
  | 'soft'              // เงานุ่ม (Soft Elevation)
  | 'glow'              // แสงเรืองรอบการ์ด (Ambient Glow)
  | 'flat'              // แบนเรียบ มีเส้นขอบบาง (Flat & Crisp Border)
  | 'floating';         // มิติลอยเด่น (Floating High Elevation)

export interface DashboardCardColorDefinition {
  bgGradientFrom: string;
  bgGradientTo: string;
  bgGradientVia?: string;
  textColor: string;
  subTextColor?: string;
  accentColor: string;
  borderColor: string;
  darkBgGradientFrom?: string;
  darkBgGradientTo?: string;
  darkTextColor?: string;
  darkBorderColor?: string;
  iconBgColor?: string;
  iconColor?: string;
  sparklineColor?: string;
}

export interface DashboardCardDesignConfig {
  themePreset: DashboardCardThemePreset;
  layoutStyle: DashboardCardLayoutStyle;
  borderRadius: DashboardCardBorderRadius;
  shadowStyle: DashboardCardShadow;
  showSparklines: boolean;
  showTrendSubtext: boolean;
  showIconBadge: boolean;
  enableHoverScale: boolean;
  glassBackdropBlur: boolean;
  cardOrders: DashboardCardId[];
  cardVisibility: Record<DashboardCardId, boolean>;
  customColors?: Partial<Record<DashboardCardId, DashboardCardColorDefinition>>;
}

export type BudgetAlertStatus = 'normal' | 'warning' | 'critical';

export interface SmartBudgetAlertConfig {
  monthlyBudget: number;
  warningThresholdPercent: number;
  criticalThresholdPercent: number;
  enableNotifications: boolean;
}

export interface AppThemeConfig {
  primaryColor: string; // e.g. '#3b82f6'
  accentName: string; // e.g. 'blue', 'ocean', 'sunset'
  secondaryColor?: string; // e.g. '#06b6d4'
  paletteName?: string; // e.g. 'Ocean'
}

export type DisplayDensity = 'compact' | 'comfortable';

export interface StandardProductSetItem {
  id: string;
  name: string;
  quantity: string;
}

export interface StandardProductSet {
  id: string;
  name: string;
  price: number;
  items: StandardProductSetItem[];
  linkedSubcategoryId?: string; // Link to subcategory ID in ConfigItem
  description?: string;
  warrantyPeriod?: string;
}

export interface ShopInfo {
  name: string;
  address: string;
  phone: string;
  email?: string;
  taxId?: string;
  branch?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  bankBranch?: string;
  logoUrl?: string;
  receiptNote?: string;
  taxRegistered?: boolean;
  promptPayId?: string;
  systemName?: string;
  showLogo?: boolean;
  companyNameTh?: string;
  companyNameEn?: string;
  showDeveloperCredit?: boolean;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  price: number;
  cost?: number;
  unit: string;
  inStock?: number;
  minStock?: number;
  sku?: string;
  barcode?: string;
  category?: string;
  description?: string;
  isActive: boolean;
  itemType?: 'product' | 'equipment' | 'service' | 'raw_material';
  updatedAt?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  isActive: boolean;
  description?: string;
  color?: string;
  icon?: string;
  items: ProductCatalogItem[];
}

export interface AssetItem {
  id: string;
  name: string;
  assetCode?: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue?: number;
  salvageValue?: number; // มูลค่าซาก
  usefulLifeYears: number; // อายุการใช้งาน (ปี)
  depreciationMethod?: 'straight_line' | 'none';
  location?: string;
  assignedTo?: string;
  status: 'active' | 'maintenance' | 'retired' | 'lost';
  notes?: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface CategoryTab {
  id: string;
  name: string;
  type: 'income' | 'expense';
  items: ConfigItem[];
}

export type BottomNavActionType = 'tab' | 'quick_action';

export type BottomNavQuickAction = 
  | 'quick_income' 
  | 'quick_expense' 
  | 'toggle_theme' 
  | 'quick_design' 
  | 'pin_lock' 
  | 'sync_now' 
  | 'customize_menu';

export interface BottomNavItemConfig {
  id: string;
  label: string;
  iconName: string;
  actionType: BottomNavActionType;
  targetTab?: string;
  quickAction?: BottomNavQuickAction;
  color?: string;
  badgeText?: string;
  description?: string;
  allowedRoles?: UserRole[]; // If empty or undefined, visible to all roles
  isActive: boolean;
  order: number;
}

export type BottomNavStyleType = 
  | 'floating-capsule' 
  | 'dock-modern' 
  | 'classic-edge' 
  | 'glassmorphism' 
  | 'neon-glow';

export type BottomNavActiveIndicator = 
  | 'pill' 
  | 'dot' 
  | 'glow-border' 
  | 'scale-bounce';

export type BottomNavLabelMode = 
  | 'all' 
  | 'active-only' 
  | 'icon-only';

export interface BottomNavConfig {
  items: BottomNavItemConfig[];
  styleType: BottomNavStyleType;
  activeIndicator: BottomNavActiveIndicator;
  labelMode: BottomNavLabelMode;
  showOnDesktop: boolean;
  blurEffect: boolean;
  customBgColor?: string;
  accentColor?: string;
  iconSize: 'small' | 'medium' | 'large';
  hideOnScroll?: boolean;
}

export interface AppConfig {
  incomeCategories: ConfigItem[];
  expenseCategories: ConfigItem[];
  customCategoryTabs: CategoryTab[];
  paymentMethods: ConfigItem[];
  paymentStatuses: ConfigItem[];
  dashboardWidgets?: DashboardWidgetConfig;
  dashboardCardDesign?: DashboardCardDesignConfig;
  bottomNav?: BottomNavConfig;
  theme?: AppThemeConfig;
  displayDensity?: DisplayDensity;
  standardSets?: StandardProductSet[];
  productCategories?: ProductCategory[];
  catalogItems?: ProductCatalogItem[];
  assets?: AssetItem[];
  systemTags?: string[];
  shopInfo?: ShopInfo;
}

export type PaymentStatus = string;

export type ShippingStatus = 'สั่งซื้อแล้ว' | 'กำลังประกอบ' | 'กำลังขนส่ง' | 'จัดส่งสำเร็จ';

export type DocumentType = 
  | 'quotation'               // ใบเสนอราคา / ใบเสนอขาย
  | 'full_tax_invoice'        // ใบกำกับภาษี / ใบเสร็จรับเงิน (เต็มรูปแบบ)
  | 'abbreviated_tax_invoice' // ใบกำกับภาษีอย่างย่อ (สลิป POS)
  | 'receipt'                 // ใบเสร็จรับเงิน
  | 'delivery_order';         // ใบแจ้งหนี้ / ใบส่งของ

export type TaxCalculationMode = 'vat_included' | 'vat_excluded' | 'no_vat';
export type WithholdingTaxRate = 0 | 1 | 2 | 3 | 5;

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface InstallationAppointment {
  id?: string;
  appointmentNumber: string;
  customerId?: string;
  customerName: string;
  phoneNumber?: string;
  customerAddress?: string;
  province?: string;
  appointmentDate: string;
  appointmentTime?: string;
  solarPackage?: string;
  systemSizeKw?: number;
  teamLead?: string;
  technicians?: string[];
  status: AppointmentStatus;
  notes?: string;
  transactionId?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface WarrantyEquipmentItem {
  id: string;
  itemType: 'panel' | 'inverter' | 'battery' | 'combiner' | 'other';
  name: string;
  brandModel?: string;
  serialNumber: string;
  quantity: number;
  warrantyYears: number;
}

export interface WarrantyCard {
  id?: string;
  warrantyNumber: string;
  appointmentId?: string;
  transactionId?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  province?: string;
  installationDate: string;
  warrantyStartDate: string;
  solarSystemPackage?: string;
  systemCapacityKw?: number;
  equipments: WarrantyEquipmentItem[];
  systemWarrantyYears: number;
  freeCleaningCountPerYear?: number;
  nextCleaningDate?: string;
  termsAndConditions?: string;
  certifiedTechnicianName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Customer {
  id?: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  customerTaxId?: string;
  customerBranch?: string;
  customerAddress?: string;
  district?: string;
  province: string;
  zipcode?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface SaleOrderDetails {
  customerId?: string;
  setOption?: string;
  ampOption?: string;
  systemOption?: string;
  solarPanelCount?: number;
  batteryOption?: string;
  combinerOption?: string;
  customerName: string;
  customerAddress?: string;
  district?: string;
  province: string;
  zipcode?: string;
  phoneNumber?: string;
  customerTaxId?: string;
  customerBranch?: string;
  customerEmail?: string;
  deliveryDate: string;
  paymentReceivedDate?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  shippingStatus?: ShippingStatus;
  note?: string;
  discountAmount?: number;
  discountType?: 'baht' | 'percent';
  shippingFee?: number;
}

export interface Transaction {
  id?: string;
  date: string; // ISO string
  type: TransactionType;
  category: TransactionCategory;
  subcategory?: string;
  detail: string;
  amount: number;
  createdAt: string;
  createdBy: string;
  paymentMethod?: string;
  saleOrderDetails?: SaleOrderDetails;
  receiptUrl?: string;
  hasPendingWrites?: boolean;
  tags?: string[];
  recurringId?: string;
  notes?: string;
}

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'BATCH_DELETE' | 'BATCH_UPDATE';

export interface ActionRecord {
  id: string;
  type: ActionType;
  timestamp: string;
  transactionId?: string;
  previousData?: any;
  newData?: any;
  transactions?: Transaction[]; // For batch actions
}

export type RecurringInterval = 'daily' | 'weekly' | 'monthly';

export interface RecurringTransaction {
  id?: string;
  title: string;
  type: TransactionType;
  category: TransactionCategory;
  subcategory?: string;
  amount: number;
  interval?: RecurringInterval; // 'daily' | 'weekly' | 'monthly', defaults to 'monthly'
  dayOfMonth?: number; // 1-31 (used when interval is 'monthly')
  dayOfWeek?: number; // 0 (Sun) to 6 (Sat) (used when interval is 'weekly')
  paymentMethod?: string;
  detail?: string;
  isActive: boolean;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  autoApprove?: boolean;
  lastProcessedDate?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
}

export const ThaiProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร",
  "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ",
  "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก",
  "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์",
  "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี",
  "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา",
  "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี",
  "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน",
  "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี",
  "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล",
  "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี",
  "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์",
  "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี",
  "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
];

export const SaleOrderSets = ['3500WAT', '5000WAT', '4.2kW', '6kW', '10kW'];
export const SaleOrderAmps = ['120Ah', '200Ah', '300Ah', '314Ah'];
export const SaleOrderSystems = ['12V', '24V', '48V'];

export const PaymentMethods = [
  'เงินสด',
  'โอนผ่านธนาคาร',
  'QR CODE Propmtpay',
  'เก็บเงินปลายทาง (COD)'
];

export const BatteryOptions = [
  { label: '120ah 12V', price: 15000 },
  { label: '200ah 24V', price: 18000 },
  { label: '300ah 48V', price: 49000 },
  { label: '314ah 25.6V', price: 28900 }
];

export const CombinerOptions = [
  { label: '3500W-คอมบายเนอร์', price: 7000 },
  { label: '5000W-คอมบายเนอร์', price: 7900 },
  { label: '4.2kW-คอมบายเนอร์', price: 14900 },
  { label: '6kW-คอมบายเนอร์', price: 18900 },
  { label: '10kW-คอมบายเนอร์', price: 25900 }
];

export interface QuickNote {
  id?: string;
  content: string;
  createdAt: string;
  createdBy: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  isImportant?: boolean;
  transactionId?: string;
  transactionCategory?: string;
  transactionAmount?: number;
  transactionType?: TransactionType;
  transactionDetail?: string;
  transactionDate?: string;
  tags?: string[];
}

export type AuditCategory = 'transaction' | 'user' | 'settings' | 'customer' | 'installation' | 'system';

export type AuditActionType =
  | 'TRANSACTION_CREATE'
  | 'TRANSACTION_UPDATE'
  | 'TRANSACTION_DELETE'
  | 'TRANSACTION_BATCH_DELETE'
  | 'TRANSACTION_RESTORE'
  | 'USER_CREATE'
  | 'USER_ROLE_UPDATE'
  | 'USER_PERM_UPDATE'
  | 'USER_STATUS_TOGGLE'
  | 'USER_PASSWORD_RESET'
  | 'USER_DELETE'
  | 'SETTINGS_UPDATE'
  | 'CUSTOMER_CREATE'
  | 'CUSTOMER_UPDATE'
  | 'CUSTOMER_DELETE'
  | 'INSTALLATION_CREATE'
  | 'INSTALLATION_UPDATE'
  | 'WARRANTY_CREATE';

export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  userRole: string;
  action: AuditActionType | string;
  category: AuditCategory;
  targetId?: string;
  targetName?: string;
  details: string;
  previousData?: any;
  newData?: any;
  ipAddress?: string;
}

