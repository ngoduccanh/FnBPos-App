import { postRemoteUrl } from '@/services/apiClient';
import { DEFAULT_GET_TABLE_PARAMS } from '../contants/tableContants';
import type { BaseDbObject } from '@/shared/types/baseObject.types';

export const getTableOptionsApi = (storeId: number, params?: Partial<BaseDbObject>) => {
  return postRemoteUrl<any>(`/api/ObjectMan/${storeId}/Objects`, {
    ...DEFAULT_GET_TABLE_PARAMS,
    ...params
  });
};
