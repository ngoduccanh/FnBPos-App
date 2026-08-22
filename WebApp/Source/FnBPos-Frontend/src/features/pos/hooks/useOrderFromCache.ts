import { ref } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';
import { getOrderFromCacheApi } from '../api/getOrderApi';
import { mapOrderCacheToDeliveryNoteWithRoundsModel } from '../mappers/orderCacheMapper';
import type { DeliveryNoteWithRoundsModel } from '@/shared/types/deliveryNote.types';

export function useOrderFromCache() {
    const appStore = useAppStore();
    const authStore = useAuthStore();
    const ordersFromCache = ref<DeliveryNoteWithRoundsModel[]>([]);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);
     
    const fetchOrdersFromCache = async (params?: any, silent = false) => {
        const selectedStore: any = authStore.selectedStore;
        const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;
        if (!storeId) {
            error.value = 'Chưa xác định được ID cửa hàng';
            return [];
        }
        if (!silent) isLoading.value = true;
        error.value = null;
        try {
            const res: any = await getOrderFromCacheApi(storeId, params);
            console.log('[useOrderFromCache] API Response:', res);
            const rawData = res?.data?.result || res?.data?.Result || res?.data || res?.result || [];
            console.log('[useOrderFromCache] RawData extracted:', rawData);
            const mappedOrders = mapOrderCacheToDeliveryNoteWithRoundsModel(rawData);
            console.log('[useOrderFromCache] MappedOrders:', mappedOrders);
            ordersFromCache.value = mappedOrders;
            return mappedOrders;
        } catch (err: any) {
            console.error('[Fetch Order From Cache Error]:', err);
            error.value = err?.message || 'Lỗi lấy đơn hàng từ cache';
            return [];
        } finally {
            if (!silent) isLoading.value = false;
        }
    };
    return {
        ordersFromCache,
        isLoading,
        error,
        fetchOrdersFromCache
    }

}