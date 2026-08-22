/**
 * 🎯 usePosQueue — Vue Composable cho POS Queue Service
 *
 * Wrap posQueueService thành reactive composable, dễ dùng trong bất kỳ component nào.
 *
 * @example
 * const { enqueue, isOffline, pendingCount, failedJobs } = usePosQueue();
 *
 * // Lưu snapshot trước khi optimistic update
 * const snapshot: SaveOrderRollbackPayload = {
 *   targetId: targetId.value,
 *   noteId: noteId.value,
 *   items: JSON.parse(JSON.stringify(cartItems.value))
 * };
 *
 * // Optimistic update
 * cartItems.value.push(newItem);
 *
 * // Đẩy vào queue — tự động pause nếu offline, resume khi có mạng
 * // Nếu lỗi server (sau 2 lần gọi) → onFailed rollback UI + rollbackPayload rollback Dexie
 * await enqueue(POS_JOB_TYPES.SAVE_ORDER, { storeId, model: payload }, {
 *   rollbackPayload: snapshot,
 *   onFailed: () => {
 *     cartItems.value = snapshot.items;
 *     toast.error('Lỗi đồng bộ dữ liệu! Đã hoàn lại thao tác.');
 *   }
 * });
 */
import {
  enqueueJob,
  clearFailedJobs,
  retryFailedJobs,
  queueIsProcessing,
  queuePendingCount,
  queueFailedJobs,
  queueIsOffline
} from '@/services/posQueue/posQueueService';
import type { EnqueueOptions } from '@/services/posQueue/posQueueService';
import type { PosJobType } from '@/services/posQueue/posQueueHandlers';

export function usePosQueue() {
  /**
   * ⚡ Thêm job vào hàng chờ.
   * Non-blocking — trả về ngay.
   * Nếu offline: job vẫn lưu vào Dexie, tự động xử lý khi có mạng trở lại.
   */
  async function enqueue<T = any>(
    type: PosJobType | string,
    payload: T,
    options?: EnqueueOptions
  ): Promise<string> {
    return enqueueJob(type, payload, options);
  }

  /**
   * 🗑️ Xóa tất cả job bị lỗi (dọn dẹp thủ công).
   */
  async function clearFailed(): Promise<void> {
    return clearFailedJobs();
  }

  /**
   * 🔁 Thử lại tất cả job bị lỗi.
   * Chỉ thực sự chạy nếu đang online.
   */
  async function retryFailed(): Promise<void> {
    return retryFailedJobs();
  }

  return {
    // Actions
    enqueue,
    clearFailed,
    retryFailed,

    // Reactive state (readonly để tránh mutation bên ngoài)
    isProcessing: queueIsProcessing,
    pendingCount:  queuePendingCount,
    failedJobs:    queueFailedJobs,
    isOffline:     queueIsOffline
  };
}
