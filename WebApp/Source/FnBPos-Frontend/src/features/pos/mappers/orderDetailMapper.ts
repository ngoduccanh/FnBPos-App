import type { PosProductItem } from '../types/products.types';

export interface CartItem {
  product: PosProductItem;
  quantity: number;
}


export function mapDeliveryNoteItemsToCart(noteItems: any[]): CartItem[] {
  if (!Array.isArray(noteItems)) return [];

  return noteItems.map(item => {

    const price = Number(item.retailPrice ?? item.price ?? item.retailOutPrice ?? item.outPrice ?? 0);

    const productItem: PosProductItem = {
      productId: item.productId || 0,
      productCode: item.productCode || item.code || '',
      productName: item.prodName || item.refProductName || item.name || '',
      retailUnitId: item.retailUnitId || item.selectedUnitId || item.unitId || 0,
      retailUnitName: item.retailUnitName || item.selectedUnitName || item.unit || '',
      groupId: item.groupId || 0,
      groupName: item.groupName || '',
      retailOutPrice: price,
      lastInventoryQuantity: Number(item.lastInventoryQuantity ?? -1),
      recordStatusId: item.recordStatusId || 0,
      productTypeId: item.productTypeId || 1,
      isHot: false,
      isExclusive: false,
      disableOrdering: false,
      sampleNoteId: 0,
      barcode: item.barcode || '',
      imageThumbUrl: item.imageThumbUrl || item.imagePreviewUrl || null,
      formattedPrice: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price),
      order: item.order || 0
    };

    return {
      product: productItem,
      quantity: Number(item.quantity || item.retailQuantity || 1)
    };
  });
}
