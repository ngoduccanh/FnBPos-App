import type { BaseDbObject } from '@/shared/types/baseObject.types';

export interface PosTableItem extends BaseDbObject {
  id: number;
  code : string;
  name: string;
  storeId?: number;
  note?: string;
  groupId?: number;
  groupName?: string;
  status?: string; 
  activated?: boolean;
  typeId?: number;
  
  activeOrder?: any; 
  customerName?: string;
  totalAmount?: number;
  prodCount?: number;
  timeStarted?: string; 
  noteId?: number;
  noteNumber?: number;
  [key: string]: any;
}
export interface PosTableAreaGroup extends PosTableItem {}