import { SOMThemePreset, SOMVisualStylePreset, DesignSystemConfig, RadiusToken, ShadowToken, FontToken, DensityToken, BorderStyleToken, DesignPresetDefinition } from '../types/designSystem';

export const SOM_THEMES: SOMThemePreset[] = [
  {
    id: 'modern-solar',
    name: 'Modern Solar',
    labelThai: 'พลังงานแสงอาทิตย์ร่วมสมัย (Modern Solar)',
    description: 'โทนสีทองอำพันพระอาทิตย์ผสานน้ำเงินคราม สะท้อนความเป็นผู้นำด้านพลังงานแสงอาทิตย์',
    tagline: 'Warm Solar Amber & Deep Sky',
    badge: 'ธีมหลัก SOM',
    category: 'Modern',
    colors: {
      primary: '#d97706', // Amber 600
      secondary: '#0284c7', // Sky 600
      accent: '#f59e0b', // Amber 500
      backgroundLight: '#f8fafc',
      surfaceLight: '#ffffff',
      cardLight: '#ffffff',
      borderLight: '#e2e8f0',
      textPrimaryLight: '#0f172a',
      textSecondaryLight: '#475569',
      backgroundDark: '#0b0f19',
      surfaceDark: '#111827',
      cardDark: '#1e293b',
      borderDark: '#334155',
      textPrimaryDark: '#f8fafc',
      textSecondaryDark: '#94a3b8',
      gradientClass: 'from-amber-500 via-orange-500 to-sky-600'
    },
    recommendedStyle: 'dimensional',
    recommendedRadius: 'xl',
    recommendedFont: 'prompt'
  },
  {
    id: 'cute-modern',
    name: 'Cute Modern',
    labelThai: 'คิวท์พาสเทลโมเดิร์น (Cute Modern Pastel)',
    description: 'โทนสีชมพูพาสเทลผสานม่วงลาเวนเดอร์และไซแอนสดใส นุ่มนวล น่ารัก สบายตา ใช้งานเพลิน',
    tagline: 'Sweet Pink, Lilac & Soft Mint',
    badge: 'น่ารักสดใส',
    category: 'Playful',
    colors: {
      primary: '#ec4899', // Pink 500
      secondary: '#8b5cf6', // Violet 500
      accent: '#06b6d4', // Cyan 500
      backgroundLight: '#faf5ff', // Purple 50 tint
      surfaceLight: '#ffffff',
      cardLight: '#ffffff',
      borderLight: '#f3e8ff',
      textPrimaryLight: '#1e1b4b',
      textSecondaryLight: '#6b21a8',
      backgroundDark: '#190e28',
      surfaceDark: '#26143d',
      cardDark: '#351d52',
      borderDark: '#4c2875',
      textPrimaryDark: '#faf5ff',
      textSecondaryDark: '#d8b4fe',
      gradientClass: 'from-pink-500 via-purple-500 to-cyan-400'
    },
    recommendedStyle: 'cute-pastel',
    recommendedRadius: '2xl',
    recommendedFont: 'kanit'
  },
  {
    id: 'apple-minimal',
    name: 'Apple Minimal',
    labelThai: 'แอปเปิ้ลมินิมอล เพียวเรียบหรู (Apple Minimalist)',
    description: 'ความเรียบหรูสไตล์ Cupertino เน้นความชัดเจนของข้อมูล คอนทราสต์สมดุล สบายตาขั้นสุด',
    tagline: 'Pure Monochrome, Slate & Subtle Grays',
    badge: 'มินิมอลพรีเมียม',
    category: 'Minimal',
    colors: {
      primary: '#0f172a', // Slate 900
      secondary: '#64748b', // Slate 500
      accent: '#3b82f6', // Apple Blue
      backgroundLight: '#fbfbfd',
      surfaceLight: '#ffffff',
      cardLight: '#ffffff',
      borderLight: '#e5e7eb',
      textPrimaryLight: '#111827',
      textSecondaryLight: '#4b5563',
      backgroundDark: '#000000',
      surfaceDark: '#121212',
      cardDark: '#1c1c1e',
      borderDark: '#2c2c2e',
      textPrimaryDark: '#ffffff',
      textSecondaryDark: '#8e8e93',
      gradientClass: 'from-slate-900 via-slate-800 to-slate-700'
    },
    recommendedStyle: 'flat-clean',
    recommendedRadius: 'lg',
    recommendedFont: 'sarabun'
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon',
    labelThai: 'ไซเบอร์พังก์ นีออนไฮเทค (Cyberpunk & Neon)',
    description: 'โทนสีม่วงนีออนเรืองแสงผสานสีฟ้าไซเบอร์ไฮเทค คมชัด คมคาย สไตล์อนาคต',
    tagline: 'Electric Violet, Cyber Cyan & Neon Glow',
    badge: 'ล้ำยุค',
    category: 'Tech',
    colors: {
      primary: '#8b5cf6', // Electric Purple
      secondary: '#06b6d4', // Cyber Cyan
      accent: '#f43f5e', // Neon Rose
      backgroundLight: '#f1f5f9',
      surfaceLight: '#ffffff',
      cardLight: '#ffffff',
      borderLight: '#cbd5e1',
      textPrimaryLight: '#090d16',
      textSecondaryLight: '#334155',
      backgroundDark: '#05070e',
      surfaceDark: '#0d111d',
      cardDark: '#131a2e',
      borderDark: '#243254',
      textPrimaryDark: '#38bdf8',
      textSecondaryDark: '#a5b4fc',
      gradientClass: 'from-purple-600 via-indigo-600 to-cyan-400'
    },
    recommendedStyle: 'glassmorphism',
    recommendedRadius: 'xl',
    recommendedFont: 'chakra'
  },
  {
    id: 'forest-eco',
    name: 'Forest Eco',
    labelThai: 'กรีนอีโค่ พลังงานสีเขียว (Forest Eco Solar)',
    description: 'โทนสีเขียวมรกตธรรมชาติผสมผสานมิ้นต์ สะท้อนวิสัยทัศน์ความยั่งยืนและโซล่าเซลล์สะอาด',
    tagline: 'Emerald Green, Mint & Earth Tone',
    badge: 'รักษ์โลก',
    category: 'Nature',
    colors: {
      primary: '#059669', // Emerald 600
      secondary: '#14b8a6', // Teal 500
      accent: '#84cc16', // Lime 500
      backgroundLight: '#f0fdf4', // Green 50 tint
      surfaceLight: '#ffffff',
      cardLight: '#ffffff',
      borderLight: '#dcfce7',
      textPrimaryLight: '#064e3b',
      textSecondaryLight: '#047857',
      backgroundDark: '#041d14',
      surfaceDark: '#062d1f',
      cardDark: '#0c3d2b',
      borderDark: '#13543d',
      textPrimaryDark: '#ecfdf5',
      textSecondaryDark: '#6ee7b7',
      gradientClass: 'from-emerald-600 via-teal-600 to-lime-500'
    },
    recommendedStyle: 'dimensional',
    recommendedRadius: 'xl',
    recommendedFont: 'prompt'
  },
  {
    id: 'royal-luxury',
    name: 'Royal Luxury',
    labelThai: 'รอยัลลักชัวรี่ ทองคำม่วง (Royal Gold & Violet)',
    description: 'โทนสีม่วงอเมทิสต์หรูหราผสานสีทองราชวงศ์ สื่อถึงความสำเร็จ ความพรีเมียม และความมั่งคั่ง',
    tagline: 'Imperial Violet, Amber Gold & Crimson',
    badge: 'หรูหราพรีเมียม',
    category: 'Luxury',
    colors: {
      primary: '#7c3aed', // Violet 600
      secondary: '#f59e0b', // Amber 500
      accent: '#e11d48', // Rose 600
      backgroundLight: '#faf5ff',
      surfaceLight: '#ffffff',
      cardLight: '#ffffff',
      borderLight: '#ebd5ff',
      textPrimaryLight: '#2e1065',
      textSecondaryLight: '#581c87',
      backgroundDark: '#120726',
      surfaceDark: '#1e0c3d',
      cardDark: '#2c1458',
      borderDark: '#441d87',
      textPrimaryDark: '#faf5ff',
      textSecondaryDark: '#e9d5ff',
      gradientClass: 'from-violet-700 via-purple-600 to-amber-500'
    },
    recommendedStyle: 'glassmorphism',
    recommendedRadius: 'xl',
    recommendedFont: 'prompt'
  },
  {
    id: 'sunset-warmth',
    name: 'Sunset Warmth',
    labelThai: 'สายัณห์คอรัล ส้มทองอบอุ่น (Sunset Coral & Gold)',
    description: 'โทนสีพระอาทิตย์อัสดง ส้มคอรัลผสมผสานสีชมพูทับทิม อบอุ่น กระปรี้กระเปร่า มีพลังงาน',
    tagline: 'Vibrant Coral, Warm Tangerine & Ruby',
    badge: 'สดชื่นอบอุ่น',
    category: 'Modern',
    colors: {
      primary: '#f43f5e', // Rose 500
      secondary: '#f97316', // Orange 500
      accent: '#eab308', // Yellow 500
      backgroundLight: '#fff1f2',
      surfaceLight: '#ffffff',
      cardLight: '#ffffff',
      borderLight: '#ffe4e6',
      textPrimaryLight: '#881337',
      textSecondaryLight: '#be123c',
      backgroundDark: '#210811',
      surfaceDark: '#330c1b',
      cardDark: '#471125',
      borderDark: '#661935',
      textPrimaryDark: '#fff1f2',
      textSecondaryDark: '#fda4af',
      gradientClass: 'from-rose-500 via-orange-500 to-amber-400'
    },
    recommendedStyle: 'dimensional',
    recommendedRadius: 'xl',
    recommendedFont: 'prompt'
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    labelThai: 'นอร์ดิกฟรอสต์ ฟ้าใสไอซ์แลนด์ (Nordic Frost & Cyan)',
    description: 'โทนสีฟ้าไซแอนโปร่งใสผสมสีเทาไอซ์แลนด์ สงบ ปลอดโปร่ง สะอาดตา เหมาะกับการทำงานยาวนาน',
    tagline: 'Glacial Sky, Pure Teal & Arctic Mist',
    badge: 'เย็นสบายตา',
    category: 'Minimal',
    colors: {
      primary: '#0284c7', // Sky 600
      secondary: '#0d9488', // Teal 600
      accent: '#38bdf8', // Sky 400
      backgroundLight: '#f0f9ff',
      surfaceLight: '#ffffff',
      cardLight: '#ffffff',
      borderLight: '#e0f2fe',
      textPrimaryLight: '#0c4a6e',
      textSecondaryLight: '#0369a1',
      backgroundDark: '#041724',
      surfaceDark: '#072438',
      cardDark: '#0c3552',
      borderDark: '#134c75',
      textPrimaryDark: '#f0f9ff',
      textSecondaryDark: '#7dd3fc',
      gradientClass: 'from-sky-600 via-cyan-500 to-teal-500'
    },
    recommendedStyle: 'soft-neumorphic',
    recommendedRadius: 'xl',
    recommendedFont: 'sarabun'
  },
  {
    id: 'slate-monochrome',
    name: 'Slate Monochrome',
    labelThai: 'สเลท โมโนโครม สุขุมมินิมอล (Slate Monochrome)',
    description: 'โทนสีเทาดำสเลทสไตล์ช่างวิศวกร มินิมอล คมชัด โฟกัสเฉพาะตัวเลขทางการเงินและสต็อก',
    tagline: 'Industrial Slate, Steel Gray & Pure Contrast',
    badge: 'สุขุมจริงจัง',
    category: 'Minimal',
    colors: {
      primary: '#334155', // Slate 700
      secondary: '#64748b', // Slate 500
      accent: '#94a3b8', // Slate 400
      backgroundLight: '#f8fafc',
      surfaceLight: '#ffffff',
      cardLight: '#ffffff',
      borderLight: '#e2e8f0',
      textPrimaryLight: '#0f172a',
      textSecondaryLight: '#475569',
      backgroundDark: '#090d16',
      surfaceDark: '#0f172a',
      cardDark: '#1e293b',
      borderDark: '#334155',
      textPrimaryDark: '#f8fafc',
      textSecondaryDark: '#cbd5e1',
      gradientClass: 'from-slate-800 via-slate-700 to-slate-600'
    },
    recommendedStyle: 'high-contrast',
    recommendedRadius: 'md',
    recommendedFont: 'chakra'
  },
  {
    id: 'midnight-deep',
    name: 'Midnight Deep Ocean',
    labelThai: 'มิดไนท์โอเชี่ยน ไนท์โหมดพรีเมียม (Midnight Deep Ocean)',
    description: 'โทนสีน้ำเงินมหาสมุทรลึกผสมอินดิโก้ คอนทราสต์สะดุดตา สวยงามในทุกสภาพแสง',
    tagline: 'Deep Ocean Blue, Sapphire & Electric Indigo',
    badge: 'ยอดนิยมถาวร',
    category: 'Modern',
    colors: {
      primary: '#2563eb', // Blue 600
      secondary: '#06b6d4', // Cyan 500
      accent: '#6366f1', // Indigo 500
      backgroundLight: '#f0f7ff',
      surfaceLight: '#ffffff',
      cardLight: '#ffffff',
      borderLight: '#dbeafe',
      textPrimaryLight: '#1e3a8a',
      textSecondaryLight: '#1d4ed8',
      backgroundDark: '#020617',
      surfaceDark: '#0f172a',
      cardDark: '#1e293b',
      borderDark: '#293d61',
      textPrimaryDark: '#f8fafc',
      textSecondaryDark: '#93c5fd',
      gradientClass: 'from-blue-600 via-indigo-600 to-cyan-500'
    },
    recommendedStyle: 'dimensional',
    recommendedRadius: 'xl',
    recommendedFont: 'prompt'
  }
];

