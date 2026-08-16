import React, { useState, FormEvent, useRef } from 'react';
import { useAppConfig } from '../hooks/useAppConfig';
import { useAuth } from '../hooks/useAuth';
import { AppConfig, ConfigItem, ProductCategory } from '../types';
import { 
  Tag, Plus, Edit3, Trash2, Check, X, 
  CreditCard, CheckCircle2, ListFilter,
  Eye, EyeOff, ChevronRight, ChevronDown,
  Layers, Copy, Package, Search, QrCode,
  Building2, Hash, Sparkles, AlertCircle, ArrowUp, ArrowDown,
  Info, UploadCloud, DownloadCloud, FileUp, FileDown, Database, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function ConfigManager() {
  const {
    config,
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
    convertSubToStandardSet,
    addSystemTag,
    deleteSystemTag,
    addCategoryTab,
    renameCategoryTab,
    deleteCategoryTab,
    duplicateCategoryTab,
    saveConfig,
    loading
  } = useAppConfig();

  const { user, appUser } = useAuth();
  const isAdmin = user?.email?.toLowerCase() === 'b.b.thodsawat@gmail.com' || appUser?.role === 'admin' || appUser?.role === 'owner';

  const [activeTab, setActiveTab] = useState<'incomeCategories' | 'expenseCategories' | 'paymentMethods' | 'paymentStatuses' | 'systemTags'>('incomeCategories');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Simple Add Input for Top bar
  const [quickAddName, setQuickAddName] = useState('');

  // Detailed Modal Add/Edit
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
  const [detailForm, setDetailForm] = useState<{
    name: string;
    description: string;
    code: string;
    bankName: string;
    accountNo: string;
    accountName: string;
    promptPayId: string;
    badgeStyle: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
    isDefault: boolean;
  }>({
    name: '',
    description: '',
    code: '',
    bankName: '',
    accountNo: '',
    accountName: '',
    promptPayId: '',
    badgeStyle: 'info',
    isDefault: false
  });

  // Subcategory Input
  const [newSubName, setNewSubName] = useState<{ [parentId: string]: string }>({});
  const [editingSubId, setEditingSubId] = useState<{ parentId: string; subId: string } | null>(null);
  const [editSubValue, setEditSubValue] = useState('');

  // Tag Input
  const [newTagInput, setNewTagInput] = useState('');

  // Bulk Import/Export Administrative states
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [exportSelectedTypes, setExportSelectedTypes] = useState({
    income: true,
    expense: true,
    product: true,
    payment: true,
    tags: true
  });
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [importStrategy, setImportStrategy] = useState<'merge' | 'overwrite'>('merge');
  const [parsedImportData, setParsedImportData] = useState<any>(null);
  const [importPreview, setImportPreview] = useState<{
    incomeCount: number;
    expenseCount: number;
    productCount: number;
    paymentCount: number;
    tagsCount: number;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const customTabs = (config.customCategoryTabs || []).map(tab => ({
    id: tab.id,
    label: tab.name,
    icon: Layers,
    color: 'indigo' as const,
    count: tab.items.length
  }));

  const tabs = [
    { id: 'incomeCategories', label: 'หมวดหมู่รายรับ', icon: Tag, color: 'emerald', count: config.incomeCategories?.length || 0 },
    { id: 'expenseCategories', label: 'หมวดหมู่รายจ่าย', icon: Tag, color: 'rose', count: config.expenseCategories?.length || 0 },
    ...customTabs,
    { id: 'paymentMethods', label: 'รูปแบบการชำระเงิน', icon: CreditCard, color: 'blue', count: config.paymentMethods?.length || 0 },
    { id: 'paymentStatuses', label: 'สถานะการชำระเงิน', icon: CheckCircle2, color: 'amber', count: config.paymentStatuses?.length || 0 },
    { id: 'systemTags', label: 'แท็กระบบ / ป้ายกำกับ', icon: Sparkles, color: 'purple', count: config.systemTags?.length || 0 },
  ] as const;

  // Filter items
  const rawItems = (config[activeTab as keyof AppConfig] as ConfigItem[]) || [];
  const filteredItems = rawItems.filter(item => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = (item.name || '').toLowerCase().includes(term);
    const descMatch = (item.description || '').toLowerCase().includes(term);
    const codeMatch = (item.code || '').toLowerCase().includes(term);
    const bankMatch = (item.bankName || '').toLowerCase().includes(term);
    const subMatch = item.subcategories?.some(s => (s.name || '').toLowerCase().includes(term));
    return nameMatch || descMatch || codeMatch || bankMatch || subMatch;
  });

  // Filter system tags
  const filteredTags = (config.systemTags || []).filter(tag => {
    if (!searchTerm.trim()) return true;
    return tag.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Quick Add
  const handleQuickAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!quickAddName.trim()) return toast.error('กรุณากรอกชื่อ');

    setSubmitting(true);
    try {
      if (activeTab === 'systemTags') {
        await addSystemTag(quickAddName.trim());
        toast.success('เพิ่มแท็กใหม่เรียบร้อยแล้ว');
      } else {
        const type = activeTab === 'incomeCategories' ? 'income' : activeTab === 'expenseCategories' ? 'expense' : undefined;
        await addItem(activeTab, quickAddName.trim(), type);
        toast.success('เพิ่มรายการเรียบร้อยแล้ว');
      }
      setQuickAddName('');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Detailed Modal
  const handleOpenDetailModal = (item?: ConfigItem) => {
    if (item) {
      setEditingItem(item);
      setDetailForm({
        name: item.name,
        description: item.description || '',
        code: item.code || '',
        bankName: item.bankName || '',
        accountNo: item.accountNo || '',
        accountName: item.accountName || '',
        promptPayId: item.promptPayId || '',
        badgeStyle: item.badgeStyle || 'info',
        isDefault: Boolean(item.isDefault)
      });
    } else {
      setEditingItem(null);
      setDetailForm({
        name: '',
        description: '',
        code: '',
        bankName: config.shopInfo?.bankName || '',
        accountNo: config.shopInfo?.bankAccountNo || '',
        accountName: config.shopInfo?.bankAccountName || '',
        promptPayId: config.shopInfo?.promptPayId || '',
        badgeStyle: 'info',
        isDefault: false
      });
    }
    setIsDetailModalOpen(true);
  };

  const handleSaveDetailModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailForm.name.trim()) {
      toast.error('กรุณาระบุชื่อรายการ');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await updateItem(activeTab as any, editingItem.id, {
          name: detailForm.name.trim(),
          description: detailForm.description.trim() || undefined,
          code: detailForm.code.trim() || undefined,
          bankName: detailForm.bankName.trim() || undefined,
          accountNo: detailForm.accountNo.trim() || undefined,
          accountName: detailForm.accountName.trim() || undefined,
          promptPayId: detailForm.promptPayId.trim() || undefined,
          badgeStyle: detailForm.badgeStyle,
          isDefault: detailForm.isDefault
        });
        toast.success('อัปเดตข้อมูลเรียบร้อยแล้ว');
      } else {
        const itemType = activeTab === 'incomeCategories' ? 'income' : activeTab === 'expenseCategories' ? 'expense' : undefined;
        await addItem(activeTab as any, detailForm.name.trim(), itemType, {
          description: detailForm.description.trim() || undefined,
          code: detailForm.code.trim() || undefined,
          bankName: detailForm.bankName.trim() || undefined,
          accountNo: detailForm.accountNo.trim() || undefined,
          accountName: detailForm.accountName.trim() || undefined,
          promptPayId: detailForm.promptPayId.trim() || undefined,
          badgeStyle: detailForm.badgeStyle,
          isDefault: detailForm.isDefault
        });
        toast.success('เพิ่มรายการใหม่เรียบร้อยแล้ว');
      }
      setIsDetailModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  // Subcategory Actions
  const handleAddSub = async (parentId: string) => {
    const name = newSubName[parentId];
    if (!name || !name.trim()) return toast.error('กรุณากรอกชื่อหมวดหมู่ย่อย');

    setSubmitting(true);
    try {
      await addSubItem(activeTab as any, parentId, name.trim());
      toast.success('เพิ่มหมวดหมู่ย่อยเรียบร้อยแล้ว');
      setNewSubName(prev => ({ ...prev, [parentId]: '' }));
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSub = async (parentId: string, subId: string) => {
    if (!editSubValue.trim()) return toast.error('ชื่อต้องไม่เป็นค่าว่าง');
    
    setSubmitting(true);
    try {
      await updateSubItem(activeTab as any, parentId, subId, { name: editSubValue.trim() });
      toast.success('อัปเดตเรียบร้อยแล้ว');
      setEditingSubId(null);
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSub = async (parentId: string, subId: string, name: string) => {
    if (confirm(`คุณต้องการลบหมวดหมู่ย่อย "${name}" หรือไม่?`)) {
      setSubmitting(true);
      try {
        await deleteSubItem(activeTab as any, parentId, subId);
        toast.success('ลบหมวดหมู่ย่อยเรียบร้อยแล้ว');
      } catch (err: any) {
        toast.error(err.message || 'เกิดข้อผิดพลาด');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (confirm(`คุณต้องการลบ "${name}" หรือไม่?`)) {
      setSubmitting(true);
      try {
        await deleteItem(activeTab as any, id);
        toast.success('ลบรายการเรียบร้อยแล้ว');
      } catch (err: any) {
        toast.error(err.message || 'เกิดข้อผิดพลาด');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDuplicate = async (id: string) => {
    setSubmitting(true);
    try {
      await duplicateItem(activeTab as any, id);
      toast.success('คัดลอกรายการเรียบร้อยแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertToSet = async (subId: string, name: string) => {
    setSubmitting(true);
    try {
      await convertSubToStandardSet(subId, name);
      toast.success(`สร้างชุดสินค้ามาตรฐานสำหรับ "${name}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // ADMINISTRATIVE CATEGORY BULK IMPORT / EXPORT OPERATIONS
  // -------------------------------------------------------------
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportData = () => {
    try {
      const exportObj: any = {
        type: 'solar_shop_categories_export',
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      if (exportSelectedTypes.income) exportObj.incomeCategories = config.incomeCategories || [];
      if (exportSelectedTypes.expense) exportObj.expenseCategories = config.expenseCategories || [];
      if (exportSelectedTypes.product) exportObj.productCategories = config.productCategories || [];
      if (exportSelectedTypes.payment) exportObj.paymentMethods = config.paymentMethods || [];
      if (exportSelectedTypes.tags) exportObj.systemTags = config.systemTags || [];

      if (exportFormat === 'json') {
        const jsonStr = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        downloadBlob(blob, `solar_shop_categories_${new Date().toISOString().split('T')[0]}.json`);
        toast.success('ส่งออกหมวดหมู่เป็น JSON สำเร็จ!');
      } else {
        // CSV Export
        const csvRows: string[] = [];
        csvRows.push('Type,ParentCategoryName,ItemName,DescriptionOrSku,PriceOrAccountNo,CostOrAccountName,UnitOrPromptPay,StockOrIsActive');

        const esc = (val: any) => {
          if (val === undefined || val === null) return '';
          let str = String(val).replace(/"/g, '""');
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            str = `"${str}"`;
          }
          return str;
        };

        // Income Categories
        if (exportSelectedTypes.income && config.incomeCategories) {
          config.incomeCategories.forEach(cat => {
            csvRows.push(`income_category,,${esc(cat.name)},${esc(cat.description || '')},,,,${cat.isActive ? 'true' : 'false'}`);
            if (cat.subcategories) {
              cat.subcategories.forEach(sub => {
                csvRows.push(`income_subcategory,${esc(cat.name)},${esc(sub.name)},,,,${sub.isActive ? 'true' : 'false'}`);
              });
            }
          });
        }

        // Expense Categories
        if (exportSelectedTypes.expense && config.expenseCategories) {
          config.expenseCategories.forEach(cat => {
            csvRows.push(`expense_category,,${esc(cat.name)},${esc(cat.description || '')},,,,${cat.isActive ? 'true' : 'false'}`);
            if (cat.subcategories) {
              cat.subcategories.forEach(sub => {
                csvRows.push(`expense_subcategory,${esc(cat.name)},${esc(sub.name)},,,,${sub.isActive ? 'true' : 'false'}`);
              });
            }
          });
        }

        // Product Categories
        if (exportSelectedTypes.product && config.productCategories) {
          config.productCategories.forEach(cat => {
            csvRows.push(`product_category,,${esc(cat.name)},${esc(cat.description || '')},,,,${cat.isActive ? 'true' : 'false'}`);
            if (cat.items) {
              cat.items.forEach(item => {
                csvRows.push(`product_item,${esc(cat.name)},${esc(item.name)},${esc(item.sku || '')},${item.price || 0},${item.cost || 0},${esc(item.unit || '')},${item.inStock || 0}`);
              });
            }
          });
        }

        // Payment Methods
        if (exportSelectedTypes.payment && config.paymentMethods) {
          config.paymentMethods.forEach(method => {
            csvRows.push(`payment_method,${esc(method.bankName || '')},${esc(method.name)},${esc(method.accountNo || '')},${esc(method.promptPayId || '')},${esc(method.accountName || '')},,${method.isActive ? 'true' : 'false'}`);
          });
        }

        // System Tags
        if (exportSelectedTypes.tags && config.systemTags) {
          config.systemTags.forEach(tag => {
            csvRows.push(`system_tag,,${esc(tag)},,,,,,`);
          });
        }

        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `solar_shop_categories_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('ส่งออกหมวดหมู่เป็น CSV สำเร็จ!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('ไม่สามารถส่งออกข้อมูลได้: ' + err.message);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    const result: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cells: string[] = [];
      let inQuotes = false;
      let currentCell = '';
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim());
      
      const cleanedCells = cells.map(cell => {
        if (cell.startsWith('"') && cell.endsWith('"')) {
          return cell.slice(1, -1).replace(/""/g, '"');
        }
        return cell.replace(/""/g, '"');
      });
      
      if (cleanedCells.length > 0 && cleanedCells[0]) {
        result.push(cleanedCells);
      }
    }
    return result;
  };

  const convertCSVRowsToConfig = (rows: any[][]) => {
    const result: any = {
      incomeCategories: [],
      expenseCategories: [],
      productCategories: [],
      paymentMethods: [],
      systemTags: []
    };

    const incomeMap: { [name: string]: any } = {};
    const expenseMap: { [name: string]: any } = {};
    const productMap: { [name: string]: any } = {};

    rows.forEach(row => {
      const [
        type, 
        parentName, 
        itemName, 
        descOrSku, 
        priceOrAcc, 
        costOrAccName, 
        unitOrPp, 
        stockOrActive
      ] = row;

      if (!type) return;

      const isActive = stockOrActive === 'false' ? false : true;

      switch (type.toLowerCase()) {
        case 'income_category':
          if (!itemName) return;
          const incCat = {
            id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: itemName,
            description: descOrSku || undefined,
            isActive: isActive,
            type: 'income',
            subcategories: []
          };
          result.incomeCategories.push(incCat);
          incomeMap[itemName] = incCat;
          break;
          
        case 'income_subcategory':
          if (!itemName || !parentName) return;
          let targetIncCat = incomeMap[parentName];
          if (!targetIncCat) {
            targetIncCat = result.incomeCategories.find((c: any) => c.name === parentName);
            if (!targetIncCat) {
              targetIncCat = {
                id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: parentName,
                isActive: true,
                type: 'income',
                subcategories: []
              };
              result.incomeCategories.push(targetIncCat);
              incomeMap[parentName] = targetIncCat;
            }
          }
          targetIncCat.subcategories.push({
            id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: itemName,
            isActive: isActive
          });
          break;

        case 'expense_category':
          if (!itemName) return;
          const expCat = {
            id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: itemName,
            description: descOrSku || undefined,
            isActive: isActive,
            type: 'expense',
            subcategories: []
          };
          result.expenseCategories.push(expCat);
          expenseMap[itemName] = expCat;
          break;

        case 'expense_subcategory':
          if (!itemName || !parentName) return;
          let targetExpCat = expenseMap[parentName];
          if (!targetExpCat) {
            targetExpCat = result.expenseCategories.find((c: any) => c.name === parentName);
            if (!targetExpCat) {
              targetExpCat = {
                id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: parentName,
                isActive: true,
                type: 'expense',
                subcategories: []
              };
              result.expenseCategories.push(targetExpCat);
              expenseMap[parentName] = targetExpCat;
            }
          }
          targetExpCat.subcategories.push({
            id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: itemName,
            isActive: isActive
          });
          break;

        case 'product_category':
          if (!itemName) return;
          const prodCat = {
            id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: itemName,
            description: descOrSku || undefined,
            isActive: isActive,
            items: []
          };
          result.productCategories.push(prodCat);
          productMap[itemName] = prodCat;
          break;

        case 'product_item':
          if (!itemName || !parentName) return;
          let targetProdCat = productMap[parentName];
          if (!targetProdCat) {
            targetProdCat = result.productCategories.find((c: any) => c.name === parentName);
            if (!targetProdCat) {
              targetProdCat = {
                id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: parentName,
                isActive: true,
                items: []
              };
              result.productCategories.push(targetProdCat);
              productMap[parentName] = targetProdCat;
            }
          }
          targetProdCat.items.push({
            id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: itemName,
            sku: descOrSku || '',
            price: Number(priceOrAcc) || 0,
            cost: Number(costOrAccName) || 0,
            unit: unitOrPp || 'แผง',
            inStock: Number(stockOrActive) || 0,
            minStock: 2,
            isActive: true,
            itemType: 'product'
          });
          break;

        case 'payment_method':
          if (!itemName) return;
          result.paymentMethods.push({
            id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: itemName,
            bankName: parentName || '',
            accountNo: descOrSku || '',
            promptPayId: priceOrAcc || '',
            accountName: costOrAccName || '',
            isActive: isActive
          });
          break;

        case 'system_tag':
          if (!itemName) return;
          result.systemTags.push(itemName);
          break;

        default:
          break;
      }
    });

    return result;
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImportFile(file);
  };

  const processImportFile = async (file: File) => {
    setImportError(null);
    setParsedImportData(null);
    setImportPreview(null);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('ไฟล์ว่างเปล่า');
        
        let parsedData: any = {};
        
        if (file.name.endsWith('.json')) {
          const raw = JSON.parse(text);
          if (raw.type !== 'solar_shop_categories_export') {
            throw new Error('โครงสร้างไฟล์ JSON ไม่ถูกต้องสำหรับหมวดหมู่ระบบ');
          }
          parsedData = raw;
        } else if (file.name.endsWith('.csv')) {
          const rows = parseCSV(text);
          parsedData = convertCSVRowsToConfig(rows);
        } else {
          throw new Error('รองรับเฉพาะไฟล์ .json หรือ .csv เท่านั้น');
        }
        
        const preview = {
          incomeCount: parsedData.incomeCategories?.length || 0,
          expenseCount: parsedData.expenseCategories?.length || 0,
          productCount: parsedData.productCategories?.length || 0,
          paymentCount: parsedData.paymentMethods?.length || 0,
          tagsCount: parsedData.systemTags?.length || 0
        };
        
        if (preview.incomeCount === 0 && preview.expenseCount === 0 && preview.productCount === 0 && preview.paymentCount === 0 && preview.tagsCount === 0) {
          throw new Error('ไม่พบข้อมูลหมวดหมู่หรือรายการที่สมบูรณ์ในไฟล์นี้');
        }
        
        setParsedImportData(parsedData);
        setImportPreview(preview);
        toast.success('วิเคราะห์ไฟล์นำเข้าสำเร็จ! โปรดตรวจสอบตัวอย่างด้านล่าง');
      } catch (err: any) {
        console.error(err);
        setImportError(err.message || 'เกิดข้อผิดพลาดในการวิเคราะห์ไฟล์');
        toast.error('การวิเคราะห์ไฟล์ล้มเหลว');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!parsedImportData) return;
    
    setSubmitting(true);
    const loadingToast = toast.loading('กำลังนำเข้าและบันทึกข้อมูลแบบกลุ่ม...');
    
    try {
      const newConfig = { ...config };
      
      const keysToImport = [
        { key: 'incomeCategories', label: 'หมวดหมู่รายรับ' },
        { key: 'expenseCategories', label: 'หมวดหมู่รายจ่าย' },
        { key: 'productCategories', label: 'หมวดหมู่สินค้าในสต็อก' },
        { key: 'paymentMethods', label: 'รูปแบบการชำระเงิน' },
        { key: 'systemTags', label: 'แท็กระบบ' }
      ];
      
      keysToImport.forEach(({ key, label }) => {
        const importedItems = parsedImportData[key];
        if (!importedItems || importedItems.length === 0) return;
        
        if (importStrategy === 'overwrite') {
          newConfig[key as keyof AppConfig] = importedItems;
        } else {
          const currentItems = (config[key as keyof AppConfig] || []) as any[];
          
          if (key === 'systemTags') {
            const mergedTags = Array.from(new Set([...currentItems, ...importedItems]));
            newConfig.systemTags = mergedTags;
          } else {
            const mergedList = [...currentItems];
            importedItems.forEach((impItem: any) => {
              const duplicateIndex = mergedList.findIndex((cur: any) => cur.name?.toLowerCase() === impItem.name?.toLowerCase());
              if (duplicateIndex !== -1) {
                if (key === 'incomeCategories' || key === 'expenseCategories') {
                  const currentSubs = mergedList[duplicateIndex].subcategories || [];
                  const importedSubs = impItem.subcategories || [];
                  const mergedSubs = [...currentSubs];
                  importedSubs.forEach((sub: any) => {
                    if (!mergedSubs.some((s: any) => s.name?.toLowerCase() === sub.name?.toLowerCase())) {
                      mergedSubs.push(sub);
                    }
                  });
                  mergedList[duplicateIndex].subcategories = mergedSubs;
                } else if (key === 'productCategories') {
                  const currentItemsList = mergedList[duplicateIndex].items || [];
                  const importedItemsList = impItem.items || [];
                  const mergedItemsList = [...currentItemsList];
                  importedItemsList.forEach((it: any) => {
                    if (!mergedItemsList.some((existingIt: any) => existingIt.name?.toLowerCase() === it.name?.toLowerCase() || (existingIt.sku && existingIt.sku?.toLowerCase() === it.sku?.toLowerCase()))) {
                      mergedItemsList.push(it);
                    }
                  });
                  mergedList[duplicateIndex].items = mergedItemsList;
                } else {
                  mergedList[duplicateIndex] = { ...mergedList[duplicateIndex], ...impItem };
                }
              } else {
                mergedList.push(impItem);
              }
            });
            newConfig[key as keyof AppConfig] = mergedList as any;
          }
        }
      });
      
      await saveConfig(newConfig);
      
      setParsedImportData(null);
      setImportPreview(null);
      if (importFileRef.current) importFileRef.current.value = '';
      
      toast.success('นำเข้าข้อมูลแบบกลุ่มและซิงค์บัญชีผู้ใช้ทั้งหมดสำเร็จ!', { id: loadingToast });
    } catch (err: any) {
      console.error(err);
      toast.error('การนำเข้าล้มเหลว: ' + err.message, { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">กำลังโหลดการตั้งค่าระบบ...</div>;

  const isCategoryTab = activeTab === 'incomeCategories' || activeTab === 'expenseCategories';

  const badgeStyleClasses = {
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-200 dark:border-blue-800">
            <ListFilter size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">จัดการหมวดหมู่ รูปแบบชำระเงิน และแท็กระบบ</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">กำหนดตัวเลือกที่ใช้บันทึกบัญชี ออกใบเสร็จ POS และควบคุมทุกโมดูลในระบบ</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenDetailModal()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus size={16} />
          <span>เพิ่มรายการใหม่แบบละเอียด</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all border shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 shadow-md scale-[1.02]'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isActive
                  ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
        {/* Actions for Custom Tabs */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
           <button onClick={() => {
             const name = prompt('ชื่อแท็บใหม่:');
             if (name) addCategoryTab(name, 'income');
           }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-emerald-600 dark:text-emerald-400" title="เพิ่มแท็บหมวดหมู่">
             <Plus size={16} />
           </button>
           
           {activeTab.startsWith('tab_') && (
             <>
               <button onClick={() => {
                 const newName = prompt('เปลี่ยนชื่อเป็น:', tabs.find(t => t.id === activeTab)?.label);
                 if (newName) renameCategoryTab(activeTab, newName);
               }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-blue-600 dark:text-blue-400" title="เปลี่ยนชื่อแท็บ">
                 <Edit3 size={16} />
               </button>
               <button onClick={() => {
                 if (confirm('คุณต้องการทำสำเนาแท็บนี้หรือไม่?')) {
                   const newName = prompt('ชื่อแท็บใหม่:');
                   if (newName) duplicateCategoryTab(activeTab, newName);
                 }
               }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-purple-600 dark:text-purple-400" title="ทำสำเนาแท็บ">
                 <Copy size={16} />
               </button>
               <button onClick={() => {
                 if (confirm('คุณต้องการลบแท็บนี้หรือไม่? ข้อมูลภายในจะถูกลบทั้งหมด')) {
                   deleteCategoryTab(activeTab);
                   setActiveTab('incomeCategories');
                 }
               }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-rose-600 dark:text-rose-400" title="ลบแท็บ">
                 <Trash2 size={16} />
               </button>
             </>
           )}
        </div>
      </div>

      {/* Quick Add & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`ค้นหาใน ${tabs.find(t => t.id === activeTab)?.label}...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick Add Input */}
        <form onSubmit={handleQuickAdd} className="sm:col-span-7 flex gap-2">
          <input
            type="text"
            value={quickAddName}
            onChange={(e) => setQuickAddName(e.target.value)}
            placeholder={
              activeTab === 'incomeCategories' ? 'พิมพ์ชื่อหมวดหมู่รายรับด่วน เช่น งานติดตั้งโซล่าฟาร์ม...' :
              activeTab === 'expenseCategories' ? 'พิมพ์ชื่อหมวดหมู่รายจ่ายด่วน เช่น ค่าต่อใบอนุญาต...' :
              activeTab === 'paymentMethods' ? 'พิมพ์ชื่อวิธีชำระเงินด่วน เช่น สแกนบัตรเครดิต...' :
              activeTab === 'paymentStatuses' ? 'พิมพ์สถานะชำระเงินด่วน เช่น รอยืนยันสลิป...' :
              'พิมพ์แท็กใหม่ เช่น โปรโมชั่นหน้าฝน...'
            }
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-black shrink-0 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>เพิ่มด่วน</span>
          </button>
        </form>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'systemTags' ? (
        /* Tags View */
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider">
            <span>แท็กระบบสำหรับติดป้ายกำกับรายการขายและบิล ({filteredTags.length})</span>
          </div>

          <div className="flex flex-wrap gap-2.5 p-4 rounded-3xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
            {filteredTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm group"
              >
                <Tag size={12} className="text-purple-500" />
                <span>{tag}</span>
                <button
                  onClick={() => deleteSystemTag(tag)}
                  className="text-slate-400 hover:text-rose-500 rounded p-0.5 transition-colors cursor-pointer"
                  title="ลบแท็กนี้"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* Categories / Payment Methods / Statuses List */
        <div className="space-y-3 pt-2">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
              <ListFilter size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-bold text-slate-500">ไม่พบรายการที่ตรงกับการค้นหา</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedIds.includes(item.id);
              const subCount = item.subcategories?.length || 0;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all ${
                    item.isActive 
                      ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 shadow-sm' 
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {/* Item Row Header */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {isCategoryTab && (
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                          title={isExpanded ? 'ย่อหมวดหมู่ย่อย' : 'ขยายหมวดหมู่ย่อย'}
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {item.name}
                          </span>

                          {item.isDefault && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              ค่าเริ่มต้น
                            </span>
                          )}

                          {item.badgeStyle && (
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${badgeStyleClasses[item.badgeStyle]}`}>
                              {item.code || item.badgeStyle}
                            </span>
                          )}

                          {isCategoryTab && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                              {subCount} หมวดย่อย
                            </span>
                          )}
                        </div>

                        {/* Extra metadata description/bank */}
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                          {item.description && <span>{item.description}</span>}
                          {item.bankName && (
                            <span className="flex items-center gap-1 text-slate-500 font-bold">
                              <Building2 size={11} /> {item.bankName}
                            </span>
                          )}
                          {item.accountNo && (
                            <span className="font-mono text-slate-500 font-bold">
                              เลขที่: {item.accountNo}
                            </span>
                          )}
                          {item.promptPayId && (
                            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
                              <QrCode size={11} /> PromptPay: {item.promptPayId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {/* Active Switch */}
                      <button
                        onClick={() => toggleActive(activeTab as any, item.id)}
                        className={`p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          item.isActive 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                        title={item.isActive ? 'เปิดใช้งานอยู่ (กดเพื่อปิด)' : 'ปิดใช้งานอยู่ (กดเพื่อเปิด)'}
                      >
                        {item.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span className="text-[10px]">{item.isActive ? 'เปิด' : 'ปิด'}</span>
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(item.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="คัดลอกรายการนี้"
                      >
                        <Copy size={15} />
                      </button>

                      {/* Edit Details */}
                      <button
                        onClick={() => handleOpenDetailModal(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="แก้ไขรายละเอียด"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="ลบรายการ"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Expansion Block */}
                  {isCategoryTab && isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-3 rounded-b-2xl">
                      {/* Subcategories List */}
                      <div className="space-y-2">
                        {(item.subcategories || []).map((sub) => {
                          const isEditingThisSub = editingSubId?.parentId === item.id && editingSubId?.subId === sub.id;

                          return (
                            <div
                              key={sub.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                                sub.isActive 
                                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs' 
                                  : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50 opacity-60'
                              }`}
                            >
                              {isEditingThisSub ? (
                                <div className="flex items-center gap-2 flex-1 mr-2">
                                  <input
                                    type="text"
                                    value={editSubValue}
                                    onChange={(e) => setEditSubValue(e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleUpdateSub(item.id, sub.id)}
                                    className="p-1.5 bg-emerald-600 text-white rounded-lg cursor-pointer"
                                    title="บันทึก"
                                  >
                                    <Check size={13} />
                                  </button>
                                  <button
                                    onClick={() => setEditingSubId(null)}
                                    className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer"
                                    title="ยกเลิก"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {sub.name}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center gap-1 shrink-0">
                                {/* Convert to Standard Set */}
                                {activeTab === 'incomeCategories' && (
                                  <button
                                    onClick={() => handleConvertToSet(sub.id, sub.name)}
                                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg cursor-pointer"
                                    title="สร้างชุดสินค้ามาตรฐานจากหมวดหมู่นี้"
                                  >
                                    <Package size={13} />
                                  </button>
                                )}

                                {/* Toggle Active */}
                                <button
                                  onClick={() => toggleSubActive(activeTab as any, item.id, sub.id)}
                                  className={`p-1 rounded-lg cursor-pointer ${sub.isActive ? 'text-emerald-500' : 'text-slate-400'}`}
                                  title={sub.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                >
                                  {sub.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                                </button>

                                {/* Edit */}
                                {!isEditingThisSub && (
                                  <button
                                    onClick={() => {
                                      setEditingSubId({ parentId: item.id, subId: sub.id });
                                      setEditSubValue(sub.name);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-500 rounded-lg cursor-pointer"
                                    title="แก้ไขชื่อ"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                )}

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteSub(item.id, sub.id, sub.name)}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                                  title="ลบหมวดหมู่ย่อย"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Subcategory Input */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newSubName[item.id] || ''}
                          onChange={(e) => setNewSubName({ ...newSubName, [item.id]: e.target.value })}
                          placeholder={`เพิ่มหมวดหมู่ย่อยใน "${item.name}"...`}
                          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSub(item.id)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Plus size={14} />
                          <span>เพิ่มหมวดย่อย</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Category Bulk Import / Export Admin Tool */}
      {isAdmin ? (
        <div className="mt-8 border-t border-slate-200/60 dark:border-slate-800/60 pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Database size={16} className="text-blue-600" />
                <span>เครื่องมือผู้ดูแลระบบ: นำเข้า/ส่งออกหมวดหมู่แบบกลุ่ม</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                จัดการและซิงค์โครงสร้างข้อมูลบัญชีและรายการสินค้าผ่านไฟล์ JSON หรือ CSV อย่างง่ายดาย
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Panel */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                <FileDown size={16} className="text-emerald-600" />
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">ส่งออกข้อมูล (Export)</h4>
              </div>

              {/* Data types selection */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  เลือกประเภทข้อมูลที่ต้องการส่งออก:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={exportSelectedTypes.income}
                      onChange={(e) => setExportSelectedTypes({ ...exportSelectedTypes, income: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span>หมวดหมู่รายรับ ({config.incomeCategories?.length || 0})</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={exportSelectedTypes.expense}
                      onChange={(e) => setExportSelectedTypes({ ...exportSelectedTypes, expense: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span>หมวดหมู่รายจ่าย ({config.expenseCategories?.length || 0})</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={exportSelectedTypes.product}
                      onChange={(e) => setExportSelectedTypes({ ...exportSelectedTypes, product: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span>คลังสินค้า ({config.productCategories?.length || 0})</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={exportSelectedTypes.payment}
                      onChange={(e) => setExportSelectedTypes({ ...exportSelectedTypes, payment: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span>รูปแบบชำระเงิน ({config.paymentMethods?.length || 0})</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 col-span-2">
                    <input
                      type="checkbox"
                      checked={exportSelectedTypes.tags}
                      onChange={(e) => setExportSelectedTypes({ ...exportSelectedTypes, tags: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span>ป้ายกำกับ / แท็กระบบ ({config.systemTags?.length || 0})</span>
                  </label>
                </div>
              </div>

              {/* Format selection */}
              <div className="space-y-2 pt-2">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">รูปแบบไฟล์:</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={() => setExportFormat('json')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>JSON (สมบูรณ์ที่สุด)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={() => setExportFormat('csv')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>CSV Spreadsheet (แก้ไขสะดวก)</span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportData}
                disabled={!Object.values(exportSelectedTypes).some(Boolean)}
                className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <DownloadCloud size={14} />
                <span>ดาวน์โหลดไฟล์ข้อมูลสำรอง</span>
              </button>
            </div>

            {/* Import Panel */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                <FileUp size={16} className="text-blue-600" />
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">นำเข้าข้อมูล (Import)</h4>
              </div>

              {/* Drag n Drop Area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processImportFile(file);
                }}
                onClick={() => importFileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-800'
                }`}
              >
                <input
                  type="file"
                  ref={importFileRef}
                  onChange={handleImportFileChange}
                  accept=".json,.csv"
                  className="hidden"
                />
                <UploadCloud size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">ลากและวางไฟล์ หรือคลิกเพื่ออัปโหลด</p>
                <p className="text-[10px] text-slate-400 mt-1">รองรับรูปแบบไฟล์ .json หรือ .csv</p>
              </div>

              {/* Import Strategy */}
              {parsedImportData && (
                <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3.5">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">📦 ข้อมูลที่ตรวจพบในไฟล์:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      {importPreview?.incomeCount ? <div>- หมวดหมู่รายรับ: {importPreview.incomeCount} รายการ</div> : null}
                      {importPreview?.expenseCount ? <div>- หมวดหมู่รายจ่าย: {importPreview.expenseCount} รายการ</div> : null}
                      {importPreview?.productCount ? <div>- หมวดหมู่สินค้า: {importPreview.productCount} รายการ</div> : null}
                      {importPreview?.paymentCount ? <div>- รูปแบบชำระเงิน: {importPreview.paymentCount} รายการ</div> : null}
                      {importPreview?.tagsCount ? <div>- ป้ายกำกับ / แท็ก: {importPreview.tagsCount} รายการ</div> : null}
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-700 pt-2.5">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">นโยบายการนำเข้า:</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="importStrategy"
                          value="merge"
                          checked={importStrategy === 'merge'}
                          onChange={() => setImportStrategy('merge')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>ผสานข้อมูล (Merge)</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="importStrategy"
                          value="overwrite"
                          checked={importStrategy === 'overwrite'}
                          onChange={() => setImportStrategy('overwrite')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-rose-600 font-bold">เขียนทับทั้งหมด (Overwrite)</span>
                      </label>
                    </div>
                    {importStrategy === 'overwrite' && (
                      <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-2 rounded-lg text-[10px] font-bold flex items-start gap-1">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                        <span>คำเตือน: การเขียนทับจะลบข้อมูลหมวดหมู่เดิมทั้งหมดของกลุ่มที่ระบุและแทนที่ด้วยไฟล์นี้</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setParsedImportData(null);
                        setImportPreview(null);
                        if (importFileRef.current) importFileRef.current.value = '';
                      }}
                      className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 text-xs font-bold transition-all cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={submitting}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                    >
                      ยืนยันนำเข้าข้อมูล
                    </button>
                  </div>
                </div>
              )}

              {importError && (
                <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-[11px] font-bold flex items-start gap-1.5 border border-rose-100 dark:border-rose-900/40">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>เกิดข้อผิดพลาด: {importError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 border-t border-slate-200/60 dark:border-slate-800/60 pt-6">
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400">
              <Database size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">🔒 ข้อมูลผู้ดูแลระบบระดับสูง</p>
              <p className="text-[10px] text-slate-400">ฟังก์ชันนำเข้า/ส่งออกข้อมูลถูกควบคุมดูแลเฉพาะผู้ดูแลระบบที่มีสิทธิ์สูงสุดเพื่อรักษาความสอดคล้องทางการบัญชี</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Add/Edit Modal */}
      <AnimatePresence>
        {isDetailModalOpen && (
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
                    {editingItem ? `แก้ไข: ${editingItem.name}` : `เพิ่มรายการใหม่ใน ${tabs.find(t => t.id === activeTab)?.label}`}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">ระบุชื่อและข้อมูลจำเพาะของตัวเลือก</p>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveDetailModal} className="space-y-3.5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อรายการ *
                  </label>
                  <input
                    type="text"
                    required
                    value={detailForm.name}
                    onChange={(e) => setDetailForm({ ...detailForm, name: e.target.value })}
                    placeholder="เช่น โอนเงินผ่านธนาคารไทยพาณิชย์ หรือ ค่าเดินทางช่าง..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    คำอธิบาย / รายละเอียด
                  </label>
                  <textarea
                    rows={2}
                    value={detailForm.description}
                    onChange={(e) => setDetailForm({ ...detailForm, description: e.target.value })}
                    placeholder="ระบุข้อความอธิบาย หรือคำแนะนำในการใช้งาน..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Payment Method Specific Fields */}
                {activeTab === 'paymentMethods' && (
                  <div className="space-y-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
                      ข้อมูลบัญชีรับเงินและ QR Code
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          ชื่อธนาคาร
                        </label>
                        <input
                          type="text"
                          value={detailForm.bankName}
                          onChange={(e) => setDetailForm({ ...detailForm, bankName: e.target.value })}
                          placeholder="เช่น ธนาคารกสิกรไทย (KBANK)"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          เลขที่บัญชี
                        </label>
                        <input
                          type="text"
                          value={detailForm.accountNo}
                          onChange={(e) => setDetailForm({ ...detailForm, accountNo: e.target.value })}
                          placeholder="เช่น 123-4-56789-0"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          ชื่อบัญชี
                        </label>
                        <input
                          type="text"
                          value={detailForm.accountName}
                          onChange={(e) => setDetailForm({ ...detailForm, accountName: e.target.value })}
                          placeholder="เช่น บจก. กลางนาโซล่าเซลล์"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          พร้อมเพย์ (PromptPay ID)
                        </label>
                        <input
                          type="text"
                          value={detailForm.promptPayId}
                          onChange={(e) => setDetailForm({ ...detailForm, promptPayId: e.target.value })}
                          placeholder="เบอร์โทร หรือ เลขประจำตัวผู้เสียภาษี"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Badge Style & Default Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      รูปแบบสีป้ายกำกับ (Badge Style)
                    </label>
                    <select
                      value={detailForm.badgeStyle}
                      onChange={(e: any) => setDetailForm({ ...detailForm, badgeStyle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="success">🟢 เขียว (Success / ชำระแล้ว)</option>
                      <option value="warning">🟡 ส้ม/เหลือง (Warning / มัดจำ)</option>
                      <option value="danger">🔴 แดง (Danger / ค้างชำระ)</option>
                      <option value="info">🔵 ฟ้า/น้ำเงิน (Info / ธนาคาร)</option>
                      <option value="purple">🟣 ม่วง (Purple / PromptPay)</option>
                      <option value="neutral">⚪ เทา (Neutral / ทั่วไป)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={detailForm.isDefault}
                        onChange={(e) => setDetailForm({ ...detailForm, isDefault: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>ตั้งเป็นตัวเลือกเริ่มต้น (Default)</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {editingItem ? 'บันทึกการแก้ไข' : 'สร้างรายการ'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
