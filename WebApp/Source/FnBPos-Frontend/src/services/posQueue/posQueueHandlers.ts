/**
 * ⚡ POS QUEUE HANDLERS
 * Đăng ký tất cả handler cho từng loại job trong hàng chờ POS.
 * Import file này 1 lần duy nhất ở main.ts hoặc App.vue.
 */
import { registerQueueHandler, registerQueueRollbackHandler } from './posQueueService';
import { saveOrderTemporarilyApi } from '@/features/pos/api/saveOrderTemporarilyApi';
import { deleteOrderCacheApi } from '@/features/pos/api/deleteOrderCacheApi';
import { transferTableApi } from '@/features/pos/api/transferTableApi';
import { getOrderFromCacheApi } from '@/features/pos/api/getOrderApi';
import { mapOrderCacheToDeliveryNoteWithRoundsModel } from '@/features/pos/mappers/orderCacheMapper';
import { posCartCacheService } from '@/services/posDexieDB/posCartCacheService';
import { posOrderCacheService } from '@/services/posDexieDB/posOrderCacheService';
import { posTableCacheService } from '@/services/posDexieDB/posTableCacheService';
import {
  POS_JOB_TYPES,
  type SaveOrderJobPayload,
  type DeleteOrderJobPayload,
  type TransferTableJobPayload,
  type SaveOrderRollbackPayload,
  type DeleteOrderRollbackPayload,
  type TransferTableRollbackPayload,
  type PosJobType
} from './posQueue.types';



export {
  POS_JOB_TYPES,
  type SaveOrderJobPayload,
  type DeleteOrderJobPayload,
  type TransferTableJobPayload,
  type SaveOrderRollbackPayload,
  type DeleteOrderRollbackPayload,
  type TransferTableRollbackPayload,
  type PosJobType
};


