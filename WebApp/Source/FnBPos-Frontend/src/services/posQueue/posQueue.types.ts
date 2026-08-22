import type { CartItem } from '@/features/pos/mappers/orderDetailMapper';
import type { PosTableItem } from '@/features/pos/types/tables.types';
import type { SaveOrderTemporarilyModel } from '@/features/pos/types/saveOrderTemporarily.types';
import type { DeleteDeliveryRequestModel } from '@/features/pos/types/deleteOrderCache.types';

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE JOB STATUS & CORE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PosQueueJobStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface PosQueueJob<T = any> {
  id: string;               // UUID duy nhất
  type: string;             // 'SAVE_ORDER' | 'DELETE_ORDER' | ...
  payload: T;               // Dữ liệu cần xử lý
  rollbackPayload?: any;    // Snapshot dùng để rollback khi fail
  status: PosQueueJobStatus;
  retryCount: number;       // Số lần đã thử
  maxRetry: number;         // Tối đa retry (default 1 → tổng 2 lần gọi)
  createdAt: number;        // timestamp ms
  error?: string;           // Lỗi gần nhất
}

export interface EnqueueOptions {

  maxRetry?: number;

  rollbackPayload?: any;

  onFailed?: (errorMessage: string) => void | Promise<void>;

  onSuccess?: () => void | Promise<void>;
}

export type JobHandler<T = any>      = (payload: T) => Promise<void>;
export type RollbackHandler<T = any> = (rollbackPayload: T) => Promise<void>;
 
export interface SaveOrderJobPayload {
  storeId: number;
  model: SaveOrderTemporarilyModel;
}

export interface DeleteOrderJobPayload {
  storeId: number;
  model: DeleteDeliveryRequestModel;
}

export interface SaveOrderRollbackPayload {
  targetId: number;             // ID bàn (khóa của cartItemsCache)
  noteId: number;               // ID phiếu giao hàng
  items: CartItem[];            // Danh sách món cũ (trước khi thêm/sửa)
  previousTable?: PosTableItem; // Snapshot trạng thái bàn trước khi đặt món
}

export interface DeleteOrderRollbackPayload {
  targetId: number;
  noteId: number;
  items: CartItem[];
}

export interface TransferTableJobPayload {
  storeId: number;
  request: import('@/features/pos/types/tableTransfer.types').TableTransferRequest;
}

export interface TransferTableRollbackPayload {
  sourceTable: PosTableItem;
  targetTable: PosTableItem;
  sourceCartItems: CartItem[];
  targetCartItems: CartItem[];
  sourceNoteId: number;
  targetNoteId: number;
}

export interface HandleNoteItemsJobPayload {
  storeId: number;
  noteId: number;
  noteItemIds: number[];
}

export interface HandleNoteItemsRollbackPayload {
  noteId: number;
  noteItemIds: number[];
  previousStatus: number;
}

export interface SyncOrdersJobPayload {
  storeId: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB TYPE CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const POS_JOB_TYPES = {
  SAVE_ORDER: 'SAVE_ORDER',
  DELETE_ORDER: 'DELETE_ORDER',
  TRANSFER_TABLE: 'TRANSFER_TABLE',
  APPROVE_NOTE_ITEMS: 'APPROVE_NOTE_ITEMS',
  REJECT_NOTE_ITEMS: 'REJECT_NOTE_ITEMS',
  SYNC_ORDERS_FROM_CACHE: 'SYNC_ORDERS_FROM_CACHE',
  SYNC_SERVER_DATA: 'SYNC_SERVER_DATA'
} as const;

export type PosJobType = typeof POS_JOB_TYPES[keyof typeof POS_JOB_TYPES];
