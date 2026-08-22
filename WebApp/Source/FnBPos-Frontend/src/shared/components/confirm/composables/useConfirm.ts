import { ref } from 'vue';
import type { ConfirmOptions, ConfirmState } from '../types/confirm.types';

const state = ref<ConfirmState>({
  isOpen: false,
  title: 'Xác nhận',
  message: '',
  subMessage: '',
  type: 'info',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy bỏ'
});

export function useConfirm() {
  /**
   * ❓ Hiển thị hộp thoại xác nhận tuỳ biến (trả về Promise<boolean>)
   */
  const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      state.value = {
        isOpen: true,
        title: options.title || 'Xác nhận',
        message: options.message,
        subMessage: options.subMessage || '',
        type: options.type || 'info',
        confirmText: options.confirmText || 'Xác nhận',
        cancelText: options.cancelText || 'Hủy bỏ',
        resolve
      };
    });
  };

  /**
   * ✅ Xác nhận hành động
   */
  const handleConfirm = () => {
    state.value.isOpen = false;
    if (state.value.resolve) {
      state.value.resolve(true);
    }
  };

  /**
   * ❌ Hủy bỏ hành động
   */
  const handleCancel = () => {
    state.value.isOpen = false;
    if (state.value.resolve) {
      state.value.resolve(false);
    }
  };

  /**
   * 🟢 Shortcut xác nhận duyệt món
   */
  const confirmApprove = (message: string, count?: number) => {
    return showConfirm({
      title: 'Xác nhận duyệt món',
      message: message,
      subMessage: count ? `Tổng cộng ${count} món sẽ được chuyển sang trạng thái đã duyệt.` : '',
      type: 'success',
      confirmText: 'Duyệt món',
      cancelText: 'Bỏ qua'
    });
  };

  /**
   * 🔴 Shortcut xác nhận từ chối / hủy món
   */
  const confirmReject = (message: string, count?: number) => {
    return showConfirm({
      title: 'Xác nhận từ chối món',
      message: message,
      subMessage: count ? `Tổng cộng ${count} món sẽ bị từ chối phục vụ.` : 'Món bị từ chối sẽ không được gửi vào chế biến.',
      type: 'danger',
      confirmText: 'Từ chối',
      cancelText: 'Quay lại'
    });
  };

  /**
   * 🗑️ Shortcut xác nhận xóa toàn bộ đơn
   */
  const confirmDelete = (message: string, subMessage?: string) => {
    return showConfirm({
      title: 'Cảnh báo xóa đơn',
      message: message,
      subMessage: subMessage || 'Thao tác này không thể hoàn tác.',
      type: 'danger',
      confirmText: 'Xóa ngay',
      cancelText: 'Hủy bỏ'
    });
  };

  return {
    state,
    showConfirm,
    handleConfirm,
    handleCancel,
    confirmApprove,
    confirmReject,
    confirmDelete
  };
}
