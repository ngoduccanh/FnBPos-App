import { ref } from 'vue';
import { getChildStoresApi } from '../api/getChildStoresApi';
import type { ChildStoreOption } from '../types/childStores.types';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';

/**
 * 🏬 useChildStores — Hook lấy danh sách nhà con / chi nhánh của cửa hàng hiện tại
 */
export function useChildStores() {
  const childStores = ref<ChildStoreOption[]>([]);
  const isLoading = ref<boolean>(false);
  const appStore = useAppStore();
  const authStore = useAuthStore();

  const fetchChildStores = async (customStoreId?: number): Promise<ChildStoreOption[]> => {
    const selectedStore: any = authStore.selectedStore;
    const storeId = customStoreId || appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;

    if (!storeId) {
      childStores.value = [];
      return [];
    }

    isLoading.value = true;
    try {
      const res: any = await getChildStoresApi(storeId);
      let list: ChildStoreOption[] = [];

      if (Array.isArray(res)) {
        list = res;
      } else if (res && Array.isArray(res.data)) {
        list = res.data;
      } else if (res && Array.isArray(res.Data)) {
        list = res.Data;
      }

      childStores.value = list;
      return list;
    } catch (err) {
      console.error('[useChildStores] ❌ Lỗi lấy danh sách nhà con:', err);
      childStores.value = [];
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  return {
    childStores,
    isLoading,
    fetchChildStores
  };
}
