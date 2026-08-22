import { ref } from 'vue';
import { EBroadcastType } from '@/enums/broadcastType.enum';
import { signalRConnectionManager } from './signalRConnectionManager';
import { signalRFilter } from './signalRFilter';
import { signalRDispatcher, type SignalRDataHandler } from './signalRDispatcher';
import { signalRNotificationHandler } from './signalRNotificationHandler';

export type { SignalRDataHandler };

class SignalRService {
  public isConnected = signalRConnectionManager.isConnected;
  public lastBroadcastData = ref<any>(null);

  /**
   * 🚀 Khởi tạo kết nối SignalR Hub
   */
  public start(customServerUrl?: string): void {
    signalRConnectionManager.start(customServerUrl, (rawPayload: any) => {
      this.handleIncomingMessage(rawPayload);
    });
  }

  /**
   * 📥 Xử lý bản tin nhận về từ Hub
   */
  private handleIncomingMessage(rawPayload: any): void {
    if (!rawPayload) return;

    const data = (rawPayload && typeof rawPayload === 'object') ? rawPayload : {};
    const typeId: number = Number(data.TypeId ?? data.typeId ?? EBroadcastType.None);

    // 1. Lọc StoreId (Chỉ nhận tin của Store hiện tại)
    if (!signalRFilter.isMatchingCurrentStore(data)) {
      return;
    }

    console.log(`⚡ [SignalRService] 🔔 Nhận tin nhắn (TypeId: ${typeId}):`, data);
    this.lastBroadcastData.value = data;

    // 2. Kiểm tra xem có phải thao tác của chính mình hay không
    const isSelf = signalRFilter.isSelfAction(data);

    // 3. Xử lý thông báo Toast + Chuông báo (Nếu là người khác thao tác)
    signalRNotificationHandler.handleNotification(data, typeId, isSelf);

    // 4. Phân phối sự kiện đến các subscribers
    signalRDispatcher.dispatch(data, typeId);
  }

  /**
   * 📡 Đăng ký nhận sự kiện POS (TypeId: 10 - ShowMessagePos)
   */
  public onReceivedSystemMessagePos(callback: SignalRDataHandler): () => void {
    return signalRDispatcher.onPosMessage(callback);
  }

  /**
   * 📡 Đăng ký nhận sự kiện chuyển bàn POS (TypeId: 11 - TableTransferPos)
   */
  public onReceivedTableTransferPos(callback: SignalRDataHandler): () => void {
    return signalRDispatcher.onTableTransfer(callback);
  }

  /**
   * 📡 Đăng ký nhận sự kiện hệ thống chung (TypeId: 2 - ShowMessageAndRefreshData)
   */
  public onReceivedSystemMessage(callback: SignalRDataHandler): () => void {
    return signalRDispatcher.onSystemMessage(callback);
  }

  /**
   * 📡 Đăng ký nhận tất cả sự kiện broadcast
   */
  public onBroadcast(callback: SignalRDataHandler): () => void {
    return signalRDispatcher.onAll(callback);
  }

  /**
   * 🔄 Đăng ký callback kích hoạt khi SignalR kết nối lại thành công
   */
  public onReconnected(callback: () => void): () => void {
    return signalRConnectionManager.onReconnected(callback);
  }

  /**
   * 🛑 Ngắt kết nối SignalR
   */
  public stop(): void {
    signalRConnectionManager.stop();
  }
}

export const signalRService = new SignalRService();
