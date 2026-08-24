import { getRemoteUrl } from '@/services/apiClient';

// Map lưu trữ các request đang chạy trên đường truyền (In-flight Request Deduplication)
const inFlightRequests = new Map<string, Promise<any>>();

export const getOrderDetailApi = (storeId: number, noteId: number, targetId: number) => {
  const requestKey = `${storeId}_${noteId}_${targetId}`;

  // Nếu request của bàn này đang bay, tái sử dụng Promise thay vì tạo thêm request
  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  const promise = getRemoteUrl<any>(`/api/posSale/${storeId}/getOrderDetail`, {
    noteId,
    targetId
  }).finally(() => {
    inFlightRequests.delete(requestKey);
  });

  inFlightRequests.set(requestKey, promise);
  return promise;
};
