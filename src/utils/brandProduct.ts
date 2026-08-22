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

/**
 * Resolve a product's brand from the canonical brand id first, with a
 * name-based fallback for legacy products created before brandId existed.
 */
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

/**
 * Only active brands are selectable for new product assignments. Existing
 * products may still resolve inactive brands so historical data stays intact.
 */
export function selectableBrands(brands: BrandRecord[]): BrandRecord[] {
  return brands.filter(brand => brand.isActive).sort((a, b) => a.name.localeCompare(b.name, 'th-TH'));
}

export function matchesBrandFilter<T extends BrandAwareProduct>(
  product: T,
  brandId: string,
  brands: BrandRecord[]
): boolean {
  if (brandId === 'all') return true;
  return resolveProductBrand(product, brands)?.id === brandId;
}
