export interface GenVietQrModel {
  /** Mã đơn hàng / Mã giao dịch / Mã VietQR (Bắt buộc theo BIDV API - không được null) */
  code: string;
  /** Số tài khoản nhận tiền */
  accountNo?: string;
  /** Tên chủ tài khoản */
  accountName?: string;
  /** Mã ngân hàng thụ hưởng (VD: 970418 - BIDV) */
  acqId?: string | number;
  /** Số tiền cần thanh toán */
  amount: number;
  /** Nội dung thanh toán / chuyển khoản */
  addInfo?: string;
  /** Mã cửa hàng / Điểm bán */
  storeId?: number | string;
  /** Mã thiết bị / Terminal */
  terminalId?: string;
}

export interface GenVietQrResponse {
  status?: string | number;
  code?: string;
  message?: string;
  qrCode?: string;
  qrDataURL?: string;
  data?: any;
}
