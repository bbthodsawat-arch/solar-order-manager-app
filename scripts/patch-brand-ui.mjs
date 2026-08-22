import fs from 'node:fs';

function patch(path, apply) {
  const source = fs.readFileSync(path, 'utf8');
  const next = apply(source);
  if (next === source) console.warn(`No brand UI changes applied to ${path}`);
  fs.writeFileSync(path, next);
}

patch('src/components/ProductInventoryManager.tsx', (source) => {
  if (!source.includes("useAppConfig")) {
    source = source.replace(
      "import { notifyReaction } from '../utils/feedback';",
      "import { notifyReaction } from '../utils/feedback';\nimport { useAppConfig } from '../hooks/useAppConfig';"
    );
  }
  if (!source.includes("const [brandFilter")) {
    source = source.replace(
      "  const [typeFilter, setTypeFilter] = useState<string>('all');",
      "  const [typeFilter, setTypeFilter] = useState<string>('all');\n  const [brandFilter, setBrandFilter] = useState<string>('all');\n  const { config } = useAppConfig();\n  const activeBrands = (config.brands || []).filter((brand: any) => brand.isActive);"
    );
  }
  source = source.replace(
    "    itemType: 'product'\n  });",
    "    itemType: 'product',\n    brandId: '',\n    brandName: ''\n  });"
  );
  source = source.replace(
    "        itemType: product.item.itemType || 'product'\n      });",
    "        itemType: product.item.itemType || 'product',\n        brandId: product.item.brandId || '',\n        brandName: product.item.brandName || ''\n      });"
  );
  source = source.replace(
    "        itemType: 'product'\n      });",
    "        itemType: 'product',\n        brandId: '',\n        brandName: ''\n      });"
  );
  source = source.replace(
    "    // Type filter\n    if (typeFilter !== 'all' && (item.itemType || 'product') !== typeFilter) return false;",
    "    // Type filter\n    if (typeFilter !== 'all' && (item.itemType || 'product') !== typeFilter) return false;\n\n    // Brand filter keeps legacy brandName records searchable while preferring canonical brandId.\n    if (brandFilter !== 'all' && item.brandId !== brandFilter) return false;"
  );
  source = source.replace(
    "      const matchCat = (item.categoryName || '').toLowerCase().includes(q);\n      return matchName || matchSku || matchBarcode || matchCat;",
    "      const matchCat = (item.categoryName || '').toLowerCase().includes(q);\n      const matchBrand = (item.brandName || activeBrands.find((brand: any) => brand.id === item.brandId)?.name || '').toLowerCase().includes(q);\n      return matchName || matchSku || matchBarcode || matchCat || matchBrand;"
  );
  const brandFilterUi = `\n          {/* Brand Filter */}\n          <div className="sm:col-span-3">\n            <select\n              value={brandFilter}\n              onChange={(e) => setBrandFilter(e.target.value)}\n              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"\n            >\n              <option value="all">🏷️ ทุกแบรนด์</option>\n              {activeBrands.map((brand: any) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}\n            </select>\n          </div>\n`;
  if (!source.includes('ทุกแบรนด์')) source = source.replace('        {/* Product List Table / Cards */}', brandFilterUi + '\n        {/* Product List Table / Cards */}');
  source = source.replace(
    '<th className="py-3 px-3">หมวดหมู่</th>',
    '<th className="py-3 px-3">หมวดหมู่</th>\n                  <th className="py-3 px-3">แบรนด์</th>'
  );
  if (!source.includes('activeBrands.find((brand: any) => brand.id === prod.brandId)')) {
    source = source.replace(
      '                      {/* Sale Price */}',
      `                      <td className="py-3.5 px-3 whitespace-nowrap">\n                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800">\n                          {prod.brandName || activeBrands.find((brand: any) => brand.id === prod.brandId)?.name || 'ไม่ระบุ'}\n                        </span>\n                      </td>\n\n                      {/* Sale Price */}`
    );
  }
  const brandSelect = `                {/* Brand */}\n                <div>\n                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">แบรนด์</label>\n                  <select\n                    value={productForm.brandId || ''}\n                    onChange={(e) => {\n                      const brand = activeBrands.find((entry: any) => entry.id === e.target.value);\n                      setProductForm({ ...productForm, brandId: brand?.id || '', brandName: brand?.name || '' });\n                    }}\n                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"\n                  >\n                    <option value="">ไม่ระบุแบรนด์</option>\n                    {activeBrands.map((brand: any) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}\n                  </select>\n                  {editingProduct && productForm.brandId && !activeBrands.some((brand: any) => brand.id === productForm.brandId) && <p className="mt-1 text-[10px] text-amber-600">แบรนด์นี้ปิดใช้งานแล้ว จึงคงไว้เพื่อรักษาข้อมูลเดิม</p>}\n                </div>\n\n`;
  if (!source.includes('label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">แบรนด์')) source = source.replace('                {/* Price, Cost, Unit */}', brandSelect + '                {/* Price, Cost, Unit */}');
  return source;
});

