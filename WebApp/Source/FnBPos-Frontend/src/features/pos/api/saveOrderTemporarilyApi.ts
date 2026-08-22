import { postRemoteUrl } from '@/services/apiClient';
import type { SaveOrderTemporarilyModel } from '../types/saveOrderTemporarily.types';

export const saveOrderTemporarilyApi = (storeId: number, model: SaveOrderTemporarilyModel) => {
  return postRemoteUrl<any>(`/api/posSale/${storeId}/saveOrderTemporarily`, model);
};