export const SOM_VISUAL_STYLES: SOMVisualStylePreset[] = [
  {
    id: 'flat-clean',
    name: 'Flat Clean & Crisp',
    labelThai: 'แบนเรียบ สะอาด คมชัด (Flat Minimal)',
    description: 'เส้นขอบบางคมกริบ 1px เงาบางเบา พื้นหลังขาวสะอาด อ่านข้อมูลตัวเลขสบายตา',
    iconName: 'Square',
    badge: 'มินิมอล',
    cardClass: 'bg-white border border-slate-200/90 shadow-2xs',
    cardDarkClass: 'dark:bg-slate-900 dark:border-slate-800 dark:shadow-none',
    previewBorderColor: '#e2e8f0',
    previewBg: '#ffffff'
  },
  {
    id: 'soft-neumorphic',
    name: 'Soft Neumorphic',
    labelThai: 'นิวโมฟิกนุ่มนวล มีมิตินูนสัมผัส (Soft Neumorphic)',
    description: 'มิติเงาสองทิศทางนุ่มนวล ให้ความรู้สึกเหมือนปุ่มและกล่องมีสัมผัสจริง นวลตา',
    iconName: 'Layers',
    badge: 'สัมผัสนุ่มนวล',
    cardClass: 'soft-neumorphic border border-slate-100/90',
    cardDarkClass: 'dark:soft-neumorphic dark:border-slate-800/80',
    previewBorderColor: '#cbd5e1',
    previewBg: '#f8fafc'
  },
  {
    id: 'glassmorphism',
    name: 'Frosted Glassmorphism',
    labelThai: 'กระจกฝ้าโปร่งแสงล้ำสมัย (Frosted Glass)',
    description: 'เอฟเฟกต์กระจกเบลอโปร่งแสง (Backdrop Blur) ขอบสะท้อนแสงไฟ ดูโมเดิร์นหรูหรา',
    iconName: 'Sparkles',
    badge: 'กระจกฝ้าหรูหรา',
    cardClass: 'bg-white/80 backdrop-blur-xl border border-white/60 shadow-sm',
    cardDarkClass: 'dark:bg-slate-900/80 dark:backdrop-blur-xl dark:border-slate-700/60',
    previewBorderColor: 'rgba(255,255,255,0.7)',
    previewBg: 'rgba(255,255,255,0.7)'
  },
  {
    id: 'dimensional',
    name: 'Dimensional Elevated',
    labelThai: 'มิติลอยตัว นูนเด่น (Dimensional Card)',
    description: 'เงาลอยตัวนุ่ม มีมิติยกตัวเมื่อชี้เมาส์ (Hover elevation) สวยงามลงตัวที่สุด',
    iconName: 'Box',
    badge: 'ยอดนิยม',
    cardClass: 'dimensional-card bg-white border border-slate-200/70 shadow-sm',
    cardDarkClass: 'dark:bg-slate-900 dark:border-slate-800',
    previewBorderColor: '#e2e8f0',
    previewBg: '#ffffff'
  },
  {
    id: 'cute-pastel',
    name: 'Cute Pastel Pill',
    labelThai: 'คิวท์พาสเทล มนกลม นุ่มฟู (Cute Pastel Pill)',
    description: 'ขอบมุมมนพิเศษ (Extra Rounded) สีสันพาสเทลนุ่มฟู ป้ายแท็กทรงแคปซูล น่ารักสดใส',
    iconName: 'Heart',
    badge: 'คิ้วท์น่ารัก',
    cardClass: 'bg-white/95 rounded-3xl border-2 border-pink-100 shadow-md shadow-pink-500/5',
    cardDarkClass: 'dark:bg-purple-950/40 dark:border-purple-800/50',
    previewBorderColor: '#fbcfe8',
    previewBg: '#fff1f2'
  },
  {
    id: 'high-contrast',
    name: 'High Contrast Pro',
    labelThai: 'คอนทราสต์คมชัด ระดับวิศวกร (High Contrast Pro)',
    description: 'เส้นขอบชัดเจน สีตัวอักษรตัดกับพื้นหลัง 100% อ่านค่าง่ายท่ามกลางแดดจ้าหรือที่มืด',
    iconName: 'Shield',
    badge: 'คมชัดสูงสุด',
    cardClass: 'bg-white border-2 border-slate-900 shadow-none text-slate-900 font-bold',
    cardDarkClass: 'dark:bg-black dark:border-slate-200 dark:text-white',
    previewBorderColor: '#0f172a',
    previewBg: '#ffffff'
  }
];

