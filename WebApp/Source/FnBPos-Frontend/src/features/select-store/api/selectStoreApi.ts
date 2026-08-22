import { postRemoteUrl } from '@/services/apiClient';
import type { BaseDbObject } from '@/shared/types/baseObject.types';
import { DEFAULT_GET_STORES_PARAMS } from '../constants/selectStore.constants';

export const getStoresListingApi = (params?: Partial<BaseDbObject>) => {
  return postRemoteUrl<any>('/api/ObjectMan/GetObjectListingData', {
    ...DEFAULT_GET_STORES_PARAMS,
    ...params
  });
};
