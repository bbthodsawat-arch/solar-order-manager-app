import React, { useState } from 'react';
import { 
  Package, Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronUp, 
  Link as LinkIcon, Copy, Sparkles, Search, RotateCcw, LayoutGrid, 
  Table as TableIcon, Tag, CheckCircle2, DollarSign, Layers
} from 'lucide-react';
import { StandardProductSet, StandardProductSetItem, ConfigItem } from '../types';
import { toast } from 'react-hot-toast';
import { notifyReaction } from '../utils/feedback';

interface ProductCatalogManagerProps {
  standardSets: StandardProductSet[];
  onUpdateSets: (sets: StandardProductSet[]) => void;
  incomeCategories: ConfigItem[];
  onGenerateFromSubcategories?: () => Promise<number>;
  onResetToDefaultCatalog?: () => Promise<void>;
}

export const ProductCatalogManager: React.FC<ProductCatalogManagerProps> = ({ 
  standardSets = [], 
  onUpdateSets,
  incomeCategories = [],
  onGenerateFromSubcategories,
  onResetToDefaultCatalog
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tempSet, setTempSet] = useState<StandardProductSet | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Flatten all subcategories to show in the link dropdown
  const allSubcategories = incomeCategories.flatMap(cat => 
    (cat.subcategories || []).map(sub => ({
      ...sub,
      parentId: cat.id,
      parentName: cat.name
    }))
  );

  // Filter and group sets
  const filteredSets = standardSets.filter(set => {
    const matchesSearch = set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.items?.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeTab === 'all') return matchesSearch;
    
    // Find the category this set belongs to
    const sub = allSubcategories.find(s => s.id === set.linkedSubcategoryId);
    return matchesSearch && sub?.parentId === activeTab;
  });

  // Calculate stats
  const totalCatalogValue = standardSets.reduce((sum, s) => sum + (s.price || 0), 0);
  const totalItemsCount = standardSets.reduce((sum, s) => sum + (s.items?.length || 0), 0);
  const linkedSetsCount = standardSets.filter(s => Boolean(s.linkedSubcategoryId)).length;

  // Include unsaved tempSet in the display list
  const displayFilteredSets = [...filteredSets];
  if (tempSet && !standardSets.some(s => s.id === tempSet.id)) {
    displayFilteredSets.unshift(tempSet);
  }

  const handleAddSet = () => {
    const newSet: StandardProductSet = {
      id: `set_${Date.now()}`,
      name: 'ชุดสินค้าใหม่',
      price: 0,
      items: [],
      linkedSubcategoryId: activeTab !== 'all' ? allSubcategories.find(s => s.parentId === activeTab)?.id : undefined
    };
    setEditingId(newSet.id);
    setTempSet(newSet);
    setExpandedId(newSet.id);
    notifyReaction('info', 'สร้างชุดสินค้าใหม่ พร้อมสำหรับการแก้ไขแล้ว');
  };

  const handleDuplicateSet = (set: StandardProductSet) => {
    const newSet: StandardProductSet = {
      ...JSON.parse(JSON.stringify(set)),
      id: `set_${Date.now()}`,
      name: `${set.name} (สำเนา)`,
      linkedSubcategoryId: undefined
    };
    setExpandedId(newSet.id);
    setEditingId(newSet.id);
    setTempSet(newSet);
    notifyReaction('success', `คัดลอกชุดสินค้า "${set.name}" สำเร็จ`);
  };

  const handleEditSet = (set: StandardProductSet) => {
    setEditingId(set.id);
    setTempSet(JSON.parse(JSON.stringify(set)));
    notifyReaction('info', `เปิดแก้ไข "${set.name}"`);
  };

  const handleSaveEdit = () => {
    if (tempSet) {
      if (!tempSet.name.trim()) {
        notifyReaction('warning', 'กรุณาระบุชื่อชุดสินค้า');
        return;
      }
      
      const exists = standardSets.some(s => s.id === tempSet.id);
      if (exists) {
        onUpdateSets(standardSets.map(s => s.id === tempSet.id ? tempSet : s));
      } else {
        onUpdateSets([tempSet, ...standardSets]);
      }
      
      setEditingId(null);
      setTempSet(null);
      notifyReaction('success', 'บันทึกข้อมูลชุดสินค้าเรียบร้อยแล้ว');
    }
  };

  const handleDeleteSet = (id: string, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบชุดสินค้า "${name}"?`)) {
      onUpdateSets(standardSets.filter(s => s.id !== id));
      notifyReaction('delete', `ลบชุดสินค้า "${name}" เรียบร้อยแล้ว`);
    }
  };

  const handleAddItem = () => {
    if (tempSet) {
      const newItem: StandardProductSetItem = {
        id: `item_${Date.now()}`,
        name: '',
        quantity: '1'
      };
      setTempSet({
        ...tempSet,
        items: [...tempSet.items, newItem]
      });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (tempSet) {
      setTempSet({
        ...tempSet,
        items: tempSet.items.filter(i => i.id !== itemId)
      });
    }
  };

  const handleDuplicateItem = (item: StandardProductSetItem) => {
    if (tempSet) {
      const newItem: StandardProductSetItem = {
        ...item,
        id: `item_${Date.now()}`,
      };
      const itemIndex = tempSet.items.findIndex(i => i.id === item.id);
      const newItems = [...tempSet.items];
      newItems.splice(itemIndex + 1, 0, newItem);
      setTempSet({
        ...tempSet,
        items: newItems
      });
    }
  };

  const handleAutoGenerate = async () => {
    if (!onGenerateFromSubcategories) return;
    
    setIsGenerating(true);
    try {
      const count = await onGenerateFromSubcategories();
      if (count > 0) {
        toast.success(`สร้างเทมเพลตใหม่สำเร็จ ${count} รายการ`);
      } else {
        toast.error('หมวดหมู่ทั้งหมดมีเทมเพลตอยู่แล้ว');
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการสร้างเทมเพลต');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateItem = (itemId: string, field: keyof StandardProductSetItem, value: string) => {
    if (tempSet) {
      setTempSet({
        ...tempSet,
        items: tempSet.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
      });
    }
  };

  const handleResetToDefault = async () => {
    if (!onResetToDefaultCatalog) return;
    if (confirm('คุณต้องการรีเซ็ตคลังสินค้าและหมวดหมู่กลับเป็น "ข้อมูลมาตรฐานโซล่าเซลล์ครบชุด" หรือไม่?')) {
      setIsResetting(true);
      try {
        await onResetToDefaultCatalog();
        toast.success('รีเซ็ตและโหลดคลังชุดสินค้ามาตรฐานโซล่าเซลล์เรียบร้อยแล้ว!');
      } catch (err) {
        toast.error('เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in transition-all">
      
      {/* Header & Main Stats */}
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Package size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">คลังชุดสินค้ามาตรฐานโซล่าเซลล์</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {standardSets.length} ชุด
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                จัดการเทมเพลตชุดอุปกรณ์สำเร็จรูป ราคาขาย และจับคู่กับหมวดหมู่งานติดตั้ง
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onResetToDefaultCatalog && (
              <button
                onClick={handleResetToDefault}
                disabled={isResetting}
                className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-2xl text-xs font-black transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800/80 disabled:opacity-50"
                title="รีเซ็ตและโหลดชุดสินค้ามาตรฐานโซล่าเซลล์ครบชุด"
              >
                <RotateCcw size={15} className={isResetting ? 'animate-spin' : ''} />
                <span>โหลดชุดมาตรฐาน</span>
              </button>
            )}

            {onGenerateFromSubcategories && (
              <button
                onClick={handleAutoGenerate}
                disabled={isGenerating}
                className="flex items-center space-x-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-300 rounded-2xl text-xs font-black transition-all cursor-pointer border border-amber-200 dark:border-amber-800/80 disabled:opacity-50"
                title="ดึงหมวดหมู่ย่อยมาสร้างเป็นเทมเพลตสินค้าอัตโนมัติ"
              >
                <Sparkles size={15} className={isGenerating ? 'animate-pulse' : ''} />
                <span>ซิงค์จากหมวดหมู่ย่อย</span>
              </button>
            )}

            <button
              onClick={handleAddSet}
              className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-indigo-500/20 active:scale-98 cursor-pointer"
            >
              <Plus size={16} />
              <span>เพิ่มชุดสินค้าใหม่</span>
            </button>
          </div>
        </div>

        {/* Catalog Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">มูลค่ารวมชุดสินค้า</span>
              <p className="text-lg font-black text-slate-900 dark:text-white">฿{totalCatalogValue.toLocaleString()}</p>
            </div>
            <div className="p-2.5 bg-indigo-500 text-white rounded-xl shadow-md">
              <DollarSign size={18} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">รายการอุปกรณ์ย่อยรวม</span>
              <p className="text-lg font-black text-slate-900 dark:text-white">{totalItemsCount} รายการ</p>
            </div>
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md">
              <Layers size={18} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">ผูกหมวดหมู่สำเร็จ</span>
              <p className="text-lg font-black text-slate-900 dark:text-white">{linkedSetsCount} / {standardSets.length} ชุด</p>
            </div>
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
              <LinkIcon size={18} />
            </div>
          </div>
        </div>

        {/* Search, Filter Tabs & View Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="ค้นหาชื่อชุดสินค้า หรืออุปกรณ์ย่อย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white rounded-2xl pl-11 pr-8 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Categories & View Mode Switcher */}
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  activeTab === 'all' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ทั้งหมด ({standardSets.length})
              </button>
              {incomeCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === cat.id 
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="การ์ดตาราง (Grid View)"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="รายการกะทัดรัด (Table View)"
              >
                <TableIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Display List */}
      <div className="space-y-4">
        {displayFilteredSets.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <Package size={44} className="mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-black text-slate-400">ไม่พบชุดสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                ล้างคำค้นหาทั้งหมด
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
            {displayFilteredSets.map((set, idx) => {
              const isEditing = editingId === set.id;
              const isExpanded = expandedId === set.id;
              const displaySet = isEditing ? tempSet! : set;
              const sub = allSubcategories.find(s => s.id === set.linkedSubcategoryId);

              return (
                <div 
                  key={set.id}
                  className={`group border rounded-3xl overflow-hidden transition-all duration-200 ${
                    isEditing 
                      ? 'border-indigo-500 dark:border-indigo-500 ring-4 ring-indigo-500/10 bg-white dark:bg-slate-900 shadow-lg' 
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800/80 bg-white dark:bg-slate-900'
                  }`}
                >
                  {/* Card Header */}
                  <div 
                    className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer select-none"
                    onClick={() => !isEditing && setExpandedId(isExpanded ? null : set.id)}
                  >
                    <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                        isEditing 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50'
                      }`}>
                        #{idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            type="text"
                            value={displaySet.name}
                            onChange={(e) => setTempSet({ ...tempSet!, name: e.target.value })}
                            className="bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-xs font-black px-3 py-2 rounded-xl w-full outline-none focus:ring-2 focus:ring-indigo-500"
                            onClick={(e) => e.stopPropagation()}
                            placeholder="ชื่อชุดสินค้า (เช่น ชุด 5000W HYBRID)"
                          />
                        ) : (
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{set.name}</h4>
                              {sub && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 text-[9px] font-black rounded-lg border border-emerald-200 dark:border-emerald-800">
                                  {sub.parentName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-xs">
                              <span className="font-black text-indigo-600 dark:text-indigo-400 text-base">
                                ฿{(set.price || 0).toLocaleString()}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                • {set.items?.length || 0} รายการอุปกรณ์
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <>
                          <button 
                            onClick={handleSaveEdit} 
                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl transition-colors cursor-pointer" 
                            title="บันทึกข้อมูล"
                          >
                            <Save size={18} />
                          </button>
                          <button 
                            onClick={() => { setEditingId(null); setTempSet(null); }} 
                            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer" 
                            title="ยกเลิก"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleDuplicateSet(set)} 
                            className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors cursor-pointer" 
                            title="คัดลอกชุดนี้"
                          >
                            <Copy size={16} />
                          </button>
                          <button 
                            onClick={() => handleEditSet(set)} 
                            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors cursor-pointer" 
                            title="แก้ไขรายละเอียด"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSet(set.id, set.name)} 
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer" 
                            title="ลบชุดนี้"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button 
                            onClick={() => setExpandedId(isExpanded ? null : set.id)} 
                            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Body Details */}
                  {(isExpanded || isEditing) && (
                    <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-4">
                      {/* Price & Link */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            ราคาขายมาตรฐาน (Price)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">฿</span>
                            <input
                              type="number"
                              disabled={!isEditing}
                              value={displaySet.price}
                              onChange={(e) => setTempSet({ ...tempSet!, price: Number(e.target.value) })}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black pl-8 pr-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-80 disabled:bg-transparent"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            ผูกกับหมวดหมู่รอง
                          </label>
                          <div className="relative">
                            <select
                              disabled={!isEditing}
                              value={displaySet.linkedSubcategoryId || ''}
                              onChange={(e) => setTempSet({ ...tempSet!, linkedSubcategoryId: e.target.value })}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-80 disabled:bg-transparent"
                            >
                              <option value="">-- ไม่ระบุผูกหมวดหมู่ --</option>
                              {allSubcategories.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.parentName} » {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Sub-items Table */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            รายการอุปกรณ์ย่อย ({displaySet.items?.length || 0})
                          </span>
                          {isEditing && (
                            <button
                              onClick={handleAddItem}
                              className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center space-x-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>เพิ่มอุปกรณ์</span>
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {displaySet.items?.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic text-center py-3 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                              ยังไม่มีรายการอุปกรณ์ในชุดนี้
                            </p>
                          ) : (
                            displaySet.items?.map((item, itemIdx) => (
                              <div key={item.id} className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                                <span className="text-[10px] font-black text-slate-400 w-5 text-center shrink-0">#{itemIdx + 1}</span>
                                <input
                                  disabled={!isEditing}
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                  placeholder="ชื่ออุปกรณ์..."
                                  className="flex-1 bg-transparent font-bold outline-none text-slate-900 dark:text-white disabled:opacity-90"
                                />
                                <input
                                  disabled={!isEditing}
                                  type="text"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                                  placeholder="จำนวน..."
                                  className="w-24 text-center font-bold bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 outline-none disabled:bg-transparent"
                                />
                                {isEditing && (
                                  <div className="flex items-center space-x-1 shrink-0">
                                    <button
                                      onClick={() => handleDuplicateItem(item)}
                                      className="p-1 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg cursor-pointer"
                                      title="คัดลอกอุปกรณ์นี้"
                                    >
                                      <Copy size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveItem(item.id)}
                                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg cursor-pointer"
                                      title="ลบอุปกรณ์นี้"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
