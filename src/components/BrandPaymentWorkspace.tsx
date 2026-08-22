import { useMemo } from 'react';
import { useAppConfig } from '../hooks/useAppConfig';
import type { ConfigItem } from '../types';
import BrandPaymentManager, { type BrandItem } from './BrandPaymentManager';

const normalize = (value: string) => value.trim().toLocaleLowerCase('th-TH');

export default function BrandPaymentWorkspace() {
  const appConfig = useAppConfig() as any;
  const config = appConfig.config || {};
  const update = appConfig.update as (patch: any) => Promise<void>;
  const brands: BrandItem[] = Array.isArray(config.brands) ? config.brands : [];
  const paymentMethods: ConfigItem[] = Array.isArray(config.paymentMethods) ? config.paymentMethods : [];
  const productReferences = useMemo(() => {
    const references = new Map<string, number>();
    (config.productCategories || []).forEach((category: any) => (category.items || []).forEach((item: any) => {
      const brandId = item.brandId || item.brand?.id;
      const brandName = typeof item.brand === 'string' ? item.brand : item.brandName;
      brands.forEach(brand => { if (brandId === brand.id || (brandName && normalize(brandName) === normalize(brand.name))) references.set(brand.id, (references.get(brand.id) || 0) + 1); });
    }));
    return references;
  }, [brands, config.productCategories]);
  const saveBrands = async (next: BrandItem[]) => update({ brands: next });
  const savePayments = async (next: ConfigItem[]) => update({ paymentMethods: next });
  return <BrandPaymentManager brands={brands} paymentMethods={paymentMethods}
    onAddBrand={async brand => { const name = brand.name.trim(); if (brands.some(item => normalize(item.name) === normalize(name))) throw new Error('มีแบรนด์ชื่อนี้อยู่แล้ว'); await saveBrands([...brands, { ...brand, name, id: `brand_${Date.now()}` }]); }}
    onUpdateBrand={async (id, patch) => { const nextName = patch.name?.trim(); if (nextName && brands.some(item => item.id !== id && normalize(item.name) === normalize(nextName))) throw new Error('มีแบรนด์ชื่อนี้อยู่แล้ว'); await saveBrands(brands.map(item => item.id === id ? { ...item, ...patch, ...(nextName ? { name: nextName } : {}) } : item)); }}
    onDeleteBrand={async id => { const count = productReferences.get(id) || 0; if (count > 0) throw new Error(`ไม่สามารถลบแบรนด์นี้ได้ เพราะยังถูกใช้งานกับสินค้า ${count} รายการ`); await saveBrands(brands.filter(item => item.id !== id)); }}
    onToggleBrand={async id => saveBrands(brands.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item))}
    onAddPayment={async item => { const name = item.name.trim(); if (paymentMethods.some(method => normalize(method.name) === normalize(name))) throw new Error('มีช่องทางชำระเงินชื่อนี้อยู่แล้ว'); const isDefault = Boolean(item.isDefault); await savePayments([...paymentMethods.map(method => isDefault ? { ...method, isDefault: false } : method), { ...item, id: `payment_${Date.now()}`, name, isActive: true, isDefault }]); }}
    onUpdatePayment={async (id, patch) => { const current = paymentMethods.find(item => item.id === id); if (!current) throw new Error('ไม่พบช่องทางชำระเงิน'); const name = (patch.name ?? current.name).trim(); if (paymentMethods.some(item => item.id !== id && normalize(item.name) === normalize(name))) throw new Error('มีช่องทางชำระเงินชื่อนี้อยู่แล้ว'); if (patch.isActive === false && current.isDefault) throw new Error('ไม่สามารถปิดใช้งานช่องทางชำระเงินเริ่มต้นได้ กรุณาตั้งค่า default รายการอื่นก่อน'); const makeDefault = patch.isDefault === true; await savePayments(paymentMethods.map(item => item.id === id ? { ...item, ...patch, name, isDefault: makeDefault ? true : Boolean(item.isDefault) } : makeDefault ? { ...item, isDefault: false } : item)); }}
    onDeletePayment={async id => { const current = paymentMethods.find(item => item.id === id); if (!current) return; if (current.isDefault) throw new Error('ไม่สามารถลบช่องทางชำระเงินเริ่มต้นได้ กรุณาตั้งค่า default รายการอื่นก่อน'); if (paymentMethods.filter(item => item.isActive).length <= 1 && current.isActive) throw new Error('ต้องมีช่องทางชำระเงินที่เปิดใช้งานอย่างน้อย 1 รายการ'); await savePayments(paymentMethods.filter(item => item.id !== id)); }}
    onTogglePayment={async id => { const current = paymentMethods.find(item => item.id === id); if (!current) return; if (current.isDefault && current.isActive) throw new Error('ไม่สามารถปิดใช้งานช่องทางชำระเงินเริ่มต้นได้'); if (current.isActive && paymentMethods.filter(item => item.isActive).length <= 1) throw new Error('ต้องมีช่องทางชำระเงินที่เปิดใช้งานอย่างน้อย 1 รายการ'); await savePayments(paymentMethods.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item)); }}
  />;
}
