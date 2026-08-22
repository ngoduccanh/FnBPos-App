import { EBroadcastType } from '@/enums/broadcastType.enum';

export type SignalRDataHandler = (data: any) => void;

/**
 * 📢 SIGNALR DISPATCHER SERVICE
 * Chịu trách nhiệm:
 * 1. Quản lý danh sách các Listener đăng ký theo sự kiện POS / System / Chuyển bàn
 * 2. Phân phối dữ liệu (Dispatch) đến đúng các Listener tương ứng
 */
export class SignalRDispatcher {
  private listenersPosMessage = new Set<SignalRDataHandler>();
  private listenersTableTransfer = new Set<SignalRDataHandler>();
  private listenersSystemMessage = new Set<SignalRDataHandler>();
  private listenersAll = new Set<SignalRDataHandler>();

  /**
   * 📡 Đăng ký sự kiện POS (TypeId: 10 - ShowMessagePos)
   */
  public onPosMessage(callback: SignalRDataHandler): () => void {
    this.listenersPosMessage.add(callback);
    return () => this.listenersPosMessage.delete(callback);
  }

  /**
   * 📡 Đăng ký sự kiện chuyển bàn POS (TypeId: 11 - TableTransferPos)
   */
  public onTableTransfer(callback: SignalRDataHandler): () => void {
    this.listenersTableTransfer.add(callback);
    return () => this.listenersTableTransfer.delete(callback);
  }

  /**
   * 📡 Đăng ký sự kiện hệ thống (TypeId: 2 - ShowMessageAndRefreshData)
   */
  public onSystemMessage(callback: SignalRDataHandler): () => void {
    this.listenersSystemMessage.add(callback);
    return () => this.listenersSystemMessage.delete(callback);
  }

  /**
   * 📡 Đăng ký tất cả sự kiện broadcast
   */
  public onAll(callback: SignalRDataHandler): () => void {
    this.listenersAll.add(callback);
    return () => this.listenersAll.delete(callback);
  }

  /**
   * ⚡ Phân phối dữ liệu đến các listener
   */
  public dispatch(data: any, typeId: number): void {
    // 1. Kích hoạt toàn bộ listener chung
    this.listenersAll.forEach(cb => {
      try { cb(data); } catch (err) { console.error('[SignalRDispatcher] Lỗi listener all:', err); }
    });

    // 2. Kích hoạt listener theo từng TypeId
    switch (typeId) {
      case EBroadcastType.ShowMessageAndRefreshData:
        this.listenersSystemMessage.forEach(cb => {
          try { cb(data); } catch (err) { console.error('[SignalRDispatcher] Lỗi system listener:', err); }
        });
        break;

      case EBroadcastType.ShowMessagePos:
        this.listenersPosMessage.forEach(cb => {
          try { cb(data); } catch (err) { console.error('[SignalRDispatcher] Lỗi POS listener:', err); }
        });
        break;

      case EBroadcastType.TableTransferPos:
        this.listenersTableTransfer.forEach(cb => {
          try { cb(data); } catch (err) { console.error('[SignalRDispatcher] Lỗi TableTransfer listener:', err); }
        });
        break;

      default:
        // Mặc định chuyển tới system listeners
        this.listenersSystemMessage.forEach(cb => {
          try { cb(data); } catch (err) { console.error('[SignalRDispatcher] Lỗi default listener:', err); }
        });
        break;
    }
  }
}

export const signalRDispatcher = new SignalRDispatcher();
