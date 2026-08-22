import { ref, onMounted, onUnmounted } from 'vue';
import type {
  CustomerDisplayMode,
  CustomerDisplayPayload,
  CustomerDisplayCartItem,
  CustomerDisplayStoreInfo,
  CustomerDisplayCheckoutInfo
} from '../types/customerDisplay.types';

const CHANNEL_NAME = 'pos_customer_display';
const STORAGE_KEY = 'pos_customer_display_state';

// State dùng cho Client (Màn hình phụ)
const currentPayload = ref<CustomerDisplayPayload>({
  mode: 'IDLE',
  storeInfo: {
    storeName: 'FnB POS',
    storeAddress: '',
    storePhone: ''
  },
  tableName: '',
  customerName: '',
  cartItems: [],
  cartTotalQuantity: 0,
  cartTotalAmount: 0,
  updatedAt: Date.now()
});

let sharedBroadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!sharedBroadcastChannel && 'BroadcastChannel' in window) {
    sharedBroadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
  return sharedBroadcastChannel;
}

export function useCustomerDisplayBridge() {
  /**
   * 📤 GỬI TIN NHẮN TỪ MÀN HÌNH CHÍNH (HOST)
   */
  const sendToDisplay = (payload: Partial<CustomerDisplayPayload>) => {
    const fullPayload: CustomerDisplayPayload = {
      ...currentPayload.value,
      ...payload,
      updatedAt: Date.now()
    };

    currentPayload.value = fullPayload;

    // 1. Gửi qua BroadcastChannel (0ms, nhanh nhất)
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage(fullPayload);
    }

    // 2. Lưu vào localStorage để cửa sổ mới mở lên nhận được ngay lập tức
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullPayload));
    } catch {}
  };

  /**
   * 🟢 Chuyển sang chế độ Chờ (Khi thu ngân ở Sơ đồ bàn / Chưa chọn bàn)
   */
  const broadcastIdle = (storeInfo?: CustomerDisplayStoreInfo) => {
    sendToDisplay({
      mode: 'IDLE',
      storeInfo: storeInfo || currentPayload.value.storeInfo,
      tableName: '',
      customerName: '',
      cartItems: [],
      cartTotalQuantity: 0,
      cartTotalAmount: 0,
      checkoutInfo: undefined
    });
  };

  /**
   * 🔵 Chuyển sang chế độ Đang gọi món (Khi thu ngân click chọn bàn)
   */
  const broadcastOrdering = (
    tableName: string,
    cartItems: CustomerDisplayCartItem[],
    cartTotalQuantity: number,
    cartTotalAmount: number,
    customerName?: string,
    storeInfo?: CustomerDisplayStoreInfo
  ) => {
    sendToDisplay({
      mode: 'ORDERING',
      storeInfo: storeInfo || currentPayload.value.storeInfo,
      tableName,
      customerName: customerName || 'Khách lẻ',
      cartItems,
      cartTotalQuantity,
      cartTotalAmount,
      checkoutInfo: undefined
    });
  };

  /**
   * 💳 Chuyển sang chế độ Thanh toán (Khi thu ngân bấm Thanh toán F1 / Xuất QR)
   */
  const broadcastCheckout = (
    tableName: string,
    cartItems: CustomerDisplayCartItem[],
    cartTotalQuantity: number,
    cartTotalAmount: number,
    checkoutInfo: CustomerDisplayCheckoutInfo,
    customerName?: string,
    storeInfo?: CustomerDisplayStoreInfo
  ) => {
    sendToDisplay({
      mode: 'CHECKOUT',
      storeInfo: storeInfo || currentPayload.value.storeInfo,
      tableName,
      customerName: customerName || 'Khách lẻ',
      cartItems,
      cartTotalQuantity,
      cartTotalAmount,
      checkoutInfo
    });
  };

  /**
   * 🖥️ Mở cửa sổ Màn hình phụ trên màn hình thứ 2 (hoặc Tab riêng)
   */
  const openCustomerDisplayWindow = () => {
    const url = '/customer-display';
    const windowFeatures = 'width=1024,height=768,left=1920,top=0,menubar=no,toolbar=no,location=no,status=no';
    
    const displayWin = window.open(url, 'PosCustomerDisplayWindow', windowFeatures);
    if (displayWin) {
      displayWin.focus();
    }
  };

  /**
   * 📥 LẮNG NGHE Ở PHÍA MÀN HÌNH PHỤ (CLIENT)
   */
  const initClientListener = () => {
    // 1. Nạp state ban đầu từ localStorage nếu có
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        currentPayload.value = JSON.parse(saved);
      }
    } catch {}

    // 2. Lắng nghe qua BroadcastChannel
    const channel = getBroadcastChannel();
    if (channel) {
      channel.onmessage = (event) => {
        if (event.data) {
          currentPayload.value = event.data;
        }
      };
    }

    // 3. Lắng nghe sự kiện storage (dự phòng)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          currentPayload.value = JSON.parse(event.newValue);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  };

  return {
    currentPayload,
    sendToDisplay,
    broadcastIdle,
    broadcastOrdering,
    broadcastCheckout,
    openCustomerDisplayWindow,
    initClientListener
  };
}
