import type { BaseDbObject } from '@/shared/types/baseObject.types';
import { EObjectType } from '@/enums/objectType.enum';

/**
 * 🏷️ THAM SỐ MẶC ĐỊNH LẤY DANH SÁCH NHÓM SẢN PHẨM (PRODUCT GROUP)
 * Dùng chung endpoint API /api/ObjectMan/{storeId}/Objects giống danh sách bàn
 */
export const DEFAULT_GET_PRODUCT_GROUP_PARAMS: BaseDbObject = {
  PageIndex: 0,
  PageSize: 0,
  TypeId: EObjectType.ProductGroup, // TypeId = 56 (Nhóm sản phẩm)
  FillExatraInfos: false,
};
