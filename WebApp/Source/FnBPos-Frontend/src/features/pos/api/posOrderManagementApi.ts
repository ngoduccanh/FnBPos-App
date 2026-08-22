import { postRemoteUrl, getRemoteUrl } from '@/services/apiClient';
import type { DeliveryNoteWithRoundsModel } from '@/shared/types/deliveryNote.types';

export interface HandleNoteItemsPayload {
  storeId: number;
  noteId: number;
  noteItemIds: number[];
}

export interface HandleNoteItemsResponse {
  status: number;
  data: any;
  message?: string;
  errors?: string[];
}

/**
 * 📥 Lấy danh sách đơn hàng từ Cache theo trạng thái món (EOrderItemStatus)
 * Endpoint: POST /api/posSale/{storeId}/ordersFromCache
 */
export const getOrdersByStatusFromCacheApi = (
  storeId: number,
  orderItemStatusId: number = -1,
  pageIndex: number = 1,
  pageSize: number = 100
) => {
  return postRemoteUrl<{ data: DeliveryNoteWithRoundsModel[] }>(
    `/api/posSale/${storeId}/ordersFromCache`,
    {
      storeId,
      orderItemStatusId,
      pageIndex,
      pageSize
    }
  );
};

/**
 * ⚡ Duyệt danh sách món ăn trong đợt gọi món
 * Endpoint: POST /api/posSale/{storeId}/approveNoteItems
 */
export const approveNoteItemsApi = (storeId: number, payload: HandleNoteItemsPayload) => {
  return postRemoteUrl<HandleNoteItemsResponse>(
    `/api/posSale/${storeId}/approveNoteItems`,
    payload
  );
};

/**
 * ❌ Từ chối danh sách món ăn trong đợt gọi món
 * Endpoint: POST /api/posSale/{storeId}/rejectNoteItems
 */
export const rejectNoteItemsApi = (storeId: number, payload: HandleNoteItemsPayload) => {
  return postRemoteUrl<HandleNoteItemsResponse>(
    `/api/posSale/${storeId}/rejectNoteItems`,
    payload
  );
};

/**
 * 📋 Lấy danh sách tổng hợp đơn hàng POS từ cache
 * Endpoint: GET /api/posSale/{storeId}/posOrderCache
 */
export const getPosOrderCacheApi = (storeId: number) => {
  return getRemoteUrl<any>(
    `/api/posSale/${storeId}/posOrderCache`
  );
};
