import { EObjectType, EObjectParentType } from '@/enums/objectType.enum';

export interface BaseDbObject {
  id?: number;
  code?: string;
  name?: string;
  nameUnsignedText?: string;
  typeId?: EObjectType | number;
  subTypeId?: number;
  subTypeName?: string | null;
  storeId?: number;
  groupId?: number;
  groupName?: string;
  
  // Thông tin liên hệ
  phones?: string | null;
  mobile?: string | null;
  addresses?: string | null;
  emails?: string | null;

  // Trạng thái & Phân quyền
  activated?: boolean;
  isDefault?: boolean;
  inactive?: boolean;
  isDeleted?: boolean;

  // Mô tả & Hiển thị
  shortInfo?: string | null;
  displayInfo?: string | null;
  fullInfo?: string | null;
  description?: string | null;

  // Ngày tháng
  createdDate?: string | null;
  updatedDate?: string | null;

  // Phân cấp
  parentId?: number;
  parentName?: string | null;
  parentTypeId?: EObjectParentType | number;
  parentTypeName?: string | null;

  
  SwitchAble?: number;
  PageIndex?: number;
  PageSize?: number;
  SortingDirection?: number;
  SearchText?: string;
  StoreId?: number;
  TypeId?: EObjectType | number;
  StoreForNewSession?: boolean;
  FillExatraInfos?: boolean;
}

