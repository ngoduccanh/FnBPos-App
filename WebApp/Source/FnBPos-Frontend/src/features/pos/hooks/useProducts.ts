import { ref } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';
import { getListProductApi } from '../api/productsApi';
import { mapProductList } from '../mappers/productsMapper';
import { posProductCacheService } from '@/services/posDexieDB/posProductCacheService';
import type { PosProductItem, ProductFilterParams } from '../types/products.types';

// 🚀 SINGLETON RAM CACHE — Lưu trữ danh sách sản phẩm trong RAM, không bao giờ phải nạp lại khi đổi bàn (0ms delay)
const sharedProducts = ref<PosProductItem[]>([]);
const sharedTotalSize = ref<number>(0);
const isSharedLoading = ref<boolean>(false);
const sharedError = ref<string | null>(null);

/**
 * ⚡ HOOK QUẢN LÝ VÀ FETCH DANH SÁCH SẢN PHẨM / THỰC ĐƠN POS VỚI DEXIE LOCAL DB CACHE
 */
export function useProducts() {
  const appStore = useAppStore();
  const authStore = useAuthStore();

  const products = sharedProducts;
  const totalSize = sharedTotalSize;
  const isLoading = isSharedLoading;
  const error = sharedError;

  /**
   * 🚀 LẤY DANH SÁCH SẢN PHẨM TỪ BỘ NHỚ LOCAL DEXIE DB (0ms delay)
   */
  const loadProductsFromCache = async () => {
    // Nếu đã có sẵn trong RAM thì trả về ngay lập tức không cần đọc DB
    if (products.value.length > 0) {
      return products.value;
    }

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

      // 💾 LƯU SẢN PHẨM VÀO DEXIE LOCAL DB TRONG NỀN
      posProductCacheService.saveProducts(mappedList);

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
