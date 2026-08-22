import { getRemoteUrl } from '@/services/apiClient';
import type { ChildStoreOption, ChildStoresResponse } from '../types/childStores.types';

export type { ChildStoreOption, ChildStoresResponse };

export const getChildStoresApi = (storeId: number) => {
  return getRemoteUrl<ChildStoresResponse | ChildStoreOption[]>(
    `/api/posSale/${storeId}/getChildStores`
  );
};
