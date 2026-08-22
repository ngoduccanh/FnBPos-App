import { ref, readonly } from 'vue';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type NetworkStatus = 'online' | 'offline';

// ─────────────────────────────────────────────────────────────────────────────
// STATE — module-level singleton (dùng chung toàn app)
// ─────────────────────────────────────────────────────────────────────────────

const _isOnline  = ref<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
const _isOffline = ref<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
const _status    = ref<NetworkStatus>(typeof navigator !== 'undefined'
  ? (navigator.onLine ? 'online' : 'offline')
  : 'online'
);

let _initialized = false;

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────────────────

function _setOnline(): void {
  _isOnline.value  = true;
  _isOffline.value = false;
  _status.value    = 'online';
  console.log('[NetworkStatus] 🌐 Online');
}

function _setOffline(): void {
  _isOnline.value  = false;
  _isOffline.value = true;
  _status.value    = 'offline';
  console.log('[NetworkStatus] 📡 Offline');
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 🌐 Khởi tạo lắng nghe sự kiện mạng (online/offline).
 * Gọi 1 lần duy nhất trong main.ts — trước khi mount app.
 * Các module khác (queue, composable...) chỉ cần import state, không cần gọi lại.
 */
export function initNetworkStatusListener(): void {
  if (_initialized) return;
  _initialized = true;

  // Đồng bộ trạng thái ban đầu
  navigator.onLine ? _setOnline() : _setOffline();

  window.addEventListener('online',  _setOnline);
  window.addEventListener('offline', _setOffline);
}

/**
 * Kiểm tra trạng thái mạng tại thời điểm hiện tại (non-reactive).
 * Dùng trong logic thuần (không phải template Vue).
 */
export function checkIsOnline(): boolean {
  return navigator.onLine;
}

/**
 * Reactive state — dùng trực tiếp trong Vue composable & template.
 * Readonly để tránh mutation từ bên ngoài.
 */
export const networkIsOnline  = readonly(_isOnline);
export const networkIsOffline = readonly(_isOffline);
export const networkStatus    = readonly(_status);

/**
 * 📡 useNetworkStatus — Vue Composable
 * Dùng trong component để lấy reactive network state.
 *
 * @example
 * const { isOnline, isOffline, status } = useNetworkStatus();
 */
export function useNetworkStatus() {
  return {
    isOnline:  networkIsOnline,
    isOffline: networkIsOffline,
    status:    networkStatus,
    checkIsOnline
  };
}
