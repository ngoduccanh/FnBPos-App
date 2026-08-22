
export interface BaseItem {
  order: number;
  itemDate?: string; 
  itemNumber?: string;
  invoiceNo?: string;
  itemId: number;
  itemName?: string;
  itemCode?: string;
  selectedUnitId: number;
  selectedUnitName?: string;
  unitId: number;
  retailUnitId: number;
  unit3: number;
  secondRetailUnitId: number;
  thirdRetailUnitId: number;
  unitName?: string;
  unit3Name?: string;
  retailUnitName?: string;
  description?: string;
  refUnitName?: string;
  refUnitId: number;
  units?: any[]; 
  specification?: string;

  sellerId: number;
  sellerRefKey?: string;
  partnerId: number;
  partnerCode?: string;
  partnerName?: string;
  partnerAddress?: string;
  partnerPhones?: string;
  partnerTaxCode?: string;
  partnerRefKey?: string;
  adviserId: number;
  adviserName?: string;
  adviserWorkPlace?: string;
  staffId: number;
  staffName?: string;
  targetStoreId: number;
  targetStoreName?: string;
  registeredNo?: string;
  sourceId: number;
  minQuantity?: number;
  maxQuantity?: number;
  orderStatusId: number;
  orderStatusName?: string;
  paymentTypeId: number;
  paymentTypeName?: string;
  paymentMode: number;
  partner?: any; 

  vat: number;
  taxRateId?: number;
  vatTypeId: number;
  vatTypeName?: string;

  lastBalancedDate?: string;
  locked: boolean;
  errorMessage?: string;
  presentation: boolean;
}
