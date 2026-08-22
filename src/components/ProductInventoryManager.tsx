import React, { useState } from 'react';
import { 
  Layers, Plus, Trash2, Edit3, Save, X, Search, 
  Package, AlertTriangle, CheckCircle2, TrendingUp, 
  DollarSign, ArrowUpDown, Filter, ChevronRight,
  Boxes, Barcode, Tag, Copy, Sparkles, SlidersHorizontal,
  Minus, PlusCircle, Check
} from 'lucide-react';
import { ProductCategory, ProductCatalogItem } from '../types';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { notifyReaction } from '../utils/feedback';

interface ProductInventoryManagerProps {
  categories: ProductCategory[];
  onUpdateCategories?: (categories: ProductCategory[]) => void;
  onAddCategory: (category: Omit<ProductCategory, 'id' | 'items'>) => Promise<void>;
  onUpdateCategory: (id: string, updates: Partial<ProductCategory>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddProduct: (categoryId: string, item: Omit<ProductCatalogItem, 'id'>) => Promise<void>;
  onUpdateProduct: (categoryId: string, itemId: string, updates: Partial<ProductCatalogItem>) => Promise<void>;
  onDeleteProduct: (categoryId: string, itemId: string) => Promise<void>;
  onAdjustStock?: (categoryId: string, itemId: string, delta: number) => Promise<void>;
}

export const ProductInventoryManager: React.FC<ProductInventoryManagerProps> = ({
  categories = [],
  onUpdateCategories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock: _onAdjustStock
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals & form state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', color: '#3b82f6' });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ categoryId: string; item: ProductCatalogItem } | null>(null);
  const [productForm, setProductForm] = useState<Omit<ProductCatalogItem, 'id'>>({
    name: '',
    sku: '',
    barcode: '',
    price: 0,
    cost: 0,
    unit: 'ชิ้น',
    inStock: 0,
    minStock: 5,
    description: '',
    isActive: true,
    itemType: 'product'
  });
  const [targetProductCategoryId, setTargetProductCategoryId] = useState<string>('');

  // Collect all products with their category info
  const allProducts = categories.flatMap(cat => 
    (cat.items || []).map(item => ({
      ...item,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color || '#3b82f6'
    }))
  );

  // Filtered products list
  const filteredProducts = allProducts.filter(item => {
    // Category filter
    if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) return false;
    
    // Type filter
    if (typeFilter !== 'all' && (item.itemType || 'product') !== typeFilter) return false;

    // Stock filter
    const stock = item.inStock || 0;
    const minStock = item.minStock || 5;
    if (stockFilter === 'out_of_stock' && stock > 0) return false;
    if (stockFilter === 'low_stock' && (stock === 0 || stock > minStock)) return false;
    if (stockFilter === 'in_stock' && stock === 0) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchSku = (item.sku || '').toLowerCase().includes(q);
      const matchBarcode = (item.barcode || '').toLowerCase().includes(q);
      const matchCat = (item.categoryName || '').toLowerCase().includes(q);
      return matchName || matchSku || matchBarcode || matchCat;
    }

    return true;
  });

  // Calculate high-level stats
  const totalProductsCount = allProducts.length;
  const totalStockUnits = allProducts.reduce((sum, i) => sum + (i.inStock || 0), 0);
  const totalInventoryValue = allProducts.reduce((sum, i) => sum + ((i.inStock || 0) * (i.cost || i.price || 0)), 0);
  const lowStockCount = allProducts.filter(i => (i.inStock || 0) > 0 && (i.inStock || 0) <= (i.minStock || 5)).length;
  const outOfStockCount = allProducts.filter(i => (i.inStock || 0) <= 0).length;

