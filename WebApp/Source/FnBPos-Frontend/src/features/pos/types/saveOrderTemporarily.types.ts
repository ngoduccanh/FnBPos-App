import type { DeliveryNoteModel } from '@/shared/types/deliveryNote.types';


export interface PaymentQRModel {
  code?: string;
  accountNo?: string;
  accountName?: string;
  amount: number;
  acqId?: string;
}

export interface SaveOrderItemModel {
  id: number;
  noteItemId: number;
  uId?: string;
  productId: number;
  productName: string;
  name?: string;
  prodName?: string;
  productCode?: string;
  code?: string;
  barcode?: string;
  quantity: number;
  price: number;
  outPrice: number;
  retailPrice: number;
  notes?: string;
  status: number;
  orderStatusId: number;
  isServerItem: boolean;
  unitId: number;
  unitName: string;
  retailUnitId: number;
  selectedUnitId: number;
  retailUnitName?: string;
  points: number;
  pointsPercent: number;
  scorable: boolean;
  units?: any;
  splitQty: number;
  order: number;
  factors: number;
  unit3: number;
  unit3Factors: number;
  isModified: boolean;
  hashValue: number;
  noteId: number;
  groupId?: number;
  storeId?: number;
  imageThumbUrl?: string;
  customPrices?: Array<{
    price: number;
    typeId: number;
    level: number;
    storeId: number;
    id: number;
    name: string;
  }>;
  product?: {
    score: number;
    id: number;
    name: string;
    code: string;
  };
  [key: string]: any;
}


export interface SaveOrderTemporarilyModel extends DeliveryNoteModel {
  staffId?: number;
  sellerId: number;
  createdById: number;
  staffName?: string;
  adviserName?: string;
  partnerId: number;
  customerId?: number;
  targetId?: number; 
  targetTypeId?: number;
  amount?: number;
  paymentAmount: number;
  pointDisAmount?: number;
  paymentScoreAmount?: number;
  paymentScore?: number;
  paymentQRModel?: PaymentQRModel;
  noteItems: SaveOrderItemModel[];
  noteItemIds?: number[];
  isForceReloadInventory?: boolean;
}
