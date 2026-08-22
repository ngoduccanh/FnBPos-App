/**
 * 📦 BASE PRODUCT MODEL (Chuẩn hóa từ C# Med.Api.Model.ProductModel.ProductResultModel)
 */
export interface BaseProductModel {
  order?: number;
  productId: number;
  productCode: string;
  productName: string;
  retailUnitId?: number;
  retailUnitName?: string;
  groupId?: number;
  groupName?: string;
  retailOutPrice?: number;
  lastInventoryQuantity?: number;
  recordStatusId?: number;
  productTypeId?: number;
  isHot?: boolean;
  isExclusive?: boolean;
  disableOrdering?: boolean;
  sampleNoteId?: number;
  barcode?: string;
  imageThumbUrl?: string;
  activeSubstance?: string;
  imageThumbBase64?: string;
  connectivityCode?: string;
  registeredNo?: string;
  contents?: string;
  packingWay?: string;
  manufacturer?: string;
  countryOfManufacturer?: string;
  dosageForms?: string;
  importers?: string;
  organizeDeclaration?: string;
  countryRegistration?: string;
  addressRegistration?: string;
  addressManufacture?: string;
  smallestPackingUnit?: string;
  declaredPrice?: number;
  isFixed?: boolean;
  imageId?: number;
  isPos?: boolean;
  intendedQuantity?: number;
}
