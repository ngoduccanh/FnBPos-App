import { ref } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';
import { getProductGroupOptionsApi } from '../api/productGroupApi';
import { mapTableOptions } from '../mappers/tablesMapper';
import { posProductCacheService } from '@/services/posDexieDB/posProductCacheService';
import type { PosTableAreaGroup } from '../types/tables.types';

// 🚀 SINGLETON RAM CACHE — Lưu trữ nhóm sản phẩm trong RAM, không bao giờ phải nạp lại khi chuyển bàn
const sharedProductGroups = ref<PosTableAreaGroup[]>([]);
const isSharedGroupsLoading = ref<boolean>(false);
const sharedGroupsError = ref<string | null>(null);

export function useProductGroupOptions() {
  const appStore = useAppStore();
  const authStore = useAuthStore();

  const productGroups = sharedProductGroups;
  const isLoading = isSharedGroupsLoading;
  const error = sharedGroupsError;

  const loadProductGroupsFromCache = async () => {
    if (productGroups.value.length > 0) {
      return productGroups.value;
    }

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

      posProductCacheService.saveProductGroups(mappedGroups);

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
