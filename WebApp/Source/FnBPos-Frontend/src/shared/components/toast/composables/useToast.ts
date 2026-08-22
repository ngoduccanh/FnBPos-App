import { ref } from 'vue';
import type { ToastItem, ToastType } from '../types/toast.types';

const toasts = ref<ToastItem[]>([]);

export function useToast() {
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  };

  const addToast = (type: ToastType, message: string, title?: string, duration: number = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: ToastItem = { id, type, message, title, duration };
    
    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const showSuccess = (message: string, title: string = 'Thành công') => {
    addToast('success', message, title);
  };

  const showError = (message: string, title: string = 'Thất bại') => {
    addToast('error', message, title);
  };

  const showWarning = (message: string, title: string = 'Cảnh báo') => {
    addToast('warning', message, title);
  };

  const showInfo = (message: string, title: string = 'Thông báo') => {
    addToast('info', message, title);
  };

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
