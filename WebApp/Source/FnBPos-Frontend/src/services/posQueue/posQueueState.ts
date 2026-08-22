import { ref } from 'vue';
import { db } from '../posDexieDB/posDatabase';
import { networkIsOffline } from '../useNetworkStatus';
import type { PosQueueJob } from './posQueue.types';

// ─────────────────────────────────────────────────────────────────────────────
// REACTIVE STATE (dùng trong Vue composable & template)
// ─────────────────────────────────────────────────────────────────────────────

/** Queue đang xử lý job? */
export const queueIsProcessing = ref<boolean>(false);

/** Số job đang chờ / đang xử lý. */
export const queuePendingCount = ref<number>(0);

/** Danh sách job đã thất bại (sau tất cả retry). */
export const queueFailedJobs = ref<PosQueueJob[]>([]);

/**
 * Trạng thái mạng — re-export từ useNetworkStatus (singleton dùng chung).
 * true  → offline: queue tự pause, không gọi API, job giữ nguyên pending.
 * false → online:  queue tự resume khi có mạng.
 */
export const queueIsOffline = networkIsOffline;

/**
 * 🔄 Đồng bộ reactive state với IndexedDB (Dexie)
 */
export async function syncQueueState(): Promise<void> {
  const pending = await db.queueJobs
    .where('status')
    .anyOf(['pending', 'processing'])
    .count();
  queuePendingCount.value = pending;

  const failed = await db.queueJobs
    .where('status')
    .equals('failed')
    .toArray();
  queueFailedJobs.value = failed;
}
