import type { BaseItem } from './baseItem.types';

/**
 * 📦 MODEL NỀN TẢNG CHO DÒNG MÓN ANH/CHI TIẾT PHIẾU (BASE NOTE ITEM MODEL)
 * Ánh xạ 100% từ C# Med.ServiceModel.Common.BaseNoteItem
 * Kế thừa từ BaseItem
 */
export interface BaseNoteItem extends BaseItem {
  noteId: number;
  noteItemId: number;
  noteTypeId: number;
  productId: number;
  productCode?: string;
  prodName?: string;
  retailPrice: number;
  price: number;
  inPrice: number;
  outPrice: number;
  retailOutPrice: number;
  prodRetailInPrice: number;
  prodRetailOutPrice: number;
  prodBatchOutPrice: number;
  minBatchQuantity: number;
  salaryPrice: number;
  quantity: number;
  usedQuantity: number;
  remainingQuantity: number;
  sourceId: number;
  sourceNoteId: number;
  realQuantity?: number;
  retailQuantity: number;
  preRetailQuantity: number;
  totalAmount: number;
  vatAmount: number;
  totalAmountWithoutDiscount?: number;
  totalAmountWithDiscount?: number;
  lastInventoryQuantity: number;
  discount: number;
  isModified: boolean;
  editMode: boolean;
  isEditingItem: boolean;
  productTypeId: number;
  productStatusId: number;
  connectivityResult?: string;
  hasConnectivityErrors: boolean;
  isConnectivity: boolean;
  connectivityProdId: number;
  discountByValue: boolean;
  discountValue: number;
  reason?: string;
  solution?: string;
  recallLocation?: string;
  notes?: string;
  score?: number;
  scorable: boolean;
  moneyToOneScoreRate: number;
  advisoryGoods: boolean;
  advisoryDiscount: number;
  priceFactors: number;
  nextServiceDate?: string;
  isProdRef: boolean;
  dosage?: string;
  ingredient?: string;
  preProductId: number;
  refProductId: number;
  refProductCode?: string;
  refProductName?: string;
  refActiveSubstance?: string;
  refQuantity: number;
  refDosage?: string;
  saleTypeId: number;
  saleOff: number;
  saleDescription?: string;
  saleStartDate?: string;
  saleEndDate?: string;
  paid: boolean;
  averagePrice: number;
  product?: {
    id: number;
    code?: string;
    name?: string;
  };
  listBatchExp?: any[];
  isInvoice: boolean;
  originalProdId: number;
  ogProdName?: string;
  invoiceCode?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  message?: string;
  refProduct?: any;
  prodIsNotExisted: boolean;
  unitIsNotExisted: boolean;
  unit?: string;
  productCoefficient: number;
  packingWay?: string;
  lossPercent: number;
  prodType: number;
  uId?: string;
  recordHash: number;
  recordChanged?: boolean;

  // Thuộc tính lô/hạn dùng kế thừa từ C# Batch if any
  batchNumber?: string;
  expiredDate?: string;
  createdDate?: string;
}
