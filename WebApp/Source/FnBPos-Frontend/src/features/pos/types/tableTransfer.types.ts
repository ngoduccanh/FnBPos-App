/**
 * ⇆ TYPES CHO TÍNH NĂNG CHUYỂN & TÁCH BÀN (TABLE TRANSFER)
 */

export interface TransferItemDto {
  productId: number;       // ID sản phẩm
  quantityToMove: number;  // Số lượng cần chuyển
  unitId: number;          // Đơn vị tính
  price: number;           // Đơn giá
}

export interface TableTransferRequest {
  storeId: number;         // ID chi nhánh / cửa hàng
  sourceTableId: number;   // ID Bàn NGUỒN (bàn đang ngồi)
  targetTableId: number;   // ID Bàn ĐÍCH (bàn muốn chuyển sang)
  isTransferAll: boolean;  // true: Chuyển toàn bộ bàn | false: Tách bàn (chuyển 1 phần món)
  itemsToMove: TransferItemDto[]; // Danh sách món chuyển (khi tách bàn)
}

export interface TransferTableResponse {
  status: number;
  data: boolean;
  message?: string;
  errors?: string[];
}