export const RADIUS_TOKENS: { id: RadiusToken; label: string; px: string; previewClass: string }[] = [
  { id: 'none', label: 'มุมเหลี่ยมคม (0px)', px: '0px', previewClass: 'rounded-none' },
  { id: 'sm', label: 'มนเล็กน้อย (6px)', px: '6px', previewClass: 'rounded-sm' },
  { id: 'md', label: 'มนมาตรฐาน (8px)', px: '8px', previewClass: 'rounded-md' },
  { id: 'lg', label: 'มนนุ่มนวล (12px)', px: '12px', previewClass: 'rounded-lg' },
  { id: 'xl', label: 'มนโมเดิร์น (16px)', px: '16px', previewClass: 'rounded-xl' },
  { id: '2xl', label: 'มนพิเศษ SOM (24px)', px: '24px', previewClass: 'rounded-3xl' },
  { id: 'pill', label: 'ทรงแคปซูล Pill (999px)', px: '9999px', previewClass: 'rounded-full' }
];

export const SHADOW_TOKENS: { id: ShadowToken; label: string; desc: string }[] = [
  { id: 'none', label: 'ไม่มีเงา (Flat 0px)', desc: 'เน้นความเรียบง่าย แบนสนิท' },
  { id: 'soft', label: 'เงานุ่มบางเบา (Soft 2xs)', desc: 'เงาละมุน ไม่รบกวนสายตา' },
  { id: 'medium', label: 'เงาลอยมาตรฐาน (Medium)', desc: 'มิติกำลังดี มีน้ำหนัก' },
  { id: 'deep', label: 'เงามิติลึก (Deep Layered)', desc: 'เงาหนา ชัดเจน โดดเด่น' },
  { id: 'glow', label: 'เงาเรืองแสงสีแบรนด์ (Brand Glow)', desc: 'เรืองแสงสีประจำธีมทันสมัย' }
];

