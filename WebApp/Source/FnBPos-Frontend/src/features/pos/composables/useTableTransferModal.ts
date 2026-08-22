import { ref, computed, watch } from 'vue';
import type { PosTableItem } from '../types/tables.types';
import type { CartItem } from '../mappers/orderDetailMapper';
import type { TransferItemDto } from '../types/tableTransfer.types';

/**
 * 🎯 useTableTransferModal — Quản lý toàn bộ state và logic tính toán của modal chuyển / tách bàn
 */
export function useTableTransferModal(
  isOpen: () => boolean,
  sourceTable: () => PosTableItem | null,
  tables: () => PosTableItem[],
  cartItems: () => CartItem[]
) {
  const activeTab = ref<'transfer_all' | 'split_table'>('transfer_all');
  const selectedTargetTable = ref<PosTableItem | null>(null);
  const splitQtyMap = ref<Record<number, number>>({});

  // 1. Lọc các bàn có thể chuyển sang (loại trừ bàn nguồn)
  const selectableTables = computed(() => {
    const src = sourceTable();
    return tables().filter(t => t.id !== src?.id);
  });

  // 2. Tính tổng số lượng và tiền bàn nguồn
  const cartTotalQuantity = computed(() => {
    return cartItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  const formattedTotalAmount = computed(() => {
    const total = cartItems().reduce((sum, item) => sum + item.quantity * (item.product.retailOutPrice || 0), 0);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total);
  });

  // 3. Logic tách món
  const getSplitQty = (productId: number): number => {
    return splitQtyMap.value[productId] || 0;
  };

  const increaseSplitQty = (productId: number, maxQty: number) => {
    const current = getSplitQty(productId);
    if (current < maxQty) {
      splitQtyMap.value[productId] = current + 1;
    }
  };

  const decreaseSplitQty = (productId: number) => {
    const current = getSplitQty(productId);
    if (current > 0) {
      splitQtyMap.value[productId] = current - 1;
    }
  };

  const setAllSplitQty = (productId: number, maxQty: number) => {
    splitQtyMap.value[productId] = maxQty;
  };

  const totalSplitQty = computed(() => {
    return Object.values(splitQtyMap.value).reduce((sum, q) => sum + q, 0);
  });

  const totalSplitAmount = computed(() => {
    let amount = 0;
    for (const item of cartItems()) {
      const qty = getSplitQty(item.product.productId);
      if (qty > 0) {
        amount += qty * (item.product.retailOutPrice || 0);
      }
    }
    return amount;
  });

  // 4. Kiểm tra điều kiện có thể xác nhận
  const canConfirm = computed(() => {
    if (!selectedTargetTable.value) return false;

    if (activeTab.value === 'transfer_all') {
      return cartItems().length > 0;
    } else {
      return totalSplitQty.value > 0;
    }
  });

  // 5. Reset khi mở modal
  const resetState = () => {
    activeTab.value = 'transfer_all';
    selectedTargetTable.value = null;
    splitQtyMap.value = {};
  };

  watch(
    () => isOpen(),
    (open) => {
      if (open) {
        resetState();
      }
    }
  );

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  // 6. Xây dựng payload để emit khi xác nhận
  const buildTransferPayload = () => {
    if (!selectedTargetTable.value) return null;

    const isAll = activeTab.value === 'transfer_all';
    const itemsToMove: TransferItemDto[] = [];

    if (!isAll) {
      for (const item of cartItems()) {
        const qty = getSplitQty(item.product.productId);
        if (qty > 0) {
          itemsToMove.push({
            productId: item.product.productId,
            quantityToMove: qty,
            unitId: item.product.retailUnitId || 0,
            price: item.product.retailOutPrice || 0
          });
        }
      }
    }

    return {
      targetTable: selectedTargetTable.value,
      isTransferAll: isAll,
      itemsToMove
    };
  };

  return {
    activeTab,
    selectedTargetTable,
    splitQtyMap,
    selectableTables,
    cartTotalQuantity,
    formattedTotalAmount,
    getSplitQty,
    increaseSplitQty,
    decreaseSplitQty,
    setAllSplitQty,
    totalSplitQty,
    totalSplitAmount,
    canConfirm,
    resetState,
    formatCurrency,
    buildTransferPayload
  };
}
