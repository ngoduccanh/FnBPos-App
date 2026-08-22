import { onMounted, onUnmounted, watch } from 'vue';
import { useNetworkStatus } from '@/services/useNetworkStatus';

/**
 * 🛡️ usePreventOfflineRefresh
 *
 * Ngăn người dùng vô tình F5 / Ctrl+R / bấm nút refresh khi đang offline.
 * Khi online → tất cả hoạt động bình thường.
 *
 * Cơ chế:
 *  - keydown F5 / Ctrl+R / Cmd+R → preventDefault + hiện toast cảnh báo
 *  - beforeunload → bẫy nút refresh browser → hộp thoại xác nhận native
 *
 * @param onWarnCallback - Callback tùy chọn để hiện UI cảnh báo (toast, snackbar...)
 *
 * @example
 * // Trong PosMainView.vue
 * usePreventOfflineRefresh(() => {
 *   toast.warning('Đang offline! Không thể tải lại trang.');
 * });
 */
export function usePreventOfflineRefresh(onWarnCallback?: () => void) {
  const { isOffline } = useNetworkStatus();

  // ── Handler 1: Bắt F5 / Ctrl+R / Cmd+R ──────────────────────────────────
  const handleKeydown = (e: KeyboardEvent) => {
    if (!isOffline.value) return;

    const isF5     = e.key === 'F5';
    const isCtrlR  = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r';

    if (isF5 || isCtrlR) {
      e.preventDefault();
      e.stopPropagation();
      onWarnCallback?.();
      console.warn('[PreventOfflineRefresh] 🚫 Chặn F5/Ctrl+R khi offline');
    }
  };

  // ── Handler 2: Bắt nút refresh browser / đóng tab ─────────────────────
  // beforeunload chỉ hiện hộp thoại native khi có sự kiện user-initiated
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!isOffline.value) return;

    e.preventDefault();
    // returnValue cần thiết cho Chrome/Edge để kích hoạt hộp thoại
    e.returnValue = 'Bạn đang offline. Nếu tải lại trang, dữ liệu chưa đồng bộ có thể bị ảnh hưởng. Bạn có chắc không?';
  };

  // ── Gắn / gỡ listener theo trạng thái offline ────────────────────────────
  // Khi online: gỡ beforeunload (không cần chặn), giữ keydown để react nhanh
  function attachListeners() {
    window.addEventListener('keydown',     handleKeydown,     { capture: true });
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  function detachListeners() {
    window.removeEventListener('keydown',     handleKeydown,     { capture: true });
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }

  onMounted(() => {
    attachListeners();
  });

  onUnmounted(() => {
    detachListeners();
  });
}
