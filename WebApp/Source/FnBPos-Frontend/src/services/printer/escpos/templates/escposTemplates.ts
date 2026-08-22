import { EscposEncoder } from '../escposEncoder';
import type { KitchenPrintData, BillPrintData, PrinterPaperSize } from '../../types/printer.types';

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

// ─────────────────────────────────────────────────────────────────────────────
// 1. ESC/POS PHIẾU BẾP / HỦY BẾP
// ─────────────────────────────────────────────────────────────────────────────

export function buildKitchenEscpos(
  data: KitchenPrintData,
  paperSize: PrinterPaperSize = 'K80'
): EscposEncoder {
  const encoder = new EscposEncoder(paperSize);
  const now = getNowDateStr();
  const isCancel = data.type === 'cancel';
  const title = data.title || (isCancel ? 'Đơn Hủy Món' : 'Đơn Gửi Bếp');
  const tag = data.tag || (isCancel ? '[HỦY MÓN]' : '[ĐẶT THÊM]');
  const dateStr = data.dateStr || now.date;
  const timeStr = data.timeStr || now.time;

  // Tiêu đề to đậm ở giữa
  encoder
    .align('center')
    .size('large')
    .bold(true)
    .line(title)
    .bold(false)
    .size('normal')
    .line();

  // Bàn & Tag
  encoder
    .align('left')
    .bold(true)
    .twoColumns(data.tableName, tag)
    .bold(false);

  // Ngày giờ
  encoder.twoColumns(`Ngày: ${dateStr}`, timeStr);

  // Phục vụ
  encoder.line(`Phục vụ : ${data.serverName || 'Thu ngân'}`);
  encoder.divider('-');

  // Header Bảng
  encoder.bold(true);
  if (paperSize === 'K58') {
    encoder.line('MÓN           ĐV     SL');
  } else {
    encoder.line('MÓN                               Đơn vị    SL');
  }
  encoder.bold(false);
  encoder.divider('-');

  // Danh sách món
  data.items.forEach(item => {
    encoder.bold(true);
    encoder.line(item.name);
    encoder.bold(false);

    if (item.note) {
      encoder.line(`  *Ghi chú: ${item.note}`);
    }

    const unitStr = item.unit || '-';
    const qtyStr = `${item.quantity}`;
    encoder.twoColumns(`  Đơn vị: ${unitStr}`, `SL: ${qtyStr}`);
    encoder.divider('.');
  });

  encoder.cut();
  return encoder;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ESC/POS HÓA ĐƠN BÁN HÀNG / ĐƠN TẠM TÍNH
// ─────────────────────────────────────────────────────────────────────────────

export function buildBillEscpos(
  data: BillPrintData,
  paperSize: PrinterPaperSize = 'K80',
  openDrawer: boolean = false
): EscposEncoder {
  const encoder = new EscposEncoder(paperSize);
  const now = getNowDateStr();
  const isProvisional = data.type === 'provisional';
  const title = data.title || (isProvisional ? 'Đơn Tạm Tính' : 'Hóa Đơn Bán Hàng');
  const dateStr = data.dateStr || now.full;

  if (openDrawer && !isProvisional) {
    encoder.openCashDrawer();
  }

  // Header Cửa hàng
  encoder
    .align('center')
    .bold(true)
    .size('double-height')
    .line(data.storeName || 'BeePos247')
    .size('normal')
    .bold(false);

  if (data.storePhone) {
    encoder.line(`SĐT: ${data.storePhone}`);
  }
  if (data.storeAddress) {
    encoder.line(data.storeAddress);
  }

  encoder.line();

  // Tiêu đề Hóa đơn
  encoder
    .size('large')
    .bold(true)
    .line(title)
    .size('normal')
    .bold(false)
    .line();

  // Thông tin đơn
  encoder
    .align('left')
    .line(`Ngày: ${dateStr}`)
    .line(`Khách hàng: ${data.customerName || 'Bán cho người tiêu dùng'}`);

  if (data.orderNote) {
    encoder.line(`Ghi chú: ${data.orderNote}`);
  }

  encoder
    .bold(true)
    .line(`HÓA ĐƠN ${data.tableName}`)
    .bold(false);

  encoder.divider('-');

  // Header Bảng
  encoder.bold(true);
  if (paperSize === 'K58') {
    encoder.line('TT Tên hàng          SL    T.Tiền');
  } else {
    encoder.line('TT  Tên hàng                 SL       Thành tiền');
  }
  encoder.bold(false);
  encoder.divider('-');

  // Danh sách món
  data.items.forEach((item, idx) => {
    const stt = item.stt || idx + 1;
    encoder.bold(true).line(`${stt}. ${item.name}`).bold(false);

    const priceUnit = `${formatVND(item.price)} VNĐ / ${item.unit || 'món'}`;
    const qtyAmount = `${item.quantity} x ${formatVND(item.price)} = ${formatVND(item.amount)}`;
    encoder.twoColumns(`   ${priceUnit}`, formatVND(item.amount));
    encoder.divider('.');
  });

  encoder.divider('-');

  // Tổng kết
  encoder.twoColumns(`Tổng tiền Hàng (${data.totalQuantity} món)`, formatVND(data.totalAmount));
  encoder.twoColumns('Thuế:', formatVND(data.taxAmount || 0));
  encoder.twoColumns('Giảm giá:', formatVND(data.discountAmount || 0));
  
  encoder.divider('=');
  encoder
    .bold(true)
    .size('double-height')
    .twoColumns('Tổng Cộng:', `${formatVND(data.finalAmount)} đ`)
    .size('normal')
    .bold(false);

  encoder.feed(2);
  encoder.align('center').line('Xin cảm ơn Quý khách!').line();
  encoder.cut();

  return encoder;
}
