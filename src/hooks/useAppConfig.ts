import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './useAuth';
import { 
  ConfigItem, 
  AppConfig, 
  DashboardWidgetConfig, 
  DashboardCardDesignConfig,
  DashboardCardId,
  DashboardCardColorDefinition,
  BottomNavConfig,
  BottomNavItemConfig,
  AppThemeConfig, 
  DisplayDensity,
  StandardProductSet, 
  ShopInfo,
  ProductCategory,
  ProductCatalogItem,
  AssetItem,
  CategoryTab
} from '../types';
import { DEFAULT_DASHBOARD_CARD_DESIGN } from '../utils/dashboardCardPresets';

export { DEFAULT_DASHBOARD_CARD_DESIGN };

export const DEFAULT_BOTTOM_NAV_CONFIG: BottomNavConfig = {
  styleType: 'floating-capsule',
  activeIndicator: 'pill',
  labelMode: 'all',
  showOnDesktop: false,
  blurEffect: true,
  iconSize: 'medium',
  items: [
    {
      id: 'bn_dashboard',
      label: 'ภาพรวม',
      iconName: 'LayoutDashboard',
      actionType: 'tab',
      targetTab: 'dashboard',
      isActive: true,
      order: 1,
      allowedRoles: ['admin', 'manager', 'staff', 'viewer']
    },
    {
      id: 'bn_pos',
      label: 'ขาย POS',
      iconName: 'PlusCircle',
      actionType: 'tab',
      targetTab: 'pos',
      color: '#10b981',
      isActive: true,
      order: 2,
      allowedRoles: ['admin', 'manager', 'staff']
    },
    {
      id: 'bn_history',
      label: 'ประวัติ',
      iconName: 'ListOrdered',
      actionType: 'tab',
      targetTab: 'history',
      isActive: true,
      order: 3,
      allowedRoles: ['admin', 'manager', 'staff', 'viewer']
    },
    {
      id: 'bn_reports',
      label: 'รายงาน',
      iconName: 'BarChart3',
      actionType: 'tab',
      targetTab: 'reports',
      isActive: true,
      order: 4,
      allowedRoles: ['admin', 'manager', 'viewer']
    },
    {
      id: 'bn_customers',
      label: 'ลูกค้า CRM',
      iconName: 'UserCheck',
      actionType: 'tab',
      targetTab: 'customers',
      isActive: true,
      order: 5,
      allowedRoles: ['admin', 'manager', 'staff']
    },
    {
      id: 'bn_installations',
      label: 'นัดหมาย',
      iconName: 'Calendar',
      actionType: 'tab',
      targetTab: 'installations',
      isActive: true,
      order: 6,
      allowedRoles: ['admin', 'manager', 'staff']
    },
    {
      id: 'bn_settings',
      label: 'ตั้งค่า',
      iconName: 'Settings',
      actionType: 'tab',
      targetTab: 'settings',
      isActive: true,
      order: 7,
      allowedRoles: ['admin', 'manager']
    }
  ]
};

export const DEFAULT_WIDGET_CONFIG: DashboardWidgetConfig = {
  showPinnedMetrics: true,
  pinnedMetrics: ['daily_net_profit', 'top_selling_product', 'daily_revenue_goal', 'unpaid_collections'],
  showDailyRevenueGoal: true,
  showSmartBudgetAlerts: true,
  showTotalIncome: true,
  showTotalExpense: true,
  showNetProfit: true,
  showUnpaid: true,
  showSolarSales: true,
  showWeeklyTrend: true,
  showCategorySalesSummary: true,
  showQuickShortcuts: true,
  showDueAlerts: true,
  showTrendChart: true,
  showCategoryBreakdown: true,
  showMonthlyBudget: true,
  showStockInventory: true,
  showQuickNotes: true,
  showRecentSolarTable: true,
  showRecentTransactionsList: true,
  widgetsOrder: [
    'showPinnedMetrics',
    'showKPIs',
    'showDailyRevenueGoal',
    'showQuickShortcuts',
    'showSmartBudgetAlerts',
    'showDueAlerts',
    'showCategorySalesSummary',
    'showCharts',
    'showMonthlyBudget',
    'showOperations',
    'showRecentActivity'
  ],
  enableGoalNotifications: false,
};

export const DEFAULT_THEME: AppThemeConfig = {
  primaryColor: '#3b82f6',
  accentName: 'blue'
};

export const DEFAULT_DISPLAY_DENSITY: DisplayDensity = 'comfortable';

export const DEFAULT_SHOP_INFO: ShopInfo = {
  name: 'ร้านกลางนาโซล่าเซลล์',
  address: 'อำเภอเมือง จังหวัดขอนแก่น',
  phone: '088-555-9999',
  email: 'contact@klangnasolar.com',
  bankName: 'ธนาคารกสิกรไทย (KBANK)',
  bankAccountNo: '123-4-56789-0',
  bankAccountName: 'บจก. กลางนาโซล่าเซลล์ เอ็นเนอร์ยี',
  promptPayId: '0885559999',
  logoUrl: '/logo.jpg',
  receiptNote: 'ขอบคุณที่ใช้บริการ ติดต่อสอบถามเพิ่มเติมได้ตลอดเวลาครับ'
};

