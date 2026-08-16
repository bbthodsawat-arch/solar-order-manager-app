import { useState, useEffect } from 'react';

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  minAlert: number;
  category?: string;
}

const DEFAULT_STOCK_ITEMS: StockItem[] = [
  { id: '1', sku: 'SKU001', name: 'อินเวอร์เตอร์', quantity: 1, unit: 'ตัว', minAlert: 2, category: 'อุปกรณ์หลัก' },
  { id: '2', sku: 'SKU002', name: 'ชาร์จเจอร์ MPPT', quantity: 0, unit: 'ตัว', minAlert: 3, category: 'อุปกรณ์หลัก' },
  { id: '3', sku: 'SKU003', name: 'ตัวควบคุม BMS', quantity: 0, unit: 'ตัว', minAlert: 3, category: 'อุปกรณ์หลัก' },
  { id: '4', sku: 'SKU004', name: 'เบรกเกอร์ DC', quantity: 2, unit: 'ตัว', minAlert: 5, category: 'ระบบป้องกัน' },
  { id: '5', sku: 'SKU005', name: 'เบรกเกอร์ AC', quantity: 10, unit: 'ตัว', minAlert: 5, category: 'ระบบป้องกัน' },
  { id: '6', sku: 'SKU006', name: 'ชิโนไทม์เมอร์', quantity: 3, unit: 'ตัว', minAlert: 2, category: 'ระบบควบคุม' },
  { id: '7', sku: 'SKU007', name: 'ขั้วแบตเตอรี่', quantity: 12, unit: 'ตัว', minAlert: 5, category: 'อะไหล่และปลั๊ก' },
  { id: '8', sku: 'SKU008', name: 'MC4', quantity: 40, unit: 'ตัว', minAlert: 10, category: 'อะไหล่และปลั๊ก' },
  { id: '9', sku: 'SKU009', name: 'ปลั๊กตัวผู้', quantity: 7, unit: 'ตัว', minAlert: 5, category: 'อะไหล่และปลั๊ก' },
  { id: '10', sku: 'SKU010', name: 'ปลั๊กตัวเมีย', quantity: 6, unit: 'ตัว', minAlert: 5, category: 'อะไหล่และปลั๊ก' },
  { id: '11', sku: 'SKU011', name: 'เบรกเกอร์กันฟ้า', quantity: 3, unit: 'ตัว', minAlert: 2, category: 'ระบบป้องกัน' }
];

const STORAGE_KEY = 'solar_store_inventory_v1';

export function useInventory() {
  const [items, setItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load inventory from storage', e);
    }
    return DEFAULT_STOCK_ITEMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save inventory', e);
    }
  }, [items]);

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const setStockQuantity = (id: string, newQty: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, newQty) };
      }
      return item;
    }));
  };

  const addStockItem = (item: Omit<StockItem, 'id'>) => {
    const newItem: StockItem = {
      ...item,
      id: Date.now().toString()
    };
    setItems(prev => [...prev, newItem]);
  };

  const resetInventory = () => {
    setItems(DEFAULT_STOCK_ITEMS);
  };

  const lowStockCount = items.filter(i => i.quantity <= i.minAlert).length;
  const outOfStockCount = items.filter(i => i.quantity === 0).length;

  return {
    items,
    updateQuantity,
    setStockQuantity,
    addStockItem,
    resetInventory,
    lowStockCount,
    outOfStockCount
  };
}
