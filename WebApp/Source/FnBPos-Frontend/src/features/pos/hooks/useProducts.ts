import { ref } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';
import { getListProductApi } from '../api/productsApi';
import { mapProductList } from '../mappers/productsMapper';
import { posProductCacheService } from '@/services/posDexieDB/posProductCacheService';
import type { PosProductItem, ProductFilterParams } from '../types/products.types';

/**
 * ⚡ HOOK QUẢN LÝ VÀ FETCH DANH SÁCH SẢN PHẨM / THỰC ĐƠN POS VỚI DEXIE LOCAL DB CACHE
 */
export function useProducts() {
  const appStore = useAppStore();
  const authStore = useAuthStore();

  const products = ref<PosProductItem[]>([]);
  const totalSize = ref<number>(0);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  /**
   * 🚀 LẤY DANH SÁCH SẢN PHẨM TỪ BỘ NHỚ LOCAL DEXIE DB (0ms delay)
   */
  const loadProductsFromCache = async () => {
    const cached = await posProductCacheService.getProducts();
    if (cached && cached.length > 0) {
      products.value = cached;
      totalSize.value = cached.length;
      return cached;
    }
    return [];
  };

  /**
   * 📡 CALL API LẤY DANH SÁCH SẢN PHẨM & LƯU VÀO DEXIE DB
   */
  const fetchProducts = async (params?: Partial<ProductFilterParams>) => {
    const selectedStore: any = authStore.selectedStore;
    const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;

    if (!storeId) {
      error.value = 'Chưa xác định được ID cửa hàng';
      return [];
    }

    isLoading.value = true;
    error.value = null;

    try {
      const res: any = await getListProductApi(storeId, params);
      
      const dataObj = res?.data?.Data || res?.Data || res?.data || {};
      const pagingObj = dataObj?.PagingResultModel || dataObj?.pagingResultModel;
      const rawResults = pagingObj?.Results || pagingObj?.results || dataObj?.Results || dataObj?.results || [];

      const mappedList = mapProductList(rawResults);
      totalSize.value = pagingObj?.TotalSize || dataObj?.TotalSize || mappedList.length;
      products.value = mappedList;

      // 💾 LƯU SẢN PHẨM VÀO DEXIE LOCAL DB
      await posProductCacheService.saveProducts(mappedList);

      return products.value;
    } catch (err: any) {
      console.error('[Fetch Products Error]:', err);
      error.value = err?.message || 'Lỗi nạp danh sách sản phẩm';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  return {
    products,
    totalSize,
    isLoading,
    error,
    loadProductsFromCache,
    fetchProducts
  };
}
