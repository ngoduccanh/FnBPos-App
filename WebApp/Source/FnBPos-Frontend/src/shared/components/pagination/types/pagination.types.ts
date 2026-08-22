export interface PaginationProps {
  /** Trang hiện tại (0-indexed: 0 là trang 1) */
  pageIndex: number;
  /** Số lượng bản ghi trên một trang */
  pageSize: number;
  /** Tổng số lượng bản ghi toàn hệ thống */
  totalItems: number;
  /** Danh sách tùy chọn số lượng bản ghi / trang */
  pageSizeOptions?: number[];
  /** Hiển thị bộ chọn pageSize */
  showSizeChanger?: boolean;
  /** Hiển thị dòng thông tin tổng số bản ghi */
  showTotal?: boolean;
  /** Số lượng nút số trang hiển thị tối đa */
  maxPageButtons?: number;
}

export interface PaginationEmits {
  (e: 'update:pageIndex', pageIndex: number): void;
  (e: 'update:pageSize', pageSize: number): void;
  (e: 'change', payload: { pageIndex: number; pageSize: number }): void;
}
