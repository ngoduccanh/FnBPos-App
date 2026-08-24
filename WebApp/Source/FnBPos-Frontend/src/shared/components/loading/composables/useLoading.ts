import { ref, computed } from 'vue';
import type { LoadingState } from '../types/loading.types';

const state = ref<LoadingState>({
  isLoading: false,
  message: 'Đang tải dữ liệu...',
  subMessage: ''
});

let activeRequestsCount = 0;

export function useLoading() {
  const isLoading = computed(() => state.value.isLoading);
  const loadingMessage = computed(() => state.value.message || 'Đang xử lý...');
  const loadingSubMessage = computed(() => state.value.subMessage || '');

  /**
   * ⏳ Hiển thị màn hình Loading toàn cục
   */
  const showLoading = (message = 'Đang tải dữ liệu...', subMessage = '') => {
    activeRequestsCount++;
    state.value = {
      isLoading: true,
      message,
      subMessage
    };
  };

  /**
   * Ẩn màn hình Loading
   */
  const hideLoading = (force = false) => {
    if (force) {
      activeRequestsCount = 0;
      state.value.isLoading = false;
      return;
    }

    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    if (activeRequestsCount === 0) {
      state.value.isLoading = false;
    }
  };

  /**
   * ⚡ Bọc 1 hàm Async tự động bật và tắt Loading
   */
  const withLoading = async <T>(
    fn: () => Promise<T>,
    message = 'Đang xử lý...',
    subMessage = ''
  ): Promise<T> => {
    showLoading(message, subMessage);
    try {
      return await fn();
    } finally {
      hideLoading();
    }
  };

  return {
    state,
    isLoading,
    loadingMessage,
    loadingSubMessage,
    showLoading,
    hideLoading,
    withLoading
  };
}
