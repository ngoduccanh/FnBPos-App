import {postRemoteUrl} from '@/services/apiClient';
import type { TableQrRequestModel, TableQrResponse } from '../types/tableQr.types';


export const getTableQrCodeApi = (storeId: number, targetId: number) => {
  const payload: TableQrRequestModel = { targetId };
  return postRemoteUrl<TableQrResponse>(
    `/api/posSale/${storeId}/tableQrCode`,
    payload
  );
};
