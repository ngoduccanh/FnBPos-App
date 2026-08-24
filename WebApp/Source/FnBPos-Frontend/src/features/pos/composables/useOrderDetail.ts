import { ref } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';
import { posCartCacheService } from '@/services/posDexieDB/posCartCacheService';
import { getOrderDetailApi } from '../api/getOrderDetailApi';
import { mapDeliveryNoteItemsToCart } from '../mappers/orderDetailMapper';
import type { PosTableItem } from '../types/tables.types';
import type { CartItem } from '../mappers/orderDetailMapper';

/**
 * 📋 useOrderDetail — Composable nạp chi tiết đơn hàng của bàn (Cache-first 0ms + API fallback)
 */
export function useOrderDetail() {
  const isCartLoading = ref<boolean>(false);
  const appStore = useAppStore();
  const authStore = useAuthStore();

  /**
   * Nạp chi tiết giỏ hàng theo bàn.
   * Ưu tiên đọc từ Dexie Local 0ms, nếu chưa có sẽ gọi API và lưu vào Dexie.
   */
  const loadCartOrderDetail = async (
    table: PosTableItem | null,
    onSuccess: (items: CartItem[]) => void
  ): Promise<void> => {
    const targetId = table?.id || 0;
    const noteId = table?.noteId || 0;

    if (!targetId) {
      onSuccess([]);
      return;
    }

    // ── Bước 1: Đọc trực tiếp từ Dexie Local Cache theo targetId (0ms) ───────────────────
    const localCartItems = await posCartCacheService.getTableCart(targetId);
    if (localCartItems && localCartItems.length > 0) {
      console.log(`⚡ [useOrderDetail] Nạp 0ms giỏ hàng cho Bàn ID ${targetId} từ DexieDB:`, localCartItems);
      onSuccess(localCartItems);
      return;
    }

    // ── Bước 2: Chưa có trong Dexie và không có noteId -> Bàn rỗng ──────────────────────
    if (!noteId) {
      onSuccess([]);
      return;
    }

    // ── Bước 2: Chưa có cache -> Gọi API từ server ────────────────────────
    const selectedStore: any = authStore.selectedStore;
    const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;

    if (!storeId) return;

    isCartLoading.value = true;
    try {
      const res: any = await getOrderDetailApi(storeId, noteId, targetId);
      const dataObj = res?.data?.Data || res?.Data || res?.data || {};
      const noteItems = dataObj?.noteItems || dataObj?.NoteItems || [];

      const fetchedCartItems = mapDeliveryNoteItemsToCart(noteItems);
      onSuccess(fetchedCartItems);

      // Lưu vào Dexie cache để dùng lại cho các lần sau
      await posCartCacheService.saveTableCart(targetId, noteId, fetchedCartItems);
    } catch (err) {
      console.error('[useOrderDetail] ❌ Lỗi nạp chi tiết đơn hàng:', err);
    } finally {
      isCartLoading.value = false;
    }
  };

  return {
    isCartLoading,
    loadCartOrderDetail
  };
}
