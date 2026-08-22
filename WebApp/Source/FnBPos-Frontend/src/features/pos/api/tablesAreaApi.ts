import { postRemoteUrl } from '@/services/apiClient';
import { EObjectType } from '@/enums/objectType.enum';
import type { BaseDbObject } from '@/shared/types/baseObject.types';

/**
 * 🏷️ API LẤY DANH SÁCH KHU VỰC BÀN (TABLE AREA / PHÂN KHU BÀN)
 * Endpoint: POST /api/ObjectMan/{storeId}/Objects với TypeId = 71 (TableArea)
 */
export const getTablesAreaApi = (storeId: number, params?: Partial<BaseDbObject>) => {
  return postRemoteUrl<any>(`/api/ObjectMan/${storeId}/Objects`, {
    PageIndex: 0,
    PageSize: 0,
    TypeId: EObjectType.TableArea,
    FillExatraInfos: false,
    ...params
  });
};