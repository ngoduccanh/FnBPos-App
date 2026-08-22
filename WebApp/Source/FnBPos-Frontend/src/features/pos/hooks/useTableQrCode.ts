import { ref, computed } from 'vue';
import { getTableQrCodeApi } from '../api/tableQrApi';
import { posTableQrCacheService } from '@/services/posDexieDB/posTableQrCacheService';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/shared/components/toast/composables/useToast';

/**
 * 📲 HOOK QUẢN LÝ LẤY VÀ XỬ LÝ MÃ QR BÀN (OFFLINE-FIRST CACHE DEXIE DB)
 */
export function useTableQrCode() {
  const appStore = useAppStore();
  const authStore = useAuthStore();
  const { showError } = useToast();

  const qrBase64 = ref<string>('');
  const isLoading = ref<boolean>(false);

  /**
   * 🖼️ Chuẩn hóa URL hiển thị trên thẻ <img> (Data URL)
   */
  const qrImageUrl = computed(() => {
    if (!qrBase64.value) return '';
    if (qrBase64.value.startsWith('data:image')) {
      return qrBase64.value;
    }
    return `data:image/png;base64,${qrBase64.value}`;
  });

  /**
   * 🚀 Lấy mã QR bàn: Ưu tiên nạp từ Dexie DB (0ms), nếu chưa có mới gọi Server
   */
  const fetchTableQrCode = async (targetId: number, forceReload = false): Promise<string | null> => {
    const selectedStore: any = authStore.selectedStore;
    const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;

    if (!storeId || !targetId) {
      console.warn('[useTableQrCode] Thiếu storeId hoặc targetId:', { storeId, targetId });
      return null;
    }

    // ⚡ 1. KIỂM TRA BỘ NHỚ LOCAL DEXIE DB TRƯỚC (0ms)
    if (!forceReload) {
      const cachedQr = await posTableQrCacheService.getQrCode(targetId);
      if (cachedQr) {
        console.log(`[useTableQrCode] ⚡ Đã nạp mã QR bàn #${targetId} từ Dexie DB trong 0ms!`);
        qrBase64.value = cachedQr;
        return qrImageUrl.value;
      }
    }

    // 🌐 2. NẾU CHƯA CÓ TRONG DEXIE DB -> GỌI API LẦN ĐẦU VÀ LƯU LẠI
    isLoading.value = true;
    try {
      const res: any = await getTableQrCodeApi(storeId, targetId);
      const rawData = res?.data?.data || res?.data?.Data || res?.data?.result || res?.data?.Result || res?.data || '';

      if (typeof rawData === 'string' && rawData.trim()) {
        const cleanBase64 = rawData.trim();
        qrBase64.value = cleanBase64;
        
        // 💾 Lưu vĩnh viễn vào Dexie DB để các lần sau không cần gọi lại API nữa!
        await posTableQrCacheService.saveQrCode(targetId, storeId, cleanBase64);
        
        return qrImageUrl.value;
      } else {
        throw new Error(res?.data?.errors?.[0] || 'Không nhận được dữ liệu ảnh mã QR');
      }
    } catch (err: any) {
      console.error('[useTableQrCode] Lỗi lấy mã QR bàn:', err);
      showError(err?.message || 'Không thể tạo mã QR cho bàn này');
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const clearQrCode = () => {
    qrBase64.value = '';
    isLoading.value = false;
  };

  return {
    qrBase64,
    qrImageUrl,
    isLoading,
    fetchTableQrCode,
    clearQrCode
  };
}
