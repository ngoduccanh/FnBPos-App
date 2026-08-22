/**
 * 📊 TRẠNG THÁI BÀN POS (TABLE STATUS CONST & TYPE)
 */
export const ETableStatusFilter = {
  ALL: 'ALL',          // Tất cả trạng thái
  EMPTY: 'READY',      // Bàn trống (Chưa có khách)
  USING: 'USING',      // Đang có khách
  RESERVED: 'RESERVED' // Đặt trước
} as const;

export type ETableStatusFilter = typeof ETableStatusFilter[keyof typeof ETableStatusFilter];