export const FONT_TOKENS: { id: FontToken; name: string; labelThai: string; cssFont: string }[] = [
  { 
    id: 'prompt', 
    name: 'Prompt', 
    labelThai: 'พร้อมท์ โมเดิร์น (Prompt - สากล ทันสมัย ยอดนิยม)',
    cssFont: "'Prompt', 'Plus Jakarta Sans', sans-serif" 
  },
  { 
    id: 'sarabun', 
    name: 'Sarabun', 
    labelThai: 'สารบรรณ คลีนทางการ (Sarabun - ชัดเจน เรียบง่าย เอกสารราชการ)',
    cssFont: "'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif" 
  },
  { 
    id: 'chakra', 
    name: 'Chakra Petch', 
    labelThai: 'จักรเพชร ไฮเทควิศวกรรม (Chakra Petch - คมเข้ม เทคโน โซล่า)',
    cssFont: "'Chakra Petch', monospace, sans-serif" 
  },
  { 
    id: 'kanit', 
    name: 'Kanit', 
    labelThai: 'คณิต โดดเด่นสดใส (Kanit - ตัวหนา มีพลัง น่ารัก)',
    cssFont: "'Kanit', sans-serif" 
  }
];

export const DENSITY_TOKENS: { id: DensityToken; label: string; desc: string }[] = [
  { id: 'compact', label: 'กระชับ แน่นหนา (Compact)', desc: 'ประหยัดพื้นที่ เห็นข้อมูลได้มากที่สุดในหน้าจอเดียว' },
  { id: 'comfortable', label: 'มาตรฐาน พอดี (Comfortable)', desc: 'สมดุลระหว่างพื้นที่ว่างและการอ่านที่สบายตา' },
  { id: 'spacious', label: 'โปร่งสบาย พรีเมียม (Spacious)', desc: 'ระยะห่างกว้างขวาง สบายตา หรูหรา' }
];

