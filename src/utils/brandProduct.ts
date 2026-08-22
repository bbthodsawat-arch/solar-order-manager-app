export interface BrandRecord {
  id: string;
  name: string;
  isActive: boolean;
}

export interface BrandAwareProduct {
  brandId?: string;
  brandName?: string;
  [key: string]: unknown;
}

const normalize = (value?: string) => (value || '').trim().toLocaleLowerCase('th-TH');

/** Resolve a product brand by canonical id, with a legacy name fallback. */
export function resolveProductBrand<T extends BrandAwareProduct>(
  product: T,
  brands: BrandRecord[]
): BrandRecord | undefined {
  if (product.brandId) {
    const byId = brands.find(brand => brand.id === product.brandId);
    if (byId) return byId;
  }
  if (product.brandName) {
    return brands.find(brand => normalize(brand.name) === normalize(product.brandName));
  }
  return undefined;
}

/** Only active brands are selectable for new product assignments. */
export function selectableBrands(brands: BrandRecord[]): BrandRecord[] {
  return brands
    .filter(brand => brand.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, 'th-TH'));
}

/**
 * Apply a canonical brand reference to a product.
 * Existing products can continue to resolve inactive or deleted historical
 * brands, but new assignments must target an active brand.
 */
export function assignProductBrand<T extends BrandAwareProduct>(
  product: T,
  brandId: string | undefined,
  brands: BrandRecord[]
): T & Pick<BrandAwareProduct, 'brandId' | 'brandName'> {
  if (!brandId) {
    const { brandId: _brandId, brandName: _brandName, ...rest } = product;
    return rest as T & Pick<BrandAwareProduct, 'brandId' | 'brandName'>;
  }

  const brand = brands.find(candidate => candidate.id === brandId);
  if (!brand) throw new Error('ไม่พบแบรนด์ที่เลือก');
  if (!brand.isActive) throw new Error('ไม่สามารถเลือกแบรนด์ที่ปิดการใช้งาน');

  return { ...product, brandId: brand.id, brandName: brand.name };
}

export function matchesBrandFilter<T extends BrandAwareProduct>(
  product: T,
  brandId: string,
  brands: BrandRecord[]
): boolean {
  if (brandId === 'all') return true;
  return resolveProductBrand(product, brands)?.id === brandId;
}