export const DEFAULT_STANDARD_SETS: StandardProductSet[] = [
  // 1. SOLAR ENERGY STANDARDS
  {
    id: 'set_solar_std_1',
    name: 'SET 3500WAT | 120AH | 12V',
    price: 16900,
    linkedSubcategoryId: 'sub_solar_std_1',
    items: [
      { id: 'i_1_1', name: 'INVERTER (PURE SINE WAVE) 3500W 12V', quantity: '1 UNIT / PCS' },
      { id: 'i_1_2', name: 'SOLAR CHARGE CONTROLLER (MPPT) 60A', quantity: '1 UNIT / PCS' },
      { id: 'i_1_3', name: 'SOLAR BATTERY (LITHIUM-ION) 120AH 12V', quantity: '1 UNIT / PCS' },
      { id: 'i_1_4', name: 'SOLAR PANEL (MONO-CRYSTALLINE) 340W', quantity: '2 UNIT / PCS' },
      { id: 'i_1_5', name: 'CONNECTORS (MC4 CONNECTORS)', quantity: '2 PAIRS / PCS' },
      { id: 'i_1_6', name: 'SOLAR CABLES (PV1-F 4MM²/6MM²)', quantity: '10 METERS' },
      { id: 'i_1_7', name: 'COMBINER BOX (DC/AC BREAKERS & SURGE PROTECTION)', quantity: '1 SET / PCS' },
      { id: 'i_1_8', name: 'MOUNTING STRUCTURE (ALUMINUM RAILS & CLAMPS)', quantity: '1 SET' },
    ]
  },
  {
    id: 'set_solar_std_2',
    name: 'SET 5000WAT | 200AH | 24V',
    price: 28900,
    linkedSubcategoryId: 'sub_solar_std_2',
    items: [
      { id: 'i_2_1', name: 'INVERTER (PURE SINE WAVE) 5000W 24V', quantity: '1 UNIT / PCS' },
      { id: 'i_2_2', name: 'SOLAR CHARGE CONTROLLER (MPPT) 80A', quantity: '1 UNIT / PCS' },
      { id: 'i_2_3', name: 'SOLAR BATTERY (LITHIUM-ION) 200AH 24V', quantity: '1 UNIT / PCS' },
      { id: 'i_2_4', name: 'SOLAR PANEL (MONO-CRYSTALLINE) 450W', quantity: '4 UNIT / PCS' },
      { id: 'i_2_5', name: 'CONNECTORS (MC4 CONNECTORS)', quantity: '4 PAIRS / PCS' },
      { id: 'i_2_6', name: 'SOLAR CABLES (PV1-F 4MM²/6MM²)', quantity: '20 METERS' },
      { id: 'i_2_7', name: 'COMBINER BOX (DC/AC BREAKERS & SURGE PROTECTION)', quantity: '1 SET / PCS' },
      { id: 'i_2_8', name: 'MOUNTING STRUCTURE (ALUMINUM RAILS & CLAMPS)', quantity: '1 SET' },
    ]
  },
  {
    id: 'set_solar_std_3',
    name: 'SET 4.2KW | 200AH | 24V',
    price: 38900,
    linkedSubcategoryId: 'sub_solar_std_3',
    items: [
      { id: 'i_3_1', name: 'INVERTER (PURE SINE WAVE) 4.2KW High Volt 24V', quantity: '1 UNIT / PCS' },
      { id: 'i_3_2', name: 'SOLAR CHARGE CONTROLLER (MPPT Built-in)', quantity: '1 UNIT / PCS' },
      { id: 'i_3_3', name: 'SOLAR BATTERY (LITHIUM-ION) 200AH 24V', quantity: '1 UNIT / PCS' },
      { id: 'i_3_4', name: 'SOLAR PANEL (MONO-CRYSTALLINE) 550W', quantity: '4 UNIT / PCS' },
      { id: 'i_3_5', name: 'CONNECTORS (MC4 CONNECTORS)', quantity: '4 PAIRS / PCS' },
      { id: 'i_3_6', name: 'SOLAR CABLES (PV1-F 4MM²/6MM²)', quantity: '30 METERS' },
      { id: 'i_3_7', name: 'COMBINER BOX (DC/AC BREAKERS & SURGE PROTECTION)', quantity: '1 SET / PCS' },
      { id: 'i_3_8', name: 'MOUNTING STRUCTURE (ALUMINUM RAILS & CLAMPS)', quantity: '1 SET' },
    ]
  },
  {
    id: 'set_solar_std_4',
    name: 'SET 4.2KW | 314AH | 24V',
    price: 56900,
    linkedSubcategoryId: 'sub_solar_std_4',
    items: [
      { id: 'i_4_1', name: 'INVERTER (PURE SINE WAVE) 4.2KW High Volt 24V', quantity: '1 UNIT / PCS' },
      { id: 'i_4_2', name: 'SOLAR CHARGE CONTROLLER (MPPT Built-in)', quantity: '1 UNIT / PCS' },
      { id: 'i_4_3', name: 'SOLAR BATTERY (LITHIUM-ION) 314AH 24V', quantity: '1 UNIT / PCS' },
      { id: 'i_4_4', name: 'SOLAR PANEL (MONO-CRYSTALLINE) 550W', quantity: '6 UNIT / PCS' },
      { id: 'i_4_5', name: 'CONNECTORS (MC4 CONNECTORS)', quantity: '6 PAIRS / PCS' },
      { id: 'i_4_6', name: 'SOLAR CABLES (PV1-F 4MM²/6MM²)', quantity: '30 METERS' },
      { id: 'i_4_7', name: 'COMBINER BOX (DC/AC BREAKERS & SURGE PROTECTION)', quantity: '1 SET / PCS' },
      { id: 'i_4_8', name: 'MOUNTING STRUCTURE (ALUMINUM RAILS & CLAMPS)', quantity: '1 SET' },
    ]
  },
  {
    id: 'set_solar_std_5',
    name: 'SET 6KW | 300AH | 48V',
    price: 89900,
    linkedSubcategoryId: 'sub_solar_std_5',
    items: [
      { id: 'i_5_1', name: 'INVERTER (PURE SINE WAVE) 6KW High Volt 48V', quantity: '1 UNIT / PCS' },
      { id: 'i_5_2', name: 'SOLAR CHARGE CONTROLLER (MPPT Built-in 100A)', quantity: '1 UNIT / PCS' },
      { id: 'i_5_3', name: 'SOLAR BATTERY (LITHIUM-ION) 300AH 48V', quantity: '1 UNIT / PCS' },
      { id: 'i_5_4', name: 'SOLAR PANEL (MONO-CRYSTALLINE) 550W', quantity: '8 UNIT / PCS' },
      { id: 'i_5_5', name: 'CONNECTORS (MC4 CONNECTORS)', quantity: '8 PAIRS / PCS' },
      { id: 'i_5_6', name: 'SOLAR CABLES (PV1-F 4MM²/6MM²)', quantity: '50 METERS' },
      { id: 'i_5_7', name: 'COMBINER BOX (DC/AC BREAKERS & SURGE PROTECTION)', quantity: '1 SET / PCS' },
      { id: 'i_5_8', name: 'MOUNTING STRUCTURE (ALUMINUM RAILS & CLAMPS)', quantity: '1 SET' },
    ]
  },
  {
    id: 'set_solar_std_6',
    name: 'SET 10KW | 300AH | 48V X2',
    price: 89900,
    linkedSubcategoryId: 'sub_solar_std_6',
    items: [
      { id: 'i_6_1', name: 'INVERTER (PURE SINE WAVE) 10KW High Volt 3-Phase', quantity: '1 UNIT / PCS' },
      { id: 'i_6_2', name: 'SOLAR CHARGE CONTROLLER (MPPT Dual String)', quantity: '1 UNIT / PCS' },
      { id: 'i_6_3', name: 'SOLAR BATTERY (LITHIUM-ION) 300AH 48V X2', quantity: '2 UNIT / PCS' },
      { id: 'i_6_4', name: 'SOLAR PANEL (MONO-CRYSTALLINE) 550W', quantity: '12 UNIT / PCS' },
      { id: 'i_6_5', name: 'CONNECTORS (MC4 CONNECTORS)', quantity: '12 PAIRS / PCS' },
      { id: 'i_6_6', name: 'SOLAR CABLES (PV1-F 4MM²/6MM²)', quantity: '50 METERS' },
      { id: 'i_6_7', name: 'COMBINER BOX (DC/AC BREAKERS & SURGE PROTECTION)', quantity: '1 SET / PCS' },
      { id: 'i_6_8', name: 'MOUNTING STRUCTURE (ALUMINUM RAILS & CLAMPS)', quantity: '1 SET' },
    ]
  },

  // 2. LITHIUM BATTERY SET
  {
    id: 'set_bat_120_24',
    name: '120AH | 24V',
    price: 16000,
    linkedSubcategoryId: 'sub_bat_120_24',
    items: [{ id: 'b_1', name: 'SOLAR BATTERY (LITHIUM-ION) 120AH 24V (Smart BMS)', quantity: '1 UNIT / PCS' }]
  },
  {
    id: 'set_bat_200_24',
    name: '200AH | 24V',
    price: 18000,
    linkedSubcategoryId: 'sub_bat_200_24',
    items: [{ id: 'b_2', name: 'SOLAR BATTERY (LITHIUM-ION) 200AH 24V (Smart BMS)', quantity: '1 UNIT / PCS' }]
  },
  {
    id: 'set_bat_314_24',
    name: '314AH | 24V',
    price: 28900,
    linkedSubcategoryId: 'sub_bat_314_24',
    items: [{ id: 'b_3', name: 'SOLAR BATTERY (LITHIUM-ION) 314AH 24V (LiFePO4)', quantity: '1 UNIT / PCS' }]
  },
  {
    id: 'set_bat_300_48',
    name: '300AH | 48V',
    price: 49000,
    linkedSubcategoryId: 'sub_bat_300_48',
    items: [{ id: 'b_4', name: 'SOLAR BATTERY (LITHIUM-ION) 300AH 48V Powerwall', quantity: '1 UNIT / PCS' }]
  },

  // 3. INVERTER | COMBINER SET
  {
    id: 'set_inv_3500',
    name: '3500W | COMBINER',
    price: 7000,
    linkedSubcategoryId: 'sub_inv_3500',
    items: [
      { id: 'ic_1_1', name: 'INVERTER (PURE SINE WAVE) 3500W', quantity: '1 UNIT / PCS' },
      { id: 'ic_1_2', name: 'COMBINER BOX (DC/AC BREAKERS & SURGE PROTECTION)', quantity: '1 SET / PCS' }
    ]
  },
  {
    id: 'set_inv_5000',
    name: '5000W | COMBINER',
    price: 7900,
    linkedSubcategoryId: 'sub_inv_5000',
    items: [
      { id: 'ic_2_1', name: 'INVERTER (PURE SINE WAVE) 5000W', quantity: '1 UNIT / PCS' },
      { id: 'ic_2_2', name: 'COMBINER BOX (DC/AC BREAKERS & SURGE PROTECTION)', quantity: '1 SET / PCS' }
    ]
  },
  {
    id: 'set_inv_4.2k',
    name: '4.2KW | COMBINER',
    price: 14900,
    linkedSubcategoryId: 'sub_inv_4.2k',
    items: [
      { id: 'ic_3_1', name: 'INVERTER (PURE SINE WAVE) 4.2KW High Volt', quantity: '1 UNIT / PCS' },
      { id: 'ic_3_2', name: 'COMBINER BOX (DC/AC BREAKERS & SURGE PROTECTION)', quantity: '1 SET / PCS' }
    ]
  },
  {
    id: 'set_inv_6k',
    name: '6KW | COMBINER',
    price: 18900,
    linkedSubcategoryId: 'sub_inv_6k',
    items: [
      { id: 'ic_4_1', name: 'INVERTER (PURE SINE WAVE) 6KW High Volt', quantity: '1 UNIT / PCS' },
      { id: 'ic_4_2', name: 'COMBINER BOX (DC/AC BREAKERS & SURGE PROTECTION)', quantity: '1 SET / PCS' }
    ]
  },
  {
    id: 'set_inv_10k',
    name: '10KW | COMBINER',
    price: 25900,
    linkedSubcategoryId: 'sub_inv_10k',
    items: [
      { id: 'ic_5_1', name: 'INVERTER (PURE SINE WAVE) 10KW 3-Phase', quantity: '1 UNIT / PCS' },
      { id: 'ic_5_2', name: 'COMBINER BOX (DC/AC BREAKERS & SURGE PROTECTION)', quantity: '1 SET / PCS' }
    ]
  },

  // 4. CUSTOM SOLAR SET
  {
    id: 'set_cust_inv_3500',
    name: 'INVERTER 3500WAT',
    price: 7000,
    linkedSubcategoryId: 'sub_cust_inv_3500',
    items: [{ id: 'ci_1', name: 'INVERTER (PURE SINE WAVE) 3500W', quantity: '1 UNIT / PCS' }]
  },
  {
    id: 'set_cust_inv_5000',
    name: 'INVERTER 5000WAT',
    price: 7900,
    linkedSubcategoryId: 'sub_cust_inv_5000',
    items: [{ id: 'ci_2', name: 'INVERTER (PURE SINE WAVE) 5000W', quantity: '1 UNIT / PCS' }]
  },
  {
    id: 'set_cust_inv_4.2k',
    name: 'INVERTER 4.2KW',
    price: 14900,
    linkedSubcategoryId: 'sub_cust_inv_4.2k',
    items: [{ id: 'ci_3', name: 'INVERTER (PURE SINE WAVE) 4.2KW High Volt', quantity: '1 UNIT / PCS' }]
  },
  {
    id: 'set_cust_inv_6k',
    name: 'INVERTER 6KW',
    price: 18900,
    linkedSubcategoryId: 'sub_cust_inv_6k',
    items: [{ id: 'ci_4', name: 'INVERTER (PURE SINE WAVE) 6KW High Volt', quantity: '1 UNIT / PCS' }]
  },
  {
    id: 'set_cust_inv_10k',
    name: 'INVERTER 10KW',
    price: 25900,
    linkedSubcategoryId: 'sub_cust_inv_10k',
    items: [{ id: 'ci_5', name: 'INVERTER (PURE SINE WAVE) 10KW 3-Phase', quantity: '1 UNIT / PCS' }]
  },
  {
    id: 'set_cust_bat_120_12',
    name: 'LITHIUM BATTERY 120AH-12V',
    price: 15000,
    linkedSubcategoryId: 'sub_cust_bat_120_12',
    items: [{ id: 'cb_1', name: 'SOLAR BATTERY (LITHIUM-ION) 120AH 12V', quantity: '1 UNIT / PCS' }]
  },
  {
    id: 'set_cust_bat_200_24',
    name: 'LITHIUM BATTERY 200AH-24V',
    price: 18000,
    linkedSubcategoryId: 'sub_cust_bat_200_24',
    items: [{ id: 'cb_2', name: 'SOLAR BATTERY (LITHIUM-ION) 200AH 24V', quantity: '1 UNIT / PCS' }]
  },
  {
    id: 'set_cust_bat_300_48',
    name: 'LITHIUM BATTERY 300AH-48V',
    price: 49000,
    linkedSubcategoryId: 'sub_cust_bat_300_48',
    items: [{ id: 'cb_3', name: 'SOLAR BATTERY (LITHIUM-ION) 300AH 48V', quantity: '1 UNIT / PCS' }]
  },
  {
    id: 'set_cust_bat_314_25.6',
    name: 'LITHIUM BATTERY 314AH-25.6V',
    price: 28900,
    linkedSubcategoryId: 'sub_cust_bat_314_25.6',
    items: [{ id: 'cb_4', name: 'SOLAR BATTERY (LITHIUM-ION) 314AH 25.6V', quantity: '1 UNIT / PCS' }]
  },

  // 5. SOLAR PANEL SET
  {
    id: 'set_panel_mono',
    name: 'SOLAR PANEL (MONO-CRYSTALLINE)',
    price: 3000,
    linkedSubcategoryId: 'sub_panel_mono',
    items: [{ id: 'sp_1', name: 'SOLAR PANEL (MONO-CRYSTALLINE)', quantity: '1 QTY / PCS' }]
  }
];

