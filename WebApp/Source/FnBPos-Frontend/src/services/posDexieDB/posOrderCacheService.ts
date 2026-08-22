import { db } from './posDatabase';
import type { DeliveryNoteWithRoundsModel, OrderRoundModel } from '@/shared/types/deliveryNote.types';
import type { ProductDeliveryItem } from '@/shared/types/productDeliveryItem.types';
import { getOrdersByStatusFromCacheApi } from '@/features/pos/api/posOrderManagementApi';
import { mapOrderCacheToDeliveryNoteWithRoundsModel } from '@/features/pos/mappers/orderCacheMapper';

/**
 * 🛒 SERVICE QUẢN LÝ BỘ NHỚ DEXIE DB CHO ĐƠN HÀNG (ORDERS CACHE)
 */
export const posOrderCacheService = {
  // 1. Kiểm tra xem đã có dữ liệu đơn hàng chưa
  async hasOrders(): Promise<boolean> {
    const count = await db.ordersCache.count();
    return count > 0;
  },

  // 2. Lưu toàn bộ cache đơn hàng vào IndexedDB (Tự động khử trùng lặp)
  async saveOrders(orders: DeliveryNoteWithRoundsModel[]): Promise<void> {
    const cleanOrders: DeliveryNoteWithRoundsModel[] = JSON.parse(JSON.stringify(orders || []));
    
    // Khử trùng lặp theo noteId hoặc targetId
    const seen = new Set<string>();
    const deduplicated: DeliveryNoteWithRoundsModel[] = [];

    for (const o of cleanOrders) {
      const noteId = Number(o.noteId || 0);
      const targetId = Number(o.targetId || 0);
      const key = noteId > 0 ? `note_${noteId}` : (targetId > 0 ? `target_${targetId}` : '');
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      deduplicated.push(o);
    }

    await db.ordersCache.clear();
    await db.ordersCache.bulkPut(deduplicated);
  },

  // 3. Lấy toàn bộ danh sách đơn hàng từ IndexedDB
  async getOrders(): Promise<DeliveryNoteWithRoundsModel[]> {
    return await db.ordersCache.toArray();
  },

  // 4. Lấy chi tiết 1 đơn hàng theo ID Bàn (targetId)
  async getOrderByTargetId(targetId: number): Promise<DeliveryNoteWithRoundsModel | undefined> {
    return await db.ordersCache.where('targetId').equals(targetId).first();
  },

  // 5. Tìm kiếm đơn hàng trực tiếp từ IndexedDB theo Tên khách hàng, Mã đơn, Ghi chú
  async searchOrders(keyword: string): Promise<DeliveryNoteWithRoundsModel[]> {
    if (!keyword || !keyword.trim()) {
      return await this.getOrders();
    }
    const cleanKey = keyword.trim().toLowerCase();
    
    return await db.ordersCache
      .filter(order => Boolean(
        (order.customerName && order.customerName.toLowerCase().includes(cleanKey)) 
      ))
      .toArray();
  },

  // 6. Xóa 1 đơn hàng theo ID Bàn (targetId) khi hủy đơn
  async deleteOrderByTargetId(targetId: number): Promise<void> {
    if (!targetId) return;
    await db.ordersCache.where('targetId').equals(targetId).delete();
  },

  // 7. Xóa toàn bộ bộ nhớ đơn hàng
  async clearOrdersCache(): Promise<void> {
    await db.ordersCache.clear();
  },

  /**
   * ⚡ 8. ĐỒNG BỘ ĐƠN HÀNG TỪ SERVER VÀO DEXIE DB (status = -1 lấy tất cả)
   */
  async syncOrdersFromServer(storeId: number): Promise<DeliveryNoteWithRoundsModel[]> {
    if (!storeId) return [];
    try {
      const res: any = await getOrdersByStatusFromCacheApi(storeId, -1);
      const rawData = res?.data?.result || res?.data?.Result || res?.data?.Data || res?.data || res?.Data || [];
      const mappedOrders = mapOrderCacheToDeliveryNoteWithRoundsModel(rawData);

      // Luôn ghi đè lại vào Dexie DB để làm mới hoàn toàn
      await this.saveOrders(mappedOrders);
      return mappedOrders;
    } catch (err) {
      console.warn('[posOrderCacheService] Lỗi đồng bộ ordersFromCache:', err);
      return await this.getOrders();
    }
  },

  /**
   * ⚡ 9. CẬP NHẬT TRẠNG THÁI MÓN ĂN TRỰC TIẾP TRONG DEXIE DB (OPTIMISTIC 0ms)
   */
  async updateItemStatus(noteId: number, noteItemIds: number[], newStatus: number): Promise<void> {
    const allOrders = await this.getOrders();
    const targetOrder = allOrders.find(o => o.noteId === noteId);

    if (!targetOrder) return;

    const idSet = new Set(noteItemIds);

    // Cập nhật trong noteItems
    if (targetOrder.noteItems) {
      targetOrder.noteItems.forEach((item: ProductDeliveryItem) => {
        if (idSet.has(item.noteItemId)) {
          item.productStatusId = newStatus;
        }
      });
    }

    // Cập nhật trong orderRounds
    if (targetOrder.orderRounds) {
      targetOrder.orderRounds.forEach((round: OrderRoundModel) => {
        if (round.items) {
          round.items.forEach((item: ProductDeliveryItem) => {
            if (idSet.has(item.noteItemId)) {
              item.productStatusId = newStatus;
            }
          });
        }
      });
    }

    await this.saveOrders(allOrders);
  },

  /**
   * ⚡ 10. LỌC ĐƠN HÀNG TRÊN FRONTEND TỪ DEXIE DB (0ms, KHÔNG GỌI NETWORK)
   */
  async filterOrdersByStatus(status: number): Promise<DeliveryNoteWithRoundsModel[]> {
    const allOrders = await this.getOrders();
    if (status === -1) {
      // Trả về toàn bộ
      return allOrders;
    }

    // Lọc các món theo trạng thái status
    const filtered: DeliveryNoteWithRoundsModel[] = [];

    for (const ord of allOrders) {
      const cloneOrd: DeliveryNoteWithRoundsModel = JSON.parse(JSON.stringify(ord));
      const matchedRounds: OrderRoundModel[] = [];

      if (cloneOrd.orderRounds && cloneOrd.orderRounds.length > 0) {
        for (const round of cloneOrd.orderRounds) {
          const matchedItems = (round.items || []).filter(item => {
            if (status === 2) {
              // Tab từ chối gồm status 2 (Rejected), 3 (Canceled), 4 (Delete)
              return item.productStatusId === 2 || item.productStatusId === 3 || item.productStatusId === 4;
            }
            return item.productStatusId === status;
          });

          if (matchedItems.length > 0) {
            matchedRounds.push({
              ...round,
              items: matchedItems
            });
          }
        }
      }

      if (matchedRounds.length > 0) {
        cloneOrd.orderRounds = matchedRounds;
        cloneOrd.noteItems = matchedRounds.flatMap(r => r.items || []);
        filtered.push(cloneOrd);
      }
    }

    return filtered;
  },

  /**
   * ⚡ 11. ĐẾM SỐ LƯỢNG BADGE TỪ DEXIE DB (0ms)
   */
  async getBadgeCounts(): Promise<{ pendingCount: number; approvedCount: number; rejectedCount: number }> {
    const allOrders = await this.getOrders();
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    for (const ord of allOrders) {
      const items = ord.noteItems || [];
      for (const item of items) {
        if (item.productStatusId === 0) pending++;
        else if (item.productStatusId === 1) approved++;
        else if (item.productStatusId === 2 || item.productStatusId === 3 || item.productStatusId === 4) rejected++;
      }
    }

    return {
      pendingCount: pending,
      approvedCount: approved,
      rejectedCount: rejected
    };
  }
};
