import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/appStore';
import { useToast } from '@/shared/components/toast/composables/useToast';
import { usePosQueue } from './usePosQueue';
import { posCartCacheService } from '@/services/posDexieDB/posCartCacheService';
import { posOrderCacheService } from '@/services/posDexieDB/posOrderCacheService';
import { posTableCacheService } from '@/services/posDexieDB/posTableCacheService';
import { POS_JOB_TYPES } from '@/services/posQueue/posQueueHandlers';
import type { PosTableItem } from '@/features/pos/types/tables.types';
import type { CartItem } from '@/features/pos/mappers/orderDetailMapper';
import type { DeleteOrderJobPayload, DeleteOrderRollbackPayload } from '@/services/posQueue/posQueueHandlers';

/**
 * ⚡ Composable xử lý Hủy đơn hàng POS:
 * 1. Xóa ngay giỏ hàng & đơn hàng trong Dexie DB (0ms UI)
 * 2. Báo thành công ngay lập tức
 * 3. Đẩy vào POS Queue gọi API deleteOrderCache
 * 4. Tự động rollback Dexie DB + giao diện nếu API báo lỗi
 */
export function usePosCancelOrder() {
  const authStore = useAuthStore();
  const appStore = useAppStore();
  const { showSuccess, showError } = useToast();
  const { enqueue: enqueueJob } = usePosQueue();
  const isCancelling = ref<boolean>(false);

  const cancelOrder = async (
    table: PosTableItem | null | undefined,
    currentCartItems: CartItem[],
    options?: {
      onRollback?: (previousItems: CartItem[]) => void;
      onSuccess?: () => void;
    }
  ) => {
    if (!table || !table.id) {
      showError('Chưa chọn bàn để hủy đơn.', 'Lỗi hủy đơn');
      return;
    }

    const selectedStore: any = authStore.selectedStore;
    const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;
    if (!storeId) {
      showError('Chưa xác định được ID cửa hàng.', 'Lỗi hủy đơn');
      return;
    }

    const targetId = table.id;
    // Tìm NoteId từ table, giỏ hàng cache, hoặc đơn hàng cache
    let noteId = table.order?.noteId 
      || (table as any)?.noteId 
      || (table as any)?.activeOrder?.noteId 
      || (table as any)?.orderInfo?.noteId 
      || 0;

    if (!noteId) {
      const cartRecord = await posCartCacheService.getTableCartRecord(targetId);
      if (cartRecord?.noteId) {
        noteId = cartRecord.noteId;
      }
    }

    if (!noteId) {
      const cachedOrder = await posOrderCacheService.getOrderByTargetId(targetId);
      if (cachedOrder?.noteId) {
        noteId = cachedOrder.noteId;
      }
    }

    // Snapshot giỏ hàng cũ để rollback nếu API báo lỗi
    const cartSnapshot: CartItem[] = JSON.parse(JSON.stringify(currentCartItems || []));

    isCancelling.value = true;

    try {
      // ── BƯỚC 1: XÓA NGAY LẬP TỨC TRONG DEXIE DB Ở FRONTEND (0ms) ───────────
      await Promise.all([
        posCartCacheService.deleteTableCart(targetId),
        posOrderCacheService.deleteOrderByTargetId(targetId),
        posTableCacheService.clearTableOrderOptimistic(targetId)
      ]);

      // ── BƯỚC 2: HIỆN THÔNG BÁO THÀNH CÔNG NGAY ───────────────────────────
      showSuccess(`Đã hủy đơn ${table.name || `Bàn ${targetId}`} thành công!`, 'Thành công');
      options?.onSuccess?.();

      // Nếu không có NoteId trên server (chưa từng lưu server) thì chỉ cần xóa local là xong
      if (!noteId) {
        return;
      }

      // ── BƯỚC 3: ĐẨY JOB VÀO POS QUEUE ĐỂ CALL API deleteOrderCache ────────
      const jobPayload: DeleteOrderJobPayload = {
        storeId,
        model: {
          NoteId: noteId,
          TargetId: targetId,
          TargetTypeId: (table as any).typeId || (table as any).targetTypeId || 2, // 2: PosReservationSale
          StoreId: storeId
        }
      };

      const rollbackPayload: DeleteOrderRollbackPayload = {
        targetId,
        noteId,
        items: cartSnapshot
      };

      await enqueueJob<DeleteOrderJobPayload>(
        POS_JOB_TYPES.DELETE_ORDER,
        jobPayload,
        {
          rollbackPayload,
          onSuccess: () => {
            console.log(`[usePosCancelOrder] ⚡ API deleteOrderCache thành công cho bàn ${targetId}`);
          },
          onFailed: async (errMsg) => {
            console.error(`[usePosCancelOrder] ❌ API deleteOrderCache thất bại cho bàn ${targetId}:`, errMsg);
            
            // Khôi phục lại dữ liệu giỏ hàng trong Dexie DB
            if (cartSnapshot.length > 0) {
              await posCartCacheService.saveTableCart(targetId, noteId, cartSnapshot);
            }

            // Gọi callback rollback trên UI
            options?.onRollback?.(cartSnapshot);

            // Hiển thị thông báo lỗi
            showError(errMsg || 'Gặp lỗi trong quá trình xử lý hủy đơn hàng!', 'Hủy đơn thất bại');
          }
        }
      );
    } catch (err: any) {
      console.error('[usePosCancelOrder] Lỗi xử lý hủy đơn:', err);
      showError(err?.message || 'Có lỗi xảy ra khi hủy đơn.', 'Lỗi');
    } finally {
      isCancelling.value = false;
    }
  };

  return {
    isCancelling,
    cancelOrder
  };
}
