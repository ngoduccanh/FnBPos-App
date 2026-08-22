import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/appStore';

export function usePosInit() {
  const authStore = useAuthStore();
  const appStore = useAppStore();

  const isInitializing = ref<boolean>(false);

  onMounted(async () => {
    if (!appStore.isLoaded) {
      isInitializing.value = true;
      const selectedStore: any = authStore.selectedStore;
      const storeId = selectedStore?.id || selectedStore?.Id || appStore.currentStoreId;
      if (storeId) {
        await appStore.loadStoreSession(storeId);
      }
      isInitializing.value = false;
    }
  });

  return {
    isInitializing,
    session: appStore.session,
    settings: appStore.settings,
    isLoading: appStore.isLoading,
    error: appStore.error
  };
}
