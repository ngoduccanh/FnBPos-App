import { db } from './posDatabase';
import type { PosProductItem } from '@/features/pos/types/products.types';
import type { PosTableAreaGroup } from '@/features/pos/types/tables.types';

/**
 * ⚡ SERVICE QUẢN LÝ BỘ NHỚ LOCAL DEXIE DB CHO SẢN PHẨM VÀ NHÓM SẢN PHẨM
 */
export const posProductCacheService = {
  /**
   * 1. SẢN PHẨM (PRODUCTS)
   */
  async saveProducts(products: PosProductItem[]): Promise<void> {
    if (!products || products.length === 0) return;
    await db.productsCache.clear();
    await db.productsCache.bulkPut(products);
  },

  async getProducts(): Promise<PosProductItem[]> {
    return await db.productsCache.toArray();
  },

  async hasProducts(): Promise<boolean> {
    const count = await db.productsCache.count();
    return count > 0;
  },

  async searchProducts(keyword: string): Promise<PosProductItem[]> {
    if (!keyword || !keyword.trim()) {
      return await this.getProducts();
    }
    const term = keyword.toLowerCase().trim();
    return await db.productsCache
      .filter(p => Boolean(
        (p.productName && p.productName.toLowerCase().includes(term)) ||
        (p.productCode && p.productCode.toLowerCase().includes(term)) ||
        (p.barcode && p.barcode.toLowerCase().includes(term))
      ))
      .toArray();
  },

  async clearProductsCache(): Promise<void> {
    await db.productsCache.clear();
  },

  /**
   * 2. NHÓM SẢN PHẨM (PRODUCT GROUPS)
   */
  async saveProductGroups(groups: PosTableAreaGroup[]): Promise<void> {
    if (!groups || groups.length === 0) return;
    await db.productGroupsCache.clear();
    await db.productGroupsCache.bulkPut(groups);
  },

  async getProductGroups(): Promise<PosTableAreaGroup[]> {
    return await db.productGroupsCache.toArray();
  },

  async hasProductGroups(): Promise<boolean> {
    const count = await db.productGroupsCache.count();
    return count > 0;
  },

  async clearProductGroupsCache(): Promise<void> {
    await db.productGroupsCache.clear();
  }
};
