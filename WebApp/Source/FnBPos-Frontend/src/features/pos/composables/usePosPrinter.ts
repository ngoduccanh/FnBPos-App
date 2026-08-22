import { ref } from 'vue';
import { PosPrinterService } from '@/services/printer/posPrinterService';
import { PrinterStorageService } from '@/services/printer/printerStorageService';
import { useToast } from '@/shared/components/toast/composables/useToast';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';
import type { PosTableItem } from '../types/tables.types';
import type { CartItem } from '../mappers/orderDetailMapper';
import type {
  BillPrintData,
  KitchenPrintData,
  PosPrinterSettings,
  PrinterDeviceConfig
} from '@/services/printer/types/printer.types';

/**
 * 🖨️ usePosPrinter — Composable điều khiển in ấn trong POS
 */
export function usePosPrinter() {
  const isPrinting = ref<boolean>(false);
  const toast = useToast();
  const appStore = useAppStore();
  const authStore = useAuthStore();
  const printerSettings = ref<PosPrinterSettings>(PrinterStorageService.getSettings());

  /**
   * Cập nhật cấu hình máy in
   */
  const savePrinterSettings = (newSettings: PosPrinterSettings) => {
    printerSettings.value = newSettings;
    PrinterStorageService.saveSettings(newSettings);
    toast.showSuccess('Đã lưu cấu hình máy in!', 'Cài đặt máy in');
  };

  /**
   * In Hóa đơn thanh toán hoặc Đơn tạm tính từ giỏ hàng hiện tại
   */
  const printBillFromCart = async (
    table: PosTableItem | null,
    cartItems: CartItem[],
    options?: {
      isProvisional?: boolean;
      orderNote?: string;
      customerName?: string;
      customConfig?: Partial<PrinterDeviceConfig>;
    }
  ): Promise<boolean> => {
    if (!cartItems || cartItems.length === 0) {
      toast.showWarning('Giỏ hàng trống! Không có món để in.', 'In hóa đơn');
      return false;
    }

    isPrinting.value = true;

    try {
      const selectedStore: any = authStore.selectedStore;
      const storeName = appStore.session?.storeName || selectedStore?.name || selectedStore?.Name || 'BeePos247';
      const storePhone = appStore.session?.storePhones || appStore.session?.storeMobiles || '';
      const storeAddress = appStore.session?.storeAddresses || selectedStore?.address || selectedStore?.Address || '';

      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (Number(item.product.retailOutPrice || 0) * item.quantity),
        0
      );

      const storeId = table?.storeId || appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;

      const billData: BillPrintData = {
        type: options?.isProvisional ? 'provisional' : 'receipt',
        title: options?.isProvisional ? 'Đơn Tạm Tính' : 'Hóa Đơn Bán Hàng',
        storeName,
        storePhone,
        storeAddress,
        tableName: table?.name || 'BÀN',
        customerName: options?.customerName || 'Bán cho người tiêu dùng',
        orderNote: options?.orderNote || '',
        totalQuantity,
        totalAmount,
        taxAmount: 0,
        discountAmount: 0,
        finalAmount: totalAmount,
        storeId,
        items: cartItems.map((item, idx) => ({
          stt: idx + 1,
          name: item.product.productName,
          price: Number(item.product.retailOutPrice || 0),
          unit: item.product.retailUnitName || 'món',
          quantity: item.quantity,
          amount: Number(item.product.retailOutPrice || 0) * item.quantity
        }))
      };

      const result = await PosPrinterService.printBill(billData, options?.customConfig);
      if (result) {
        toast.showSuccess(
          options?.isProvisional ? 'Đã gửi lệnh in Đơn Tạm Tính!' : 'Đã gửi lệnh in Hóa Đơn!',
          'Máy in'
        );
      }
      return result;
    } catch (err: any) {
      console.error('[usePosPrinter] ❌ Lỗi in hóa đơn:', err);
      toast.showError(err?.message || 'Không thể in hóa đơn. Vui lòng kiểm tra lại máy in!', 'Lỗi in ấn');
      return false;
    } finally {
      isPrinting.value = false;
    }
  };

  /**
   * In Phiếu Gửi Bếp hoặc Phiếu Hủy Món từ giỏ hàng
   */
  const printKitchenFromCart = async (
    table: PosTableItem | null,
    cartItems: CartItem[],
    options?: {
      isCancel?: boolean;
      customConfig?: Partial<PrinterDeviceConfig>;
    }
  ): Promise<boolean> => {
    if (!cartItems || cartItems.length === 0) {
      toast.showWarning('Giỏ hàng trống! Không có món để gửi bếp.', 'In bếp');
      return false;
    }

    isPrinting.value = true;

    try {
      const serverName = authStore.user?.fullName || authStore.user?.username || 'Thu ngân';
      const selectedStore: any = authStore.selectedStore;
      const storeId = table?.storeId || appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;

      const kitchenData: KitchenPrintData = {
        type: options?.isCancel ? 'cancel' : 'order',
        title: options?.isCancel ? 'Đơn Hủy Món' : 'Đơn Gửi Bếp',
        tag: options?.isCancel ? '[HỦY MÓN]' : '[ĐẶT THÊM]',
        tableName: table?.name || 'BÀN',
        serverName,
        storeId,
        items: cartItems.map(item => ({
          name: item.product.productName,
          unit: item.product.retailUnitName || 'món',
          quantity: options?.isCancel ? -Math.abs(item.quantity) : item.quantity
        }))
      };

      const result = await PosPrinterService.printKitchen(kitchenData, options?.customConfig);
      if (result) {
        toast.showSuccess(
          options?.isCancel ? 'Đã in Phiếu Hủy Món!' : 'Đã in Phiếu Gửi Bếp!',
          'Bếp / Bar'
        );
      }
      return result;
    } catch (err: any) {
      console.error('[usePosPrinter] ❌ Lỗi in bếp:', err);
      toast.showError(err?.message || 'Không thể gửi lệnh in bếp. Vui lòng kiểm tra máy in bếp!', 'Lỗi in ấn');
      return false;
    } finally {
      isPrinting.value = false;
    }
  };

  return {
    isPrinting,
    printerSettings,
    savePrinterSettings,
    printBillFromCart,
    printKitchenFromCart
  };
}
