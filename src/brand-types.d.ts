import type { BrandRecord } from './utils/brandProduct';

declare module './types' {
  interface ProductCatalogItem {
    /** Canonical reference to AppConfig.brands */
    brandId?: string;
    /** Denormalized display value retained for backward compatibility */
    brandName?: string;
  }

  interface AppConfig {
    /** First-class brand collection persisted with app configuration */
    brands?: BrandRecord[];
  }
}

export {};
