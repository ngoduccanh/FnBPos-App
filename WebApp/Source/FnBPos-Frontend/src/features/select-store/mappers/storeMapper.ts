import type { StoreBranch } from '../types/store.types';

export function mapStoresResponse(res: any): StoreBranch[] {
  const rawList: any[] = res?.data?.pagingResultModel?.results || [];

  return rawList.map((item: any) => ({
    ...item,
    id: item.id ?? item.Id,
    code: item.code || 'N/A',
    name: item.name || 'Cửa hàng không tên',
    addresses: item.addresses || item.address || ''
  }));
}
