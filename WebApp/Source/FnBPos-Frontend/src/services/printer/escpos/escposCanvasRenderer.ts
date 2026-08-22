import type { BillPrintData, KitchenPrintData, PrinterPaperSize } from '../types/printer.types';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

function getNowDateStr(): { date: string; time: string; full: string } {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const t = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const shortTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return { date: d, time: t, full: `${d} ${shortTime}` };
}

/**
 * Chuyển đổi Canvas 2D thành mã nhị phân ESC/POS Raster Bitmap (GS v 0)
 * Đảm bảo 100% font tiếng Việt nét căng, chữ to rõ ràng, tự động đẩy và cắt giấy.
 */
function canvasToEscposRaster(canvas: HTMLCanvasElement, openCashDrawer = false, autoCut = true): Uint8Array {
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Uint8Array();

  const width = canvas.width;
  const height = canvas.height;
  const widthBytes = Math.ceil(width / 8);

  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  // Header GS v 0 0 (mode 0: normal density)
  const header = [
    0x1b, 0x40, // ESC @ (Init)
    0x1b, 0x61, 0x01 // ESC a 1 (Align Center)
  ];

  if (openCashDrawer) {
    header.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // Mở két tiền
  }

  // GS v 0 0 xL xH yL yH
  const xL = widthBytes & 0xff;
  const xH = (widthBytes >> 8) & 0xff;
  const yL = height & 0xff;
  const yH = (height >> 8) & 0xff;

  header.push(0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH);

  // Bitmap bytes
  const rasterBytes = new Uint8Array(widthBytes * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      // Pixel đen nếu độ sáng < 200 và alpha > 40
      const isBlack = a > 40 && (r * 0.299 + g * 0.587 + b * 0.114 < 200);
      if (isBlack) {
        const byteIdx = y * widthBytes + Math.floor(x / 8);
        const bitIdx = 7 - (x % 8);
        rasterBytes[byteIdx] |= 1 << bitIdx;
      }
    }
  }

  // Footer: Đẩy 2 dòng & Cắt giấy
  const footer = [
    0x1b, 0x64, 0x02 // Đẩy 2 dòng vừa đủ qua lưỡi dao
  ];

  if (autoCut) {
    footer.push(0x1d, 0x56, 0x00); // GS V 0 (Cắt giấy hoàn toàn)
  }

  // Gộp toàn bộ mảng
  const totalLen = header.length + rasterBytes.length + footer.length;
  const finalBuffer = new Uint8Array(totalLen);
  finalBuffer.set(header, 0);
  finalBuffer.set(rasterBytes, header.length);
  finalBuffer.set(footer, header.length + rasterBytes.length);

  return finalBuffer;
}

/**
 * 🍳 Vẽ Phiếu Bếp / Phiếu Hủy Món lên Canvas & Chuyển sang ESC/POS Raster (CHỮ SIÊU TO, ĐẬM, RÕ NÉT)
 */
