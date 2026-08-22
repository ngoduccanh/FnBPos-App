import type { PosProductItem } from '@/features/pos/types/products.types';
import type { CartItem } from '@/features/pos/mappers/orderDetailMapper';

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS & LITERALS
// ─────────────────────────────────────────────────────────────────────────────

export type PrinterDriverType = 'qz-tray' | 'web-usb' | 'wifi-lan' | 'browser';

export type PrinterPaperSize = 'K80' | 'K58';

/** Loại mẫu in bếp */
export type KitchenPrintType = 'order' | 'cancel' | 'extra';

/** Loại mẫu in hóa đơn */
export type BillPrintType = 'receipt' | 'provisional';

// ─────────────────────────────────────────────────────────────────────────────
// DỮ LIỆU ĐẦU VÀO CHO MẪU IN (MODELS)
// ─────────────────────────────────────────────────────────────────────────────

/** Món trong phiếu bếp */
export interface KitchenPrintItem {
  name: string;
  unit: string;
  quantity: number; // > 0 cho đặt món/đặt thêm, < 0 cho hủy món
  note?: string;
}

/** Dữ liệu in phiếu Bếp / Bar */
export interface KitchenPrintData {
  type?: KitchenPrintType; // 'order': Đơn Gửi Bếp | 'cancel': Đơn Hủy Món | 'extra': [ĐẶT THÊM]
  title?: string;          // Default: 'Đơn Gửi Bếp' | 'Đơn Hủy Món'
  tag?: string;            // Default: '[ĐẶT THÊM]' | '[HỦY MÓN]' | '[MÓN MỚI]'
  tableName: string;       // Bàn 2
  dateStr?: string;        // 14/08/2026
  timeStr?: string;        // 11:44:47
  serverName: string;      // canhdev2026
  items: KitchenPrintItem[];
  storeId?: number;        // ID cửa hàng/nhà con để chọn máy in
}

/** Món trong hóa đơn */
export interface BillPrintItem {
  stt: number;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  amount: number;
}

/** Dữ liệu in Hóa đơn / Tạm tính */
export interface BillPrintData {
  type?: BillPrintType;    // 'receipt': Hóa Đơn Bán Hàng | 'provisional': Đơn Tạm Tính
  title?: string;          // Default: 'Hóa Đơn Bán Hàng' | 'Đơn Tạm Tính'
  storeName: string;       // Minh test FNB
  storePhone?: string;     // SĐT: 0988...
  storeAddress?: string;
  dateStr?: string;        // 14/08/2026 11:44
  customerName?: string;   // Bán cho người tiêu dùng
  orderNote?: string;      // Ghi chú
  tableName: string;       // Bàn 2
  items: BillPrintItem[];
  totalQuantity: number;   // 4 món
  totalAmount: number;     // 105,000
  taxAmount?: number;      // 0
  discountAmount?: number; // 0
  finalAmount: number;     // 105,000
  cashierName?: string;
  storeId?: number;        // ID cửa hàng/nhà con để chọn máy in
}

// ─────────────────────────────────────────────────────────────────────────────
// CẤU HÌNH MÁY IN
// ─────────────────────────────────────────────────────────────────────────────

export interface PrinterDeviceConfig {
  driver: PrinterDriverType; // 'qz-tray' | 'web-usb' | 'wifi-lan' | 'browser'
  name: string;              // Tên máy in mặc định trong Windows hoặc QZ
  ip?: string;               // IP cho WiFi/LAN (ví dụ 192.168.1.200)
  port?: number;             // Port cho WiFi/LAN (mặc định 9100)
  paperSize: PrinterPaperSize; // 'K80' (80mm) | 'K58' (58mm)
  autoCut: boolean;          // Tự động cắt giấy
  openCashDrawer?: boolean;  // Tự động mở két tiền
  storePrinterMap?: Record<number, string>; // Gán máy in theo từng nhà con { [childStoreId]: printerName }
}

export interface PosPrinterSettings {
  billPrinter: PrinterDeviceConfig;
  kitchenPrinter: PrinterDeviceConfig;
}
