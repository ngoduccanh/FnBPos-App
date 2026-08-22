import { postRemoteUrl } from '@/services/apiClient';
import type { BaseApiResponse } from '@/shared/types/base.types';
import type { HomeViewModelData } from '../types/storeSession.types';

export const getHomeViewModelApi = (storeId: number) => {
  return postRemoteUrl<BaseApiResponse<{ homeViewModel: HomeViewModelData }>>(
    `/api/ObjectMan/${storeId}/GetHomeViewModel`
  );
};

