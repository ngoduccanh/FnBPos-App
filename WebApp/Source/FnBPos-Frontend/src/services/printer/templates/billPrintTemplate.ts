import type {
  BillPrintData,
  PrinterPaperSize
} from '../types/printer.types';

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
// 🧾 MẪU IN HÓA ĐƠN BÁN HÀNG / THANH TOÁN / ĐƠN TẠM TÍNH (BILL RECEIPT TEMPLATE)
// ─────────────────────────────────────────────────────────────────────────────

export function renderBillHtml(
  data: BillPrintData,
  paperSize: PrinterPaperSize = 'K80'
): string {
  const now = getNowDateStr();
  const isProvisional = data.type === 'provisional';
  const title = data.title || (isProvisional ? 'Đơn Tạm Tính' : 'Hóa Đơn Bán Hàng');
  const dateStr = data.dateStr || now.full;
  const maxWidth = paperSize === 'K58' ? '200px' : '280px';

  const rowsHtml = data.items
    .map(
      (item, idx) => `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${item.stt || idx + 1}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: left;">
          <div style="font-weight: 600;">${item.name}</div>
          <div style="font-size: 11px; color: #222;">${formatVND(item.price)} VNĐ / ${item.unit || 'món'}</div>
        </td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">${item.quantity}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-weight: 500;">${formatVND(item.amount)}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      line-height: 1.35;
      color: #000;
      background: #fff;
      padding: 10px;
      width: ${maxWidth};
      margin: 0 auto;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .flex-between { display: flex; justify-content: space-between; align-items: baseline; }
    .store-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
    .store-phone { font-size: 12px; margin-bottom: 8px; }
    .bill-title { font-size: 19px; font-weight: bold; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; font-size: 12px; }
    th { border: 1px solid #000; padding: 4px 6px; background-color: #fff; font-weight: bold; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 12px; }
    .summary-total { display: flex; justify-content: space-between; margin-top: 4px; font-size: 14px; font-weight: bold; }
  </style>
</head>
<body>
  <!-- HEADER CỬA HÀNG -->
  <div class="text-center store-name">${data.storeName || 'BeePos247'}</div>
  ${data.storePhone ? `<div class="text-center store-phone">SĐT: ${data.storePhone}</div>` : ''}
  ${data.storeAddress ? `<div class="text-center" style="font-size: 11px; margin-bottom: 6px;">${data.storeAddress}</div>` : ''}

  <!-- TIÊU ĐỀ HÓA ĐƠN -->
  <div class="text-center bill-title">${title}</div>

  <!-- THÔNG TIN PHIÊN ĐƠN -->
  <div style="font-size: 12px; margin-bottom: 2px;"><strong>Ngày:</strong> ${dateStr}</div>
  <div style="font-size: 12px; margin-bottom: 2px;"><strong>Khách hàng:</strong> ${data.customerName || 'Bán cho người tiêu dùng'}</div>
  ${data.orderNote ? `<div style="font-size: 12px; margin-bottom: 2px;"><strong>Ghi chú:</strong> ${data.orderNote}</div>` : ''}
  <div style="font-size: 13px; font-weight: bold; margin-top: 4px; margin-bottom: 4px;">HÓA ĐƠN ${data.tableName}</div>

  <!-- BẢNG MÓN ĂN -->
  <table>
    <thead>
      <tr>
        <th style="width: 10%; text-align: center;">TT</th>
        <th style="width: 50%; text-align: left;">Tên hàng</th>
        <th style="width: 12%; text-align: center;">SL</th>
        <th style="width: 28%; text-align: right;">Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <!-- TỔNG KẾT TIỀN -->
  <div class="summary-row">
    <span>Tổng tiền Hàng &nbsp;<strong>${data.totalQuantity}</strong> món</span>
    <span>${formatVND(data.totalAmount)}</span>
  </div>

  <div class="summary-row">
    <span>Thuế:</span>
    <span>${formatVND(data.taxAmount || 0)}</span>
  </div>

  <div class="summary-row">
    <span>Giảm giá:</span>
    <span>${formatVND(data.discountAmount || 0)}</span>
  </div>

  <div class="summary-total">
    <span>Tổng Cộng:</span>
    <span>${formatVND(data.finalAmount)}</span>
  </div>
</body>
</html>`;
}
