/**
 * 📲 TYPES CHO API MÃ QR BÀN (TABLE QR CODE)
 */

export interface TableQrRequestModel {
  targetId: number; // ID bàn cần tạo mã QR
}

export interface TableQrResponse {
  status: number;
  data: string; // Chuỗi Base64 của ảnh QR Code (VD: "iVBORw0KGgoAAAANSUhEUg...")
  message?: string;
  errors?: string[];
}
