import type { BaseProductModel } from '@/shared/types/baseProduct.types';

export interface ProductFilterParams {
  storeId?: number;
  pageSize?: number;
  pageIndex?: number;
  searchText?: string;
  groupId?: number | null;
  isPos?: boolean;
  deleted?: boolean;
  [key: string]: any;
}


export interface ProductPagingResult {
  Results: BaseProductModel[];
  TotalSize: number;
  PageIndex: number;
  PageSize: number;
}


export interface PosProductItem extends BaseProductModel {
  formattedPrice?: string;
}
