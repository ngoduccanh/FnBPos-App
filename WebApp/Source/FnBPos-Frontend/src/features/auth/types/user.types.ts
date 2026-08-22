import type { BaseEntity } from '@/shared/types/base.types';
import type { StoreBranch } from '@/features/select-store/types/store.types';

export type UserPermissionsMap = Record<string, boolean>;

export interface User extends BaseEntity {
  name: string;
  username: string;
  fullName: string;
  email?: string | null;
  roleIds?: number[];
  storeId?: number;
  storeCount?: number;
  hasMultipleStores?: boolean;
  store?: StoreBranch;
  stores?: StoreBranch[];
  permissions?: UserPermissionsMap;
  permittedResources?: Record<string, number>;
  isAdmin?: boolean;
  isSystemAdmin?: boolean;
  isSuperUser?: boolean;
  isStoreUserOnly?: boolean;
}
