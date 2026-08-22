import { postRemoteUrl } from '@/services/apiClient';
import { DEFAULT_GET_PRODUCT_GROUP_PARAMS } from '../contants/productGroupContants';
import type { BaseDbObject } from '@/shared/types/baseObject.types';

export const getProductGroupOptionsApi = (storeId: number, params?: Partial<BaseDbObject>) => {
  return postRemoteUrl<any>(`/api/ObjectMan/${storeId}/Objects`, {
    ...DEFAULT_GET_PRODUCT_GROUP_PARAMS,
    ...params
  });
};
