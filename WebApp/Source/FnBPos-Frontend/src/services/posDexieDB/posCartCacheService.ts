import { db } from './posDatabase';
import type { TableCartCacheRecord } from '@/features/pos/types/cartCache.types';
import type { CartItem } from '@/features/pos/mappers/orderDetailMapper';

/**
 * ⚡ SERVICE QUẢN LÝ BỘ NHỚ CACHE DEXIE DB CHO GIỎ HÀNG TỪNG BÀN (TABLE CARTS)
 */
export const posCartCacheService = {
  /**
   * 1. LƯU GIỎ HÀNG CỦA 1 BÀN (THEO TARGET ID)
   */
  async saveTableCart(targetId: number, noteId: number, items: CartItem[]): Promise<void> {
    if (!targetId) return;
    // ⚡ Xử lý Vue 3 Reactive Proxy bóc tách thành Plain JSON Object để tránh lỗi DataCloneError của IndexedDB
    const cleanItems = JSON.parse(JSON.stringify(items || []));

    await db.cartItemsCache.put({
      targetId,
      noteId: noteId || 0,
      items: cleanItems,
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * 2. LƯU HÀNG LOẠT GIỎ HÀNG CHO CÁC BÀN
   */
  async saveBulkTableCarts(records: TableCartCacheRecord[]): Promise<void> {
    if (!records || records.length === 0) return;
    const cleanRecords = JSON.parse(JSON.stringify(records));
    await db.cartItemsCache.bulkPut(cleanRecords);
  },

  /**
   * 3. LẤY GIỎ HÀNG CỦA BÀN THEO TARGET ID
   */
  async getTableCart(targetId: number): Promise<CartItem[]> {
    if (!targetId) return [];
    const record = await db.cartItemsCache.get(targetId);
    return record?.items || [];
  },

  /**
   * 3.1. LẤY TOÀN BỘ BẢN GHI GIỎ HÀNG CỦA BÀN (GỒM CẢ NOTE ID)
   */
  async getTableCartRecord(targetId: number): Promise<TableCartCacheRecord | undefined> {
    if (!targetId) return undefined;
    return await db.cartItemsCache.get(targetId);
  },

  /**
   * 4. LẤY TOÀN BỘ GIỎ HÀNG CÁC BÀN TRONG DEXIE DB
   */
  async getAllTableCarts(): Promise<TableCartCacheRecord[]> {
    return await db.cartItemsCache.toArray();
  },

  /**
   * 5. XÓA GIỎ HÀNG CỦA 1 BÀN TRONG DEXIE DB KHI HỦY ĐƠN
   */
  async deleteTableCart(targetId: number): Promise<void> {
    if (!targetId) return;
    await db.cartItemsCache.delete(targetId);
  },

  /**
   * 6. XÓA TOÀN BỘ BỘ NHỚ CACHE GIỎ HÀNG CÁC BÀN
   */
  async clearCartCache(): Promise<void> {
    await db.cartItemsCache.clear();
  }
};
