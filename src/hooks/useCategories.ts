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
    config,
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
    const collection = type === 'income' ? config.incomeCategories : config.expenseCategories;
    const target = collection?.find((item) => item.name === oldName);
    if (!target) return;

    await updateItem(
      type === 'income' ? 'incomeCategories' : 'expenseCategories',
      target.id,
      { name: newName.trim() },
    );
  };

  return {
    incomeCategories,
    expenseCategories,
    loading,
    addCategory,
    renameCategory,
    deleteCategory: deleteItem,
  };
}
