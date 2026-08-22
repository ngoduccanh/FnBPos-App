import { getRemoteUrl } from '@/services/apiClient';

export const getOrderDetailApi = (storeId: number, noteId: number, targetId: number) => {
  return getRemoteUrl<any>(`/api/posSale/${storeId}/getOrderDetail`, {
    noteId,
    targetId
  });
};