  // Category handlers
  const handleOpenCategoryModal = (cat?: ProductCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({
        name: cat.name,
        description: cat.description || '',
        color: cat.color || '#3b82f6'
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', color: '#3b82f6' });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      notifyReaction('warning', 'กรุณาระบุชื่อหมวดหมู่');
      return;
    }

    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim(),
          color: categoryForm.color
        });
        notifyReaction('success', 'อัปเดตหมวดหมู่เรียบร้อยแล้ว');
      } else {
        await onAddCategory({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim(),
          color: categoryForm.color,
          isActive: true
        });
        notifyReaction('success', 'เพิ่มหมวดหมู่สินค้าใหม่เรียบร้อย');
      }
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      notifyReaction('error', err.message || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
    }
  };

  const handleDeleteCategory = async (cat: ProductCategory) => {
    const itemCount = cat.items?.length || 0;
    const confirmMsg = itemCount > 0 
      ? `คุณต้องการลบหมวดหมู่ "${cat.name}" พร้อมสินค้าภายในจำนวน ${itemCount} รายการหรือไม่?`
      : `คุณต้องการลบหมวดหมู่ "${cat.name}" หรือไม่?`;

    if (confirm(confirmMsg)) {
      try {
        await onDeleteCategory(cat.id);
        if (selectedCategoryId === cat.id) {
          setSelectedCategoryId('all');
        }
        notifyReaction('delete', 'ลบหมวดหมู่เรียบร้อยแล้ว');
      } catch (err: any) {
        notifyReaction('error', err.message || 'เกิดข้อผิดพลาด');
      }
    }
  };

  // Product handlers
  const handleOpenProductModal = (product?: { categoryId: string; item: ProductCatalogItem }) => {
    if (categories.length === 0) {
      toast.error('กรุณาสร้างหมวดหมู่สินค้าก่อนเพิ่มรายการสินค้า');
      handleOpenCategoryModal();
      return;
    }

    if (product) {
      setEditingProduct(product);
      setTargetProductCategoryId(product.categoryId);
      setProductForm({
        name: product.item.name,
        sku: product.item.sku || '',
        barcode: product.item.barcode || '',
        price: product.item.price || 0,
        cost: product.item.cost || 0,
        unit: product.item.unit || 'ชิ้น',
        inStock: product.item.inStock || 0,
        minStock: product.item.minStock || 5,
        description: product.item.description || '',
        isActive: product.item.isActive ?? true,
        itemType: product.item.itemType || 'product'
      });
    } else {
      setEditingProduct(null);
      setTargetProductCategoryId(selectedCategoryId !== 'all' ? selectedCategoryId : categories[0].id);
      setProductForm({
        name: '',
        sku: '',
        barcode: '',
        price: 0,
        cost: 0,
        unit: 'ชิ้น',
        inStock: 10,
        minStock: 3,
        description: '',
        isActive: true,
        itemType: 'product'
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      notifyReaction('warning', 'กรุณาระบุชื่อสินค้า');
      return;
    }
    if (!targetProductCategoryId) {
      notifyReaction('warning', 'กรุณาเลือกหมวดหมู่สินค้า');
      return;
    }

    try {
      if (editingProduct) {
        // If category changed, remove from old and add to new
        if (editingProduct.categoryId !== targetProductCategoryId) {
          await onDeleteProduct(editingProduct.categoryId, editingProduct.item.id);
          await onAddProduct(targetProductCategoryId, {
            ...productForm,
            name: productForm.name.trim()
          });
        } else {
          await onUpdateProduct(editingProduct.categoryId, editingProduct.item.id, {
            ...productForm,
            name: productForm.name.trim()
          });
        }
        notifyReaction('success', 'อัปเดตข้อมูลสินค้าเรียบร้อย');
      } else {
        await onAddProduct(targetProductCategoryId, {
          ...productForm,
          name: productForm.name.trim()
        });
        notifyReaction('success', 'เพิ่มสินค้าใหม่ลงในระบบเรียบร้อย');
      }
      setIsProductModalOpen(false);
    } catch (err: any) {
      notifyReaction('error', err.message || 'เกิดข้อผิดพลาดในการบันทึกสินค้า');
    }
  };

  const handleDeleteProduct = async (categoryId: string, itemId: string, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "${name}"?`)) {
      try {
        await onDeleteProduct(categoryId, itemId);
        notifyReaction('delete', `ลบสินค้า "${name}" เรียบร้อยแล้ว`);
      } catch (err: any) {
        notifyReaction('error', err.message || 'เกิดข้อผิดพลาด');
      }
    }
  };

  const handleQuickStockAdjust = async (categoryId: string, item: ProductCatalogItem, delta: number) => {
    const newStock = Math.max(0, (item.inStock || 0) + delta);
    try {
      await onUpdateProduct(categoryId, item.id, { inStock: newStock });
      toast.success(`ปรับสต็อก ${item.name}: ${newStock} ${item.unit}`, { duration: 1500 });
    } catch (err) {
      toast.error('ไม่สามารถปรับสต็อกได้');
    }
  };

  const handleDuplicateProduct = async (categoryId: string, item: ProductCatalogItem) => {
    try {
      await onAddProduct(categoryId, {
        ...item,
        name: `${item.name} (สำเนา)`,
        sku: item.sku ? `${item.sku}-COPY` : undefined
      });
      toast.success('คัดลอกรายการสินค้าเรียบร้อย');
    } catch (err) {
      toast.error('ไม่สามารถคัดลอกสินค้าได้');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">สินค้าทั้งหมด</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Boxes size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalProductsCount}</span>
            <span className="text-xs font-bold text-slate-500">รายการ ({totalStockUnits} ชิ้น)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">มูลค่าต้นทุนสต็อก</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ฿{totalInventoryValue.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">สินค้าใกล้หมด</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{lowStockCount}</span>
            <span className="text-xs font-bold text-slate-500">รายการ (≤ จุดเตือน)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">สินค้าหมดสต็อก</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{outOfStockCount}</span>
            <span className="text-xs font-bold text-slate-500">รายการ (0 ชิ้น)</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Header & Main Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="text-blue-500" size={20} />
              <span>แคตตาล็อกสินค้าและสต็อกอุปกรณ์</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              จัดการรายการสินค้า อุปกรณ์ประกอบ หมวดหมู่ ราคาขาย ราคาทุน และสต็อกคงเหลือ
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleOpenCategoryModal()}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={15} />
              <span>เพิ่มหมวดหมู่</span>
            </button>

            <button
              onClick={() => handleOpenProductModal()}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>เพิ่มสินค้าใหม่</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">หมวดหมู่สินค้า ({categories.length})</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                selectedCategoryId === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              ทั้งหมด ({allProducts.length})
            </button>

            {categories.map((cat) => {
              const count = cat.items?.length || 0;
              const isSelected = selectedCategoryId === cat.id;

              return (
                <div 
                  key={cat.id} 
                  className={`group flex items-center rounded-2xl text-xs font-black transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <button
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="px-3.5 py-2 flex items-center gap-2 cursor-pointer"
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: cat.color || '#3b82f6' }}
                    />
                    <span>{cat.name}</span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/5 dark:bg-white/10">
                      {count}
                    </span>
                  </button>

                  <div className="flex items-center pr-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="p-1 hover:text-blue-500 rounded-lg cursor-pointer"
                      title="แก้ไขหมวดหมู่"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 hover:text-rose-500 rounded-lg cursor-pointer"
                      title="ลบหมวดหมู่"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า, รหัส SKU, บาร์โค้ด หรือหน่วยนับ..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Stock Filter */}
          <div className="sm:col-span-3">
            <select
              value={stockFilter}
              onChange={(e: any) => setStockFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">📦 สต็อกทั้งหมด</option>
              <option value="in_stock">✅ มีสินค้าพร้อมส่ง (&gt;0)</option>
              <option value="low_stock">⚠️ สินค้าใกล้หมด (≤ จุดเตือน)</option>
              <option value="out_of_stock">❌ สินค้าหมด (0)</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">🏷️ ทุกประเภทไอเทม</option>
              <option value="product">📦 สินค้าสำเร็จรูป (Product)</option>
              <option value="equipment">⚙️ อุปกรณ์และอะไหล่ (Equipment)</option>
              <option value="service">🛠️ งานบริการ/ค่าแรง (Service)</option>
              <option value="raw_material">🧱 วัตถุดิบ (Raw Material)</option>
            </select>
          </div>
        </div>

        {/* Product List Table / Cards */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
            <Package size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">ไม่พบรายการสินค้าที่ตรงกับเงื่อนไข</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มสินค้าใหม่" เพื่อเริ่มต้นบันทึกรายการสินค้า
            </p>
            <button
              onClick={() => handleOpenProductModal()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>เพิ่มสินค้าใหม่ตอนนี้</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">ชื่อสินค้า / รหัส SKU</th>
                  <th className="py-3 px-3">หมวดหมู่</th>
                  <th className="py-3 px-3 text-right">ราคาขาย</th>
                  <th className="py-3 px-3 text-right">ราคาทุน</th>
                  <th className="py-3 px-3 text-center">คงเหลือ</th>
                  <th className="py-3 px-3 text-center">สถานะ</th>
                  <th className="py-3 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredProducts.map((prod) => {
                  const stock = prod.inStock || 0;
                  const minStock = prod.minStock || 5;
                  const isLow = stock > 0 && stock <= minStock;
                  const isOut = stock <= 0;
                  const profit = (prod.price || 0) - (prod.cost || 0);

                  return (
                    <tr 
                      key={`${prod.categoryId}_${prod.id}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{prod.name}</span>
                          {prod.itemType && prod.itemType !== 'product' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {prod.itemType === 'equipment' ? 'อุปกรณ์' : prod.itemType === 'service' ? 'บริการ' : 'วัตถุดิบ'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          {prod.sku && <span className="font-mono font-bold text-slate-500 dark:text-slate-400">SKU: {prod.sku}</span>}
                          {prod.barcode && <span>| บาร์โค้ด: {prod.barcode}</span>}
                          {prod.description && <span className="truncate max-w-xs">({prod.description})</span>}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                          style={{
                            borderColor: `${prod.categoryColor}40`,
                            backgroundColor: `${prod.categoryColor}15`,
                            color: prod.categoryColor
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: prod.categoryColor }} />
                          {prod.categoryName}
                        </span>
                      </td>

                      {/* Sale Price */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          ฿{(prod.price || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">/{prod.unit}</span>
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="font-bold text-slate-500 dark:text-slate-400">
                          ฿{(prod.cost || 0).toLocaleString()}
                        </span>
                        {prod.cost ? (
                          <span className="text-[10px] text-emerald-500 block font-bold">
                            +฿{profit.toLocaleString()}
                          </span>
                        ) : null}
                      </td>

                      {/* Stock Level & Quick Adjust */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleQuickStockAdjust(prod.categoryId, prod, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center font-black cursor-pointer transition-all"
                            title="ลดจำนวน 1"
                          >
                            <Minus size={11} />
                          </button>
                          
                          <span className={`font-black text-sm px-2 py-0.5 rounded-lg min-w-[3rem] text-center ${
                            isOut 
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' 
                              : isLow 
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' 
                                : 'text-slate-900 dark:text-white'
                          }`}>
                            {stock}
                          </span>

                          <button
                            onClick={() => handleQuickStockAdjust(prod.categoryId, prod, 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center font-black cursor-pointer transition-all"
                            title="เพิ่มจำนวน 1"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            หมดสต็อก
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            ใกล้หมด (≤{minStock})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            พร้อมขาย
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDuplicateProduct(prod.categoryId, prod)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="คัดลอกสินค้านี้"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenProductModal({ categoryId: prod.categoryId, item: prod })}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลสินค้า"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.categoryId, prod.id, prod.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="ลบสินค้า"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Modal (Add / Edit) */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingCategory ? 'แก้ไขหมวดหมู่สินค้า' : 'เพิ่มหมวดหมู่สินค้าใหม่'}
                </h3>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อหมวดหมู่ *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="เช่น แผงโซล่าเซลล์, อินเวอร์เตอร์..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    คำอธิบาย / รายละเอียด
                  </label>
                  <textarea
                    rows={2}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="รายละเอียดเกี่ยวกับสินค้าในหมวดหมู่นี้..."
                    className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                    สีประจำหมวดหมู่ (Tag Color)
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#64748b'].map(color => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setCategoryForm({ ...categoryForm, color })}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          categoryForm.color === color ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {categoryForm.color === color && <Check size={14} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {editingCategory ? 'บันทึกการแก้ไข' : 'สร้างหมวดหมู่'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal (Add / Edit) */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่ลงแคตตาล็อก'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">กรอกรายละเอียดราคา สต็อก และข้อมูลสำหรับออกใบเสนอราคา</p>
                </div>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-3.5">
                {/* Category & Item Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      หมวดหมู่สินค้า *
                    </label>
                    <select
                      value={targetProductCategoryId}
                      onChange={(e) => setTargetProductCategoryId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      ประเภทรายการ
                    </label>
                    <select
                      value={productForm.itemType || 'product'}
                      onChange={(e: any) => setProductForm({ ...productForm, itemType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="product">📦 สินค้าสำเร็จรูป</option>
                      <option value="equipment">⚙️ อุปกรณ์/อะไหล่</option>
                      <option value="service">🛠️ งานบริการ/ค่าติดตั้ง</option>
                      <option value="raw_material">🧱 วัตถุดิบประกอบ</option>
                    </select>
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อสินค้า / โมเดล *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="เช่น SOLAR PANEL MONO 550W N-TYPE"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* SKU & Barcode */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      รหัสสินค้า (SKU)
                    </label>
                    <input
                      type="text"
                      value={productForm.sku || ''}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      placeholder="เช่น PNL-550-N"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      บาร์โค้ด (Barcode)
                    </label>
                    <input
                      type="text"
                      value={productForm.barcode || ''}
                      onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                      placeholder="เช่น 8851234567890"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Price, Cost, Unit */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      ราคาขาย (บาท) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      ราคาทุน (บาท)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={productForm.cost || 0}
                      onChange={(e) => setProductForm({ ...productForm, cost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      หน่วยนับ
                    </label>
                    <input
                      type="text"
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      placeholder="เช่น แผง, เครื่อง, ชุด..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Stock & Min Alert Stock */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      จำนวนสต็อกปัจจุบัน
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.inStock || 0}
                      onChange={(e) => setProductForm({ ...productForm, inStock: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      จุดเตือนสต็อกขั้นต่ำ
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.minStock || 5}
                      onChange={(e) => setProductForm({ ...productForm, minStock: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    คำอธิบายเพิ่มเติม / คุณสมบัติ
                  </label>
                  <textarea
                    rows={2}
                    value={productForm.description || ''}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="เช่น รองรับไฟสูงสุด 1000V, ประกันศูนย์ 5 ปี..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {editingProduct ? 'บันทึกการแก้ไข' : 'บันทึกสินค้าใหม่'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ProductInventoryManager;
