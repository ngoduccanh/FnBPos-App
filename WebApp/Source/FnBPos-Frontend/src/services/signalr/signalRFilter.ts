import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/appStore';


export const signalRFilter = {

  isMatchingCurrentStore(data: any): boolean {
    try {
      const authStore = useAuthStore();
      const appStore = useAppStore();
      const selectedStore: any = authStore?.selectedStore;
      const currentStoreId = Number(appStore?.session?.id || appStore?.currentStoreId || selectedStore?.id || selectedStore?.Id || 0);

      const incomingStoreId = Number(data?.Data?.StoreId || data?.Data?.storeId || data?.StoreId || data?.storeId || 0);

      if (incomingStoreId && currentStoreId && incomingStoreId !== currentStoreId) {
        console.log(`[SignalRFilter] 🛑 Bỏ qua broadcast vì khác StoreId (Nhận: ${incomingStoreId}, Hiện tại: ${currentStoreId})`);
        return false;
      }
    } catch (err) {
      console.warn('[SignalRFilter] Lỗi kiểm tra StoreId:', err);
    }
    return true;
  },


  isSelfAction(data: any): boolean {
    try {
      const authStore = useAuthStore();
      if (!authStore?.user) return false;

      const user = authStore.user;
      const currentUserId = String(user.id || (user as any).Id || (user as any).userId || '').toLowerCase().trim();
      const currentUsername = String(user.username || (user as any).userName || '').toLowerCase().trim();
      const currentFullName = String(user.fullName || (user as any).FullName || user.name || (user as any).Name || '').toLowerCase().trim();

      const payload = data?.Data || data?.data || data || {};
      const msgText = String(data?.Message || data?.message || payload?.Message || payload?.message || (typeof payload === 'string' ? payload : '')).toLowerCase();

      const senderId = String(payload?.CreatedBy || payload?.createdBy || payload?.UserId || payload?.userId || data?.CreatedBy || data?.UserId || '').toLowerCase().trim();
      const senderUsername = String(payload?.UserName || payload?.userName || payload?.Username || payload?.username || '').toLowerCase().trim();
      const senderFullName = String(payload?.CreatedByName || payload?.createdByName || payload?.FullName || payload?.fullName || '').toLowerCase().trim();

      return Boolean(
        (currentUserId && senderId && currentUserId === senderId) ||
        (currentUsername && senderUsername && currentUsername === senderUsername) ||
        (currentFullName && senderFullName && currentFullName === senderFullName) ||
        (currentFullName && msgText && (msgText.startsWith(currentFullName) || msgText.includes(currentFullName))) ||
        (currentUsername && msgText && (msgText.startsWith(currentUsername) || msgText.includes(currentUsername)))
      );
    } catch {
      return false;
    }
  }
};