export function registerAllPosQueueHandlers(): void {

  // ── SAVE ORDER ─────────────────────────────────────────────────────────────
  // Handler gọi API
  registerQueueHandler<SaveOrderJobPayload>(POS_JOB_TYPES.SAVE_ORDER, async (payload) => {
    const { storeId, model } = payload;
    const res: any = await saveOrderTemporarilyApi(storeId, model);

    // Kiểm tra nếu API trả về status lỗi nghiệp vụ (412, 400,...)
    if (res && (res.status === 412 || res.Status === 412 || (typeof res.status === 'number' && res.status >= 400) || (typeof res.Status === 'number' && res.Status >= 400))) {
      const errMsg =
        res.errors?.[0]?.message ||
        res.Errors?.[0]?.message ||
        res.errors?.[0] ||
        res.Errors?.[0] ||
        res.message ||
        'Lỗi lưu đơn tạm';
      const customErr: any = new Error(errMsg);
      customErr.status = res.status || res.Status;
      customErr.errors = res.errors || res.Errors;
      throw customErr;
    }

    console.log('[QueueHandler:SAVE_ORDER] Kết quả từ server:', res);

    // ⚡ TỰ ĐỘNG GỌI LẠI ordersFromCache ĐỂ ĐỒNG BỘ LẠI ĐƠN HÀNG VÀO DEXIE DB
    try {
      const orderRes: any = await getOrderFromCacheApi(storeId);
      const rawData = orderRes?.data?.result || orderRes?.data?.Result || orderRes?.data || orderRes?.result || [];
      const mappedOrders = mapOrderCacheToDeliveryNoteWithRoundsModel(rawData);
      if (mappedOrders && mappedOrders.length > 0) {
        await posOrderCacheService.saveOrders(mappedOrders);
        console.log('[QueueHandler:SAVE_ORDER] ⚡ Đã đồng bộ ordersFromCache vào DexieDB:', mappedOrders.length, 'đơn hàng');
      }
    } catch (syncErr) {
      console.warn('[QueueHandler:SAVE_ORDER] Không thể đồng bộ ordersFromCache:', syncErr);
    }
  });

  // Rollback handler: khôi phục cart và trạng thái bàn trong Dexie về snapshot cũ
  registerQueueRollbackHandler<SaveOrderRollbackPayload>(POS_JOB_TYPES.SAVE_ORDER, async (snapshot) => {
    if (snapshot.items.length === 0) {
      await posCartCacheService.deleteTableCart(snapshot.targetId);
    } else {
      await posCartCacheService.saveTableCart(snapshot.targetId, snapshot.noteId, snapshot.items);
    }

    // Khôi phục trạng thái bàn
    if (snapshot.previousTable) {
      const tables = await posTableCacheService.getTables();
      const updated = tables.map(t => t.id === snapshot.targetId ? { ...snapshot.previousTable! } : t);
      await posTableCacheService.saveTables(updated);
    } else {
      await posTableCacheService.clearTableOrderOptimistic(snapshot.targetId);
    }

    console.log('[RollbackHandler:SAVE_ORDER] ⚡ Đã khôi phục cart và trạng thái bàn về snapshot cũ (targetId:', snapshot.targetId, ')');
  });

  // ── DELETE ORDER (HỦY ĐƠN) ──────────────────────────────────────────────────
  registerQueueHandler<DeleteOrderJobPayload>(POS_JOB_TYPES.DELETE_ORDER, async (payload) => {
    const { storeId, model } = payload;
    const res: any = await deleteOrderCacheApi(storeId, model);

    if (res && (res.status === 412 || res.Status === 412 || (typeof res.status === 'number' && res.status >= 400) || (typeof res.Status === 'number' && res.Status >= 400))) {
      const errMsg =
        res.errors?.[0]?.message ||
        res.Errors?.[0]?.message ||
        res.errors?.[0] ||
        res.Errors?.[0] ||
        res.message ||
        'Gặp lỗi trong quá trình hủy đơn hàng';
      const customErr: any = new Error(errMsg);
      customErr.status = res.status || res.Status;
      customErr.errors = res.errors || res.Errors;
      throw customErr;
    }

    console.log('[QueueHandler:DELETE_ORDER] Kết quả hủy đơn từ server:', res);

    try {
      const orderRes: any = await getOrderFromCacheApi(storeId);
      const rawData = orderRes?.data?.result || orderRes?.data?.Result || orderRes?.data || orderRes?.result || [];
      const mappedOrders = mapOrderCacheToDeliveryNoteWithRoundsModel(rawData);
      await posOrderCacheService.saveOrders(mappedOrders);
    } catch (syncErr) {
      console.warn('[QueueHandler:DELETE_ORDER] Không thể đồng bộ ordersFromCache sau khi hủy đơn:', syncErr);
    }
  });

  registerQueueRollbackHandler<DeleteOrderRollbackPayload>(POS_JOB_TYPES.DELETE_ORDER, async (snapshot) => {
    if (snapshot.targetId && snapshot.items && snapshot.items.length > 0) {
      await posCartCacheService.saveTableCart(snapshot.targetId, snapshot.noteId, snapshot.items);
    }
  });

  // ── TRANSFER TABLE (CHUYỂN & TÁCH BÀN) ──────────────────────────────────
  registerQueueHandler<TransferTableJobPayload>(POS_JOB_TYPES.TRANSFER_TABLE, async (payload) => {
    const { storeId, request } = payload;
    const res: any = await transferTableApi(storeId, request);

    if (res && (res.status === 412 || res.Status === 412 || (typeof res.status === 'number' && res.status >= 400) || (typeof res.Status === 'number' && res.Status >= 400))) {
      const errMsg =
        res.errors?.[0]?.message ||
        res.Errors?.[0]?.message ||
        res.errors?.[0] ||
        res.Errors?.[0] ||
        res.message ||
        'Lỗi trong quá trình chuyển / tách bàn';
      const customErr: any = new Error(errMsg);
      customErr.status = res.status || res.Status;
      customErr.errors = res.errors || res.Errors;
      throw customErr;
    }

    console.log('[QueueHandler:TRANSFER_TABLE] Kết quả chuyển bàn từ server:', res);

    try {
      const orderRes: any = await getOrderFromCacheApi(storeId);
      const rawData = orderRes?.data?.result || orderRes?.data?.Result || orderRes?.data || orderRes?.result || [];
      const mappedOrders = mapOrderCacheToDeliveryNoteWithRoundsModel(rawData);
      if (mappedOrders && mappedOrders.length > 0) {
        await posOrderCacheService.saveOrders(mappedOrders);
      }
    } catch (syncErr) {
      console.warn('[QueueHandler:TRANSFER_TABLE] Không thể đồng bộ ordersFromCache sau khi chuyển bàn:', syncErr);
    }
  });

  registerQueueRollbackHandler<TransferTableRollbackPayload>(POS_JOB_TYPES.TRANSFER_TABLE, async (snapshot) => {
    // 1. Khôi phục giỏ hàng bàn nguồn
    if (snapshot.sourceCartItems && snapshot.sourceCartItems.length > 0) {
      await posCartCacheService.saveTableCart(snapshot.sourceTable.id, snapshot.sourceNoteId, snapshot.sourceCartItems);
    } else {
      await posCartCacheService.deleteTableCart(snapshot.sourceTable.id);
    }

    // 2. Khôi phục giỏ hàng bàn đích
    if (snapshot.targetCartItems && snapshot.targetCartItems.length > 0) {
      await posCartCacheService.saveTableCart(snapshot.targetTable.id, snapshot.targetNoteId, snapshot.targetCartItems);
    } else {
      await posCartCacheService.deleteTableCart(snapshot.targetTable.id);
    }

    // 3. Khôi phục trạng thái 2 bàn trong Dexie DB
    const tables = await posTableCacheService.getTables();
    const updated = tables.map(t => {
      if (t.id === snapshot.sourceTable.id) return { ...snapshot.sourceTable };
      if (t.id === snapshot.targetTable.id) return { ...snapshot.targetTable };
      return t;
    });
    await posTableCacheService.saveTables(updated);

    console.log(`[RollbackHandler:TRANSFER_TABLE] ⚡ Đã hoàn tác giỏ hàng & trạng thái của Bàn #${snapshot.sourceTable.id} và Bàn #${snapshot.targetTable.id}`);
  });

  // ── APPROVE NOTE ITEMS (DUYỆT MÓN) ───────────────────────────────────────
  registerQueueHandler<import('./posQueue.types').HandleNoteItemsJobPayload>(POS_JOB_TYPES.APPROVE_NOTE_ITEMS, async (payload) => {
    const { approveNoteItemsApi } = await import('@/features/pos/api/posOrderManagementApi');
    await approveNoteItemsApi(payload.storeId, payload);
    console.log('[QueueHandler:APPROVE_NOTE_ITEMS] ✅ Đã duyệt món trên server:', payload);
  });

  registerQueueRollbackHandler<import('./posQueue.types').HandleNoteItemsRollbackPayload>(POS_JOB_TYPES.APPROVE_NOTE_ITEMS, async (snapshot) => {
    await posOrderCacheService.updateItemStatus(snapshot.noteId, snapshot.noteItemIds, snapshot.previousStatus);
    console.log('[RollbackHandler:APPROVE_NOTE_ITEMS] ⚡ Đã hoàn tác trạng thái món về:', snapshot.previousStatus);
  });

  // ── REJECT NOTE ITEMS (TỪ CHỐI MÓN) ──────────────────────────────────────
  registerQueueHandler<import('./posQueue.types').HandleNoteItemsJobPayload>(POS_JOB_TYPES.REJECT_NOTE_ITEMS, async (payload) => {
    const { rejectNoteItemsApi } = await import('@/features/pos/api/posOrderManagementApi');
    await rejectNoteItemsApi(payload.storeId, payload);
    console.log('[QueueHandler:REJECT_NOTE_ITEMS] ✅ Đã từ chối món trên server:', payload);
  });

  registerQueueRollbackHandler<import('./posQueue.types').HandleNoteItemsRollbackPayload>(POS_JOB_TYPES.REJECT_NOTE_ITEMS, async (snapshot) => {
    await posOrderCacheService.updateItemStatus(snapshot.noteId, snapshot.noteItemIds, snapshot.previousStatus);
    console.log('[RollbackHandler:REJECT_NOTE_ITEMS] ⚡ Đã hoàn tác trạng thái món về:', snapshot.previousStatus);
  });

  // ── SYNC ORDERS FROM CACHE (ĐỒNG BỘ ĐƠN HÀNG TỪ SERVER) ──────────────────
  registerQueueHandler<import('./posQueue.types').SyncOrdersJobPayload>(POS_JOB_TYPES.SYNC_ORDERS_FROM_CACHE, async (payload) => {
    await posOrderCacheService.syncOrdersFromServer(payload.storeId);
    console.log('[QueueHandler:SYNC_ORDERS_FROM_CACHE] Đã đồng bộ toàn bộ đơn hàng vào Dexie DB.');
  });

  console.log('[PosQueue] ✅ Đã đăng ký tất cả handlers:', Object.values(POS_JOB_TYPES));
}
