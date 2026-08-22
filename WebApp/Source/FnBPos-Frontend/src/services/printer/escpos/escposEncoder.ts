import type { PrinterPaperSize } from '../types/printer.types';

export class EscposEncoder {
  private buffer: number[] = [];
  private paperSize: PrinterPaperSize;
  private maxChars: number;

  constructor(paperSize: PrinterPaperSize = 'K80') {
    this.paperSize = paperSize;
    this.maxChars = paperSize === 'K58' ? 32 : 48;
    this.init();
  }

  /** Khởi tạo máy in */
  init(): this {
    this.buffer.push(0x1b, 0x40); // ESC @
    return this;
  }

  /** Căn lề: left | center | right */
  align(alignment: 'left' | 'center' | 'right'): this {
    let code = 0;
    if (alignment === 'center') code = 1;
    if (alignment === 'right') code = 2;
    this.buffer.push(0x1b, 0x61, code); // ESC a n
    return this;
  }

  /** In đậm */
  bold(enable: boolean = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0); // ESC E n
    return this;
  }

  /** Kích thước chữ */
  size(mode: 'normal' | 'large' | 'double-height' | 'double-width'): this {
    let code = 0x00;
    if (mode === 'large') code = 0x11; // Double width & height
    if (mode === 'double-height') code = 0x01;
    if (mode === 'double-width') code = 0x10;
    this.buffer.push(0x1d, 0x21, code); // GS ! n
    return this;
  }

  /** Ghi văn bản (hỗ trợ UTF-8) */
  text(content: string): this {
    if (!content) return this;
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  /** Ghi 1 dòng văn bản (tự thêm \n) */
  line(content: string = ''): this {
    return this.text(content + '\n');
  }

  /** Đường kẻ phân cách */
  divider(char: string = '-'): this {
    return this.line(char.repeat(this.maxChars));
  }

  /** In 2 cột trái - phải cách đều */
  twoColumns(leftText: string, rightText: string): this {
    const totalLen = this.maxChars;
    const rightLen = rightText.length;
    const maxLeftLen = totalLen - rightLen - 1;
    const truncatedLeft = leftText.length > maxLeftLen ? leftText.substring(0, maxLeftLen) : leftText;
    const spaces = ' '.repeat(Math.max(1, totalLen - truncatedLeft.length - rightLen));
    return this.line(truncatedLeft + spaces + rightText);
  }

  /** Đẩy giấy thêm N dòng */
  feed(lines: number = 3): this {
    this.buffer.push(0x1b, 0x64, Math.max(1, lines)); // ESC d n
    return this;
  }

  /** Lệnh tự động cắt giấy */
  cut(partial: boolean = false): this {
    this.feed(3);
    this.buffer.push(0x1d, 0x56, partial ? 0x01 : 0x00); // GS V 0
    return this;
  }

  /** Lệnh mở két tiền thu ngân (Cash Drawer) */
  openCashDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250
    return this;
  }

  /** Lấy mảng byte Uint8Array để bắn qua WebUSB / WiFi / Socket */
  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /** Lấy chuỗi Base64 để bắn qua QZ Tray */
  getBase64(): string {
    const bytes = this.getBytes();
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
