import { ref } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';
import { getTablesAreaApi } from '../api/tablesAreaApi';
import { mapTableOptions } from '../mappers/tablesMapper';
import type { PosTableAreaGroup } from '../types/tables.types';
import {
  getTableAreaCache,
  saveTableAreaCache
} from '@/services/posDexieDB/posSessionCacheService';

export function useTableArea() {
  const appStore  = useAppStore();
  const authStore = useAuthStore();

  const tablesArea = ref<PosTableAreaGroup[]>([]);
  const isLoading  = ref<boolean>(false);
  const error      = ref<string | null>(null);

  /**
   * Lấy danh sách khu vực bàn.
   *
   * Luồng:
   *  1. Đọc Dexie cache → nếu có → dùng ngay, không call API
   *  2. Nếu chưa có cache → call API → lưu Dexie
   *
   * @param forceReload - true để bỏ qua cache, call API mới nhất
   */
  const fetchTableArea = async (forceReload = false): Promise<PosTableAreaGroup[]> => {
    const selectedStore: any = authStore.selectedStore;
    const storeId = appStore.session?.id || appStore.currentStoreId
      || selectedStore?.id || selectedStore?.Id || 0;

    if (!storeId) {
      error.value = 'Chưa xác định được ID cửa hàng';
      return [];
    }

    isLoading.value = true;
    error.value = null;

    try {
      // ── Bước 1: Thử đọc Dexie cache ───────────────────────────────────────
      if (!forceReload) {
        const cached = await getTableAreaCache(storeId);
        if (cached && cached.length > 0) {
          tablesArea.value = cached;
          console.log('[useTableArea] ✅ Loaded TableArea từ Dexie cache (storeId:', storeId, ')');
          return cached;
        }
      }

      // ── Bước 2: Không có cache → call API ─────────────────────────────────
      const res: any = await getTablesAreaApi(storeId);
      const rawData  = res?.data?.result || res?.data?.Result || res?.result || res?.Results || res?.data || res?.Data || res || [];
      const mapped   = mapTableOptions(rawData);

      tablesArea.value = mapped;

      // Lưu vào Dexie để dùng lại sau F5
      if (mapped.length > 0) {
        await saveTableAreaCache(storeId, mapped);
        console.log('[useTableArea] ✅ Loaded TableArea từ API → đã lưu vào Dexie cache');
      }

      return mapped;
    } catch (err: any) {
      console.error('[useTableArea] ❌ Lỗi lấy danh sách khu vực bàn:', err);
      error.value = err?.message || 'Lỗi lấy danh sách khu vực bàn';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  return {
    tablesArea,
    isLoading,
    error,
    fetchTableArea
  };
}