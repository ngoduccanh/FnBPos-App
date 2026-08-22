import { apiClient } from '@/services/apiClient';

/**
 * 🔐 API Xin chữ ký số QZ Tray từ Backend (ApiPosSaleController / SignQZRequest)
 * Sử dụng apiClient để tự động đính kèm Authorization Token và CSRF Token.
 */
export const signQzRequestApi = async (message: string): Promise<string> => {
  try {
    // 1. Gọi qua apiClient (có gắn Bearer Token & withCredentials)
    const res: any = await apiClient.post('/api/posSale/SignQZRequest', JSON.stringify(message), {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'text'
    });

    if (typeof res === 'string') return res;
    return typeof res?.data === 'string' ? res.data : String(res || '');
  } catch (err: any) {
    console.error('[signQzRequestApi] ❌ Lỗi xin chữ ký QZ:', err);
    throw err;
  }
};
