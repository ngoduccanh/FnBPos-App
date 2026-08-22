/**
 * 📡 ENUM ĐỊNH DANH LOẠI TÍN HIỆU BROADCAST TỪ SIGNALR
 */
export enum EBroadcastType {
  None = 0,
  ShowMessage = 1,
  ShowMessageAndRefreshData = 2,
  HandleJob = 3,
  Logout = 4,

  ShowMessagePos = 10,
  TableTransferPos = 11,
}
