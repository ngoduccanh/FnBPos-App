/**
 * 📦 Request model cho API hủy đơn / deleteOrderCache
 */
export interface DeleteDeliveryRequestModel {
  NoteId: number;
  TargetId?: number;
  TargetTypeId?: number;
  StoreId?: number;
  Reason?: string;
  CurrUser?: any;
  [key: string]: any;
}
