import { hubConnection } from 'signalr-no-jquery';
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/appStore';

export type SignalRRawMessageHandler = (rawPayload: any) => void;
export type SignalRReconnectCallback = () => void;


export class SignalRConnectionManager {
  private connection: any = null;
  private medApiProxy: any = null;
  private isConnecting = false;
  private reconnectTimer: any = null;
  private reconnectCallbacks = new Set<SignalRReconnectCallback>();
  private hasConnectedBefore = false;

  public isConnected = ref<boolean>(false);

  /**
   * 📡 Đăng ký callback khi SignalR kết nối / kết nối lại thành công
   */
  public onReconnected(callback: SignalRReconnectCallback): () => void {
    this.reconnectCallbacks.add(callback);
    return () => this.reconnectCallbacks.delete(callback);
  }

  /**
   * 🚀 Bắt đầu kết nối tới SignalR
   */
  public start(customServerUrl?: string, onMessageReceived?: SignalRRawMessageHandler): void {
    if (this.isConnected.value || this.isConnecting) return;

    const signalrUrl = customServerUrl || '/signalr';
    console.log('[SignalRConnection] 🔌 Đang kết nối tới SignalR Hub:', signalrUrl);
    this.isConnecting = true;

    try {
      if (this.connection) {
        try { this.connection.stop(); } catch {}
        this.connection = null;
      }

      this.connection = hubConnection(signalrUrl, { useDefaultPath: false });

      // 1. Gắn QueryString storeId
      try {
        const authStore = useAuthStore();
        const appStore = useAppStore();
        const selectedStore: any = authStore?.selectedStore;
        const storeId = appStore?.session?.id || appStore?.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;

        if (storeId) {
          this.connection.qs = { storeId: String(storeId) };
        }
      } catch (e) {
        console.warn('[SignalRConnection] Không thể đọc storeId cho QueryString:', e);
      }

      // 2. Tạo Proxy duy nhất cho medApiHub
      this.medApiProxy = this.connection.createHubProxy('medApiHub');

      // 3. Đăng ký DUY NHẤT 1 sự kiện sendMessageToClients từ server
      this.medApiProxy.on('sendMessageToClients', (...args: any[]) => {
        const payload = args.length > 1 && typeof args[0] === 'string' ? args[1] : args[0];
        onMessageReceived?.(payload);
      });

      // 4. Bắt lỗi và xử lý ngắt kết nối / tự động kết nối lại
      this.connection.error((error: any) => {
        console.warn('[SignalRConnection] ⚠️ Lỗi kết nối SignalR:', error);
      });

      this.connection.disconnected(() => {
        console.warn('[SignalRConnection] 🔌 Đã ngắt kết nối SignalR. Tự động kết nối lại sau 5s...');
        this.isConnected.value = false;
        this.isConnecting = false;
        this.scheduleReconnect(signalrUrl, onMessageReceived);
      });

      this.connection.reconnected?.(() => {
        console.log('[SignalRConnection] 🔄 SignalR đã reconnected tự động!');
        this.isConnected.value = true;
        this.triggerReconnectCallbacks();
      });

      // 5. Khởi chạy kết nối
      this.connection
        .start({ transport: ['webSockets', 'serverSentEvents', 'longPolling'] })
        .done(() => {
          console.log('[SignalRConnection] ✅ Đã kết nối thành công tới SignalR Hub!');
          this.isConnected.value = true;
          this.isConnecting = false;

          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }

          // Kích hoạt callback nếu đây là lần kết nối lại sau sự cố mất kết nối
          if (this.hasConnectedBefore) {
            this.triggerReconnectCallbacks();
          }
          this.hasConnectedBefore = true;
        })
        .fail((err: any) => {
          console.warn('[SignalRConnection] ❌ Không thể kết nối SignalR Hub:', err);
          this.isConnected.value = false;
          this.isConnecting = false;
          this.scheduleReconnect(signalrUrl, onMessageReceived);
        });
    } catch (err) {
      console.error('[SignalRConnection] Lỗi khởi tạo SignalR:', err);
      this.isConnecting = false;
      this.scheduleReconnect(signalrUrl, onMessageReceived);
    }
  }

  /**
   * ⚡ Kích hoạt tất cả callback khi kết nối lại
   */
  private triggerReconnectCallbacks(): void {
    console.log('[SignalRConnection] ⚡ Kích hoạt callback đồng bộ lại dữ liệu sau khi kết nối lại');
    this.reconnectCallbacks.forEach(cb => {
      try { cb(); } catch (err) { console.error('[SignalRConnection] Lỗi callback reconnect:', err); }
    });
  }

  /**
   * 🔄 Lên lịch tự động kết nối lại
   */
  private scheduleReconnect(url: string, onMessageReceived?: SignalRRawMessageHandler): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isConnected.value) {
        this.start(url, onMessageReceived);
      }
    }, 5000);
  }

  /**
   * 🛑 Ngắt kết nối SignalR
   */
  public stop(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connection) {
      try {
        this.connection.stop();
      } catch {}
      this.isConnected.value = false;
      this.isConnecting = false;
    }
  }
}

export const signalRConnectionManager = new SignalRConnectionManager();
