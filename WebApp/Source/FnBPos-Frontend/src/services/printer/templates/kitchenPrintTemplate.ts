import type {
  KitchenPrintData,
  PrinterPaperSize
} from '../types/printer.types';

function getNowDateStr(): { date: string; time: string; full: string } {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const t = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const shortTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return { date: d, time: t, full: `${d} ${shortTime}` };
}

// ─────────────────────────────────────────────────────────────────────────────
// 🍳 MẪU IN PHIẾU BẾP / HỦY BẾP (KITCHEN TICKET TEMPLATE)
// ─────────────────────────────────────────────────────────────────────────────

export function renderKitchenHtml(
  data: KitchenPrintData,
  paperSize: PrinterPaperSize = 'K80'
): string {
  const now = getNowDateStr();
  const isCancel = data.type === 'cancel';
  const title = data.title || (isCancel ? 'Đơn Hủy Món' : 'Đơn Gửi Bếp');
  const tag = data.tag || (isCancel ? '[HỦY MÓN]' : '[ĐẶT THÊM]');
  const dateStr = data.dateStr || now.date;
  const timeStr = data.timeStr || now.time;
  const maxWidth = paperSize === 'K58' ? '200px' : '280px';

  const rowsHtml = data.items
    .map(
      item => `
      <tr>
        <td style="border: 1px solid #000; padding: 4px 6px; font-weight: 500;">
          ${item.name}
          ${item.note ? `<div style="font-size: 11px; font-style: italic; color: #555;">Ghi chú: ${item.note}</div>` : ''}
        </td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">${item.unit || '-'}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold; ${item.quantity < 0 ? 'color: #c00;' : ''}">
          ${item.quantity}
        </td>
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
    .title { font-size: 20px; font-weight: bold; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    th { border: 1px solid #000; padding: 4px 6px; background-color: #fff; font-weight: bold; }
  </style>
</head>
<body>
  <div class="text-center title">${title}</div>

  <div class="flex-between" style="font-size: 14px; margin-bottom: 4px;">
    <span class="font-bold">${data.tableName}</span>
    <span class="font-bold">${tag}</span>
  </div>

  <div class="flex-between" style="margin-bottom: 4px;">
    <span><strong>Ngày:</strong> ${dateStr}</span>
    <span>${timeStr}</span>
  </div>

  <div style="margin-bottom: 6px;">
    <span>Phục vụ : ${data.serverName || 'Thu ngân'}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align: left; width: 55%;">MÓN</th>
        <th style="text-align: center; width: 25%;">Đơn vị</th>
        <th style="text-align: center; width: 20%;">SL</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;
}
