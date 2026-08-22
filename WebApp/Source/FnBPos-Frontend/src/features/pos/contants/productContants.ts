import type { ProductFilterParams } from '../types/products.types';

export const DEFAULT_PRODUCT_FILTER_PARAMS: ProductFilterParams = {
  pageSize: 500,
  pageIndex: 0,
  searchText: '',
  groupId: null,
  isPos: true,
  deleted: false,
};
