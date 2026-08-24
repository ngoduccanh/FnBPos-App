import { ref } from 'vue';
import { enqueueJob } from '@/services/posQueue/posQueueService';
import { POS_JOB_TYPES, type TransferTableJobPayload, type TransferTableRollbackPayload } from '@/services/posQueue/posQueue.types';
import { posCartCacheService } from '@/services/posDexieDB/posCartCacheService';
import { posTableCacheService } from '@/services/posDexieDB/posTableCacheService';
import { useToast } from '@/shared/components/toast/composables/useToast';
import type { PosTableItem } from '../types/tables.types';
import type { TransferItemDto } from '../types/tableTransfer.types';
import type { CartItem } from '../mappers/orderDetailMapper';

/**
 * ⇆ COMPOSABLE ĐIỀU PHỐI CHUYỂN & TÁCH BÀN (OPTIMISTIC UI + POS QUEUE + AUTO ROLLBACK)
 */
export function usePosTransferTable() {
  const { showSuccess, showError } = useToast();
  const isTransferring = ref<boolean>(false);

  /**
   * ⚡ Thực hiện chuyển / tách bàn
   */
  const executeTransferTable = async (
    storeId: number,
    sourceTable: PosTableItem,
    targetTable: PosTableItem,
    isTransferAll: boolean,
    itemsToMove: TransferItemDto[],
    onSuccess?: () => void | Promise<void>,
    liveSourceCart?: CartItem[]
  ): Promise<boolean> => {
    if (!storeId || !sourceTable?.id || !targetTable?.id) {
      showError('Thông tin bàn chuyển không hợp lệ.');
      return false;
    }

    if (sourceTable.id === targetTable.id) {
      showError('Bàn đích không được trùng với bàn nguồn.');
      return false;
    }

    isTransferring.value = true;

    try {
      // 📸 1. CHỤP SNAPSHOT 2 BÀN & GIỎ HÀNG (Ưu tiên liveSourceCart từ màn hình nếu có)
      const sourceCartItems = (liveSourceCart && liveSourceCart.length > 0)
        ? liveSourceCart
        : await posCartCacheService.getTableCart(sourceTable.id);
      const targetCartItems = await posCartCacheService.getTableCart(targetTable.id);

      const sourceTableSnapshot: PosTableItem = JSON.parse(JSON.stringify(sourceTable));
      const targetTableSnapshot: PosTableItem = JSON.parse(JSON.stringify(targetTable));
      const sourceCartItemsSnapshot: CartItem[] = JSON.parse(JSON.stringify(sourceCartItems || []));
      const targetCartItemsSnapshot: CartItem[] = JSON.parse(JSON.stringify(targetCartItems || []));

      // ⚡ 2. THỰC HIỆN LOGIC GỘP / TÁCH MÓN OPTIMISTIC TRÊN FRONTEND (0ms)
      let newSourceItems: CartItem[] = [];
      let newTargetItems: CartItem[] = [...targetCartItemsSnapshot];

      if (isTransferAll) {
        // 🔄 CHUYỂN TOÀN BỘ BÀN:
        // Gộp tất cả món từ bàn nguồn sang bàn đích
        for (const srcItem of sourceCartItemsSnapshot) {
          const existingIdx = newTargetItems.findIndex(t => Number(t.product.productId) === Number(srcItem.product.productId));
          if (existingIdx >= 0 && newTargetItems[existingIdx]) {
            newTargetItems[existingIdx].quantity += srcItem.quantity;
          } else {
            newTargetItems.push({
              product: { ...srcItem.product },
              quantity: srcItem.quantity
            });
          }
        }
        newSourceItems = []; // Bàn nguồn hết sạch món
      } else {
        // ✂️ TÁCH BÀN (CHUYỂN 1 PHẦN MÓN):
        newSourceItems = JSON.parse(JSON.stringify(sourceCartItemsSnapshot));

        for (const moveItem of itemsToMove) {
          const moveProdId = Number(moveItem.productId);
          const moveQty = Number(moveItem.quantityToMove);

          const srcIdx = newSourceItems.findIndex(s => Number(s.product.productId) === moveProdId);
          if (srcIdx >= 0 && newSourceItems[srcIdx]) {
            newSourceItems[srcIdx].quantity -= moveQty;

            // Nếu số lượng <= 0 thì xóa khỏi bàn nguồn
            if (newSourceItems[srcIdx].quantity <= 0) {
              newSourceItems.splice(srcIdx, 1);
            }
          }

          // Thêm / Gộp vào bàn đích
          const tgtIdx = newTargetItems.findIndex(t => Number(t.product.productId) === moveProdId);
          if (tgtIdx >= 0 && newTargetItems[tgtIdx]) {
            newTargetItems[tgtIdx].quantity += moveQty;
          } else {
            const originalSrc = sourceCartItemsSnapshot.find(s => Number(s.product.productId) === moveProdId);
            if (originalSrc) {
              newTargetItems.push({
                product: { ...originalSrc.product },
                quantity: moveQty
              });
            }
          }
        }
      }

      // 💾 3. CẬP NHẬT GIỎ HÀNG DEXIE DB CHO 2 BÀN (0ms)
      const sourceNoteId = sourceTable.noteId || 0;
      const targetNoteId = targetTable.noteId || 0;

      if (newSourceItems.length > 0) {
        await posCartCacheService.saveTableCart(sourceTable.id, sourceNoteId, newSourceItems);
      } else {
        await posCartCacheService.deleteTableCart(sourceTable.id);
      }

      if (newTargetItems.length > 0) {
        await posCartCacheService.saveTableCart(targetTable.id, targetNoteId, newTargetItems);
      } else {
        await posCartCacheService.deleteTableCart(targetTable.id);
      }

      // 📊 4. TÍNH TOÁN LẠI TỔNG TIỀN VÀ TRẠNG THÁI SƠ ĐỒ BÀN (DEXIE DB)
      const sourceTotalAmount = newSourceItems.reduce((sum, item) => sum + item.quantity * (Number(item.product.retailOutPrice || 0)), 0);
      const sourceTotalQty = newSourceItems.reduce((sum, item) => sum + item.quantity, 0);

      const targetTotalAmount = newTargetItems.reduce((sum, item) => sum + item.quantity * (Number(item.product.retailOutPrice || 0)), 0);
      const targetTotalQty = newTargetItems.reduce((sum, item) => sum + item.quantity, 0);

      const allTables = await posTableCacheService.getTables();
      const updatedTables = allTables.map(t => {
        if (t.id === sourceTable.id) {
          return {
            ...t,
            status: (newSourceItems.length > 0 ? 'USING' : 'AVAILABLE') as any,
            prodCount: sourceTotalQty,
            totalAmount: sourceTotalAmount,
            customerName: newSourceItems.length > 0 ? t.customerName : '',
            timeStarted: newSourceItems.length > 0 ? t.timeStarted : ''
          };
        }
        if (t.id === targetTable.id) {
          return {
            ...t,
            status: 'USING' as any,
            prodCount: targetTotalQty,
            totalAmount: targetTotalAmount,
            customerName: targetTable.customerName || sourceTable.customerName || 'Khách lẻ',
            timeStarted: targetTable.timeStarted || sourceTable.timeStarted || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          };
        }
        return t;
      });

      await posTableCacheService.saveTables(updatedTables);

      // 📥 5. ĐẨY JOB VÀO POS QUEUE (CHẠY NGẦM TUẦN TỰ FIFO)
      const queuePayload: TransferTableJobPayload = {
        storeId,
        request: {
          storeId,
          sourceTableId: sourceTable.id,
          targetTableId: targetTable.id,
          isTransferAll,
          itemsToMove
        }
      };

      const rollbackPayload: TransferTableRollbackPayload = {
        sourceTable: sourceTableSnapshot,
        targetTable: targetTableSnapshot,
        sourceCartItems: sourceCartItemsSnapshot,
        targetCartItems: targetCartItemsSnapshot,
        sourceNoteId: 0,
        targetNoteId: 0
      };

      await enqueueJob<TransferTableJobPayload>(
        POS_JOB_TYPES.TRANSFER_TABLE,
        queuePayload,
        {
          rollbackPayload,
          onFailed: (err: string) => {
            showError(`Chuyển bàn thất bại: ${err}. Dữ liệu bàn đã được tự động hoàn tác.`);
          }
        }
      );

      // 🎉 6. THÔNG BÁO THÀNH CÔNG & GỌI CALLBACK ĐỂ CALLER CÓ THỂ RELOAD UI
      const actionText = isTransferAll ? 'chuyển toàn bộ bàn' : 'tách món';
      showSuccess(`Đã ${actionText} từ ${sourceTable.name} sang ${targetTable.name} thành công!`);

      // Gọi callback để caller reload tables.value từ Dexie (fix lỗi UI không cập nhật)
      if (onSuccess) {
        await onSuccess();
      }

      return true;
    } catch (err: any) {
      console.error('[usePosTransferTable] Lỗi khi chuyển bàn:', err);
      showError(err?.message || 'Có lỗi xảy ra trong quá trình chuyển bàn.');
      return false;
    } finally {
      isTransferring.value = false;
    }
  };

  return {
    isTransferring,
    executeTransferTable
  };
}
