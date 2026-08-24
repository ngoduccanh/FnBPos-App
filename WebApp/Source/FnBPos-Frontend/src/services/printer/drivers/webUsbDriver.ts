interface AndroidPrinterBridge {
  printUsbBase64?: (data: string) => boolean;
  printReceipt?: (data: string) => boolean;
  printBill?: (data: string) => boolean;
  printEscPos?: (data: string) => boolean;
  print?: (data: string) => boolean;
}

interface UsbDeviceLike {
  productName?: string;
  vendorId?: number;
  opened?: boolean;
  configuration?: {
    interfaces: Array<{
      interfaceNumber: number;
      alternates: Array<{
        endpoints: Array<{
          direction: string;
          endpointNumber: number;
        }>;
      }>;
    }>;
  } | null;
  open: () => Promise<void>;
  selectConfiguration: (config: number) => Promise<void>;
  claimInterface: (ifaceNumber: number) => Promise<void>;
  transferOut: (endpointNumber: number, data: BufferSource) => Promise<unknown>;
}

interface SerialPortLike {
  getInfo?: () => { usbVendorId?: number };
  open: (options: { baudRate: number; dataBits: number; stopBits: number; parity: string }) => Promise<void>;
  writable: {
    getWriter: () => {
      write: (data: Uint8Array) => Promise<void>;
      releaseLock: () => void;
    };
  };
}

interface CustomWindow extends Window {
  PosNativeBridge?: AndroidPrinterBridge;
  AndroidPosPrinter?: AndroidPrinterBridge;
  AndroidBridge?: AndroidPrinterBridge;
  Android?: AndroidPrinterBridge;
  PosPrinter?: AndroidPrinterBridge;
  printer?: AndroidPrinterBridge;
  JSBridge?: AndroidPrinterBridge;
}

interface NavigatorWithHardware extends Navigator {
  usb?: {
    requestDevice: (options: { filters: unknown[] }) => Promise<UsbDeviceLike>;
    getDevices: () => Promise<UsbDeviceLike[]>;
  };
  serial?: {
    requestPort: () => Promise<SerialPortLike>;
    getPorts: () => Promise<SerialPortLike[]>;
  };
}

/**
 * 🔌 WebUsbDriver — Hỗ trợ toàn diện máy in USB trên Android POS & PC
 * Tích hợp 4 cơ chế: RawBT WebSocket (Silent 0ms) + RawBT Silent Intent + Web Serial API + WebUSB
 * Tự động duy trì chế độ Fullscreen không bị thoát ra ngoài.
 */
export class WebUsbDriver {
  private static usbDevice: UsbDeviceLike | null = null;
  private static serialPort: SerialPortLike | null = null;
  private static endpointNumber: number = 1;

  /**
   * Kiểm tra thiết bị có hỗ trợ WebUSB hoặc Web Serial không
   */
  public static isSupported(): boolean {
    return typeof navigator !== 'undefined';
  }

  /**
   * Yêu cầu người dùng ghép nối máy in USB qua WebUSB hoặc Web Serial
   */
  public static async requestPrinter(): Promise<string> {
    const nav = typeof navigator !== 'undefined' ? (navigator as NavigatorWithHardware) : undefined;

    // 1. Thử Web Serial trước
    if (nav?.serial) {
      try {
        const port = await nav.serial.requestPort();
        this.serialPort = port;
        const info = port.getInfo ? port.getInfo() : {};
        const name = `USB Serial (VID:${info.usbVendorId || 'N/A'})`;
        console.log('[WebUsbDriver] 🔌 Đã ghép nối qua Web Serial:', name);
        return name;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[WebUsbDriver] Bỏ qua Web Serial:', msg);
      }
    }

    // 2. Thử WebUSB
    if (nav?.usb) {
      try {
        const device = await nav.usb.requestDevice({ filters: [] });
        this.usbDevice = device;
        const name = device.productName || `USB Printer (VID:${device.vendorId})`;
        console.log('[WebUsbDriver] 🔌 Đã ghép nối qua WebUSB:', name);
        return name;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[WebUsbDriver] Bỏ qua WebUSB:', msg);
      }
    }

    return 'USB Printer Port (QuickPrinter / USB Auto)';
  }