export const DEFAULT_INCOME_CATEGORIES: ConfigItem[] = [
  { 
    id: 'inc_solar_std', 
    name: 'SOLAR ENERGY STANDARDS', 
    isActive: true, 
    type: 'income',
    subcategories: [
      { id: 'sub_solar_std_1', name: 'SET 3500WAT | 120AH | 12V', isActive: true },
      { id: 'sub_solar_std_2', name: 'SET 5000WAT | 200AH | 24V', isActive: true },
      { id: 'sub_solar_std_3', name: 'SET 4.2KW | 200AH | 24V', isActive: true },
      { id: 'sub_solar_std_4', name: 'SET 4.2KW | 314AH | 24V', isActive: true },
      { id: 'sub_solar_std_5', name: 'SET 6KW | 300AH | 48V', isActive: true },
      { id: 'sub_solar_std_6', name: 'SET 10KW | 300AH | 48V X2', isActive: true }
    ]
  },
  { 
    id: 'inc_lithium_bat', 
    name: 'LITHIUM BATTERY SET', 
    isActive: true, 
    type: 'income',
    subcategories: [
      { id: 'sub_bat_120_24', name: '120AH | 24V', isActive: true },
      { id: 'sub_bat_200_24', name: '200AH | 24V', isActive: true },
      { id: 'sub_bat_314_24', name: '314AH | 24V', isActive: true },
      { id: 'sub_bat_300_48', name: '300AH | 48V', isActive: true }
    ]
  },
  { 
    id: 'inc_inv_combiner', 
    name: 'INVERTER | COMBINER SET', 
    isActive: true, 
    type: 'income',
    subcategories: [
      { id: 'sub_inv_3500', name: '3500W | COMBINER', isActive: true },
      { id: 'sub_inv_5000', name: '5000W | COMBINER', isActive: true },
      { id: 'sub_inv_4.2k', name: '4.2KW | COMBINER', isActive: true },
      { id: 'sub_inv_6k', name: '6KW | COMBINER', isActive: true },
      { id: 'sub_inv_10k', name: '10KW | COMBINER', isActive: true }
    ]
  },
  { 
    id: 'inc_custom_solar', 
    name: 'CUSTOM SOLAR SET', 
    isActive: true, 
    type: 'income',
    subcategories: [
      { id: 'sub_cust_inv_3500', name: 'INVERTER 3500WAT', isActive: true },
      { id: 'sub_cust_inv_5000', name: 'INVERTER 5000WAT', isActive: true },
      { id: 'sub_cust_inv_4.2k', name: 'INVERTER 4.2KW', isActive: true },
      { id: 'sub_cust_inv_6k', name: 'INVERTER 6KW', isActive: true },
      { id: 'sub_cust_inv_10k', name: 'INVERTER 10KW', isActive: true },
      { id: 'sub_cust_bat_120_12', name: 'LITHIUM BATTERY 120AH-12V', isActive: true },
      { id: 'sub_cust_bat_200_24', name: 'LITHIUM BATTERY 200AH-24V', isActive: true },
      { id: 'sub_cust_bat_300_48', name: 'LITHIUM BATTERY 300AH-48V', isActive: true },
      { id: 'sub_cust_bat_314_25.6', name: 'LITHIUM BATTERY 314AH-25.6V', isActive: true }
    ]
  },
  { 
    id: 'inc_solar_panel', 
    name: 'SOLAR PANEL SET', 
    isActive: true, 
    type: 'income',
    subcategories: [
      { id: 'sub_panel_mono', name: 'SOLAR PANEL (MONO-CRYSTALLINE)', isActive: true }
    ]
  },
  { id: 'inc_other', name: 'รายได้อื่นๆ', isActive: true, type: 'income' }
];

export const DEFAULT_EXPENSE_CATEGORIES: ConfigItem[] = [
  { id: 'exp_1', name: 'สั่งซื้ออุปกรณ์ประกอบชุด', isActive: true, type: 'expense' },
  { id: 'exp_2', name: 'ค่าโฆษณา', isActive: true, type: 'expense' },
  { id: 'exp_3', name: 'ค่าอาหาร', isActive: true, type: 'expense' },
  { id: 'exp_4', name: 'ค่าเครื่องดื่ม เหล้า/เบียร์', isActive: true, type: 'expense' },
  { id: 'exp_5', name: 'ค่าเดินทาง', isActive: true, type: 'expense' },
  { id: 'exp_6', name: 'ค่าคอมมิชชั่น', isActive: true, type: 'expense' },
  { id: 'exp_7', name: 'ค่าจ้างช่างรายวัน', isActive: true, type: 'expense' },
  { id: 'exp_8', name: 'แม่บ้านรายวัน', isActive: true, type: 'expense' },
  { id: 'exp_9', name: 'ค่าจ้างแอดมิน', isActive: true, type: 'expense' },
  { id: 'exp_10', name: 'ค่าใช้จ่ายอื่นๆ', isActive: true, type: 'expense' }
];

