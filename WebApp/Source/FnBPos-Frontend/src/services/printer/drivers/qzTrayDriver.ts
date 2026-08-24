import qz from 'qz-tray';
import { signQzRequestApi } from '@/features/pos/api/signQzRequestApi';

/**
 * 📜 Chứng chỉ QZ Tray chính thức của FnBPos
 */
export const QZ_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIDODCCAiCgAwIBAgIQVltNXRyY37hKK46N3rt/iDANBgkqhkiG9w0BAQUFADAvMQswCQYDVQQG
EwJWTjEPMA0GA1UECgwGRm5CUG9zMQ8wDQYDVQQDDAZGbkJQb3MwHhcNMjYwNTI2MDU0MjE2WhcN
MjcwNTI2MDYwMjE2WjAvMQswCQYDVQQGEwJWTjEPMA0GA1UECgwGRm5CUG9zMQ8wDQYDVQQDDAZG
bkJQb3MwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQD1g6GtsnQa7l2h4No9zGV56Kzl
zam7JvwXj3qlkj8DpPbT7miU8dLOUdhMESh4PLb2OYA+hfdEwAT00qlTbKgiLwJS4Ny1H2wNLeFs
B95yTWg+XikddcuolmgkaLaDqqojjhLw07ekxm4oaItQ2PeBAtYVe5KFiO4ncvsDKntdzD6hljEA
BEt1Z3Znv91A9qPtTfMtDIUVtWm+RSdSSX8tsIQjh/hWHbPQXlUMDeQv+bIxjFjHpuHX1/AtfYbn
8AuEb/HspXKqqcMrTnU/0fkLg1+7CFtz8kNvpY1ZqKEj2tiF52kUCHNngMl2U/4frfNq0/omr0RP
gETugb5kd77RAgMBAAGjUDBOMA4GA1UdDwEB/wQEAwIFoDAdBgNVHSUEFjAUBggrBgEFBQcDAgYI
KwYBBQUHAwEwHQYDVR0OBBYEFANDjvOqMXy9d19cF1eJysuHXZrdMA0GCSqGSIb3DQEBBQUAA4IB
AQCi4hXFsuKOE0ySX2B+YWA6ri7rKNM9Hg9fa/Xo/lk3QvmmhN3d+kpB+beKt9LLFHodTY/UGsWp
z0B2HjP4VZFI3AyZHevJDSHPSld8wrzfHocq+8IGHJPa5m3QBP2z6Er8hA0TroZGAv/B5aKe1BsA
6WnNHwjLwB/PA9ix6cEd/OidK3xNko9uMTt5PgOd+0ly9lXoqUZ8EwZdd01TX5pil6bYcfmwL/YJ
sPM3hCcx9eGXyUhNK6NoxwmN1tC2/Iwtt0AKgbcOEqw5ZcDlcKo0tahbjeybkWa6KLQXtWB5QEO7
nJrsmMlkUrJ2CrP9siExKTAHgWL18mpKTtynUMnx
-----END CERTIFICATE-----`;

export class QzTrayDriver {
  public static isConnected = false;
  private static isSecurityInitialized = false;
  private static signatureCache = new Map<string, string>();

  public static setSecurity(
    certPromise: () => Promise<string>,
    signaturePromise: (toSign: string) => Promise<string>
  ) {
    qz.security.setCertificatePromise((resolve: (cert: string) => void) => {
      certPromise().then(resolve);
    });
    qz.security.setSignaturePromise((toSign: string) => {
      return (resolve: (sig: string) => void) => {
        signaturePromise(toSign).then(resolve);
      };
    });
  }

  /**
   * Tự động khởi tạo bảo mật (Certificate & Signature Endpoint)
   * Thuật toán: SHA1 (khớp với rsa.SignData SHA1 trong Controller C#)
   */
  public static initSecurity(): void {
    if (this.isSecurityInitialized) return;
    this.isSecurityInitialized = true;

    // 1. Cấu hình Chứng chỉ
    qz.security.setCertificatePromise((resolve: (cert: string) => void) => {
      resolve(QZ_CERTIFICATE);
    });

    // 2. Cấu hình Thuật toán ký SHA1
    qz.security.setSignatureAlgorithm('SHA1');

    // 3. Cấu hình Gọi API xin chữ ký (có Cache 0ms)
    qz.security.setSignaturePromise((toSign: string) => {
      return (resolve: (sig: string) => void, reject: (err: any) => void) => {
        // Nếu đã có trong cache bộ nhớ -> trả về ngay 0ms không gọi HTTP
        if (this.signatureCache.has(toSign)) {
          resolve(this.signatureCache.get(toSign)!);
          return;
        }

        signQzRequestApi(toSign)
          .then(signature => {
            this.signatureCache.set(toSign, signature);
            resolve(signature);
          })
          .catch(err => {
            console.error('[QZ Tray] ❌ Lỗi xin chữ ký từ API /api/posSale/SignQZRequest:', err);
            reject(err);
          });
      };
    });

    console.log('[QZ Tray] 🔐 Đã khởi tạo cấu hình Bảo mật (Certificate & Signature SHA-1) cho FnBPos');
  }

  /**
   * Kết nối WebSocket tới QZ Tray (localhost:8182 hoặc wss:8181)
   */
  public static async connect(): Promise<boolean> {
    this.initSecurity();

    try {
      if (qz.websocket.isActive()) {
        this.isConnected = true;
        return true;
      }
      await qz.websocket.connect({ retries: 1, delay: 0 });
      this.isConnected = true;
      console.log('[QZ Tray] 🔌 Kết nối WebSocket QZ Tray thành công!');
      return true;
    } catch (err) {
      console.warn('[QZ Tray] ⚠️ Không thể kết nối QZ Tray:', err);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Lấy danh sách máy in từ QZ Tray
   */
  public static async getPrinters(): Promise<string[]> {
    const ok = await this.connect();
    if (!ok) return [];
    try {
      return await qz.printers.find();
    } catch (err) {
      console.error('[QZ Tray] Lỗi tìm máy in:', err);
      return [];
    }
  }

  /**
   * Bắn mảng Base64 ESC/POS thô sang máy in qua QZ Tray
   */
  public static async printRawBase64(
    printerName: string,
    base64Data: string
  ): Promise<boolean> {
    const ok = await this.connect();
    if (!ok) {
      throw new Error('Chưa kết nối được với QZ Tray. Vui lòng kiểm tra ứng dụng QZ Tray đang chạy!');
    }

    try {
      let targetPrinter = printerName?.trim();

      // Nếu chưa chọn tên máy in hoặc là tên placeholder cũ ("Kitchen Printer" / "POS-80")
      if (!targetPrinter || targetPrinter === 'Kitchen Printer' || targetPrinter === 'POS-80') {
        try {
          targetPrinter = await qz.printers.getDefault();
        } catch {
          const list = await qz.printers.find();
          targetPrinter = list?.[0] || '';
        }
      }

      // Nếu vẫn chưa có máy in -> lấy máy in đầu tiên tìm thấy trên Windows
      if (!targetPrinter) {
        const list = await qz.printers.find();
        targetPrinter = list?.[0] || '';
      }

      if (!targetPrinter) {
        throw new Error('Không tìm thấy máy in nào trên hệ thống QZ Tray. Vui lòng kiểm tra cáp máy in!');
      }

      let config;
      try {
        config = qz.configs.create(targetPrinter);
      } catch {
        // Fallback sang máy in đầu tiên trong hệ thống nếu tên truyền vào không tồn tại
        const list = await qz.printers.find();
        targetPrinter = list?.[0] || targetPrinter;
        config = qz.configs.create(targetPrinter);
      }

      const printData = [
        {
          type: 'raw',
          format: 'base64',
          data: base64Data
        }
      ];

      await qz.print(config, printData);
      console.log(`[QZ Tray] ✅ In RAW thành công tới máy in "${targetPrinter}"`);
      return true;
    } catch (err: any) {
      console.error('[QZ Tray] ❌ Lỗi in:', err);
      throw new Error(err?.message || 'Lỗi khi gửi lệnh in tới QZ Tray');
    }
  }

  /**
   * 🖨️ In mẫu HTML qua QZ Tray (Rasterize TrueType Fonts — Hỗ trợ 100% tiếng Việt có dấu nét căng)
   */
  public static async printHtml(
    printerName: string,
    htmlContent: string,
    paperSize: 'K80' | 'K58' = 'K80'
  ): Promise<boolean> {
    const ok = await this.connect();
    if (!ok) {
      throw new Error('Chưa kết nối được với QZ Tray. Vui lòng kiểm tra ứng dụng QZ Tray đang chạy!');
    }

    try {
      let targetPrinter = printerName?.trim();

      if (!targetPrinter || targetPrinter === 'Kitchen Printer' || targetPrinter === 'POS-80') {
        try {
          targetPrinter = await qz.printers.getDefault();
        } catch {
          const list = await qz.printers.find();
          targetPrinter = list?.[0] || '';
        }
      }

      if (!targetPrinter) {
        const list = await qz.printers.find();
        targetPrinter = list?.[0] || '';
      }

      if (!targetPrinter) {
        throw new Error('Không tìm thấy máy in nào trên hệ thống QZ Tray. Vui lòng kiểm tra cáp máy in!');
      }

      const widthMm = paperSize === 'K58' ? 58 : 80;
      const config = qz.configs.create(targetPrinter, {
        scaleContent: false,
        rasterize: true, // Render TrueType fonts chuẩn tiếng Việt
        margins: 0,
        size: { width: widthMm }
      });

      const printData = [
        {
          type: 'pixel',
          format: 'html',
          flavor: 'plain',
          data: htmlContent
        }
      ];

      await qz.print(config, printData);
      console.log(`[QZ Tray] ✅ In HTML tiếng Việt thành công tới máy in "${targetPrinter}"`);
      return true;
    } catch (err: any) {
      console.error('[QZ Tray] ❌ Lỗi in HTML:', err);
      throw new Error(err?.message || 'Lỗi khi gửi lệnh in tới QZ Tray');
    }
  }
}
