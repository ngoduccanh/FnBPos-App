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
    storeName: 'BeePos247',
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
    try {
      sharedBroadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {}
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
    const jsonString = JSON.stringify(fullPayload);

    // 1. Gửi qua BroadcastChannel (0ms - Dành cho trình duyệt PC / Chrome đa tab)
    const channel = getBroadcastChannel();
    if (channel) {
      try {
        channel.postMessage(fullPayload);
      } catch {}
    }

    // 2. Lưu vào localStorage (Dùng cho cả Web và Android WebView)
    try {
      localStorage.setItem(STORAGE_KEY, jsonString);
    } catch {}

    // 3. Gửi qua Android Native Bridge (0ms - Dành cho App Android 2 màn hình)
    try {
      const nativeBridge = (window as any).PosNativeBridge;
      if (nativeBridge && typeof nativeBridge.sendToCustomerDisplay === 'function') {
        nativeBridge.sendToCustomerDisplay(jsonString);
      }
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
    let lastUpdatedAt = 0;

    const applyPayload = (raw: string | object) => {
      try {
        const data: CustomerDisplayPayload = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (data && (!data.updatedAt || data.updatedAt >= lastUpdatedAt)) {
          lastUpdatedAt = data.updatedAt || Date.now();
          currentPayload.value = data;
        }
      } catch {}
    };

    // 1. Nạp state ban đầu từ localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) applyPayload(saved);
    } catch {}

    // 2. Lắng nghe qua BroadcastChannel
    const channel = getBroadcastChannel();
    if (channel) {
      channel.onmessage = (event) => {
        if (event.data) applyPayload(event.data);
      };
    }

    // 3. Lắng nghe sự kiện storage
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        applyPayload(event.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Đăng ký hàm nhận dữ liệu từ Native Android Bridge
    (window as any).updateCustomerDisplayFromNative = (rawJson: string) => {
      applyPayload(rawJson);
    };

    // 5. Polling định kỳ kiểm tra localStorage (Bảo hiểm 100% cho 2 WebView độc lập trên Android)
    const pollTimer = setInterval(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.updatedAt && parsed.updatedAt > lastUpdatedAt) {
            lastUpdatedAt = parsed.updatedAt;
            currentPayload.value = parsed;
          }
        }
      } catch {}
    }, 250);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollTimer);
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
