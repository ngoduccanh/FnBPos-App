import qz from 'qz-tray';
import { QzTrayDriver } from './qzTrayDriver';

/**
 * 📡 WifiLanDriver — In qua địa chỉ IP mạng LAN / WiFi (Cổng 9100)
 */
export class WifiLanDriver {
  /**
   * Bắn mảng Base64 ESC/POS tới máy in IP qua QZ Tray Raw Network Socket
   */
  public static async printRawToIp(
    ip: string,
    port: number = 9100,
    base64Data: string
  ): Promise<boolean> {
    if (!ip) {
      throw new Error('Chưa cấu hình địa chỉ IP máy in mạng!');
    }

    try {
      const ok = await QzTrayDriver.connect();
      if (ok) {
        // QZ Tray hỗ trợ in trực tiếp tới IP và Port raw socket
        const config = qz.configs.create({
          host: ip,
          port: port
        });

        await qz.print(config, [
          {
            type: 'raw',
            format: 'base64',
            data: base64Data
          }
        ]);
        console.log(`[WifiLanDriver] ✅ In thành công tới máy in IP: ${ip}:${port}`);
        return true;
      }
    } catch (err: any) {
      console.warn(`[WifiLanDriver] ⚠️ Không thể in qua QZ socket IP ${ip}:`, err);
    }

    // Fallback: Thử bắn qua HTTP endpoint nếu máy in hỗ trợ ePOS-Print HTTP (Timeout 2s)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const url = `http://${ip}:${port}/epos/print`;
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        body: base64Data,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log(`[WifiLanDriver] ✅ Đã gửi request in tới http://${ip}`);
      return true;
    } catch (err: any) {
      console.error('[WifiLanDriver] ❌ Lỗi in qua mạng IP:', err);
      throw new Error(`Không thể kết nối tới máy in mạng IP ${ip}:${port}. Vui lòng kiểm tra lại địa chỉ IP!`);
    }
  }
}
