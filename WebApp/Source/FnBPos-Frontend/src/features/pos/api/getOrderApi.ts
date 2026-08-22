import { postRemoteUrl } from '@/services/apiClient';
import { ORDER_FROM_CACHE_CONSTANTS } from '../contants/orderFromCacheContants';

export const getOrderFromCacheApi = (storeId: number, params?: any) => {
  return postRemoteUrl<any>(`/api/posSale/${storeId}/ordersFromCache`, {
    ...ORDER_FROM_CACHE_CONSTANTS,
    ...params
  });
};