export const BORDER_TOKENS: { id: BorderStyleToken; label: string }[] = [
  { id: 'subtle', label: 'เส้นขอบบางเบา (Subtle 1px)' },
  { id: 'solid', label: 'เส้นขอบชัดเจน (Solid 2px)' },
  { id: 'dashed', label: 'เส้นประแฟชั่น (Dashed)' },
  { id: 'glow', label: 'ขอบเรืองแสง (Glow Highlight)' },
  { id: 'none', label: 'ไร้เส้นขอบ (Seamless)' }
];

export const DEFAULT_DESIGN_CONFIG: DesignSystemConfig = {
  version: 2,
  themeId: 'modern-solar',
  visualStyle: 'dimensional',
  primaryColor: '#d97706',
  secondaryColor: '#0284c7',
  accentColor: '#f59e0b',
  radius: '2xl',
  shadow: 'medium',
  font: 'prompt',
  density: 'comfortable',
  borderStyle: 'subtle',
  animationSpeed: 'normal',
  cardBgOpacity: 95,
  glassBlurPx: 16,
  enableGlowEffects: true,
  enablePageTransitions: true,
  layoutPreset: 'full',
  widgetCustomStyles: {}
};

export const LAYOUT_PRESETS = [
  {
    id: 'full',
    name: 'Complete Hub (หน้าแรกเต็มรูปแบบ)',
    labelThai: 'สมบูรณ์แบบ (Full SOM Operations)',
    desc: 'เปิดใช้วิดเจ็ตและตัวชี้วัดทั้งหมด ครอบคลุมการขาย บัญชี สต็อก และการติดตั้ง',
    icon: 'LayoutGrid',
    widgetKeys: [
      'showPinnedMetrics',
      'showDailyRevenueGoal',
      'showTotalIncome',
      'showTotalExpense',
      'showNetProfit',
      'showUnpaid',
      'showSolarSales',
      'showQuickShortcuts',
      'showSmartBudgetAlerts',
      'showDueAlerts',
      'showCategorySalesSummary',
      'showWeeklyTrend',
      'showTrendChart',
      'showCategoryBreakdown',
      'showMonthlyBudget',
      'showStockInventory',
      'showQuickNotes',
      'showRecentSolarTable',
      'showRecentTransactionsList'
    ]
  },
  {
    id: 'executive',
    name: 'Executive Overview (สรุปผู้บริหาร)',
    labelThai: 'มุมมองผู้บริหาร (Executive KPIs)',
    desc: 'เน้นกำไรสุทธิ สรุปเป้าหมายรายวัน ยอดค้างชำระ และกราฟแนวโน้มการเงิน 30 วัน',
    icon: 'TrendingUp',
    widgetKeys: [
      'showPinnedMetrics',
      'showDailyRevenueGoal',
      'showTotalIncome',
      'showTotalExpense',
      'showNetProfit',
      'showUnpaid',
      'showSolarSales',
      'showSmartBudgetAlerts',
      'showDueAlerts',
      'showTrendChart',
      'showMonthlyBudget'
    ]
  },
  {
    id: 'operations',
    name: 'Store Operations & POS (หน้าร้าน & คลังสินค้า)',
    labelThai: 'ปฏิบัติการหน้าร้าน & สต็อก (Store POS & Stock)',
    desc: 'เน้นทางลัดบันทึกด่วน ตารางสต็อกคงเหลือ ออเดอร์โซล่าเซลล์ล่าสุด และบันทึกช่วยจำ',
    icon: 'Store',
    widgetKeys: [
      'showQuickShortcuts',
      'showSolarSales',
      'showCategorySalesSummary',
      'showStockInventory',
      'showRecentSolarTable',
      'showQuickNotes',
      'showDueAlerts',
      'showRecentTransactionsList'
    ]
  },
  {
    id: 'analytics',
    name: 'Financial Analytics (วิเคราะห์การเงินเชิงลึก)',
    labelThai: 'วิเคราะห์การเงิน & งบประมาณ (Financial Analytics)',
    desc: 'เน้นแผนภูมิวงกลมแยกตามหมวดหมู่ กราฟเปรียบเทียบกระแสเงินสด และการวิเคราะห์กำไร',
    icon: 'BarChart3',
    widgetKeys: [
      'showTotalIncome',
      'showTotalExpense',
      'showNetProfit',
      'showCategorySalesSummary',
      'showWeeklyTrend',
      'showTrendChart',
      'showCategoryBreakdown',
      'showMonthlyBudget',
      'showPinnedMetrics'
    ]
  }
];