export const DEFAULT_PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat_panels',
    name: 'แผงโซล่าเซลล์ (Solar Panels)',
    isActive: true,
    description: 'แผงโซล่าเซลล์ Mono-Crystalline, Poly-Crystalline, N-Type Half-Cell',
    color: '#3b82f6',
    items: [
      { id: 'prod_p_1', name: 'SOLAR PANEL MONO 340W', sku: 'PNL-340M', barcode: '885111111001', price: 2500, cost: 1800, unit: 'แผง', inStock: 35, minStock: 10, isActive: true, itemType: 'product' },
      { id: 'prod_p_2', name: 'SOLAR PANEL MONO HALF-CELL 450W', sku: 'PNL-450M', barcode: '885111111002', price: 3200, cost: 2400, unit: 'แผง', inStock: 28, minStock: 10, isActive: true, itemType: 'product' },
      { id: 'prod_p_3', name: 'SOLAR PANEL MONO TIER 1 550W N-TYPE', sku: 'PNL-550N', barcode: '885111111003', price: 3900, cost: 2950, unit: 'แผง', inStock: 42, minStock: 15, isActive: true, itemType: 'product' },
      { id: 'prod_p_4', name: 'SOLAR PANEL BIFACIAL 600W 2 ด้าน', sku: 'PNL-600BF', barcode: '885111111004', price: 4600, cost: 3600, unit: 'แผง', inStock: 15, minStock: 5, isActive: true, itemType: 'product' },
    ]
  },
  {
    id: 'cat_inverters',
    name: 'อินเวอร์เตอร์ (Inverters)',
    isActive: true,
    description: 'อินเวอร์เตอร์ออฟกริด ไฮบริด ออนกริด ทุกขนาดกำลังวัตต์',
    color: '#8b5cf6',
    items: [
      { id: 'prod_inv_1', name: 'INVERTER PURE SINE WAVE 3500W 12V', sku: 'INV-3500-12', barcode: '885222222001', price: 7000, cost: 5200, unit: 'เครื่อง', inStock: 8, minStock: 3, isActive: true, itemType: 'product' },
      { id: 'prod_inv_2', name: 'INVERTER PURE SINE WAVE 5000W 24V', sku: 'INV-5000-24', barcode: '885222222002', price: 7900, cost: 6000, unit: 'เครื่อง', inStock: 12, minStock: 4, isActive: true, itemType: 'product' },
      { id: 'prod_inv_3', name: 'HYBRID INVERTER 4.2KW HIGH VOLT 24V', sku: 'INV-4200-HV', barcode: '885222222003', price: 14900, cost: 11500, unit: 'เครื่อง', inStock: 6, minStock: 2, isActive: true, itemType: 'product' },
      { id: 'prod_inv_4', name: 'HYBRID INVERTER 6KW HIGH VOLT 48V', sku: 'INV-6000-HV', barcode: '885222222004', price: 18900, cost: 14800, unit: 'เครื่อง', inStock: 5, minStock: 2, isActive: true, itemType: 'product' },
      { id: 'prod_inv_5', name: 'HYBRID INVERTER 10KW 3-PHASE 48V', sku: 'INV-10K-3P', barcode: '885222222005', price: 25900, cost: 20500, unit: 'เครื่อง', inStock: 3, minStock: 1, isActive: true, itemType: 'product' },
    ]
  },
  {
    id: 'cat_batteries',
    name: 'แบตเตอรี่ลิเธียม (Lithium Batteries)',
    isActive: true,
    description: 'แบตเตอรี่ LiFePO4 คุณภาพสูง พร้อมระบบ Smart BMS',
    color: '#10b981',
    items: [
      { id: 'prod_bat_1', name: 'LITHIUM BATTERY LiFePO4 120AH 12V', sku: 'BAT-120-12', barcode: '885333333001', price: 15000, cost: 11000, unit: 'ลูก', inStock: 10, minStock: 3, isActive: true, itemType: 'product' },
      { id: 'prod_bat_2', name: 'LITHIUM BATTERY LiFePO4 200AH 24V', sku: 'BAT-200-24', barcode: '885333333002', price: 18000, cost: 13500, unit: 'ลูก', inStock: 14, minStock: 4, isActive: true, itemType: 'product' },
      { id: 'prod_bat_3', name: 'LITHIUM BATTERY LiFePO4 314AH 25.6V', sku: 'BAT-314-25', barcode: '885333333003', price: 28900, cost: 22000, unit: 'ลูก', inStock: 7, minStock: 2, isActive: true, itemType: 'product' },
      { id: 'prod_bat_4', name: 'LITHIUM BATTERY LiFePO4 300AH 48V', sku: 'BAT-300-48', barcode: '885333333004', price: 49000, cost: 38000, unit: 'ลูก', inStock: 4, minStock: 2, isActive: true, itemType: 'product' },
    ]
  },
  {
    id: 'cat_combiner',
    name: 'ตู้คอมบายเนอร์และอุปกรณ์เซฟตี้ (Combiner Box & Breakers)',
    isActive: true,
    description: 'ตู้ควบคุมพร้อมเบรกเกอร์ DC/AC และกันฟ้าผ่า Surge Protection',
    color: '#f59e0b',
    items: [
      { id: 'prod_cb_1', name: 'ตู้คอมบายเนอร์ DC/AC Breaker + Surge 1 String', sku: 'CB-1STR', barcode: '885444444001', price: 2200, cost: 1400, unit: 'ตู้', inStock: 15, minStock: 5, isActive: true, itemType: 'product' },
      { id: 'prod_cb_2', name: 'ตู้คอมบายเนอร์ DC/AC Breaker + Surge 2 String', sku: 'CB-2STR', barcode: '885444444002', price: 3200, cost: 2100, unit: 'ตู้', inStock: 10, minStock: 4, isActive: true, itemType: 'product' },
      { id: 'prod_cb_3', name: 'DC Breaker 2P 500V 32A', sku: 'BRK-DC-32A', barcode: '885444444003', price: 250, cost: 130, unit: 'ตัว', inStock: 50, minStock: 20, isActive: true, itemType: 'equipment' },
      { id: 'prod_cb_4', name: 'DC Surge Protector 2P 500V 20-40kA', sku: 'SRG-DC-500', barcode: '885444444004', price: 350, cost: 180, unit: 'ตัว', inStock: 40, minStock: 15, isActive: true, itemType: 'equipment' },
    ]
  },
  {
    id: 'cat_accessories',
    name: 'อุปกรณ์ประกอบและสายไฟ (Cables & Mounting)',
    isActive: true,
    description: 'สายไฟโซล่าเซลล์ รางยึด ขั้วต่อ MC4 และอุปกรณ์ติดตั้ง',
    color: '#ec4899',
    items: [
      { id: 'prod_acc_1', name: 'สายไฟโซล่าเซลล์ PV1-F 4 mm² (ม้วน 100 เมตร)', sku: 'CAB-PV4-100', barcode: '885555555001', price: 2200, cost: 1600, unit: 'ม้วน', inStock: 12, minStock: 4, isActive: true, itemType: 'equipment' },
      { id: 'prod_acc_2', name: 'สายไฟโซล่าเซลล์ PV1-F 6 mm² (ม้วน 100 เมตร)', sku: 'CAB-PV6-100', barcode: '885555555002', price: 2900, cost: 2100, unit: 'ม้วน', inStock: 8, minStock: 3, isActive: true, itemType: 'equipment' },
      { id: 'prod_acc_3', name: 'ขั้วต่อ MC4 Connector (ชุดคู่ ผู้-เมีย)', sku: 'MC4-PAIR', barcode: '885555555003', price: 35, cost: 15, unit: 'คู่', inStock: 250, minStock: 50, isActive: true, itemType: 'equipment' },
      { id: 'prod_acc_4', name: 'รางอลูมิเนียมยึดแผงโซล่าเซลล์ 4.2 เมตร', sku: 'MNT-RAIL-42', barcode: '885555555004', price: 650, cost: 450, unit: 'เส้น', inStock: 30, minStock: 10, isActive: true, itemType: 'equipment' },
      { id: 'prod_acc_5', name: 'Mid Clamp + End Clamp อลูมิเนียม', sku: 'MNT-CLAMP-SET', barcode: '885555555005', price: 45, cost: 22, unit: 'ชุด', inStock: 180, minStock: 40, isActive: true, itemType: 'equipment' },
    ]
  }
];

