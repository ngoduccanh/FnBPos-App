import { db, type TableQrCacheRecord } from './posDatabase';

/**
 * ⚡ SERVICE QUẢN LÝ BỘ NHỚ LOCAL DEXIE DB CHO MÃ QR BÀN
 * Giúp mở mã QR bàn ngay lập tức (0ms) mà không cần gọi lại API
 */
export const posTableQrCacheService = {
  /**
   * 🔍 Lấy mã QR bàn từ Dexie DB
   */
  async getQrCode(targetId: number): Promise<string | null> {
    try {
      const record = await db.tableQrCache.get(targetId);
      return record?.qrBase64 || null;
    } catch (err) {
      console.warn('[posTableQrCacheService] Lỗi khi đọc QR từ Dexie DB:', err);
      return null;
    }
  },

  /**
   * 💾 Lưu mã QR bàn vào Dexie DB
   */
  async saveQrCode(targetId: number, storeId: number, qrBase64: string): Promise<void> {
    if (!targetId || !qrBase64) return;
    try {
      const record: TableQrCacheRecord = {
        targetId,
        storeId,
        qrBase64,
        cachedAt: Date.now()
      };
      await db.tableQrCache.put(record);
      console.log(`[posTableQrCacheService] 💾 Đã lưu mã QR bàn #${targetId} vào Dexie DB thành công!`);
    } catch (err) {
      console.warn('[posTableQrCacheService] Lỗi khi lưu QR vào Dexie DB:', err);
    }
  },

  /**
   * 📦 Lưu hàng loạt mã QR bàn vào Dexie DB (bulk)
   */
  async saveBulkQrCodes(records: TableQrCacheRecord[]): Promise<void> {
    if (!records || records.length === 0) return;
    try {
      await db.tableQrCache.bulkPut(records);
    } catch (err) {
      console.warn('[posTableQrCacheService] Lỗi khi lưu bulk QR vào Dexie DB:', err);
    }
  },

  /**
   * 🧹 Xóa cache mã QR của một bàn
   */
  async deleteQrCode(targetId: number): Promise<void> {
    try {
      await db.tableQrCache.delete(targetId);
    } catch (err) {
      console.warn('[posTableQrCacheService] Lỗi khi xóa QR từ Dexie DB:', err);
    }
  },

  /**
   * 🧹 Xóa toàn bộ cache mã QR của cửa hàng
   */
  async clearQrCodes(): Promise<void> {
    try {
      await db.tableQrCache.clear();
    } catch (err) {
      console.warn('[posTableQrCacheService] Lỗi khi xóa toàn bộ QR từ Dexie DB:', err);
    }
  }
};