export const BUILTIN_DESIGN_PRESETS: DesignPresetDefinition[] = [
  {
    id: 'solar-master',
    name: 'Solar Master Operations',
    nameThai: 'พลังงานแสงอาทิตย์หลัก (Solar Master)',
    tagline: 'Warm Solar Amber & Deep Sky',
    description: 'พรีเซ็ตหลักของระบบ SOM ผสานโทนสีทองส้มพระอาทิตย์กับน้ำเงินคราม การ์ดนูนมีมิติ อ่านค่าง่าย อบอุ่น ทันสมัย',
    badge: 'พรีเซ็ตแบรนด์หลัก',
    category: 'Official',
    gradient: 'from-amber-500 via-orange-500 to-sky-600',
    colors: {
      primary: '#d97706',
      secondary: '#0284c7',
      accent: '#f59e0b'
    },
    config: {
      themeId: 'modern-solar',
      visualStyle: 'dimensional',
      density: 'comfortable',
      radius: '2xl',
      shadow: 'medium',
      font: 'prompt',
      borderStyle: 'subtle',
      primaryColor: '#d97706',
      secondaryColor: '#0284c7',
      accentColor: '#f59e0b'
    }
  },
  {
    id: 'executive-pro',
    name: 'Executive High-Density Pro',
    nameThai: 'มุมมองผู้บริหารกะทัดรัด (Executive Pro)',
    tagline: 'Industrial Slate & Crisp High Contrast',
    description: 'เน้นความกะทัดรัดของพื้นที่ ข้อมูลกระชับ คอนทราสต์คมชัด ฟอนต์วิศวกร Chakra เหมาะสำหรับวิเคราะห์ตัวเลขทางการเงินเชิงลึก',
    badge: 'เน้นข้อมูลแน่น',
    category: 'Official',
    gradient: 'from-slate-800 via-slate-700 to-slate-900',
    colors: {
      primary: '#334155',
      secondary: '#64748b',
      accent: '#94a3b8'
    },
    config: {
      themeId: 'slate-monochrome',
      visualStyle: 'high-contrast',
      density: 'compact',
      radius: 'md',
      shadow: 'none',
      font: 'chakra',
      borderStyle: 'solid',
      primaryColor: '#334155',
      secondaryColor: '#64748b',
      accentColor: '#94a3b8'
    }
  },
  {
    id: 'cute-pastel-delight',
    name: 'Cute Pastel Delight',
    nameThai: 'คิวท์พาสเทล นุ่มฟู สบายตา (Cute Pastel)',
    tagline: 'Sweet Pink, Lilac & Soft Mint',
    description: 'โทนสีชมพูและม่วงพาสเทล การ์ดนุ่มมนพิเศษ 24px ฟอนต์ Kanit ตัวหนาสดใส ให้บรรยากาศที่เป็นมิตรและผ่อนคลาย',
    badge: 'น่ารักสดใส',
    category: 'Official',
    gradient: 'from-pink-500 via-purple-500 to-cyan-400',
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#06b6d4'
    },
    config: {
      themeId: 'cute-modern',
      visualStyle: 'cute-pastel',
      density: 'comfortable',
      radius: '2xl',
      shadow: 'soft',
      font: 'kanit',
      borderStyle: 'subtle',
      primaryColor: '#ec4899',
      secondaryColor: '#8b5cf6',
      accentColor: '#06b6d4'
    }
  },
  {
    id: 'cupertino-glass-pro',
    name: 'Frosted Cupertino Glass',
    nameThai: 'แอปเปิ้ลมินิมอล กระจกฝ้า (Apple Cupertino Glass)',
    tagline: 'Pure Minimalist & Frosted Glass',
    description: 'กระจกฝ้าโปร่งแสง มินิมอลเรียบหรู สีโทนสเกรย์และฟ้าสว่าง ชัดเจน คลีน อ่านง่ายสไตล์ Cupertino',
    badge: 'มินิมอลพรีเมียม',
    category: 'Official',
    gradient: 'from-slate-900 via-slate-800 to-blue-600',
    colors: {
      primary: '#0f172a',
      secondary: '#64748b',
      accent: '#3b82f6'
    },
    config: {
      themeId: 'apple-minimal',
      visualStyle: 'glassmorphism',
      density: 'comfortable',
      radius: 'lg',
      shadow: 'soft',
      font: 'sarabun',
      borderStyle: 'subtle',
      primaryColor: '#0f172a',
      secondaryColor: '#64748b',
      accentColor: '#3b82f6'
    }
  },
  {
    id: 'cyberpunk-neon-future',
    name: 'Cyberpunk Future Neon',
    nameThai: 'ไซเบอร์พังก์ นีออนอนาคต (Cyberpunk Future)',
    tagline: 'Electric Violet & Cyber Cyan Glow',
    description: 'ดีไซน์ล้ำอนาคต โทนสีม่วงนีออนเรืองแสงผสานสีฟ้าไซเบอร์ ไฮไลท์สะดุดตาโดดเด่นไม่ซ้ำใคร',
    badge: 'ล้ำยุค',
    category: 'Official',
    gradient: 'from-purple-600 via-indigo-600 to-cyan-400',
    colors: {
      primary: '#8b5cf6',
      secondary: '#06b6d4',
      accent: '#f43f5e'
    },
    config: {
      themeId: 'cyber-neon',
      visualStyle: 'glassmorphism',
      density: 'comfortable',
      radius: 'xl',
      shadow: 'glow',
      font: 'chakra',
      borderStyle: 'glow',
      primaryColor: '#8b5cf6',
      secondaryColor: '#06b6d4',
      accentColor: '#f43f5e'
    }
  },
  {
    id: 'forest-eco-clean',
    name: 'Forest Eco Clean Energy',
    nameThai: 'กรีนอีโค่ พลังงานสะอาด (Forest Eco)',
    tagline: 'Emerald Green, Mint & Earth Tone',
    description: 'โทนสีเขียวมรกตและมิ้นต์ พื้นที่โปร่งสบายตา สะท้อนภาพลักษณ์ความยั่งยืน และพลังงานหมุนเวียนสะอาด',
    badge: 'รักษ์โลก',
    category: 'Official',
    gradient: 'from-emerald-600 via-teal-600 to-lime-500',
    colors: {
      primary: '#059669',
      secondary: '#14b8a6',
      accent: '#84cc16'
    },
    config: {
      themeId: 'forest-eco',
      visualStyle: 'dimensional',
      density: 'spacious',
      radius: 'xl',
      shadow: 'soft',
      font: 'prompt',
      borderStyle: 'subtle',
      primaryColor: '#059669',
      secondaryColor: '#14b8a6',
      accentColor: '#84cc16'
    }
  },
  {
    id: 'royal-luxury-gold',
    name: 'Royal Gold & Amethyst Luxury',
    nameThai: 'รอยัล ลักชัวรี่ ทองคำม่วง (Royal Luxury)',
    tagline: 'Imperial Violet, Amber Gold & Ruby',
    description: 'ม่วงราชวงศ์หรูหราผสานสีทองคำและแดงทับทิม มิติความเงาลึก สร้างบรรยากาศพรีเมียมระดับวีไอพี',
    badge: 'หรูหราพรีเมียม',
    category: 'Official',
    gradient: 'from-violet-700 via-purple-600 to-amber-500',
    colors: {
      primary: '#7c3aed',
      secondary: '#f59e0b',
      accent: '#e11d48'
    },
    config: {
      themeId: 'royal-luxury',
      visualStyle: 'glassmorphism',
      density: 'spacious',
      radius: 'xl',
      shadow: 'deep',
      font: 'prompt',
      borderStyle: 'subtle',
      primaryColor: '#7c3aed',
      secondaryColor: '#f59e0b',
      accentColor: '#e11d48'
    }
  },
  {
    id: 'nordic-glacier-frost',
    name: 'Nordic Glacier Soft Neumorphic',
    nameThai: 'นอร์ดิก ไอซ์แลนด์ (Nordic Glacier)',
    tagline: 'Glacial Sky & Soft Neumorphic Touch',
    description: 'ฟ้าใสและเขียวมิ้นต์นวลตา สัมผัสนิวโมฟิกนุ่มนวล ผ่อนคลายสายตา เหมาะสำหรับผู้ใช้งานหน้าจอต่อเนื่องยาวนาน',
    badge: 'สบายตา',
    category: 'Official',
    gradient: 'from-sky-600 via-cyan-500 to-teal-500',
    colors: {
      primary: '#0284c7',
      secondary: '#0d9488',
      accent: '#38bdf8'
    },
    config: {
      themeId: 'nordic-frost',
      visualStyle: 'soft-neumorphic',
      density: 'comfortable',
      radius: 'xl',
      shadow: 'soft',
      font: 'sarabun',
      borderStyle: 'subtle',
      primaryColor: '#0284c7',
      secondaryColor: '#0d9488',
      accentColor: '#38bdf8'
    }
  }
];
