import { ref } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';
import { getTableOptionsApi } from '../api/tablesApi';
import { mapTableOptions } from '../mappers/tablesMapper';
import type { PosTableItem } from '../types/tables.types';

export function useTableOptions() {
  const appStore = useAppStore();
  const authStore = useAuthStore();
  
  const tables = ref<PosTableItem[]>([]);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  /**
   * ⚡ CALL API LẤY TOÀN BỘ DANH SÁCH BÀN CỦA CỬA HÀNG (CÓ HỖ TRỢ SEARCH)
   */
  const fetchTableOptions = async (extraParams?: Record<string, any>, silent = false) => {
    const selectedStore: any = authStore.selectedStore;
    const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;
    
    if (!storeId) {
      error.value = 'Chưa xác định được ID cửa hàng';
      return [];
    }
    if (!silent) isLoading.value = true;
    error.value = null;

    try {
      const res: any = await getTableOptionsApi(storeId, extraParams);
      const rawData = res?.data?.result || res?.data?.Result || res?.result || res?.Results || [];
      
      tables.value = mapTableOptions(rawData);
      return tables.value;
    } catch (err: any) {
      console.error('[Fetch Table Options Error]:', err);
      error.value = err?.message || 'Lỗi lấy danh sách bàn';
      return [];
    } finally {
      if (!silent) isLoading.value = false;
    }
  };

  return {
    tables,
    isLoading,
    error,
    fetchTableOptions
  };
}
