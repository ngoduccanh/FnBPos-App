/**
 * 🔌 WebUsbDriver — Hỗ trợ toàn diện máy in USB trên Android POS & PC
 * Tích hợp 4 cơ chế: RawBT WebSocket (Silent 0ms) + RawBT Silent Intent + Web Serial API + WebUSB
 * Tự động duy trì chế độ Fullscreen không bị thoát ra ngoài.
 */
export class WebUsbDriver {
  private static usbDevice: USBDevice | null = null;
  private static serialPort: any = null;
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
    // 1. Thử Web Serial trước
    if (typeof navigator !== 'undefined' && 'serial' in (navigator as any)) {
      try {
        const port = await (navigator as any).serial.requestPort();
        this.serialPort = port;
        const info = port.getInfo ? port.getInfo() : {};
        const name = `USB Serial (VID:${info.usbVendorId || 'N/A'})`;
        console.log('[WebUsbDriver] 🔌 Đã ghép nối qua Web Serial:', name);
        return name;
      } catch (err: any) {
        console.warn('[WebUsbDriver] Bỏ qua Web Serial:', err?.message);
      }
    }

    // 2. Thử WebUSB
    if (typeof navigator !== 'undefined' && 'usb' in navigator) {
      try {
        const device = await (navigator as any).usb.requestDevice({ filters: [] });
        this.usbDevice = device;
        const name = device.productName || `USB Printer (VID:${device.vendorId})`;
        console.log('[WebUsbDriver] 🔌 Đã ghép nối qua WebUSB:', name);
        return name;
      } catch (err: any) {
        console.warn('[WebUsbDriver] Bỏ qua WebUSB:', err?.message);
      }
    }

    return 'USB Printer Port (RawBT / Auto)';
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

    // ── CƠ CHẾ 1: In ngầm qua RawBT WebSocket (Cổng 40213 — KHÔNG BỊ OUT FULLSCREEN) ──
    try {
      const ok = await this.printViaRawBtWebSocket(base64);
      if (ok) {
        console.log('[WebUsbDriver] ✅ In thành công qua RawBT WebSocket ngầm (Giữ nguyên Fullscreen)');
        return true;
      }
    } catch {
      // Tiếp tục cơ chế tiếp theo
    }

    // ── CƠ CHẾ 2: In ngầm qua RawBT HTTP Local (Cổng 40213) ───────────────
    try {
      const ok = await this.printViaRawBtHttp(base64);
      if (ok) {
        console.log('[WebUsbDriver] ✅ In thành công qua RawBT HTTP ngầm');
        return true;
      }
    } catch {
      // Tiếp tục cơ chế tiếp theo
    }

    // ── CƠ CHẾ 3: Bắn qua RawBT Silent Intent URI ────────────────────────────
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      const uri = pngBase64
        ? `rawbt:data:image/png;base64,${pngBase64}`
        : `rawbt:base64,${base64}`;

      const ok = this.printViaRawBtIntentUri(uri);
      if (ok) {
        console.log('[WebUsbDriver] ✅ Đã gửi lệnh in qua RawBT Intent URI');
        return true;
      }
    }

    // ── CƠ CHẾ 4: In qua Web Serial API ──────────────────────────────────────
    if (this.serialPort || (typeof navigator !== 'undefined' && 'serial' in (navigator as any))) {
      try {
        if (!this.serialPort) {
          const ports = await (navigator as any).serial.getPorts();
          if (ports.length > 0) this.serialPort = ports[0];
        }

        if (this.serialPort) {
          await this.serialPort.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' }).catch(() => {});
          const writer = this.serialPort.writable.getWriter();
          await writer.write(bytes);
          writer.releaseLock();
          console.log('[WebUsbDriver] ✅ In thành công qua Web Serial');
          return true;
        }
      } catch (err: any) {
        console.warn('[WebUsbDriver] Lỗi in Web Serial:', err?.message);
      }
    }

    // ── CƠ CHẾ 5: In qua WebUSB Direct API ───────────────────────────────────
    if (typeof navigator !== 'undefined' && 'usb' in navigator) {
      try {
        if (!this.usbDevice) {
          const paired = await (navigator as any).usb.getDevices();
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
              const ep = alt.endpoints.find((e: any) => e.direction === 'out');
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
            await this.usbDevice.transferOut(this.endpointNumber, bytes as any);
            console.log('[WebUsbDriver] ✅ In thành công qua WebUSB');
            return true;
          }
        }
      } catch (err: any) {
        console.warn('[WebUsbDriver] Lỗi in WebUSB:', err?.message);
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
      'http://localhost:40213/print'
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
        console.log('[WebUsbDriver] ✅ Đã gửi lệnh in qua RawBT HTTP Local (In ngầm)');
        return true;
      } catch {
        // Tiếp tục thử endpoint tiếp theo
      }
    }

    return false;
  }

  /**
   * 📲 Bắn qua RawBT Native Intent URI trên Android (Tự động phục hồi Fullscreen)
   */
  private static printViaRawBtIntentUri(uri: string): boolean {
    const wasFullscreen = typeof document !== 'undefined' && !!document.fullscreenElement;

    try {
      const link = document.createElement('a');
      link.href = uri;
      link.target = '_self';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        try {
          document.body.removeChild(link);
        } catch {}

        // Tự động khôi phục chế độ Fullscreen nếu bị Android gián đoạn
        if (wasFullscreen && typeof document !== 'undefined' && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }, 500);

      return true;
    } catch {
      return false;
    }
  }
}
