import { ref } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';
import { getProductGroupOptionsApi } from '../api/productGroupApi';
import { mapTableOptions } from '../mappers/tablesMapper';
import { posProductCacheService } from '@/services/posDexieDB/posProductCacheService';
import type { PosTableAreaGroup } from '../types/tables.types';


export function useProductGroupOptions() {
  const appStore = useAppStore();
  const authStore = useAuthStore();

  const productGroups = ref<PosTableAreaGroup[]>([]);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);


  const loadProductGroupsFromCache = async () => {
    const cached = await posProductCacheService.getProductGroups();
    if (cached && cached.length > 0) {
      cached.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi', { numeric: true }));
      productGroups.value = cached;
      return cached;
    }
    return [];
  };


  const fetchProductGroupOptions = async (extraParams?: Record<string, any>) => {
    const selectedStore: any = authStore.selectedStore;
    const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;

    if (!storeId) {
      error.value = 'Chưa xác định được ID cửa hàng';
      return [];
    }

    isLoading.value = true;
    error.value = null;

    try {
      const res: any = await getProductGroupOptionsApi(storeId, extraParams);
      const rawData = res?.data?.result || res?.data?.Result || res?.result || res?.Results || [];

      const mappedGroups = mapTableOptions(rawData);
      mappedGroups.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi', { numeric: true }));

      productGroups.value = mappedGroups;

      await posProductCacheService.saveProductGroups(mappedGroups);

      return productGroups.value;
    } catch (err: any) {
      console.error('[Fetch Product Group Options Error]:', err);
      error.value = err?.message || 'Lỗi nạp danh sách nhóm sản phẩm';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  return {
    productGroups,
    isLoading,
    error,
    loadProductGroupsFromCache,
    fetchProductGroupOptions
  };
}
