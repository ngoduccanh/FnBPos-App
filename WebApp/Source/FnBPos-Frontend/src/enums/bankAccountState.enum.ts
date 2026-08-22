/**
 * 🏦 TRẠNG THÁI TÀI KHOẢN NGÂN HÀNG / TERMINAL
 */
export enum EBankAccountState {
  /** Chưa kích hoạt (Chờ mã OTP) */
  PendingActivation = 0,

  /** Đang hoạt động */
  Active = 1,

  /** Đang đóng / Tạm dừng */
  Closed = 2,
}
