/**
 * 🖨️ BrowserDriver — In qua Iframe ẩn tiêu chuẩn trình duyệt (Chạy trên 100% thiết bị kể cả iPad, iPhone)
 */
export class BrowserDriver {
  /**
   * In mẫu HTML qua Iframe ẩn không làm gián đoạn màn hình hiện tại
   */
  public static async printHtml(htmlContent: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';

        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) {
          document.body.removeChild(iframe);
          resolve(false);
          return;
        }

        doc.open();
        doc.write(htmlContent);
        doc.close();

        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            } catch (err) {
              console.error('[BrowserDriver] Lỗi print:', err);
            } finally {
              setTimeout(() => {
                try {
                  document.body.removeChild(iframe);
                } catch {
                  // Ignore
                }
                resolve(true);
              }, 1000);
            }
          }, 300);
        };
      } catch (err) {
        console.error('[BrowserDriver] ❌ Lỗi khởi tạo iframe in:', err);
        resolve(false);
      }
    });
  }
}