export const DEFAULT_ASSETS: AssetItem[] = [
  {
    id: 'asset_1',
    name: 'เครื่องวัดกระแสและแรงดันแผงโซล่าเซลล์ (Solar PV Multimeter 1000V)',
    assetCode: 'AST-TEST-001',
    category: 'เครื่องมือวัดและทดสอบ',
    purchaseDate: '2025-01-15',
    purchasePrice: 4500,
    salvageValue: 500,
    usefulLifeYears: 3,
    depreciationMethod: 'straight_line',
    location: 'กล่องเครื่องมือทีมช่าง 1',
    assignedTo: 'หัวหน้าช่างติดตั้ง',
    status: 'active',
    isActive: true,
    notes: 'สำหรับวัด Voc, Isc และกำลังวัตต์จริงของแผง'
  },
  {
    id: 'asset_2',
    name: 'คีมย้ำหัว MC4 และปอกสายไฟ PV ชุดมืออาชีพ',
    assetCode: 'AST-TOOL-002',
    category: 'เครื่องมือช่าง',
    purchaseDate: '2025-02-10',
    purchasePrice: 2200,
    salvageValue: 200,
    usefulLifeYears: 3,
    depreciationMethod: 'straight_line',
    location: 'ช็อปงานช่าง',
    assignedTo: 'ทีมติดตั้งหน้างาน',
    status: 'active',
    isActive: true,
    notes: 'พร้อมชุดหัวเปลี่ยนสำหรับสาย 2.5/4/6 mm²'
  },
  {
    id: 'asset_3',
    name: 'สว่านกระแทกไร้สาย 20V Brushless พร้อมแบตเตอรี่ 4.0Ah 2 ก้อน',
    assetCode: 'AST-TOOL-003',
    category: 'เครื่องมือช่าง',
    purchaseDate: '2025-03-01',
    purchasePrice: 5800,
    salvageValue: 600,
    usefulLifeYears: 4,
    depreciationMethod: 'straight_line',
    location: 'รถบริการติดตั้ง',
    assignedTo: 'ช่างใหญ่',
    status: 'active',
    isActive: true,
    notes: 'ใช้สำหรับเจาะโครงสร้างเหล็กและยึดหลังคา'
  },
  {
    id: 'asset_4',
    name: 'บันไดอลูมิเนียมพับอเนกประสงค์ 4x4 ทรงพับ 4.7 เมตร',
    assetCode: 'AST-LAD-004',
    category: 'อุปกรณ์ติดตั้ง',
    purchaseDate: '2025-01-20',
    purchasePrice: 3200,
    salvageValue: 400,
    usefulLifeYears: 5,
    depreciationMethod: 'straight_line',
    location: 'คลังอุปกรณ์ช่าง',
    assignedTo: 'ทีมขนส่ง',
    status: 'active',
    isActive: true,
    notes: 'พับเป็นทรงตัวเอ และพาดตรงได้'
  },
  {
    id: 'asset_5',
    name: 'เครื่องวัดความต้านทานดินและระบบกราวด์ (Earth Resistance Tester)',
    assetCode: 'AST-TEST-005',
    category: 'เครื่องมือวัดและทดสอบ',
    purchaseDate: '2025-04-12',
    purchasePrice: 7500,
    salvageValue: 1000,
    usefulLifeYears: 5,
    depreciationMethod: 'straight_line',
    location: 'ตู้เซฟอุปกรณ์ทดสอบ',
    assignedTo: 'วิศวกรผู้ตรวจรับ',
    status: 'active',
    isActive: true,
    notes: 'ใช้ตรวจวัดความต้านทานดินของแท่งกราวด์ก่อนส่งมอบงาน'
  },
  {
    id: 'asset_6',
    name: 'รถกระบะบริการติดตั้งและส่งของ Toyota Hilux Revo',
    assetCode: 'AST-VEH-006',
    category: 'ยานพาหนะ',
    purchaseDate: '2024-06-01',
    purchasePrice: 580000,
    salvageValue: 120000,
    usefulLifeYears: 8,
    depreciationMethod: 'straight_line',
    location: 'หน้าร้าน',
    assignedTo: 'ทีมจัดส่งและติดตั้ง',
    status: 'active',
    isActive: true,
    notes: 'ติดตั้งแร็คหลังคาสำหรับบรรทุกแผงโซล่าเซลล์และบันได'
  }
];

export const DEFAULT_SYSTEM_TAGS: string[] = [
  'โปรโมชั่นพิเศษ',
  'ลูกค้าประจำ (VIP)',
  'งานติดตั้งด่วน',
  'รออะไหล่',
  'โครงการราชการ/อบต.',
  'เกษตรกรรม',
  'บ้านพักอาศัย',
  'ส่งฟรี'
];

export const DEFAULT_PAYMENT_METHODS: ConfigItem[] = [
  { 
    id: 'pm_1', 
    name: 'เงินสด', 
    isActive: true, 
    code: 'CASH',
    description: 'รับชำระด้วยเงินสดหน้าร้านหรือหน้างาน',
    badgeStyle: 'success',
    isDefault: true 
  },
  { 
    id: 'pm_2', 
    name: 'โอนผ่านธนาคาร', 
    isActive: true, 
    code: 'BANK_TRANSFER',
    description: 'โอนเงินเข้าบัญชีธนาคารร้านค้า',
    bankName: 'ธนาคารกสิกรไทย (KBANK)',
    accountNo: '123-4-56789-0',
    accountName: 'บจก. กลางนาโซล่าเซลล์ เอ็นเนอร์ยี',
    badgeStyle: 'info'
  },
  { 
    id: 'pm_3', 
    name: 'QR CODE PromptPay', 
    isActive: true, 
    code: 'PROMPTPAY',
    description: 'สแกนคิวอาร์โค้ดพร้อมเพย์ทันที',
    promptPayId: '0885559999',
    badgeStyle: 'purple'
  },
  { 
    id: 'pm_4', 
    name: 'เก็บเงินปลายทาง (COD)', 
    isActive: true, 
    code: 'COD',
    description: 'ชำระเงินเมื่อได้รับสินค้าจากพนักงานส่งของ',
    badgeStyle: 'warning'
  },
  { 
    id: 'pm_5', 
    name: 'บัตรเครดิต / เดบิต', 
    isActive: true, 
    code: 'CREDIT_CARD',
    description: 'รูดบัตรเครดิตหรือเดบิตผ่านเครื่อง EDC หน้าร้าน',
    badgeStyle: 'neutral'
  }
];