export function buildKitchenRasterEscpos(
  data: KitchenPrintData,
  paperSize: PrinterPaperSize = 'K80'
): { getBase64: () => string; getBytes: () => Uint8Array; getPngDataUrl: () => string; getPngBase64: () => string } {
  const canvas = document.createElement('canvas');
  const width = paperSize === 'K58' ? 384 : 576; // 384px cho K58, 576px cho K80
  canvas.width = width;

  const ctx = canvas.getContext('2d')!;
  const now = getNowDateStr();
  const isCancel = data.type === 'cancel';
  const title = data.title || (isCancel ? 'ĐƠN HỦY MÓN' : 'ĐƠN GỬI BẾP');
  const tag = data.tag || (isCancel ? '[HỦY MÓN]' : '[ĐẶT THÊM]');
  const dateStr = data.dateStr || now.date;
  const timeStr = data.timeStr || now.time;

  // Tính chiều cao vừa khít nội dung (không bị dài thừa đáy)
  const headerHeight = 240;
  const itemRowHeight = 65;
  const tableHeaderHeight = 50;
  const feedPaperBottom = 20; // Khoảng trắng chân vừa khít
  const totalHeight = headerHeight + tableHeaderHeight + (data.items.length * itemRowHeight) + feedPaperBottom;
  canvas.height = totalHeight;

  // Nền trắng
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);

  // Chữ màu đen đậm
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  let y = 16;

  // 1. Tiêu đề SIÊU TO, ĐẬM
  ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, y);
  y += 56;

  // 2. Bàn & Tag
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(data.tableName.toUpperCase(), 10, y);
  ctx.textAlign = 'right';
  ctx.fillText(tag, width - 10, y);
  y += 46;

  // 3. Ngày & Giờ
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Ngày: ${dateStr}`, 10, y);
  ctx.textAlign = 'right';
  ctx.fillText(timeStr, width - 10, y);
  y += 38;

  // 4. Phục vụ
  ctx.textAlign = 'left';
  ctx.fillText(`Phục vụ: ${data.serverName || 'Thu ngân'}`, 10, y);
  y += 46;

  // 5. Bảng món ăn
  const startX = 8;
  const endX = width - 8;
  const col1W = Math.floor(width * 0.55);
  const col2W = Math.floor(width * 0.22);
  const col3W = width - col1W - col2W - 16;

  // Viền trên header
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();

  y += 10;
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MÓN', startX + 6, y);
  ctx.textAlign = 'center';
  ctx.fillText('Đ.Vị', startX + col1W + col2W / 2, y);
  ctx.fillText('SL', startX + col1W + col2W + col3W / 2, y);
  y += 38;

  // Viền dưới header
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();

  // Danh sách từng món với chữ to, đậm nét
  for (const item of data.items) {
    y += 12;
    ctx.textAlign = 'left';
    ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
    ctx.fillText(item.name, startX + 6, y);

    ctx.textAlign = 'center';
    ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
    ctx.fillText(item.unit || '-', startX + col1W + col2W / 2, y);

    // Số lượng TO ĐÙNG để bếp nhìn rõ
    ctx.font = 'bold 38px "Segoe UI", Arial, sans-serif';
    ctx.fillText(String(item.quantity), startX + col1W + col2W + col3W / 2, y - 2);
    y += 42;

    if (item.note) {
      ctx.font = 'bold italic 24px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`(Ghi chú: ${item.note})`, startX + 20, y);
      y += 32;
    }

    // Đường kẻ giữa các món
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, y + 4);
    ctx.lineTo(endX, y + 4);
    ctx.stroke();
    y += 10;
  }

  const rasterBytes = canvasToEscposRaster(canvas, false, true);
  const dataUrl = canvas.toDataURL('image/png');

  return {
    getBytes: () => rasterBytes,
    getBase64: () => {
      let binary = '';
      const len = rasterBytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(rasterBytes[i]);
      }
      return btoa(binary);
    },
    getPngDataUrl: () => dataUrl,
    getPngBase64: () => dataUrl.split(',')[1] || ''
  };
}

/**
 * 📑 Vẽ Hóa Đơn Bán Hàng / Tạm Tính lên Canvas & Chuyển sang ESC/POS Raster (CHỮ SIÊU TO, ĐẬM, RÕ NÉT)
 */
export function buildBillRasterEscpos(
  data: BillPrintData,
  paperSize: PrinterPaperSize = 'K80',
  openCashDrawer = true
): { getBase64: () => string; getBytes: () => Uint8Array; getPngDataUrl: () => string; getPngBase64: () => string } {
  const canvas = document.createElement('canvas');
  const width = paperSize === 'K58' ? 384 : 576;
  canvas.width = width;

  const ctx = canvas.getContext('2d')!;
  const now = getNowDateStr();
  const isProvisional = data.type === 'provisional';
  const title = data.title || (isProvisional ? 'ĐƠN TẠM TÍNH' : 'HÓA ĐƠN BÁN HÀNG');
  const dateStr = data.dateStr || now.full;

  const headerHeight = 300;
  const itemRowHeight = 70;
  const summaryHeight = 240;
  const feedPaperBottom = 25; // Khoảng trắng chân vừa khít
  const totalHeight = headerHeight + (data.items.length * itemRowHeight) + summaryHeight + feedPaperBottom;
  canvas.height = totalHeight;

  // Nền trắng
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);

  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  let y = 16;

  // 1. Tên quán
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.storeName.toUpperCase(), width / 2, y);
  y += 46;

  if (data.storePhone) {
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Hotline: ${data.storePhone}`, width / 2, y);
    y += 34;
  }

  // 2. Tiêu đề hóa đơn
  ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
  ctx.fillText(title, width / 2, y);
  y += 52;

  // 3. Thông tin bàn, ngày, khách
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Bàn: ${data.tableName}`, 10, y);
  ctx.textAlign = 'right';
  ctx.fillText(`Ngày: ${dateStr}`, width - 10, y);
  y += 38;

  ctx.textAlign = 'left';
  ctx.fillText(`Khách: ${data.customerName || 'Khách lẻ'}`, 10, y);
  ctx.textAlign = 'right';
  ctx.fillText(`Thu ngân: ${data.cashierName || 'Admin'}`, width - 10, y);
  y += 46;

  // 4. Header Bảng
  const startX = 8;
  const endX = width - 8;

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();

  y += 10;
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('STT  MÓN', startX + 4, y);
  ctx.textAlign = 'center';
  ctx.fillText('SL', width - 230, y);
  ctx.textAlign = 'right';
  ctx.fillText('THÀNH TIỀN', endX - 4, y);
  y += 38;

  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();

  // 5. Danh sách món (Chữ to, rõ nét)
  data.items.forEach((item, idx) => {
    y += 12;
    ctx.textAlign = 'left';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`${item.stt || idx + 1}. ${item.name}`, startX + 4, y);

    ctx.textAlign = 'center';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.fillText(String(item.quantity), width - 230, y);

    ctx.textAlign = 'right';
    ctx.fillText(formatVND(item.amount), endX - 4, y);
    y += 36;

    ctx.font = '22px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#222222';
    ctx.textAlign = 'left';
    ctx.fillText(`   ${formatVND(item.price)} đ / ${item.unit || 'món'}`, startX + 24, y);
    ctx.fillStyle = '#000000';
    y += 28;
  });

  // 6. Tổng cộng
  y += 12;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();
  y += 16;

  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Tổng SL (${data.totalQuantity} món):`, startX + 4, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${formatVND(data.totalAmount)} đ`, endX - 4, y);
  y += 42;

  // TỔNG TIỀN THANH TOÁN SIÊU TO
  ctx.font = 'bold 38px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THANH TOÁN:', startX + 4, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${formatVND(data.finalAmount)} đ`, endX - 4, y);
  y += 54;

  // Lời cảm ơn
  ctx.font = 'bold italic 24px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Xin cảm ơn Quý khách & Hẹn gặp lại!', width / 2, y);

  const rasterBytes = canvasToEscposRaster(canvas, openCashDrawer, true);
  const dataUrl = canvas.toDataURL('image/png');

  return {
    getBytes: () => rasterBytes,
    getBase64: () => {
      let binary = '';
      const len = rasterBytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(rasterBytes[i]);
      }
      return btoa(binary);
    },
    getPngDataUrl: () => dataUrl,
    getPngBase64: () => dataUrl.split(',')[1] || ''
  };
}
