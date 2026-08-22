import { db } from '../posDexieDB/posDatabase';
import type { PosQueueJob, EnqueueOptions, JobHandler, RollbackHandler } from './posQueue.types';
import { syncQueueState } from './posQueueState';
import { posQueueRegistry } from './posQueueRegistry';
import { generateQueueJobId } from './posQueueHelpers';
import { runPosQueue } from './posQueueEngine';

export * from './posQueue.types';
export * from './posQueueState';

const MAX_RETRY_DEFAULT = 1;

/**
 * 📝 Đăng ký handler (API caller) cho 1 loại job.
 */
export function registerQueueHandler<T = any>(type: string, handler: JobHandler<T>): void {
  posQueueRegistry.registerHandler(type, handler);
}

/**
 * 📝 Đăng ký rollback handler cho 1 loại job.
 */
export function registerQueueRollbackHandler<T = any>(type: string, handler: RollbackHandler<T>): void {
  posQueueRegistry.registerRollbackHandler(type, handler);
}

/**
 * 🔌 Nối queue với network status service.
 * Lắng nghe sự kiện 'online' → tự động resume queue khi có mạng trở lại.
 */
export function initQueueResumeOnOnline(): void {
  window.addEventListener('online', () => {
    console.log('[PosQueueService] 🌐 Có mạng trở lại — tiếp tục xử lý queue...');
    runPosQueue();
  });
}

/**
 * ⚡ Thêm 1 job vào hàng chờ và bắt đầu xử lý ngay (nếu đang online).
 * Persist vào Dexie → không mất khi reload trang hay offline.
 */
export async function enqueueJob<T = any>(
  type: string,
  payload: T,
  options?: EnqueueOptions
): Promise<string> {
  const job: PosQueueJob<T> = {
    id: generateQueueJobId(),
    type,
    payload,
    // rollbackPayload lưu vào Dexie (strip Vue Proxy để tránh DataCloneError)
    ...(options?.rollbackPayload !== undefined && {
      rollbackPayload: JSON.parse(JSON.stringify(options.rollbackPayload))
    }),
    status: 'pending',
    retryCount: 0,
    maxRetry: options?.maxRetry ?? MAX_RETRY_DEFAULT,
    createdAt: Date.now()
  };

  // onFailed & onSuccess lưu in-memory
  if (options?.onFailed) {
    posQueueRegistry.setFailedCallback(job.id, options.onFailed);
  }
  if (options?.onSuccess) {
    posQueueRegistry.setSuccessCallback(job.id, options.onSuccess);
  }

  await db.queueJobs.add(job);
  await syncQueueState();

  console.log(`[PosQueueService] 📥 Enqueued job: "${type}" (${job.id})`);

  // Kích hoạt queue (non-blocking) — tự bỏ qua nếu đang offline
  runPosQueue();

  return job.id;
}

export const enqueuePosJob = enqueueJob;

/**
 * 🔄 Khởi động lại queue khi app load.
 * Xử lý các job pending còn sót từ lần trước (offline hoặc reload giữa chừng).
 */
export async function resumeQueueOnStartup(): Promise<void> {
  // Reset các job bị stuck ở 'processing' (do reload/crash giữa chừng)
  await db.queueJobs
    .where('status')
    .equals('processing')
    .modify({ status: 'pending', retryCount: 0 });

  await syncQueueState();

  const pendingCount = await db.queueJobs
    .where('status')
    .equals('pending')
    .count();

  if (pendingCount > 0) {
    console.log(`[PosQueueService] 🔄 Phát hiện ${pendingCount} job chưa xử lý từ phiên trước. Tiếp tục...`);
    runPosQueue();
  }
}

/**
 * 🗑️ Xóa tất cả job failed (dọn dẹp thủ công).
 */
export async function clearFailedJobs(): Promise<void> {
  await db.queueJobs.where('status').equals('failed').delete();
  await syncQueueState();
}

/**
 * 🔁 Retry tất cả job failed (thủ công từ UI).
 */
export async function retryFailedJobs(): Promise<void> {
  await db.queueJobs
    .where('status')
    .equals('failed')
    .modify({ status: 'pending', retryCount: 0, error: undefined });

  await syncQueueState();
  runPosQueue();
}