export const DEFAULT_PAYMENT_STATUSES: ConfigItem[] = [
  { 
    id: 'ps_1', 
    name: 'paid', 
    description: 'ชำระเงินครบถ้วนเรียบร้อยแล้ว',
    isActive: true,
    badgeStyle: 'success',
    isDefault: true
  },
  { 
    id: 'ps_2', 
    name: 'unpaid', 
    description: 'ยังไม่ได้ชำระเงิน / ค้างชำระ',
    isActive: true,
    badgeStyle: 'danger'
  },
  { 
    id: 'ps_3', 
    name: 'partial', 
    description: 'ชำระมัดจำแล้ว / ชำระบางส่วน',
    isActive: true,
    badgeStyle: 'warning'
  },
  { 
    id: 'ps_4', 
    name: 'refunded', 
    description: 'คืนเงินแล้ว',
    isActive: true,
    badgeStyle: 'neutral'
  }
];

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>({
    incomeCategories: DEFAULT_INCOME_CATEGORIES,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
    paymentStatuses: DEFAULT_PAYMENT_STATUSES,
    dashboardWidgets: DEFAULT_WIDGET_CONFIG,
    dashboardCardDesign: DEFAULT_DASHBOARD_CARD_DESIGN,
    bottomNav: DEFAULT_BOTTOM_NAV_CONFIG,
    theme: DEFAULT_THEME,
    standardSets: DEFAULT_STANDARD_SETS,
    productCategories: DEFAULT_PRODUCT_CATEGORIES,
    assets: DEFAULT_ASSETS,
    systemTags: DEFAULT_SYSTEM_TAGS,
    shopInfo: DEFAULT_SHOP_INFO
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const configDocRef = doc(db, 'config', 'app');
    const settingsDocRef = doc(db, 'settings', 'company');

    let currentConfigData: AppConfig | null = null;
    let currentSettingsData: any = null;

    const updateCombinedConfig = () => {
      if (currentConfigData) {
        const mergedShopInfo = {
          ...currentConfigData.shopInfo,
          ...(currentSettingsData ? {
            name: currentSettingsData.name || currentConfigData.shopInfo.name,
            companyNameTh: currentSettingsData.companyNameTh !== undefined ? currentSettingsData.companyNameTh : currentConfigData.shopInfo.companyNameTh,
            companyNameEn: currentSettingsData.companyNameEn !== undefined ? currentSettingsData.companyNameEn : currentConfigData.shopInfo.companyNameEn,
            showLogo: currentSettingsData.showLogo !== undefined ? currentSettingsData.showLogo : currentConfigData.shopInfo.showLogo
          } : {})
        };

        setConfig({
          ...currentConfigData,
          shopInfo: mergedShopInfo
        });
        localStorage.setItem('cachedShopInfo', JSON.stringify(mergedShopInfo));
      }
    };

    const unsubscribeConfig = onSnapshot(configDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<AppConfig>;

        const newConfig: AppConfig = {
          incomeCategories: data.incomeCategories && data.incomeCategories.length > 0 ? data.incomeCategories : DEFAULT_INCOME_CATEGORIES,
          expenseCategories: data.expenseCategories && data.expenseCategories.length > 0 ? data.expenseCategories : DEFAULT_EXPENSE_CATEGORIES,
          customCategoryTabs: data.customCategoryTabs || [],
          paymentMethods: data.paymentMethods && data.paymentMethods.length > 0 ? data.paymentMethods : DEFAULT_PAYMENT_METHODS,
          paymentStatuses: data.paymentStatuses && data.paymentStatuses.length > 0 ? data.paymentStatuses : DEFAULT_PAYMENT_STATUSES,
          dashboardWidgets: data.dashboardWidgets || DEFAULT_WIDGET_CONFIG,
          dashboardCardDesign: data.dashboardCardDesign || DEFAULT_DASHBOARD_CARD_DESIGN,
          bottomNav: data.bottomNav || DEFAULT_BOTTOM_NAV_CONFIG,
          theme: data.theme || DEFAULT_THEME,
          displayDensity: data.displayDensity || (localStorage.getItem('preferredDisplayDensity') as DisplayDensity) || DEFAULT_DISPLAY_DENSITY,
          standardSets: data.standardSets && data.standardSets.length > 0 ? data.standardSets : DEFAULT_STANDARD_SETS,
          productCategories: data.productCategories && data.productCategories.length > 0 ? data.productCategories : DEFAULT_PRODUCT_CATEGORIES,
          assets: data.assets && data.assets.length > 0 ? data.assets : DEFAULT_ASSETS,
          systemTags: data.systemTags && data.systemTags.length > 0 ? data.systemTags : DEFAULT_SYSTEM_TAGS,
          shopInfo: data.shopInfo || DEFAULT_SHOP_INFO
        };
        
        currentConfigData = newConfig;
        updateCombinedConfig();
      } else {
        // Initialize default config if not present
        const initialConfig: AppConfig = {
          incomeCategories: DEFAULT_INCOME_CATEGORIES,
          expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
          customCategoryTabs: [],
          paymentMethods: DEFAULT_PAYMENT_METHODS,
          paymentStatuses: DEFAULT_PAYMENT_STATUSES,
          dashboardWidgets: DEFAULT_WIDGET_CONFIG,
          dashboardCardDesign: DEFAULT_DASHBOARD_CARD_DESIGN,
          bottomNav: DEFAULT_BOTTOM_NAV_CONFIG,
          theme: DEFAULT_THEME,
          displayDensity: DEFAULT_DISPLAY_DENSITY,
          standardSets: DEFAULT_STANDARD_SETS,
          productCategories: DEFAULT_PRODUCT_CATEGORIES,
          assets: DEFAULT_ASSETS,
          systemTags: DEFAULT_SYSTEM_TAGS,
          shopInfo: DEFAULT_SHOP_INFO
        };

        setDoc(configDocRef, {
          ...JSON.parse(JSON.stringify(initialConfig)),
          updatedAt: new Date().toISOString()
        }).catch(err => console.error("Error initializing default config:", err));
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching app config:", error);
      handleFirestoreError(error, OperationType.GET, 'config/app');
      setLoading(false);
    });

    const unsubscribeSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        currentSettingsData = docSnap.data();
        updateCombinedConfig();
      }
    }, (error) => {
      console.error("Error fetching settings/company:", error);
      handleFirestoreError(error, OperationType.GET, 'settings/company');
    });

    return () => {
      unsubscribeConfig();
      unsubscribeSettings();
    };
  }, [user]);

  const saveConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    if (user) {
      try {
        const configDocRef = doc(db, 'config', 'app');
        // Sanitize config to remove undefined values which are not supported by Firestore
        const sanitizedConfig = JSON.parse(JSON.stringify(newConfig));
        await setDoc(configDocRef, {
          ...sanitizedConfig,
          updatedAt: new Date().toISOString(),
          updatedBy: user.uid
        });
      } catch (e) {
        console.error("Error updating config in Firestore:", e);
      }
    }
  };

  const addItem = async (type: 'incomeCategories' | 'expenseCategories' | 'paymentMethods' | 'paymentStatuses', name: string, itemType?: 'income' | 'expense', extraProps?: Partial<ConfigItem>) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("ชื่อต้องไม่เป็นค่าว่าง");

    const newItem: ConfigItem = {
      id: `${type}_${Date.now()}`,
      name: trimmed,
      isActive: true,
      type: itemType,
      ...extraProps
    };

    const updatedConfig = {
      ...config,
      [type]: [...(config[type] || []), newItem]
    };

    await saveConfig(updatedConfig);
  };

  const updateItem = async (type: 'incomeCategories' | 'expenseCategories' | 'paymentMethods' | 'paymentStatuses', id: string, updates: Partial<ConfigItem>) => {
    const updatedConfig = {
      ...config,
      [type]: (config[type] || []).map(item => item.id === id ? { ...item, ...updates } : item)
    };
    await saveConfig(updatedConfig);
  };

  const deleteItem = async (type: 'incomeCategories' | 'expenseCategories' | 'paymentMethods' | 'paymentStatuses', id: string) => {
    const updatedConfig = {
      ...config,
      [type]: (config[type] || []).filter(item => item.id !== id)
    };
    await saveConfig(updatedConfig);
  };

  const toggleActive = async (type: 'incomeCategories' | 'expenseCategories' | 'paymentMethods' | 'paymentStatuses', id: string) => {
    const updatedConfig = {
      ...config,
      [type]: (config[type] || []).map(item => item.id === id ? { ...item, isActive: !item.isActive } : item)
    };
    await saveConfig(updatedConfig);
  };

  const addSubItem = async (type: 'incomeCategories' | 'expenseCategories', parentId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("ชื่อต้องไม่เป็นค่าว่าง");

    const newSubItem: ConfigItem = {
      id: `sub_${Date.now()}`,
      name: trimmed,
      isActive: true
    };

    const updatedConfig = {
      ...config,
      [type]: (config[type] || []).map(item => 
        item.id === parentId 
          ? { ...item, subcategories: [...(item.subcategories || []), newSubItem] }
          : item
      )
    };

    await saveConfig(updatedConfig);
  };

  const updateSubItem = async (type: 'incomeCategories' | 'expenseCategories', parentId: string, subId: string, updates: Partial<ConfigItem>) => {
    const updatedConfig = {
      ...config,
      [type]: (config[type] || []).map(item => 
        item.id === parentId 
          ? { 
              ...item, 
              subcategories: (item.subcategories || []).map(sub => 
                sub.id === subId ? { ...sub, ...updates } : sub
              )
            }
          : item
      )
    };
    await saveConfig(updatedConfig);
  };

  const deleteSubItem = async (type: 'incomeCategories' | 'expenseCategories', parentId: string, subId: string) => {
    const updatedConfig = {
      ...config,
      [type]: (config[type] || []).map(item => 
        item.id === parentId 
          ? { 
              ...item, 
              subcategories: (item.subcategories || []).filter(sub => sub.id !== subId)
            }
          : item
      )
    };
    await saveConfig(updatedConfig);
  };

  const toggleSubActive = async (type: 'incomeCategories' | 'expenseCategories', parentId: string, subId: string) => {
    const updatedConfig = {
      ...config,
      [type]: (config[type] || []).map(item => 
        item.id === parentId 
          ? { 
              ...item, 
              subcategories: (item.subcategories || []).map(sub => 
                sub.id === subId ? { ...sub, isActive: !sub.isActive } : sub
              )
            }
          : item
      )
    };
    await saveConfig(updatedConfig);
  };

  const duplicateItem = async (type: 'incomeCategories' | 'expenseCategories' | 'paymentMethods' | 'paymentStatuses', id: string) => {
    const itemToCopy = (config[type] || []).find(i => i.id === id);
    if (!itemToCopy) return;

    const newItem: ConfigItem = {
      ...JSON.parse(JSON.stringify(itemToCopy)),
      id: `${type}_${Date.now()}`,
      name: `${itemToCopy.name} (สำเนา)`,
      isActive: true
    };

    const updatedConfig = {
      ...config,
      [type]: [...(config[type] || []), newItem]
    };

    await saveConfig(updatedConfig);
  };

  const duplicateSubItem = async (type: 'incomeCategories' | 'expenseCategories', parentId: string, subId: string) => {
    const parent = (config[type] || []).find(i => i.id === parentId);
    if (!parent || !parent.subcategories) return;

    const subToCopy = parent.subcategories.find(s => s.id === subId);
    if (!subToCopy) return;

    const newSub: ConfigItem = {
      ...JSON.parse(JSON.stringify(subToCopy)),
      id: `sub_${Date.now()}`,
      name: `${subToCopy.name} (สำเนา)`,
      isActive: true
    };

    const updatedConfig = {
      ...config,
      [type]: (config[type] || []).map(item => 
        item.id === parentId 
          ? { ...item, subcategories: [...(item.subcategories || []), newSub] }
          : item
      )
    };

    await saveConfig(updatedConfig);
  };

  const reorderItems = async (type: 'incomeCategories' | 'expenseCategories' | 'paymentMethods' | 'paymentStatuses', reorderedList: ConfigItem[]) => {
    const updatedConfig = {
      ...config,
      [type]: reorderedList
    };
    await saveConfig(updatedConfig);
  };

  // Product categories CRUD
  const updateProductCategories = async (productCategories: ProductCategory[]) => {
    const updatedConfig = {
      ...config,
      productCategories
    };
    await saveConfig(updatedConfig);
  };

  const addProductCategory = async (category: Omit<ProductCategory, 'id' | 'items'>) => {
    const newCat: ProductCategory = {
      ...category,
      id: `cat_${Date.now()}`,
      items: []
    };
    const updatedConfig = {
      ...config,
      productCategories: [...(config.productCategories || []), newCat]
    };
    await saveConfig(updatedConfig);
  };

  const updateProductCategory = async (id: string, updates: Partial<ProductCategory>) => {
    const updatedConfig = {
      ...config,
      productCategories: (config.productCategories || []).map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
      )
    };
    await saveConfig(updatedConfig);
  };

  const deleteProductCategory = async (id: string) => {
    const updatedConfig = {
      ...config,
      productCategories: (config.productCategories || []).filter(cat => cat.id !== id)
    };
    await saveConfig(updatedConfig);
  };

  const addProductItem = async (categoryId: string, item: Omit<ProductCatalogItem, 'id'>) => {
    const newItem: ProductCatalogItem = {
      ...item,
      id: `prod_${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    const updatedConfig = {
      ...config,
      productCategories: (config.productCategories || []).map(cat => 
        cat.id === categoryId 
          ? { ...cat, items: [...(cat.items || []), newItem] }
          : cat
      )
    };
    await saveConfig(updatedConfig);
  };

  const updateProductItem = async (categoryId: string, itemId: string, updates: Partial<ProductCatalogItem>) => {
    const updatedConfig = {
      ...config,
      productCategories: (config.productCategories || []).map(cat => 
        cat.id === categoryId 
          ? { 
              ...cat, 
              items: (cat.items || []).map(i => i.id === itemId ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i) 
            }
          : cat
      )
    };
    await saveConfig(updatedConfig);
  };

  const deleteProductItem = async (categoryId: string, itemId: string) => {
    const updatedConfig = {
      ...config,
      productCategories: (config.productCategories || []).map(cat => 
        cat.id === categoryId 
          ? { ...cat, items: (cat.items || []).filter(i => i.id !== itemId) }
          : cat
      )
    };
    await saveConfig(updatedConfig);
  };

  const adjustProductStock = async (categoryId: string, itemId: string, delta: number) => {
    const updatedConfig = {
      ...config,
      productCategories: (config.productCategories || []).map(cat => 
        cat.id === categoryId 
          ? {
              ...cat,
              items: (cat.items || []).map(i => 
                i.id === itemId 
                  ? { ...i, stockQuantity: Math.max(0, (i.stockQuantity || 0) + delta) }
                  : i
              )
            }
          : cat
      )
    };
    await saveConfig(updatedConfig);
  };

  // Assets Management CRUD
  const updateAssets = async (assets: AssetItem[]) => {
    const updatedConfig = {
      ...config,
      assets
    };
    await saveConfig(updatedConfig);
  };

  const addAsset = async (asset: Omit<AssetItem, 'id'>) => {
    const newAsset: AssetItem = {
      ...asset,
      id: `asset_${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    const updatedConfig = {
      ...config,
      assets: [newAsset, ...(config.assets || [])]
    };
    await saveConfig(updatedConfig);
  };

  const updateAsset = async (id: string, updates: Partial<AssetItem>) => {
    const updatedConfig = {
      ...config,
      assets: (config.assets || []).map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a)
    };
    await saveConfig(updatedConfig);
  };

  const deleteAsset = async (id: string) => {
    const updatedConfig = {
      ...config,
      assets: (config.assets || []).filter(a => a.id !== id)
    };
    await saveConfig(updatedConfig);
  };

  // System Tags CRUD
  const updateSystemTags = async (systemTags: string[]) => {
    const updatedConfig = {
      ...config,
      systemTags
    };
    await saveConfig(updatedConfig);
  };

  const addSystemTag = async (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if ((config.systemTags || []).includes(trimmed)) {
      throw new Error('แท็กนี้มีอยู่ในระบบแล้ว');
    }
    const updatedConfig = {
      ...config,
      systemTags: [...(config.systemTags || []), trimmed]
    };
    await saveConfig(updatedConfig);
  };

  const deleteSystemTag = async (tag: string) => {
    const updatedConfig = {
      ...config,
      systemTags: (config.systemTags || []).filter(t => t !== tag)
    };
    await saveConfig(updatedConfig);
  };

  const generateSetsFromSubcategories = async () => {
    const existingLinkedIds = new Set((config.standardSets || []).map(s => s.linkedSubcategoryId).filter(Boolean));
    const newSets: StandardProductSet[] = [];

    config.incomeCategories.forEach(category => {
      (category.subcategories || []).forEach(sub => {
        if (!existingLinkedIds.has(sub.id)) {
          newSets.push({
            id: `set_${sub.id}_${Date.now()}`,
            name: sub.name,
            price: 0,
            items: [],
            linkedSubcategoryId: sub.id
          });
        }
      });
    });

    if (newSets.length === 0) return 0;

    const updatedConfig = {
      ...config,
      standardSets: [...(config.standardSets || []), ...newSets]
    };

    await saveConfig(updatedConfig);
    return newSets.length;
  };

  const convertSubToStandardSet = async (subId: string, name: string) => {
    // Check if already exists
    const exists = (config.standardSets || []).some(s => s.linkedSubcategoryId === subId);
    if (exists) throw new Error("หมวดหมู่ย่อยนี้ถูกเชื่อมโยงเป็นสินค้ามาตรฐานอยู่แล้ว");

    const newSet: StandardProductSet = {
      id: `set_${subId}_${Date.now()}`,
      name: name,
      price: 0,
      items: [],
      linkedSubcategoryId: subId
    };

    const updatedConfig = {
      ...config,
      standardSets: [...(config.standardSets || []), newSet]
    };

    await saveConfig(updatedConfig);
  };

  const updateWidgetConfig = async (updates: Partial<DashboardWidgetConfig>) => {
    const updatedConfig = {
      ...config,
      dashboardWidgets: {
        ...(config.dashboardWidgets || DEFAULT_WIDGET_CONFIG),
        ...updates
      }
    };
    await saveConfig(updatedConfig);
  };

  const moveWidget = async (key: keyof DashboardWidgetConfig, direction: 'up' | 'down') => {
    const currentOrder = config.dashboardWidgets?.widgetsOrder || DEFAULT_WIDGET_CONFIG.widgetsOrder;
    const index = currentOrder.indexOf(key as any);
    if (index === -1) return;
    
    const newOrder = [...currentOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    await updateWidgetConfig({ widgetsOrder: newOrder });
  };

  const updateTheme = async (theme: AppThemeConfig) => {
    const updatedConfig = {
      ...config,
      theme
    };
    await saveConfig(updatedConfig);
  };

  const updateDisplayDensity = async (displayDensity: DisplayDensity) => {
    const updatedConfig = {
      ...config,
      displayDensity
    };
    localStorage.setItem('preferredDisplayDensity', displayDensity);
    await saveConfig(updatedConfig);
  };

  const updateStandardSets = async (standardSets: StandardProductSet[]) => {
    const updatedConfig = {
      ...config,
      standardSets
    };
    await saveConfig(updatedConfig);
  };

  const addCategoryTab = async (name: string, type: 'income' | 'expense') => {
    const newTab: CategoryTab = {
      id: `tab_${Date.now()}`,
      name,
      type,
      items: []
    };
    const newConfig = { ...config, customCategoryTabs: [...(config.customCategoryTabs || []), newTab] };
    await saveConfig(newConfig);
  };

  const renameCategoryTab = async (id: string, name: string) => {
    const newConfig = {
      ...config,
      customCategoryTabs: (config.customCategoryTabs || []).map(tab => tab.id === id ? { ...tab, name } : tab)
    };
    await saveConfig(newConfig);
  };

  const deleteCategoryTab = async (id: string) => {
    const newConfig = {
      ...config,
      customCategoryTabs: (config.customCategoryTabs || []).filter(tab => tab.id !== id)
    };
    await saveConfig(newConfig);
  };

  const duplicateCategoryTab = async (id: string, newName: string) => {
    const tabToDuplicate = (config.customCategoryTabs || []).find(tab => tab.id === id);
    if (!tabToDuplicate) return;
    const newTab: CategoryTab = {
      ...tabToDuplicate,
      id: `tab_${Date.now()}`,
      name: newName,
      items: tabToDuplicate.items.map(item => ({ ...item, id: `item_${Date.now()}_${Math.random()}` }))
    };
    const newConfig = { ...config, customCategoryTabs: [...(config.customCategoryTabs || []), newTab] };
    await saveConfig(newConfig);
  };

  const updateShopInfo = async (shopInfo: ShopInfo) => {
    const updatedConfig = {
      ...config,
      shopInfo
    };
    await saveConfig(updatedConfig);
    localStorage.setItem('cachedShopInfo', JSON.stringify(shopInfo));
  };

  const resetToDefaultCatalog = async () => {
    const updatedConfig = {
      ...config,
      standardSets: DEFAULT_STANDARD_SETS,
      incomeCategories: DEFAULT_INCOME_CATEGORIES,
      productCategories: DEFAULT_PRODUCT_CATEGORIES,
      assets: DEFAULT_ASSETS
    };
    await saveConfig(updatedConfig);
  };

  const updateBottomNavConfig = async (bottomNav: BottomNavConfig) => {
    const updatedConfig = {
      ...config,
      bottomNav
    };
    await saveConfig(updatedConfig);
  };

  const addBottomNavItem = async (item: Omit<BottomNavItemConfig, 'id' | 'order'>) => {
    const currentItems = config.bottomNav?.items || DEFAULT_BOTTOM_NAV_CONFIG.items;
    const newItem: BottomNavItemConfig = {
      ...item,
      id: `bn_${Date.now()}`,
      order: currentItems.length + 1
    };

    const updatedBottomNav: BottomNavConfig = {
      ...(config.bottomNav || DEFAULT_BOTTOM_NAV_CONFIG),
      items: [...currentItems, newItem]
    };

    await updateBottomNavConfig(updatedBottomNav);
  };

  const updateBottomNavItem = async (id: string, updates: Partial<BottomNavItemConfig>) => {
    const currentItems = config.bottomNav?.items || DEFAULT_BOTTOM_NAV_CONFIG.items;
    const updatedItems = currentItems.map(item => item.id === id ? { ...item, ...updates } : item);

    const updatedBottomNav: BottomNavConfig = {
      ...(config.bottomNav || DEFAULT_BOTTOM_NAV_CONFIG),
      items: updatedItems
    };

    await updateBottomNavConfig(updatedBottomNav);
  };

  const deleteBottomNavItem = async (id: string) => {
    const currentItems = config.bottomNav?.items || DEFAULT_BOTTOM_NAV_CONFIG.items;
    const updatedItems = currentItems.filter(item => item.id !== id);

    const updatedBottomNav: BottomNavConfig = {
      ...(config.bottomNav || DEFAULT_BOTTOM_NAV_CONFIG),
      items: updatedItems
    };

    await updateBottomNavConfig(updatedBottomNav);
  };

  const toggleBottomNavItemActive = async (id: string) => {
    const currentItems = config.bottomNav?.items || DEFAULT_BOTTOM_NAV_CONFIG.items;
    const updatedItems = currentItems.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item);

    const updatedBottomNav: BottomNavConfig = {
      ...(config.bottomNav || DEFAULT_BOTTOM_NAV_CONFIG),
      items: updatedItems
    };

    await updateBottomNavConfig(updatedBottomNav);
  };

  const reorderBottomNavItems = async (items: BottomNavItemConfig[]) => {
    const orderedItems = items.map((item, idx) => ({ ...item, order: idx + 1 }));
    const updatedBottomNav: BottomNavConfig = {
      ...(config.bottomNav || DEFAULT_BOTTOM_NAV_CONFIG),
      items: orderedItems
    };

    await updateBottomNavConfig(updatedBottomNav);
  };

  const resetBottomNavConfig = async () => {
    const updatedBottomNav: BottomNavConfig = {
      ...DEFAULT_BOTTOM_NAV_CONFIG
    };
    await updateBottomNavConfig(updatedBottomNav);
  };

  const updateDashboardCardDesign = async (updates: Partial<DashboardCardDesignConfig>) => {
    const currentDesign = config.dashboardCardDesign || DEFAULT_DASHBOARD_CARD_DESIGN;
    const updatedDesign: DashboardCardDesignConfig = {
      ...currentDesign,
      ...updates
    };

    const newConfig: AppConfig = {
      ...config,
      dashboardCardDesign: updatedDesign
    };

    await saveConfig(newConfig);
  };

  const resetDashboardCardDesign = async () => {
    const newConfig: AppConfig = {
      ...config,
      dashboardCardDesign: DEFAULT_DASHBOARD_CARD_DESIGN
    };
    await saveConfig(newConfig);
  };

  const toggleDashboardCardVisibility = async (cardId: DashboardCardId) => {
    const currentDesign = config.dashboardCardDesign || DEFAULT_DASHBOARD_CARD_DESIGN;
    const currentVisibility = currentDesign.cardVisibility || DEFAULT_DASHBOARD_CARD_DESIGN.cardVisibility;
    
    const updatedVisibility = {
      ...currentVisibility,
      [cardId]: !currentVisibility[cardId]
    };

    await updateDashboardCardDesign({
      cardVisibility: updatedVisibility
    });
  };

  const reorderDashboardCards = async (newOrder: DashboardCardId[]) => {
    await updateDashboardCardDesign({
      cardOrders: newOrder
    });
  };

  const setDashboardCardCustomColor = async (cardId: DashboardCardId, colors: Partial<DashboardCardColorDefinition>) => {
    const currentDesign = config.dashboardCardDesign || DEFAULT_DASHBOARD_CARD_DESIGN;
    const customColors = currentDesign.customColors || {};
    const existing = customColors[cardId] || (DEFAULT_DASHBOARD_CARD_DESIGN.customColors?.[cardId] as any) || {};

    const updatedCustomColors = {
      ...customColors,
      [cardId]: {
        ...existing,
        ...colors
      }
    };

    await updateDashboardCardDesign({
      customColors: updatedCustomColors,
      themePreset: 'custom'
    });
  };

  const resetToFactoryDefaults = async () => {
    const factoryConfig: AppConfig = {
      incomeCategories: DEFAULT_INCOME_CATEGORIES,
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      customCategoryTabs: [],
      paymentMethods: DEFAULT_PAYMENT_METHODS,
      paymentStatuses: DEFAULT_PAYMENT_STATUSES,
      dashboardWidgets: DEFAULT_WIDGET_CONFIG,
      dashboardCardDesign: DEFAULT_DASHBOARD_CARD_DESIGN,
      bottomNav: DEFAULT_BOTTOM_NAV_CONFIG,
      theme: DEFAULT_THEME,
      displayDensity: DEFAULT_DISPLAY_DENSITY,
      standardSets: DEFAULT_STANDARD_SETS,
      productCategories: DEFAULT_PRODUCT_CATEGORIES,
      assets: DEFAULT_ASSETS,
      systemTags: DEFAULT_SYSTEM_TAGS,
      shopInfo: DEFAULT_SHOP_INFO
    };
    await saveConfig(factoryConfig);
  };

  const activeIncomeCategories = (config.incomeCategories || []).filter(c => c.isActive).map(c => c.name);
  const activeExpenseCategories = (config.expenseCategories || []).filter(c => c.isActive).map(c => c.name);
  const activePaymentMethods = (config.paymentMethods || []).filter(c => c.isActive).map(c => c.name);
  const activePaymentStatuses = (config.paymentStatuses || []).filter(c => c.isActive).map(c => c.name);

  return {
    config,
    incomeCategories: activeIncomeCategories,
    expenseCategories: activeExpenseCategories,
    paymentMethods: activePaymentMethods,
    paymentStatuses: activePaymentStatuses,
    displayDensity: (config.displayDensity || (localStorage.getItem('preferredDisplayDensity') as DisplayDensity) || DEFAULT_DISPLAY_DENSITY) as DisplayDensity,
    loading,
    addItem,
    updateItem,
    deleteItem,
    toggleActive,
    addSubItem,
    updateSubItem,
    deleteSubItem,
    toggleSubActive,
    duplicateItem,
    duplicateSubItem,
    reorderItems,
    generateSetsFromSubcategories,
    convertSubToStandardSet,
    // Product Catalog & Categories
    updateProductCategories,
    addProductCategory,
    updateProductCategory,
    deleteProductCategory,
    addProductItem,
    updateProductItem,
    deleteProductItem,
    adjustProductStock,
    // Assets
    updateAssets,
    addAsset,
    updateAsset,
    deleteAsset,
    // System Tags
    updateSystemTags,
    addSystemTag,
    deleteSystemTag,
    // Bottom Navigation Customization
    updateBottomNavConfig,
    addBottomNavItem,
    updateBottomNavItem,
    deleteBottomNavItem,
    toggleBottomNavItemActive,
    reorderBottomNavItems,
    resetBottomNavConfig,
    // Dashboard Cards Customization
    updateDashboardCardDesign,
    resetDashboardCardDesign,
    toggleDashboardCardVisibility,
    reorderDashboardCards,
    setDashboardCardCustomColor,
    // System & Shop
    saveConfig,
    updateWidgetConfig,
    moveWidget,
    updateTheme,
    updateDisplayDensity,
    updateStandardSets,
    addCategoryTab,
    renameCategoryTab,
    deleteCategoryTab,
    duplicateCategoryTab,
    updateShopInfo,
    resetCatalogToOneItemPerCategory: resetToDefaultCatalog,
    resetToDefaultCatalog,
    resetToFactoryDefaults
  };
}
