// 1. Interface Cơ sở cho mọi Entity (1 bản ghi)
export interface BaseEntity {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface BasePaginationParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface LegacyPagingResultModel<T> {
  PageIndex: number;
  PageSize: number;
  TotalSize: number;
  Items: T[];
}

export interface ApiSuccessResponse<T> {
  Status: '200' | 'OK' | number;
  Data?: T;
  data?: T;
  Errors?: string[];
  Messages?: string[];
}

export interface ApiErrorResponse {
  Status: 'ERROR' | '400' | '500' | string;
  Data?: null;
  data?: null;
  Errors: string[];
  Messages?: string[];
  Message?: string;
}

export type BaseApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;
