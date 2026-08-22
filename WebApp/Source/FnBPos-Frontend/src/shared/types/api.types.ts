
export interface PagingResultModel<T> {
  pageIndex: number;
  pageSize: number;
  results: T[];
  totalSize: number;
}


export interface ApiResponse<T> {
  status: number;
  errors: string[];
  data: T;
  message?: string;
}


export interface PagingParams {
  PageIndex?: number;
  PageSize?: number;
  SearchText?: string;
  [key: string]: any;
}
