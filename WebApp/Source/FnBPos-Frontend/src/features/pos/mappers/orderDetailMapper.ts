import { EOrderItemStatus } from '@/enums/orderItemStatus.enum';
import type { ProductDeliveryItem } from '@/shared/types/productDeliveryItem.types';
import type { PosProductItem } from '../types/products.types';

export interface CartItem {
  product: PosProductItem;
  quantity: number;
}

/**
 * 🔍 Lọc bỏ các món theo Enum EOrderItemStatus:
 * - Pending (0): Chờ duyệt
 * - Rejected (2): Từ chối
 * - Canceled (3): Đã hủy
 * - Delete (4): Đã xóa
 */
export function isValidOrderItem(item: ProductDeliveryItem): boolean {
  if (!item) return false;

  const statusId = item.orderStatusId ?? -1;

  if (
    statusId === EOrderItemStatus.Pending.value ||
    statusId === EOrderItemStatus.Rejected.value ||
    statusId === EOrderItemStatus.Canceled.value ||
    statusId === EOrderItemStatus.Delete.value
  ) {
    return false;
  }

  // Số lượng phải > 0
  const qty = Number(item.quantity ?? item.retailQuantity ?? 0);
  if (qty <= 0) {
    return false;
  }

  return true;
}

export function mapDeliveryNoteItemsToCart(noteItems: ProductDeliveryItem[]): CartItem[] {
  if (!Array.isArray(noteItems)) return [];

  // Lọc bỏ các món không hợp lệ theo EOrderItemStatus
  const validItems = noteItems.filter(isValidOrderItem);

  // 🎯 GỘP TẤT CẢ CÁC DÒNG CÙNG SẢN PHẨM (productId) LẠI VỚI NHAU VÀ CỘNG DỒN SỐ LƯỢNG
  const cartItemMap = new Map<number, CartItem>();

  for (const item of validItems) {
    const prodId = Number(item.productId || 0);
    const qty = Number(item.quantity ?? item.retailQuantity ?? 1);
    const price = Number(item.retailPrice || item.retailOutPrice || item.outPrice || item.price || 0);

    if (cartItemMap.has(prodId)) {
      // Đã có món này trong giỏ -> Cộng dồn số lượng
      cartItemMap.get(prodId)!.quantity += qty;
    } else {
      const productItem: PosProductItem = {
        productId: prodId,
        productCode: item.productCode || item.itemCode || '',
        productName: item.prodName || item.itemName || 'Món ăn',
        retailUnitId: Number(item.retailUnitId || item.selectedUnitId || 0),
        retailUnitName: item.retailUnitName || item.unit || item.unitName || '',
        groupId: 0,
        groupName: '',
        retailOutPrice: price,
        lastInventoryQuantity: Number(item.lastInventoryQuantity ?? -1),
        recordStatusId: item.orderStatusId || 0,
        productTypeId: item.productTypeId || 1,
        isHot: false,
        isExclusive: false,
        disableOrdering: false,
        sampleNoteId: 0,
        barcode: '',
        imageThumbUrl: undefined,
        formattedPrice: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price),
        order: item.order || 0
      };

      cartItemMap.set(prodId, {
        product: productItem,
        quantity: qty
      });
    }
  }

  return Array.from(cartItemMap.values());
}
