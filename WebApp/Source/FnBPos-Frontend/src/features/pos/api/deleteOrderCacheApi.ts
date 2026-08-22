import { postRemoteUrl } from '@/services/apiClient';
import type { DeleteDeliveryRequestModel } from '../types/deleteOrderCache.types';

/**
 * ⚡ API Hủy đơn hàng từ cache (deleteOrderCache)
 * @param storeId ID chi nhánh/cửa hàng
 * @param model Model thông tin hủy đơn
 */
export const deleteOrderCacheApi = (storeId: number, model: DeleteDeliveryRequestModel) => {
  return postRemoteUrl<any>(`/api/posSale/${storeId}/deleteOrderCache`, model);
};
