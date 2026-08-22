import type { BaseDbObject } from '@/shared/types/baseObject.types';
import { EObjectType } from '@/enums/objectType.enum';

export const DEFAULT_GET_TABLE_PARAMS: BaseDbObject = {
  PageIndex: 0,
  PageSize: 0,
  TypeId: EObjectType.Table,
  FillExatraInfos: false,
};