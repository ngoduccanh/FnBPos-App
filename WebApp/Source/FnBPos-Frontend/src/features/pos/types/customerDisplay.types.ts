/**
 * 🖥️ TYPES CHO MÀN HÌNH PHỤ HƯỚNG VỀ KHÁCH HÀNG (CUSTOMER FACING DISPLAY)
 */

export type CustomerDisplayMode = 'IDLE' | 'ORDERING' | 'CHECKOUT';

export interface CustomerDisplayCartItem {
  productId: number;
  productCode: string;
  productName: string;
  unitName?: string;
  quantity: number;
  price: number;
  totalAmount: number;
  note?: string;
}

export interface CustomerDisplayStoreInfo {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  logoUrl?: string;
  bannerUrls?: string[];
}

export interface CustomerDisplayCheckoutInfo {
  totalAmount: number;
  discountAmount?: number;
  finalAmount: number;
  qrBankingUrl?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  transferContent?: string;
}

export interface CustomerDisplayPayload {
  mode: CustomerDisplayMode;
  storeInfo: CustomerDisplayStoreInfo;
  tableName?: string;
  customerName?: string;
  cartItems: CustomerDisplayCartItem[];
  cartTotalQuantity: number;
  cartTotalAmount: number;
  checkoutInfo?: CustomerDisplayCheckoutInfo;
  updatedAt: number;
}
