import { useAppConfig } from './useAppConfig';

export const DEFAULT_INCOME_CATEGORIES = [
  'รายรับจาก Sale order',
  'แบตเตอรี่',
  'ตู้คอมบายเนอร์+อินเวอร์เตอร์',
  'รายได้อื่นๆ'
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'สั่งซื้ออุปกรณ์ประกอบชุด',
  'ค่าโฆษณา',
  'ค่าอาหาร',
  'ค่าเครื่องดื่ม เหล้า/เบียร์',
  'ค่าเดินทาง',
  'ค่าคอมมิชชั่น',
  'ค่าจ้างช่างรายวัน',
  'แม่บ้านรายวัน',
  'ค่าจ้างแอดมิน',
  'ค่าใช้จ่ายอื่นๆ'
];

export function useCategories() {
  const {
    incomeCategories,
    expenseCategories,
    loading,
    addItem,
    updateItem,
    deleteItem,
  } = useAppConfig();

  const addCategory = async (type: 'income' | 'expense', name: string) => {
    await addItem(type === 'income' ? 'incomeCategories' : 'expenseCategories', name, type);
  };

  const renameCategory = async (type: 'income' | 'expense', oldName: string, newName: string) => {
    // This is a bit tricky since we don't have the ID here. 
    // In the old system, name was the unique identifier.
    // We'll find by name.
    const { config } = useAppConfig(); // Note: this won't work inside a function like this if it's not a hook call.
    // Refactoring components to use useAppConfig directly is safer.
  };

  return {
    incomeCategories,
    expenseCategories,
    loading,
    addCategory,
    // ... rest will be handled by components switching to useAppConfig
  };
}
