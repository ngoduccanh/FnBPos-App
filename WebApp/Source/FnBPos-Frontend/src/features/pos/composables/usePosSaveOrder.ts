import { ref } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/shared/components/toast/composables/useToast';
import { usePosQueue } from './usePosQueue';
import { POS_JOB_TYPES } from '@/services/posQueue/posQueueHandlers';
import { posCartCacheService } from '@/services/posDexieDB/posCartCacheService';
import { posTableCacheService } from '@/services/posDexieDB/posTableCacheService';
import { buildSaveOrderPayload } from '../helpers/saveOrderPayloadBuilder';
import type { PosTableItem } from '../types/tables.types';
import type { CartItem } from '../mappers/orderDetailMapper';
import type { SaveOrderRollbackPayload } from '@/services/posQueue/posQueueHandlers';

export interface SaveOrderOptions {
  orderNote?: string;
  isCreateEInvoice?: boolean;
  onRollback?: (previousItems: CartItem[]) => void;
  onSuccess?: () => void;
}

/**
 * 💾 usePosSaveOrder — Composable xử lý đặt món, lưu đơn tạm & đưa vào hàng đợi đồng bộ (POS Queue)
 */
export function usePosSaveOrder() {
  const isSavingOrder = ref<boolean>(false);
  const appStore = useAppStore();
  const authStore = useAuthStore();
  const { showSuccess, showError } = useToast();
  const { enqueue: enqueueJob } = usePosQueue();

  const handleSaveOrderTemporarily = async (
    table: PosTableItem | null,
    cartItems: CartItem[],
    options?: SaveOrderOptions
  ): Promise<boolean> => {
    if (!table) {
      showError('Vui lòng chọn Bàn trước khi đặt món!', 'Thông báo');
      return false;
    }

    if (!cartItems || cartItems.length === 0) {
      showError('Giỏ hàng đang trống! Vui lòng chọn ít nhất 1 món.', 'Thông báo');
      return false;
    }

    const targetId = table.id;
    const noteId = table.noteId || table.activeOrder?.noteId || table.orderInfo?.noteId || 0;

    isSavingOrder.value = true;

    try {
      // 1. Chụp snapshot trạng thái giỏ & trạng thái bàn trước đó trong Dexie để phục vụ rollback nếu lỗi
      const previousCartSnapshot = await posCartCacheService.getTableCart(targetId);
      const tablesList = await posTableCacheService.getTables();
      const previousTable = tablesList.find(t => t.id === targetId);

      const rollbackSnapshot: SaveOrderRollbackPayload = {
        targetId,
        noteId,
        items: previousCartSnapshot ? [...previousCartSnapshot] : [],
        previousTable: previousTable ? JSON.parse(JSON.stringify(previousTable)) : undefined
      };

      // 2. Tính toán tổng số món, tổng tiền và giờ vào ngay trên Frontend
      const totalQty = cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
      const totalMoney = cartItems.reduce((acc, it) => acc + (it.totalPrice || (it.price * it.quantity) || 0), 0);
      const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

      // 3. Cập nhật lạc quan (Optimistic UI) trực tiếp vào Dexie Tables & Cart ngay lập tức (0ms)
      await Promise.all([
        posCartCacheService.saveTableCart(targetId, noteId, cartItems),
        posTableCacheService.updateTableOrderOptimistic(targetId, {
          prodCount: totalQty,
          totalAmount: totalMoney,
          timeStarted: currentTime,
          customerName: 'Bán cho người tiêu dùng',
          noteId
        })
      ]);

      // ⚡ THÔNG BÁO THÀNH CÔNG NGAY KHI LƯU VÀO DEXIEDB
      showSuccess('Đặt món thành công!');
      if (options?.onSuccess) {
        options.onSuccess();
      }

      // 4. Chuẩn bị payload và đẩy vào POS Queue đồng bộ ngầm
      const currUser = authStore.user;
      const selectedStore: any = authStore.selectedStore;
      const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;

      if (storeId) {
        const payload = buildSaveOrderPayload(table, cartItems, currUser, {
          orderNote: options?.orderNote || '',
          isCreateEInvoice: options?.isCreateEInvoice || false
        });

        await enqueueJob(
          POS_JOB_TYPES.SAVE_ORDER,
          { storeId, model: payload },
          {
            rollbackPayload: rollbackSnapshot,
            onFailed: async (errorMsg: string) => {
              // 1. Rollback lại cache Dexie Cart & Tables về snapshot trước đó
              if (rollbackSnapshot.items.length === 0) {
                await posCartCacheService.deleteTableCart(targetId);
              } else {
                await posCartCacheService.saveTableCart(targetId, noteId, rollbackSnapshot.items);
              }

              if (rollbackSnapshot.previousTable) {
                const tables = await posTableCacheService.getTables();
                const updated = tables.map(t => t.id === targetId ? { ...rollbackSnapshot.previousTable! } : t);
                await posTableCacheService.saveTables(updated);
              } else {
                await posTableCacheService.clearTableOrderOptimistic(targetId);
              }

              // 2. Rollback reactive cart items trên giao diện UI
              if (options?.onRollback) {
                options.onRollback(rollbackSnapshot.items);
              }

              // 3. Hiển thị thông báo lỗi: nếu có message từ API thì hiện message đó, không thì hiện thông báo mặc định
              const finalMessage = (errorMsg && errorMsg.trim())
                ? errorMsg
                : 'Gặp lỗi trong quá trình xử lý dữ liệu, thông tin bàn và giỏ hàng đã được hoàn tác';

              showError(finalMessage, 'Lỗi đặt món');
            }
          }
        );
      }

      return true;
    } catch (err: any) {
      console.error('[usePosSaveOrder] ❌ Lỗi lưu đơn tạm:', err);
      showError(err?.message || 'Không thể lưu tạm đơn hàng. Vui lòng thử lại!', 'Thất bại');
      return false;
    } finally {
      isSavingOrder.value = false;
    }
  };

  return {
    isSavingOrder,
    handleSaveOrderTemporarily
  };
}
