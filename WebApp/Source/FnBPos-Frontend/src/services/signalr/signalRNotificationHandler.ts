import { useToast } from '@/shared/components/toast/composables/useToast';
import { playNotificationSound } from '@/utils/notificationSound';
import { EBroadcastType } from '@/enums/broadcastType.enum';


export const signalRNotificationHandler = {

  handleNotification(data: any, typeId: number, isSelf: boolean): void {
    if (isSelf) return;

    const { showInfo } = useToast();

    if (typeId === EBroadcastType.ShowMessage) {
      const msg = data.Data || data.data || 'Thông báo từ hệ thống';
      if (msg) {
        playNotificationSound();
        showInfo(String(msg), 'Thông báo mới');
      }
      return;
    }

    if (typeId === EBroadcastType.ShowMessageAndRefreshData) {
      const msg = data.Data || data.data || '';
      if (msg) {
        playNotificationSound();
        showInfo(String(msg), 'Thông báo mới');
      }
      return;
    }

    if (typeId === EBroadcastType.ShowMessagePos || typeId === EBroadcastType.TableTransferPos) {
      const payloadData = data?.Data || data?.data || data;
      const tableName = payloadData?.TableName || payloadData?.tableName || '';
      const explicitMsg = data?.Message || data?.message || payloadData?.Message || payloadData?.message || (typeof payloadData === 'string' ? payloadData : '');
      const displayMsg = explicitMsg || (tableName ? `${tableName} vừa có cập nhật đơn hàng mới!` : 'Có cập nhật đơn hàng mới từ máy khác!');

      playNotificationSound();
      showInfo(displayMsg, 'Thông báo mới');
      return;
    }
  }
};
