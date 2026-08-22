import type { BaseDbObject } from '@/shared/types/baseObject.types';

export interface StoreBranch extends BaseDbObject {
  owner?: string | null;
  userName?: string | null;
  taxCode?: string | null;
  businessTypeId?: number;
  isPharmacyBusiness?: boolean;
  isConnectivity?: boolean;
  regionId?: number;
  wardId?: number;
}
