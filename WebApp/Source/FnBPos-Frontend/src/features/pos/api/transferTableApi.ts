import {postRemoteUrl} from '@/services/apiClient';
import type { TableTransferRequest, TransferTableResponse } from '../types/tableTransfer.types';

/**
 * ⇆ GỌI API CHUYỂN & TÁCH BÀN
 * Endpoint: POST /api/posSale/{storeId}/transferTable
 */
export const transferTableApi = (storeId: number, payload: TableTransferRequest) => {
  return postRemoteUrl<TransferTableResponse>(
    `/api/posSale/${storeId}/transferTable`,
    payload
  );
};
