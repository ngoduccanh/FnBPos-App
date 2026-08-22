import { postRemoteUrl, getRemoteUrl } from '@/services/apiClient';
import type { GenVietQrModel, GenVietQrResponse } from '../types/bidv.types';

/**
 * API Tạo Mã QR Thanh Toán BIDV (Gen VietQR)
 * Endpoint: /api/testbidv/gen-qr
 */
export const genBidvQrApi = (model: GenVietQrModel) => {
  return postRemoteUrl<GenVietQrResponse>('/api/testbidv/gen-qr', model);
};

/**
 * API Kiểm tra trạng thái giao dịch BIDV
 * Endpoint: /api/testbidv/check-status
 */
export const checkBidvStatusApi = (code: string) => {
  return getRemoteUrl<any>('/api/testbidv/check-status', { code });
};
