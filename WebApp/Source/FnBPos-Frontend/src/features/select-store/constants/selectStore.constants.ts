import type { BaseDbObject } from '@/shared/types/baseObject.types';
import { EObjectType } from '@/enums/objectType.enum';

export const DEFAULT_GET_STORES_PARAMS: BaseDbObject = {
  SwitchAble: 1,
  PageIndex: 0,
  PageSize: 10,
  SortingDirection: 0,
  SearchText: '',
  TypeId: EObjectType.Store,
  StoreId: 2,
  StoreForNewSession: true,
  FillExatraInfos: false,
};

