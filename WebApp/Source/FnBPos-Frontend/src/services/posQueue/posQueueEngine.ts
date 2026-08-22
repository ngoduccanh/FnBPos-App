import { db } from '../posDexieDB/posDatabase';
import { checkIsOnline } from '../useNetworkStatus';
import { queueIsProcessing, syncQueueState } from './posQueueState';
import { posQueueRegistry } from './posQueueRegistry';
import { queueSleep, extractQueueErrorMessage } from './posQueueHelpers';

const RETRY_BASE_DELAY_MS = 1000;
let _isRunning = false;

/**
 * ⚙️ POS QUEUE ENGINE
 * Core xử lý tuần tự FIFO các job trong IndexedDB:
 * 1. Kiểm tra trạng thái mạng Online/Offline
 * 2. Thực thi API với cơ chế retry lũy tiến (Exponential Backoff)
 * 3. Ngắt retry ngay lập tức khi gặp lỗi nghiệp vụ 4xx (400, 401, 403, 412, 422)
 * 4. Kích hoạt Callback / Rollback tự động khi hoàn thành hoặc thất bại
 */
export async function runPosQueue(): Promise<void> {
  // ── Không chạy nếu đang offline ──────────────────────────────────────────
  if (!checkIsOnline()) {
    console.log('[PosQueueEngine] 📡 Offline — queue tạm dừng, chờ có mạng...');
    return;
  }

  // ── Chặn chạy song song ──────────────────────────────────────────────────
  if (_isRunning) return;

  _isRunning = true;
  queueIsProcessing.value = true;

  try {
    // Lấy job kế tiếp (pending, FIFO theo createdAt)
    while (true) {
      // Re-check offline trước mỗi job (có thể mất mạng giữa chừng)
      if (!checkIsOnline()) {
        console.log('[PosQueueEngine] 📡 Mất mạng giữa chừng — tạm dừng, giữ các job ở pending...');
        return;
      }

      const job = await db.queueJobs
        .where('status')
        .equals('pending')
        .sortBy('createdAt')
        .then(jobs => jobs[0]);

      if (!job) break; // Hết job -> Thoát vòng lặp

      // Đánh dấu đang xử lý
      await db.queueJobs.update(job.id, { status: 'processing' });
      await syncQueueState();

      const handler = posQueueRegistry.getHandler(job.type);

      if (!handler) {
        console.warn(`[PosQueueEngine] Không tìm thấy handler cho job type: "${job.type}"`);
        await db.queueJobs.update(job.id, {
          status: 'failed',
          error: `Không có handler cho type "${job.type}"`
        });
        await syncQueueState();
        continue;
      }

      // ── Thực thi với retry ───────────────────────────────────────────────
      let success = false;
      let lastError = '';

      for (let attempt = 0; attempt <= job.maxRetry; attempt++) {
        try {
          if (attempt > 0) {
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
            console.log(`[PosQueueEngine] Retry #${attempt} cho job "${job.type}" (${job.id}) sau ${delay}ms...`);
            await queueSleep(delay);
          }

          await handler(job.payload);
          success = true;
          break;

        } catch (err: any) {
          // ── Offline phát hiện trong lúc retry ────────────────────────────
          if (!checkIsOnline()) {
            console.log(`[PosQueueEngine] 📡 Mất mạng trong lúc retry — reset job về pending: "${job.type}" (${job.id})`);
            await db.queueJobs.update(job.id, {
              status: 'pending',
              retryCount: 0,
              error: undefined
            });
            await syncQueueState();
            return;
          }

          // ── Trích xuất message lỗi từ server ─────────────────────────────
          lastError = extractQueueErrorMessage(err);
          console.error(`[PosQueueEngine] Lỗi attempt ${attempt + 1}/${job.maxRetry + 1} — job "${job.type}" (${job.id}):`, err);

          await db.queueJobs.update(job.id, {
            retryCount: attempt + 1,
            error: lastError
          });

          // ── Lỗi nghiệp vụ / Client Error 4xx (400, 401, 403, 412, 422) ──
          // KHÔNG RETRY! Dừng ngay lập tức để rollback và báo lỗi cho người dùng.
          const status = err?.status || err?.Status || err?.response?.status;
          const isClientError = status && status >= 400 && status < 500;

          if (isClientError) {
            console.warn(`[PosQueueEngine] 🛑 Lỗi nghiệp vụ (${status}): "${lastError}" -> Dừng retry ngay để rollback.`);
            break;
          }
        }
      }

      // ── Kết quả sau retry ────────────────────────────────────────────────
      if (success) {
        await db.queueJobs.delete(job.id);
        console.log(`[PosQueueEngine] ✅ Job hoàn thành: "${job.type}" (${job.id})`);

        const onSuccess = posQueueRegistry.getSuccessCallback(job.id);
        if (onSuccess) {
          try {
            await onSuccess();
          } catch (scErr) {
            console.error(`[PosQueueEngine] Lỗi trong onSuccess callback của job "${job.type}" (${job.id}):`, scErr);
          } finally {
            posQueueRegistry.deleteSuccessCallback(job.id);
          }
        }
        posQueueRegistry.deleteFailedCallback(job.id);

      } else {
        // Hết retry hoặc lỗi nghiệp vụ 4xx -> failed
        await db.queueJobs.update(job.id, { status: 'failed' });
        console.error(`[PosQueueEngine] ❌ Job thất bại: "${job.type}" (${job.id}) - Lý do: ${lastError}`);
        posQueueRegistry.deleteSuccessCallback(job.id);

        // ── ROLLBACK ──────────────────────────────────────────────────────
        // 1. Luôn thực thi rollbackHandler đã đăng ký (nếu có rollbackPayload)
        if (job.rollbackPayload !== undefined) {
          const rollbackHandler = posQueueRegistry.getRollbackHandler(job.type);
          if (rollbackHandler) {
            try {
              console.log(`[PosQueueEngine] 🔄 Thực thi Rollback Handler cho job "${job.type}" (${job.id})...`, job.rollbackPayload);
              await rollbackHandler(job.rollbackPayload);
            } catch (rbErr) {
              console.error(`[PosQueueEngine] Lỗi trong rollback handler của job "${job.type}" (${job.id}):`, rbErr);
            }
          } else {
            console.warn(`[PosQueueEngine] ⚠️ Không tìm thấy rollback handler cho "${job.type}" dù có rollbackPayload.`);
          }
        }

        // 2. Kích hoạt onFailed callback để hiển thị thông báo toast / refresh UI
        const onFailed = posQueueRegistry.getFailedCallback(job.id);
        if (onFailed) {
          try {
            console.log(`[PosQueueEngine] 🔄 Callback (onFailed) cho job "${job.type}" (${job.id})...`);
            await onFailed(lastError);
          } catch (cbErr) {
            console.error(`[PosQueueEngine] Lỗi trong onFailed callback của job "${job.type}" (${job.id}):`, cbErr);
          } finally {
            posQueueRegistry.deleteFailedCallback(job.id);
          }
        }
      }

      await syncQueueState();
    }

  } finally {
    _isRunning = false;
    queueIsProcessing.value = false;
    await syncQueueState();
  }
}
