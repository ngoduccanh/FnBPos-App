
import type { PosProductItem } from '../types/products.types';


export function mapProductList(rawItems: any[]): PosProductItem[] {
  if (!Array.isArray(rawItems)) return [];

  return rawItems.map((item: any) => {
    const retailOutPrice = Number(item.RetailOutPrice || item.retailOutPrice || 0);

    return {
      order: item.Order ?? item.order ?? 0,
      productId: item.ProductId ?? item.productId ?? 0,
      productCode: item.ProductCode || item.productCode || '',
      productName: item.ProductName || item.productName || '',
      retailUnitId: item.RetailUnitId ?? item.retailUnitId,
      retailUnitName: item.RetailUnitName || item.retailUnitName || '',
      groupId: item.GroupId ?? item.groupId,
      groupName: item.GroupName || item.groupName || '',
      retailOutPrice,
      lastInventoryQuantity: Number(item.LastInventoryQuantity ?? item.lastInventoryQuantity ?? 0),
      recordStatusId: item.RecordStatusId ?? item.recordStatusId ?? 0,
      productTypeId: item.ProductTypeId ?? item.productTypeId ?? 1,
      isHot: Boolean(item.IsHot ?? item.isHot),
      isExclusive: Boolean(item.IsExclusive ?? item.isExclusive),
      disableOrdering: Boolean(item.DisableOrdering ?? item.disableOrdering),
      sampleNoteId: item.SampleNoteId ?? item.sampleNoteId ?? 0,
      barcode: item.Barcode || item.barcode || '',
      imageThumbUrl: item.ImageThumbUrl || item.imageThumbUrl || null,
      activeSubstance: item.ActiveSubstance || item.activeSubstance || null,
      imageThumbBase64: item.ImageThumbBase64 || item.imageThumbBase64 || null,
      connectivityCode: item.ConnectivityCode || item.connectivityCode || null,
      registeredNo: item.RegisteredNo || item.registeredNo || null,
      contents: item.Contents || item.contents || null,
      packingWay: item.PackingWay || item.packingWay || null,
      manufacturer: item.Manufacturer || item.manufacturer || null,
      countryOfManufacturer: item.CountryOfManufacturer || item.countryOfManufacturer || null,
      dosageForms: item.DosageForms || item.dosageForms || null,
      importers: item.Importers || item.importers || null,
      organizeDeclaration: item.OrganizeDeclaration || item.organizeDeclaration || null,
      countryRegistration: item.CountryRegistration || item.countryRegistration || null,
      addressRegistration: item.AddressRegistration || item.addressRegistration || null,
      addressManufacture: item.AddressManufacture || item.addressManufacture || null,
      smallestPackingUnit: item.SmallestPackingUnit || item.smallestPackingUnit || null,
      declaredPrice: Number(item.DeclaredPrice ?? item.declaredPrice ?? 0),
      isFixed: Boolean(item.IsFixed ?? item.isFixed),
      imageId: item.ImageId ?? item.imageId ?? 0,
      isPos: Boolean(item.IsPos ?? item.isPos ?? true),
      intendedQuantity: Number(item.IntendedQuantity ?? item.intendedQuantity ?? 0),
      formattedPrice: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(retailOutPrice)
    };
  });
}