patch('src/components/ProductCatalogManager.tsx', (source) => {
  if (!source.includes("useAppConfig")) {
    source = source.replace(
      "import { notifyReaction } from '../utils/feedback';",
      "import { notifyReaction } from '../utils/feedback';\nimport { useAppConfig } from '../hooks/useAppConfig';"
    );
    source = source.replace(
      "  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');",
      "  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');\n  const { config } = useAppConfig();\n  const activeBrands = (config.brands || []).filter((brand: any) => brand.isActive);"
    );
  }
  if (!source.includes('ชุดสินค้าใหม่"')) return source;
  const marker = "  const handleDuplicateSet = (set: StandardProductSet) => {";
  if (!source.includes('handleSetBrand')) source = source.replace(marker, `  const handleSetBrand = (brandId: string) => {\n    if (!tempSet) return;\n    const brand = activeBrands.find((entry: any) => entry.id === brandId);\n    setTempSet({ ...(tempSet as any), brandId: brand?.id || '', brandName: brand?.name || '' } as any);\n  };\n\n${marker}`);
  const brandEditor = `\n            <div>\n              <label className="block text-xs font-black text-slate-500 mb-1">แบรนด์ของชุดสินค้า</label>\n              <select value={(tempSet as any).brandId || ''} onChange={e => handleSetBrand(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">\n                <option value="">ไม่ระบุแบรนด์</option>\n                {activeBrands.map((brand: any) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}\n              </select>\n            </div>\n`;
  if (!source.includes('แบรนด์ของชุดสินค้า')) source = source.replace('      {/* Header & Main Stats */}', `      {editingId && tempSet ? <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/20">${brandEditor}</div> : null}\n\n      {/* Header & Main Stats */}`);
  return source;
});

patch('src/pages/AddTransaction.tsx', (source) => {
  if (!source.includes('const [activeBrand')) {
    source = source.replace(
      "  const [activeCategory, setActiveCategory] = useState<string>('all');",
      "  const [activeCategory, setActiveCategory] = useState<string>('all');\n  const [activeBrand, setActiveBrand] = useState<string>('all');"
    );
  }
  source = source.replace(
    "  const standardSets = config.standardSets || [];",
    "  const standardSets = config.standardSets || [];\n  const activeBrands = (config.brands || []).filter((brand: any) => brand.isActive);"
  );
  source = source.replace(
    "    if (searchQuery.trim()) {",
    "    if (activeBrand !== 'all') result = result.filter((set: any) => set.brandId === activeBrand);\n    if (searchQuery.trim()) {"
  );
  source = source.replace(
    "  }, [standardSets, activeCategory, searchQuery, incomeCategories]);",
    "  }, [standardSets, activeCategory, activeBrand, searchQuery, incomeCategories]);"
  );
  const brandChips = `\n            {activeBrands.length > 0 && <div className="flex items-center gap-2 overflow-x-auto pb-2">\n              <button onClick={() => setActiveBrand('all')} className={\`px-3 py-1.5 rounded-xl text-[11px] font-black border \${activeBrand === 'all' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}\`}>ทุกแบรนด์</button>\n              {activeBrands.map((brand: any) => <button key={brand.id} onClick={() => setActiveBrand(brand.id)} className={\`px-3 py-1.5 rounded-xl text-[11px] font-black border whitespace-nowrap \${activeBrand === brand.id ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}\`}>{brand.name}</button>)}\n            </div>}\n`;
  if (!source.includes('ทุกแบรนด์</button>')) source = source.replace('            {/* Search Bar */}', brandChips + '\n            {/* Search Bar */}');
  return source;
});

console.log('Brand UI integration build patch applied');
