/**
 * 🏬 Model dropdown cửa hàng con (Child Store)
 */
export interface ChildStoreOption {
  id: number;
  value: string;
  provinceId?: number;
}

/**
 * Response API lấy danh sách nhà con
 */
export interface ChildStoresResponse {
  status: number;
  errors: string[];
  data: ChildStoreOption[];
}
