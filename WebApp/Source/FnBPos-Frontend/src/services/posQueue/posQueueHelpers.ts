/**
 * 🛠️ POS QUEUE HELPERS
 * Các tiện ích hỗ trợ tạo ID, sleep và trích xuất message lỗi từ server.
 */

export function generateQueueJobId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function queueSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 🔍 Trích xuất thông báo lỗi chính xác từ response của Server
 */
export function extractQueueErrorMessage(err: any): string {
  const extractedMsg =
    err?.errors?.[0]?.message ||
    err?.Errors?.[0]?.message ||
    err?.errors?.[0] ||
    err?.Errors?.[0] ||
    err?.response?.data?.errors?.[0]?.message ||
    err?.response?.data?.Errors?.[0]?.message ||
    err?.response?.data?.errors?.[0] ||
    err?.response?.data?.Errors?.[0] ||
    err?.response?.data?.message ||
    err?.message;

  return (extractedMsg && typeof extractedMsg === 'string' && extractedMsg.trim() && !extractedMsg.includes('status code 412'))
    ? extractedMsg
    : '';
}
