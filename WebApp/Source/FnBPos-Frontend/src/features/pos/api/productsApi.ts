import { postRemoteUrl } from '@/services/apiClient';
import { DEFAULT_PRODUCT_FILTER_PARAMS } from '../contants/productContants';
import type { ProductFilterParams } from '../types/products.types';

export const getListProductApi = (storeId: number, params?: Partial<ProductFilterParams>) => {
  return postRemoteUrl<any>(`/api/productMan/${storeId}/getListProduct`, {
    storeId,
    ...DEFAULT_PRODUCT_FILTER_PARAMS,
    ...params
  });
};
