import type {} from './types';

/**
 * Compatibility fields for legacy Firestore documents that are still consumed
 * by the dashboard/configuration UI. These remain optional so current writes
 * continue to use the canonical fields while older records can be read safely.
 */
declare module './types' {
  interface ProductCatalogItem {
    /** @deprecated Read compatibility for legacy stock documents; prefer inStock. */
    stockQuantity?: number;
  }

  interface SaleOrderDetails {
    /** @deprecated Read compatibility for legacy sale-order documents. */
    productName?: string;
  }

  interface Transaction {
    /** @deprecated Read compatibility for legacy transaction documents. */
    payer?: string;
    /** @deprecated Read compatibility for legacy transaction documents. */
    vendor?: string;
  }
}

export {};
