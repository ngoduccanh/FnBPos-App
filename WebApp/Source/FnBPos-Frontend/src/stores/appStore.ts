import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { StoreSession, StoreSettings } from '@/shared/types/storeSession.types';
import { getHomeViewModelApi } from '@/shared/api/storeSessionApi';
import {
  getHomeViewModelCache,
  saveHomeViewModelCache,
  clearHomeViewModelCache
} from '@/services/posDexieDB/posSessionCacheService';

/**
 * 🏬 GLOBAL STORE SESSION STORE
 * Lưu trữ duy nhất 1 lần dữ liệu Session & Settings cho toàn hệ thống.
 *
 * Chiến lược cache:
 *  1. F5 / reload → đọc từ Dexie ngay (không call API)
 *  2. Lần đầu vào store / forceReload → call API → lưu vào Dexie
 *  3. Logout / đổi store → xóa Dexie cache
 */
export const useAppStore = defineStore('appStore', () => {
  // ── STATE ────────────────────────────────────────────────────────────────
  const session    = ref<StoreSession | null>(null);
  const settings   = ref<StoreSettings | null>(null);
  const isLoaded   = ref<boolean>(false);
  const isLoading  = ref<boolean>(false);
  const error      = ref<string | null>(null);

  // ── GETTERS ──────────────────────────────────────────────────────────────
  const currentStoreId  = computed(() => session.value?.id || 0);
  const storeName       = computed(() => session.value?.storeName || '');
  const retailCustomer  = computed(() => session.value?.defaultIds?.retailCustomer);
  const retailSupplier  = computed(() => session.value?.defaultIds?.retailSupplier);

  // ── INTERNAL: áp dữ liệu vào state ──────────────────────────────────────
  function _applyData(data: any): boolean {
    const sessionData  = data?.session  || data?.Session  || null;
    const settingsData = data?.settings || data?.Settings || null;
    if (!sessionData) return false;
    session.value  = sessionData;
    settings.value = settingsData;
    isLoaded.value = true;
    return true;
  }

  // ── ACTIONS ──────────────────────────────────────────────────────────────

  /**
   * Load HomeViewModel cho storeId.
   *
   * Luồng:
   *  1. Nếu đã load trong session RAM → bỏ qua (trừ forceReload)
   *  2. Đọc Dexie cache → nếu có → áp vào state ngay, không call API
   *  3. Nếu chưa có cache hoặc forceReload → call API → lưu Dexie → áp state
   */
  const loadStoreSession = async (storeId: number, forceReload = false): Promise<void> => {
    if (!storeId) return;

    // ── Đã có trong RAM, không cần làm gì ──────────────────────────────────
    if (isLoaded.value && !forceReload && session.value?.id === storeId) return;

    isLoading.value = true;
    error.value = null;

    try {
      // ── Bước 1: Thử đọc từ Dexie trước ───────────────────────────────────
      if (!forceReload) {
        const cached = await getHomeViewModelCache(storeId);
        if (cached) {
          const ok = _applyData(cached);
          if (ok) {
            console.log('[AppStore] ✅ Loaded HomeViewModel từ Dexie cache (storeId:', storeId, ')');
            return; // Có cache → không call API
          }
        }
      }

      // ── Bước 2: Không có cache → call API ────────────────────────────────
      const response: any = await getHomeViewModelApi(storeId);
      const resData = response?.data || response?.Data || response;
      const data    = resData?.homeViewModel || resData?.HomeViewModel || resData;

      if (data) {
        const ok = _applyData(data);
        if (ok) {
          // Lưu vào Dexie để dùng lại sau F5
          await saveHomeViewModelCache(storeId, data);
          console.log('[AppStore] ✅ Loaded HomeViewModel từ API → đã lưu vào Dexie cache');
        }
      }
    } catch (err: any) {
      console.error('[AppStore] ❌ Lỗi load HomeViewModel:', err);
      error.value = err?.message || 'Không thể lấy cấu hình phiên làm việc cửa hàng';
    } finally {
      isLoading.value = false;
    }
  };

  const clearAppStore = async () => {
    // Xóa cache Dexie khi logout / đổi cửa hàng
    if (session.value?.id) {
      await clearHomeViewModelCache(session.value.id);
    }
    session.value   = null;
    settings.value  = null;
    isLoaded.value  = false;
    isLoading.value = false;
    error.value     = null;
  };

  return {
    // State
    session, settings, isLoaded, isLoading, error,
    // Computed
    currentStoreId, storeName, retailCustomer, retailSupplier,
    // Actions
    loadStoreSession, clearAppStore
  };
});
