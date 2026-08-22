
export interface BaseUserAccount {
  Id?: number;
  UserId?: number;
  Name?: string;
  FullName?: string;
  StoreId?: number;
  MasterStoreId?: number;
  Email?: string;
  RoleIds?: number[];
  RegionId?: number;
  CityId?: number;
  WardId?: number;
  Invalid?: boolean;
  StoreCount?: number;
  InChain?: boolean;
  CategoryStoreId?: number;
  PermittedResources?: Record<number, number>;
}
