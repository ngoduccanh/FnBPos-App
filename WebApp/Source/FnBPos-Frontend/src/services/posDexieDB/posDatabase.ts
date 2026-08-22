import Dexie, { type Table } from 'dexie';
import type { PosTableItem, PosTableAreaGroup } from '@/features/pos/types/tables.types';
import type { PosProductItem } from '@/features/pos/types/products.types';
import type { DeliveryNoteWithRoundsModel } from '@/shared/types/deliveryNote.types';
import type { TableCartCacheRecord } from '@/features/pos/types/cartCache.types';
import type { PosQueueJob } from '../posQueue/posQueueService';
import type { HomeViewModelData } from '@/shared/types/storeSession.types';

// ─── TYPES CHO CACHE MỚI ────────────────────────────────────────────────────

/** Record lưu HomeViewModel theo storeId */
export interface HomeViewModelCacheRecord {
  storeId: number;           // primary key
  data: HomeViewModelData;   // toàn bộ response
  cachedAt: number;          // timestamp ms — dùng để kiểm tra TTL nếu cần
}

/** Record lưu danh sách khu vực bàn theo storeId */
export interface TableAreaCacheRecord {
  storeId: number;           // primary key
  groups: PosTableAreaGroup[];
  cachedAt: number;
}

/** Record lưu QR code của bàn theo targetId */
export interface TableQrCacheRecord {
  targetId: number;          // primary key (ID Bàn)
  storeId: number;
  qrBase64: string;          // Chuỗi Base64 ảnh QR
  cachedAt: number;
}

// ─── DATABASE ────────────────────────────────────────────────────────────────

export class PosDatabase extends Dexie {
  tablesCache!: Table<PosTableItem, number>;
  ordersCache!: Table<DeliveryNoteWithRoundsModel, number>;
  productsCache!: Table<PosProductItem, number>;
  productGroupsCache!: Table<PosTableAreaGroup, number>;
  cartItemsCache!: Table<TableCartCacheRecord, number>;
  queueJobs!: Table<PosQueueJob, string>;
  homeViewModelCache!: Table<HomeViewModelCacheRecord, number>;
  tableAreaCache!: Table<TableAreaCacheRecord, number>;
  tableQrCache!: Table<TableQrCacheRecord, number>;

  constructor() {
    super('PosDatabase');

    this.version(3).stores({
      tablesCache: '++id, code, name, storeId, note, groupId, groupName, status, activated, typeId',
      ordersCache: '++id, noteId, targetId, noteNumber, customerName, totalAmount, prodCount, timeStarted',
      productsCache: '++productId, productCode, productName, groupId, groupName, barcode, isPos',
      productGroupsCache: '++id, name, typeId',
      cartItemsCache: 'targetId, noteId'
    });

    this.version(4).stores({
      tablesCache: '++id, code, name, storeId, note, groupId, groupName, status, activated, typeId',
      ordersCache: '++id, noteId, targetId, noteNumber, customerName, totalAmount, prodCount, timeStarted',
      productsCache: '++productId, productCode, productName, groupId, groupName, barcode, isPos',
      productGroupsCache: '++id, name, typeId',
      cartItemsCache: 'targetId, noteId',
      queueJobs: 'id, type, status, createdAt'
    });

    // Version 5: Thêm cache cho HomeViewModel & TableArea
    // Persist qua F5, không cần gọi lại API khi reload
    this.version(5).stores({
      tablesCache: '++id, code, name, storeId, note, groupId, groupName, status, activated, typeId',
      ordersCache: '++id, noteId, targetId, noteNumber, customerName, totalAmount, prodCount, timeStarted',
      productsCache: '++productId, productCode, productName, groupId, groupName, barcode, isPos',
      productGroupsCache: '++id, name, typeId',
      cartItemsCache: 'targetId, noteId',
      queueJobs: 'id, type, status, createdAt',
      homeViewModelCache: 'storeId, cachedAt',
      tableAreaCache: 'storeId, cachedAt'
    });

    // Version 6: Thêm cache offline cho Mã QR Gọi món của Bàn (Table QR Code)
    this.version(6).stores({
      tablesCache: '++id, code, name, storeId, note, groupId, groupName, status, activated, typeId',
      ordersCache: '++id, noteId, targetId, noteNumber, customerName, totalAmount, prodCount, timeStarted',
      productsCache: '++productId, productCode, productName, groupId, groupName, barcode, isPos',
      productGroupsCache: '++id, name, typeId',
      cartItemsCache: 'targetId, noteId',
      queueJobs: 'id, type, status, createdAt',
      homeViewModelCache: 'storeId, cachedAt',
      tableAreaCache: 'storeId, cachedAt',
      tableQrCache: 'targetId, storeId, cachedAt'
    });
  }
}

export const db = new PosDatabase();

/**
 * 🧹 XÓA SẠCH TOÀN BỘ BỘ NHỚ DEXIE DB
 * Được gọi khi: Đăng xuất, Đăng nhập mới, hoặc Đổi cửa hàng (Switch Store)
 */
export async function clearAllPosDatabase(keepQueue = false): Promise<void> {
  try {
    const promises = [
      db.tablesCache.clear(),
      db.ordersCache.clear(),
      db.productsCache.clear(),
      db.productGroupsCache.clear(),
      db.cartItemsCache.clear(),
      db.homeViewModelCache.clear(),
      db.tableAreaCache.clear(),
      db.tableQrCache.clear()
    ];
    if (!keepQueue) {
      promises.push(db.queueJobs.clear());
    }
    await Promise.all(promises);
    console.log('[PosDatabase] 🧹 Đã xóa sạch toàn bộ Dexie DB (Cache cửa hàng cũ đã được xóa hoàn toàn)!');
  } catch (err) {
    console.error('[PosDatabase] Lỗi khi xóa Dexie DB:', err);
  }
}
