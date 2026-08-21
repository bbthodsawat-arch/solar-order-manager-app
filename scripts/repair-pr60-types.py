from pathlib import Path

def replace(path, old, new, count=1):
    p = Path(path)
    s = p.read_text()
    if old not in s:
        raise SystemExit(f'Expected pattern not found: {path}: {old[:100]!r}')
    p.write_text(s.replace(old, new, count))

p = Path('src/components/AssetManager.tsx')
p.write_text(p.read_text().replace('in_repair', 'maintenance'))
replace('src/components/RecurringTransactionsManager.tsx', 'setDayOfMonth(item.dayOfMonth);', 'setDayOfMonth(item.dayOfMonth ?? 1);')
replace('src/components/StockReportCard.tsx', "import { useTheme } from '../hooks/useTheme';", "import { useTheme } from '../hooks/useTheme';\nimport type { DashboardCardDesignConfig, DashboardCardThemePreset, DashboardCardBorderRadius, DashboardCardShadow } from '../types';")
replace('src/components/StockReportCard.tsx', """  const activeDesign = stockDesign.useKPISync ? kpiDesign : {
    themePreset: stockDesign.themePreset,
    borderRadius: stockDesign.borderRadius,
    shadowStyle: stockDesign.shadowStyle,
    enableHoverScale: stockDesign.enableHoverScale,
  };""", """  const activeDesign: DashboardCardDesignConfig = stockDesign.useKPISync ? kpiDesign : {
    ...DEFAULT_DASHBOARD_CARD_DESIGN,
    themePreset: stockDesign.themePreset as DashboardCardThemePreset,
    borderRadius: stockDesign.borderRadius as DashboardCardBorderRadius,
    shadowStyle: stockDesign.shadowStyle as DashboardCardShadow,
    enableHoverScale: stockDesign.enableHoverScale,
  };""")
replace('src/components/dashboard/DashboardMetricCardsGrid.tsx', 'data={sparkData && sparkData.length > 0 ? sparkData : [0, 10, 20, 15, 30]}', 'data={sparkData && sparkData.length > 0 ? sparkData.map(value => ({ value })) : [{ value: 0 }, { value: 10 }, { value: 20 }, { value: 15 }, { value: 30 }]}')
p = Path('src/hooks/useAppConfig.ts')
p.write_text(p.read_text().replace('updated_by:user.id', 'updated_by:user.uid'))
replace('src/pages/AddTransaction.tsx', '  const [customer, setCustomer] = useState(() => {', """  const [customer, setCustomer] = useState<{
    id?: string; name: string; address: string; district: string; province: string; zipcode: string; phone: string; customerTaxId?: string; customerBranch?: string; customerEmail?: string;
  }>(() => {""")
replace('src/pages/AddTransaction.tsx', '  const [payment, setPayment] = useState(() => {', """  const [payment, setPayment] = useState<{
    status: 'paid' | 'unpaid'; method: string; date: string; receiptUrl: string | undefined;
  }>(() => {""")
replace('src/pages/AddTransaction.tsx', '  const [incomeData, setIncomeData] = useState({', """  const [incomeData, setIncomeData] = useState<{
    category: string; detail: string; amount: string; payer: string; paymentMethod: string; receiptUrl: string | undefined;
  }>({""")
# Optional legacy customer fields are normalized at the CRM boundary.
p = Path('src/pages/AddTransaction.tsx')
s = p.read_text().replace('customerTaxId: customer.customerTaxId.trim()', "customerTaxId: customer.customerTaxId?.trim() || ''").replace('customerBranch: customer.customerBranch.trim()', "customerBranch: customer.customerBranch?.trim() || ''").replace('email: customer.customerEmail.trim()', "email: customer.customerEmail?.trim() || ''")
p.write_text(s)
replace('src/components/ProductInventoryManager.tsx', '  onUpdateCategories: (categories: ProductCategory[]) => void;', '  onUpdateCategories?: (categories: ProductCategory[]) => void;')
replace('src/components/ProductInventoryManager.tsx', "  onDeleteProduct: (categoryId: string, itemId: string) => Promise<void>;\n}", "  onDeleteProduct: (categoryId: string, itemId: string) => Promise<void>;\n  onAdjustStock?: (categoryId: string, itemId: string, delta: number) => Promise<void>;\n}")
replace('src/components/ProductInventoryManager.tsx', '  onDeleteProduct\n}) => {', '  onDeleteProduct,\n  onAdjustStock: _onAdjustStock\n}) => {')
p = Path('src/pages/Dashboard.tsx')
s = p.read_text().replace("currentDesign.themePreset !== 'retro_terminal' && currentDesign.themePreset !== 'cyber_neon'", "currentDesign.themePreset !== 'cyber_neon'")
s = s.replace("const activeProfitMargin = activeIncome > 0 ? ((activeProfit / activeIncome) * 100).toFixed(1) : '0';", "const activeProfitMargin = activeIncome > 0 ? Number(((activeProfit / activeIncome) * 100).toFixed(1)) : 0;")
p.write_text(s)
replace('src/pages/SettingsWorkspace.tsx', "import { useAppConfig } from '../hooks/useAppConfig';", "import { useAppConfig, DEFAULT_WIDGET_CONFIG } from '../hooks/useAppConfig';")
p = Path('src/pages/SettingsWorkspace.tsx')
p.write_text(p.read_text().replace('widgets={config.dashboardWidgets}', 'widgets={config.dashboardWidgets || DEFAULT_WIDGET_CONFIG}'))
