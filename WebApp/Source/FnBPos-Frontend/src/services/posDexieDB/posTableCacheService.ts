import { db } from './posDatabase';
import type { PosTableItem } from '@/features/pos/types/tables.types';

/**
 * 🪑 SERVICE QUẢN LÝ BỘ NHỚ DEXIE DB CHO BÀN (TABLES CACHE)
 */
export const posTableCacheService = {
  // 1. Kiểm tra xem đã có dữ liệu bàn chưa
  async hasTables(): Promise<boolean> {
    const count = await db.tablesCache.count();
    return count > 0;
  },

  // 2. Lưu toàn bộ danh sách bàn vào IndexedDB
  async saveTables(tables: PosTableItem[]): Promise<void> {
    const sorted = [...tables].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi', { numeric: true }));
    await db.tablesCache.clear();
    await db.tablesCache.bulkPut(sorted);
  },

  // 3. Lấy toàn bộ danh sách bàn từ IndexedDB
  async getTables(): Promise<PosTableItem[]> {
    const list = await db.tablesCache.toArray();
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi', { numeric: true }));
  },

  // 4. Tìm kiếm bàn trực tiếp từ IndexedDB theo từ khóa
  async searchTables(keyword: string): Promise<PosTableItem[]> {
    if (!keyword || !keyword.trim()) {
      return await this.getTables();
    }
    const cleanKey = keyword.trim().toLowerCase();
    
    return await db.tablesCache
      .filter(table => Boolean(
        (table.name && table.name.toLowerCase().includes(cleanKey)) ||
        (table.code && table.code.toLowerCase().includes(cleanKey)) ||
        (table.customerName && table.customerName.toLowerCase().includes(cleanKey))
      ))
      .toArray();
  },

  // 5. Xóa bộ nhớ bàn
  async clearTablesCache(): Promise<void> {
    await db.tablesCache.clear();
  },

  // 6. Cập nhật lạc quan thông tin đơn vào bàn (0ms UI)
  async updateTableOrderOptimistic(targetId: number, orderData: {
    prodCount: number;
    totalAmount: number;
    timeStarted?: string;
    customerName?: string;
    noteId?: number;
    noteNumber?: number;
  }): Promise<PosTableItem[]> {
    const list = await this.getTables();
    const updated = list.map(t => {
      if (t.id === targetId) {
        const timeStarted = orderData.timeStarted || t.timeStarted || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
        return {
          ...t,
          status: 'USING',
          prodCount: orderData.prodCount,
          totalAmount: orderData.totalAmount,
          timeStarted,
          customerName: orderData.customerName || t.customerName || 'Bán cho người tiêu dùng',
          noteId: orderData.noteId || t.noteId,
          noteNumber: orderData.noteNumber || t.noteNumber,
          activeOrder: {
            targetId,
            prodCount: orderData.prodCount,
            totalAmount: orderData.totalAmount,
            timeStarted,
            customerName: orderData.customerName || 'Bán cho người tiêu dùng',
            noteId: orderData.noteId || t.noteId
          }
        };
      }
      return t;
    });
    await this.saveTables(updated);
    return updated;
  },

  // 7. Xóa sạch thông tin đơn đưa bàn về TRỐNG lạc quan (0ms UI)
  async clearTableOrderOptimistic(targetId: number): Promise<PosTableItem[]> {
    const list = await this.getTables();
    const updated = list.map(t => {
      if (t.id === targetId) {
        return {
          ...t,
          status: 'EMPTY',
          prodCount: 0,
          totalAmount: 0,
          timeStarted: undefined,
          customerName: undefined,
          noteId: undefined,
          noteNumber: undefined,
          activeOrder: null
        };
      }
      return t;
    });
    await this.saveTables(updated);
    return updated;
  }
};
