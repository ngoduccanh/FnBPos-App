import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/appStore';
import { useToast } from '@/shared/components/toast/composables/useToast';
import { getStoresListingApi } from '../api/selectStoreApi';
import { loginByStoreApi } from '@/features/auth/api/authApi';
import { mapStoresResponse } from '../mappers/storeMapper';
import { clearAllPosDatabase } from '@/services/posDexieDB/posDatabase';
import type { StoreBranch } from '../types/store.types';

export function useSelectStore() {
  const router = useRouter();
  const authStore = useAuthStore();
  const appStore = useAppStore();
  const toast = useToast();

  const isLoading = ref(false);
  const errorMessage = ref('');
  const searchText = ref('');

  const pageIndex = ref(0);
  const pageSize = ref(10);
  const totalItems = ref(0);
  const stores = ref<StoreBranch[]>([]);

  const fetchStores = async () => {
    isLoading.value = true;
    errorMessage.value = '';

    try {
      const res: any = await getStoresListingApi({
        PageIndex: pageIndex.value,
        PageSize: pageSize.value,
        SearchText: searchText.value.trim()
      });

      const mappedStores = mapStoresResponse(res);
      totalItems.value = res?.data?.pagingResultModel?.totalSize || 0;

      if (mappedStores.length > 0) {
        stores.value = mappedStores;
        authStore.availableStores = mappedStores;
      } else {
        stores.value = [];
        if (!searchText.value.trim()) {
          errorMessage.value = 'Tài khoản chưa được phân quyền cửa hàng nào.';
        }
      }
    } catch (err: any) {
      console.error('[Fetch Stores Error]', err);
      errorMessage.value = 'Không thể tải danh sách cửa hàng. Vui lòng thử lại sau.';
    } finally {
      isLoading.value = false;
    }
  };

  const handleSearch = () => {
    pageIndex.value = 0; 
    fetchStores();
  };

  const handlePageChange = ({ pageIndex: newIndex, pageSize: newSize }: { pageIndex: number; pageSize: number }) => {
    pageIndex.value = newIndex;
    pageSize.value = newSize;
    fetchStores();
  };

  const handleSelectStore = async (store: StoreBranch) => {
    if (!store?.id) {
      toast.showError('ID cửa hàng không hợp lệ.');
      return;
    }

    isLoading.value = true;
    try {
      // 🧹 1. XÓA SẠCH TOÀN BỘ DEXIE DB CỦA CỬA HÀNG CŨ TRƯỚC KHI VÀO CỬA HÀNG MỚI
      await clearAllPosDatabase();

      const res: any = await loginByStoreApi(store.id);
      const loginData = res?.Data || (res?.accessToken || res?.id ? res : null);
      if (loginData) {
        authStore.setLoginData(loginData);
      }
      authStore.selectStore(store);

      // ⚡ CALL LUÔN API GETHOMEVIEWMODEL NẠP VÀO STORE TỔNG DÙNG TOÀN HỆ THỐNG
      await appStore.loadStoreSession(store.id, true);

      toast.showSuccess(`Đã vào cửa hàng: ${store.name || ''}`, 'Thành công');
      router.push('/pos');
    } catch (err: any) {
      console.error('[LoginByStore Error]', err);
      toast.showError('Không thể kết nối cửa hàng. Vui lòng thử lại sau.');
    } finally {
      isLoading.value = false;
    }
  };

  const handleLogout = async () => {
    await clearAllPosDatabase();
    authStore.logout();
    router.push('/login');
  };

  onMounted(() => {
    fetchStores();
  });

  return {
    isLoading,
    errorMessage,
    searchText,
    pageIndex,
    pageSize,
    totalItems,
    availableStores: stores,
    handleSearch,
    handlePageChange,
    handleSelectStore,
    handleLogout,
    refetchStores: fetchStores
  };
}
