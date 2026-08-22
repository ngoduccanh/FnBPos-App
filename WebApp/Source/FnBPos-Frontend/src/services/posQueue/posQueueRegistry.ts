import type { JobHandler, RollbackHandler } from './posQueue.types';

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

/** Map job type → hàm gọi API */
const _handlers = new Map<string, JobHandler>();

/** Map job type → hàm rollback */
const _rollbackHandlers = new Map<string, RollbackHandler>();

/** Map jobId → onFailed callback (in-memory per session) */
const _failedCallbacks = new Map<string, (errorMessage: string) => void | Promise<void>>();

/** Map jobId → onSuccess callback (in-memory per session) */
const _successCallbacks = new Map<string, () => void | Promise<void>>();

export const posQueueRegistry = {
  // 1. API Handlers
  registerHandler<T = any>(type: string, handler: JobHandler<T>): void {
    _handlers.set(type, handler as JobHandler);
  },
  getHandler(type: string): JobHandler | undefined {
    return _handlers.get(type);
  },

  // 2. Rollback Handlers
  registerRollbackHandler<T = any>(type: string, handler: RollbackHandler<T>): void {
    _rollbackHandlers.set(type, handler as RollbackHandler);
  },
  getRollbackHandler(type: string): RollbackHandler | undefined {
    return _rollbackHandlers.get(type);
  },

  // 3. Failed Callbacks
  setFailedCallback(jobId: string, callback: (errorMessage: string) => void | Promise<void>): void {
    _failedCallbacks.set(jobId, callback);
  },
  getFailedCallback(jobId: string): ((errorMessage: string) => void | Promise<void>) | undefined {
    return _failedCallbacks.get(jobId);
  },
  deleteFailedCallback(jobId: string): void {
    _failedCallbacks.delete(jobId);
  },

  // 4. Success Callbacks
  setSuccessCallback(jobId: string, callback: () => void | Promise<void>): void {
    _successCallbacks.set(jobId, callback);
  },
  getSuccessCallback(jobId: string): (() => void | Promise<void>) | undefined {
    return _successCallbacks.get(jobId);
  },
  deleteSuccessCallback(jobId: string): void {
    _successCallbacks.delete(jobId);
  }
};
