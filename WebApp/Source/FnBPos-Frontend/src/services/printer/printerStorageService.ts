import type { PosPrinterSettings, PrinterDeviceConfig } from './types/printer.types';

const STORAGE_KEY = 'beepos_printer_settings';

const isAndroidDevice = (): boolean => {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
};

const DEFAULT_SETTINGS: PosPrinterSettings = {
  billPrinter: {
    driver: isAndroidDevice() ? 'web-usb' : 'qz-tray',
    name: '',
    paperSize: 'K80',
    autoCut: true,
    openCashDrawer: true
  },
  kitchenPrinter: {
    driver: isAndroidDevice() ? 'web-usb' : 'qz-tray',
    name: '',
    paperSize: 'K80',
    autoCut: true
  }
};

export class PrinterStorageService {
  public static getSettings(): PosPrinterSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const isAndroid = isAndroidDevice();

      if (raw) {
        const parsed: PosPrinterSettings = JSON.parse(raw);
        
        // Trên Android: Nếu cấu hình cũ đang là qz-tray thì tự động chuyển sang web-usb
        if (isAndroid) {
          if (parsed.billPrinter?.driver === 'qz-tray') parsed.billPrinter.driver = 'web-usb';
          if (parsed.kitchenPrinter?.driver === 'qz-tray') parsed.kitchenPrinter.driver = 'web-usb';
        }

        // Tự động fix nếu cấu hình cũ đang trỏ IP mặc định 192.168.1.200 gây timeout hoặc tên placeholder cũ
        if (parsed.kitchenPrinter?.driver === 'wifi-lan' && parsed.kitchenPrinter?.ip === '192.168.1.200') {
          parsed.kitchenPrinter.driver = isAndroid ? 'web-usb' : 'qz-tray';
        }
        if (parsed.kitchenPrinter?.name === 'Kitchen Printer') {
          parsed.kitchenPrinter.name = '';
        }
        if (parsed.billPrinter?.name === 'POS-80') {
          parsed.billPrinter.name = '';
        }
        this.saveSettings(parsed);
        return parsed;
      }
    } catch (err) {
      console.warn('[PrinterStorage] Không thể đọc cấu hình máy in:', err);
    }
    return { ...DEFAULT_SETTINGS };
  }

  public static saveSettings(settings: PosPrinterSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      console.log('[PrinterStorage] 💾 Đã lưu cấu hình máy in thành công');
    } catch (err) {
      console.error('[PrinterStorage] Lỗi lưu cấu hình máy in:', err);
    }
  }

  public static saveBillPrinterConfig(config: PrinterDeviceConfig): void {
    const settings = this.getSettings();
    settings.billPrinter = config;
    this.saveSettings(settings);
  }

  public static saveKitchenPrinterConfig(config: PrinterDeviceConfig): void {
    const settings = this.getSettings();
    settings.kitchenPrinter = config;
    this.saveSettings(settings);
  }
}