  /**
   * Gửi dữ liệu ESC/POS nhị phân (Uint8Array) hoặc ảnh PNG ra máy in USB / RawBT
   */
  public static async printRawBytes(bytes: Uint8Array, pngBase64?: string): Promise<boolean> {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    // ── CƠ CHẾ 0: IN TRỰC TIẾP QUA NATIVE ANDROID BRIDGE (0ms SIÊU TỐC, CHUẨN KIOTVIET/SAPO) ──
    const win = typeof window !== 'undefined' ? (window as CustomWindow) : null;
    if (win) {
      // Hỗ trợ tất cả các tên Interface phổ biến trên Android Native App (Ưu tiên PosNativeBridge)
      const bridge = win.PosNativeBridge || win.AndroidPosPrinter || win.AndroidBridge || win.Android || win.PosPrinter || win.printer || win.JSBridge;
      if (bridge) {
        try {
          if (typeof bridge.printUsbBase64 === 'function') {
            const ok = bridge.printUsbBase64(base64);
            if (ok !== false) return true;
          }
          if (typeof bridge.printReceipt === 'function') {
            const ok = bridge.printReceipt(base64);
            if (ok !== false) return true;
          }
          if (typeof bridge.printBill === 'function') {
            const ok = bridge.printBill(base64);
            if (ok !== false) return true;
          }
          if (typeof bridge.printEscPos === 'function') {
            const ok = bridge.printEscPos(base64);
            if (ok !== false) return true;
          }
          if (typeof bridge.print === 'function') {
            const ok = bridge.print(base64);
            if (ok !== false) return true;
          }
        } catch (bridgeErr) {
          console.warn('[WebUsbDriver] Lỗi gọi Native Android Bridge:', bridgeErr);
        }
      }
    }

    // ── CƠ CHẾ 1: IN TRỰC TIẾP QUA WEBUSB DIRECT API (ƯU TIÊN HÀNG ĐẦU KHI ĐÃ GHÉP NỐI USB) ──
    const nav = typeof navigator !== 'undefined' ? (navigator as NavigatorWithHardware) : undefined;
    if (nav?.usb) {
      try {
        if (!this.usbDevice) {
          const paired = await nav.usb.getDevices();
          if (paired.length > 0) this.usbDevice = paired[0];
        }

        if (this.usbDevice) {
          if (!this.usbDevice.opened) {
            await this.usbDevice.open();
          }
          if (this.usbDevice.configuration === null) {
            await this.usbDevice.selectConfiguration(1);
          }

          const ifaces = this.usbDevice.configuration?.interfaces || [];
          let claimed = false;
          let outEp = 1;

          for (const iface of ifaces) {
            for (const alt of iface.alternates) {
              const ep = alt.endpoints.find(e => e.direction === 'out');
              if (ep) {
                try {
                  await this.usbDevice.claimInterface(iface.interfaceNumber);
                  outEp = ep.endpointNumber;
                  claimed = true;
                  break;
                } catch {
                  // Tiếp tục thử interface khác
                }
              }
            }
            if (claimed) break;
          }

          if (claimed) {
            this.endpointNumber = outEp;
            await this.usbDevice.transferOut(this.endpointNumber, bytes);
            console.log('[WebUsbDriver] ✅ In thành công qua WebUSB Direct');
            return true;
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[WebUsbDriver] Bỏ qua WebUSB Direct:', msg);
      }
    }

    // ── CƠ CHẾ 2: IN TRỰC TIẾP QUA WEB SERIAL API ────────────────────────────
    if (this.serialPort || nav?.serial) {
      try {
        if (!this.serialPort && nav?.serial) {
          const ports = await nav.serial.getPorts();
          if (ports.length > 0) this.serialPort = ports[0];
        }

        if (this.serialPort) {
          await this.serialPort.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' }).catch(() => {});
          const writer = this.serialPort.writable.getWriter();
          await writer.write(bytes);
          writer.releaseLock();
          console.log('[WebUsbDriver] ✅ In thành công qua Web Serial Direct');
          return true;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[WebUsbDriver] Bỏ qua Web Serial:', msg);
      }
    }

    // ── CƠ CHẾ 3: In ngầm qua Local WebSocket (Cổng 40213) ───────────────────
    try {
      const ok = await this.printViaRawBtWebSocket(base64);
      if (ok) {
        console.log('[WebUsbDriver] ✅ In thành công qua Local WebSocket ngầm');
        return true;
      }
    } catch {
      // Tiếp tục cơ chế tiếp theo
    }

    // ── CƠ CHẾ 4: In ngầm qua Local HTTP (Cổng 40213 / 8080) ──────────────────
    try {
      const ok = await this.printViaRawBtHttp(base64);
      if (ok) {
        console.log('[WebUsbDriver] ✅ In thành công qua Local HTTP ngầm');
        return true;
      }
    } catch {
      // Tiếp tục cơ chế tiếp theo
    }

    // ── CƠ CHẾ 5: Bắn qua Intent URI trên Android (Fallback cuối cùng) ────────
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      const uri = pngBase64
        ? `rawbt:data:image/png;base64,${pngBase64}`
        : `rawbt:base64,${base64}`;

      const ok = this.printViaRawBtIntentUri(uri);
      if (ok) {
        console.log('[WebUsbDriver] ✅ Đã gửi lệnh in qua Intent URI');
        return true;
      }
    }

    throw new Error('Chưa kết nối được máy in qua RawBT hoặc USB!');
  }

  /**
   * 📡 In ngầm qua RawBT WebSocket (Cổng 40213 - Không làm mất Fullscreen)
   */
  private static async printViaRawBtWebSocket(base64Data: string): Promise<boolean> {
    return new Promise((resolve) => {
      const urls = ['ws://127.0.0.1:40213/', 'ws://localhost:40213/'];
      let idx = 0;

      const tryNext = () => {
        if (idx >= urls.length) {
          resolve(false);
          return;
        }

        const url = urls[idx++];
        try {
          const ws = new WebSocket(url);
          const timeout = setTimeout(() => {
            try { ws.close(); } catch {}
            tryNext();
          }, 1000);

          ws.onopen = () => {
            clearTimeout(timeout);
            // Gửi bản tin chuẩn cho RawBT WebSocket Server
            try {
              ws.send(
                JSON.stringify({
                  command: 'print',
                  data: base64Data,
                  type: 'raw'
                })
              );
            } catch {
              ws.send(base64Data);
            }

            setTimeout(() => {
              try { ws.close(); } catch {}
              resolve(true);
            }, 200);
          };

          ws.onerror = () => {
            clearTimeout(timeout);
            tryNext();
          };
        } catch {
          tryNext();
        }
      };

      tryNext();
    });
  }

  /**
   * 🌐 In qua RawBT HTTP POST (Cổng 40213 — In ngầm không bị chặn CORS)
   */
  private static async printViaRawBtHttp(base64Data: string): Promise<boolean> {
    const endpoints = [
      'http://127.0.0.1:40213/',
      'http://localhost:40213/',
      'http://127.0.0.1:40213/print',
      'http://localhost:40213/print',
      'http://127.0.0.1:8080/',
      'http://localhost:8080/',
      'http://127.0.0.1:8080/print',
      'http://localhost:8080/print'
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);

        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(base64Data)}`,
          signal: controller.signal
        });
        clearTimeout(timeout);
        console.log(`[WebUsbDriver] ✅ Đã gửi lệnh in qua Local HTTP (${url})`);
        return true;
      } catch {
        // Tiếp tục thử endpoint tiếp theo
      }
    }

    return false;
  }

  /**
   * 📲 Bắn qua RawBT / Quick Printer Native Intent URI trên Android (Sử dụng iframe ẩn để KHÔNG bị lỗi net::ERR_UNKNOWN_URL_SCHEME)
   */
  private static printViaRawBtIntentUri(uri: string): boolean {
    const wasFullscreen = typeof document !== 'undefined' && !!document.fullscreenElement;

    try {
      // 1. Gửi qua URI chính
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.src = uri;
      document.body.appendChild(iframe);

      // 2. Gửi thêm qua scheme quickprinter nếu đang dùng rawbt
      if (uri.startsWith('rawbt:')) {
        const quickUri = uri.replace('rawbt:', 'quickprinter:');
        const iframe2 = document.createElement('iframe');
        iframe2.style.display = 'none';
        iframe2.src = quickUri;
        document.body.appendChild(iframe2);
        setTimeout(() => { try { iframe2.remove(); } catch {} }, 1000);
      }

      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        } catch {}

        // Tự động khôi phục chế độ Fullscreen nếu bị Android gián đoạn
        if (wasFullscreen && typeof document !== 'undefined' && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }, 1000);

      return true;
    } catch (err) {
      console.warn('[WebUsbDriver] Lỗi bắn Intent RawBT / QuickPrinter:', err);
      return false;
    }
  }
}
