import type {
  KitchenPrintData,
  BillPrintData,
  PrinterDeviceConfig
} from './types/printer.types';
import { PrinterStorageService } from './printerStorageService';
import { buildKitchenRasterEscpos, buildBillRasterEscpos } from './escpos/escposCanvasRenderer';
import { renderKitchenHtml } from './templates/kitchenPrintTemplate';
import { renderBillHtml } from './templates/billPrintTemplate';
import { QzTrayDriver } from './drivers/qzTrayDriver';
import { WebUsbDriver } from './drivers/webUsbDriver';
import { WifiLanDriver } from './drivers/wifiLanDriver';
import { BrowserDriver } from './drivers/browserDriver';

export class PosPrinterService {
  /**
   * Cấu hình Certificate & Signature cho QZ Tray
   */
  public static setQzSecurity(
    certPromise: () => Promise<string>,
    signaturePromise: (toSign: string) => Promise<string>
  ) {
    QzTrayDriver.setSecurity(certPromise, signaturePromise);
  }

  /**
   * Lấy danh sách máy in QZ Tray có trên máy tính
   */
  public static async getQzPrinters(): Promise<string[]> {
    return QzTrayDriver.getPrinters();
  }

  /**
   * 📑 In Hóa Đơn Bán Hàng / Đơn Tạm Tính
   */
  public static async printBill(
    data: BillPrintData,
    customConfig?: Partial<PrinterDeviceConfig>
  ): Promise<boolean> {
    const settings = PrinterStorageService.getSettings();
    const config: PrinterDeviceConfig = {
      ...settings.billPrinter,
      ...customConfig
    };

    console.log(`[PosPrinterService] 🖨️ Bắt đầu in Hóa đơn qua Driver: [${config.driver}]`);

    try {
      const targetPrinterName = (data.storeId && config.storePrinterMap?.[data.storeId]) || config.name;
      const raster = buildBillRasterEscpos(data, config.paperSize, config.openCashDrawer);

      // 1. Chế độ QZ Tray (Máy POS Windows / Desktop — In Raster Tiếng Việt Nét Căng 0ms)
      if (config.driver === 'qz-tray') {
        const base64 = raster.getBase64();
        return await QzTrayDriver.printRawBase64(targetPrinterName, base64);
      }

      // 2. Chế độ WebUSB (Máy POS Android / Chrome cắm dây USB)
      if (config.driver === 'web-usb') {
        const bytes = raster.getBytes();
        return await WebUsbDriver.printRawBytes(bytes, raster.getPngBase64());
      }

      // 3. Chế độ WiFi / LAN IP
      if (config.driver === 'wifi-lan') {
        const base64 = raster.getBase64();
        return await WifiLanDriver.printRawToIp(config.ip || '', config.port || 9100, base64);
      }

      // 4. Chế độ Browser HTML (chỉ khi cấu hình driver là browser)
      if (config.driver === 'browser') {
        const html = renderBillHtml(data, config.paperSize);
        return await BrowserDriver.printHtml(html);
      }

      return true;
    } catch (err: any) {
      console.error(`[PosPrinterService] ❌ Lỗi khi in qua driver ${config.driver}:`, err);
      if (config.driver === 'browser') {
        const html = renderBillHtml(data, config.paperSize);
        return await BrowserDriver.printHtml(html);
      }
      throw err;
    }
  }

  /**
   * 🍳 In Phiếu Bếp / Phiếu Hủy Món
   */
  public static async printKitchen(
    data: KitchenPrintData,
    customConfig?: Partial<PrinterDeviceConfig>
  ): Promise<boolean> {
    const settings = PrinterStorageService.getSettings();
    const config: PrinterDeviceConfig = {
      ...settings.kitchenPrinter,
      ...customConfig
    };

    console.log(`[PosPrinterService] 🍳 Bắt đầu in Phiếu Bếp qua Driver: [${config.driver}]`);

    try {
      const targetPrinterName = (data.storeId && config.storePrinterMap?.[data.storeId]) || config.name;
      const raster = buildKitchenRasterEscpos(data, config.paperSize);

      // 1. Chế độ QZ Tray (Máy POS Windows / Desktop — In Raster Tiếng Việt Nét Căng 0ms)
      if (config.driver === 'qz-tray') {
        const base64 = raster.getBase64();
        return await QzTrayDriver.printRawBase64(targetPrinterName, base64);
      }

      // 2. Chế độ WiFi / LAN IP (Phổ biến nhất cho Bếp)
      if (config.driver === 'wifi-lan') {
        const base64 = raster.getBase64();
        return await WifiLanDriver.printRawToIp(config.ip || '', config.port || 9100, base64);
      }

      // 3. Chế độ WebUSB
      if (config.driver === 'web-usb') {
        const bytes = raster.getBytes();
        return await WebUsbDriver.printRawBytes(bytes, raster.getPngBase64());
      }

      // 4. Chế độ Browser HTML (chỉ khi driver là browser)
      if (config.driver === 'browser') {
        const html = renderKitchenHtml(data, config.paperSize);
        return await BrowserDriver.printHtml(html);
      }

      return true;
    } catch (err: any) {
      console.error(`[PosPrinterService] ❌ Lỗi khi in bếp qua driver ${config.driver}:`, err);
      if (config.driver === 'browser') {
        const html = renderKitchenHtml(data, config.paperSize);
        return await BrowserDriver.printHtml(html);
      }
      throw err;
    }
  }
}
