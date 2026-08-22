import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useProducts } from '../hooks/useProducts';
import { useProductGroupOptions } from '../hooks/useProductGroupOptions';
import { useFilterProducts } from './useFilterProducts';
import { usePosCart } from './usePosCart';
import { useOrderDetail } from './useOrderDetail';
import { usePosSaveOrder } from './usePosSaveOrder';
import { usePosCancelOrder } from './usePosCancelOrder';
import { usePosPrinter } from './usePosPrinter';
import { posProductCacheService } from '@/services/posDexieDB/posProductCacheService';
import { posCartCacheService } from '@/services/posDexieDB/posCartCacheService';
import { posOrderCacheService } from '@/services/posDexieDB/posOrderCacheService';
import { signalRService } from '@/services/signalr/signalRService';
import { getOrderDetailApi } from '../api/getOrderDetailApi';
import { mapDeliveryNoteItemsToCart } from '../mappers/orderDetailMapper';
import { useToast } from '@/shared/components/toast/composables/useToast';
import { useConfirm } from '@/shared/components/confirm/composables/useConfirm';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/appStore';
import type { PosTableItem } from '../types/tables.types';

import { useCustomerDisplayBridge } from './useCustomerDisplayBridge';
import type { CustomerDisplayCartItem } from '../types/customerDisplay.types';

/**
 * 🎯 useTableOrderDetail — Orchestrator Composable điều phối toàn bộ nghiệp vụ màn hình đặt món
 */
export function useTableOrderDetail(table: () => PosTableItem | null) {
  const { showSuccess, showError } = useToast();
  const { confirmDelete } = useConfirm();
  const { broadcastOrdering, broadcastIdle } = useCustomerDisplayBridge();
  const authStore = useAuthStore();
  const appStore = useAppStore();

  // 1. Quản lý giỏ hàng POS & UI States (khởi tạo trước để syncToCustomerDisplay dùng an toàn)
  const cart = usePosCart();
  const isMobileCartOpen = ref<boolean>(false);
  const isRefreshingProducts = ref<boolean>(false);
  const customerSearch = ref<string>('');
  const isExportInvoice = ref<boolean>(false);
  const orderNote = ref<string>('');

  // Đồng bộ giỏ hàng sang Màn hình phụ (Customer Facing Display)
  const syncToCustomerDisplay = () => {
    const currentTable = table();
    if (!currentTable) {
      broadcastIdle();
      return;
    }

    const selectedStore: any = authStore.selectedStore;
    const storeInfo = {
      storeName: selectedStore?.name || selectedStore?.Name || 'BeePos247',
      storeAddress: selectedStore?.address || selectedStore?.Address || '',
      storePhone: selectedStore?.phone || selectedStore?.Phone || ''
    };

    const displayItems: CustomerDisplayCartItem[] = (cart.cartItems?.value || []).map(item => ({
      productId: item.productId,
      productCode: item.code || '',
      productName: item.name,
      unitName: item.unitName || '',
      quantity: item.quantity,
      price: item.price,
      totalAmount: item.totalAmount || (item.quantity * item.price),
      note: item.note || ''
    }));

    broadcastOrdering(
      currentTable.name || `Bàn #${currentTable.id}`,
      displayItems,
      cart.cartTotalQuantity?.value || 0,
      cart.cartTotal?.value || 0,
      customerSearch.value || 'Khách lẻ',
      storeInfo
    );
  };

  // 2. Quản lý sản phẩm & nhóm sản phẩm
  const {
    products,
    isLoading: productsLoading,
    loadProductsFromCache,
    fetchProducts
  } = useProducts();

  const {
    productGroups,
    loadProductGroupsFromCache,
    fetchProductGroupOptions
  } = useProductGroupOptions();

  // 3. Tìm kiếm & lọc thực đơn món ăn
  const {
    selectedGroupId,
    productSearchQuery,
    filteredProducts,
    visibleProducts,
    hasMoreProducts,
    loadMoreProducts
  } = useFilterProducts(products);

  // 4. Nạp chi tiết đơn từ bàn
  const { isCartLoading, loadCartOrderDetail } = useOrderDetail();

  // 5. Lưu đơn & In ấn & Hủy đơn
  const { isSavingOrder, handleSaveOrderTemporarily: saveOrderFn } = usePosSaveOrder();
  const { isCancelling, cancelOrder: cancelOrderFn } = usePosCancelOrder();
  const { isPrinting, printKitchenFromCart, printBillFromCart } = usePosPrinter();

  // 8. Xử lý reload thực đơn món
  const handleReloadProducts = async () => {
    if (isRefreshingProducts.value) return;
    isRefreshingProducts.value = true;

    try {
      await Promise.all([
        fetchProducts(),
        fetchProductGroupOptions()
      ]);
      showSuccess('Cập nhật danh sách thực đơn thành công!', 'Thành công');
    } catch (err: any) {
      console.error('[Reload Products Error]:', err);
      showError(err?.message || 'Không thể cập nhật thực đơn. Vui lòng thử lại!', 'Thất bại');
    } finally {
      isRefreshingProducts.value = false;
    }
  };

  // 9. Đặt món wrapper & Tự động in thẳng theo cấu hình autoPrintTypeAfterDeliveryNote_Activated
  const handleSaveOrder = async () => {
    const currentTable = table();
    const currentItems = [...cart.cartItems.value];

    await saveOrderFn(currentTable, currentItems, {
      orderNote: orderNote.value,
      isCreateEInvoice: isExportInvoice.value,
      onRollback: (previousItems) => {
        // Rollback giao diện giỏ hàng về snapshot trước đó
        cart.cartItems.value = [...previousItems];
      },
      onSuccess: () => {
        // ⚡ NẾU CỬA HÀNG BẬT autoPrintTypeAfterDeliveryNote_Activated = true THÌ IN THẲNG VÀO MÁY IN KHÔNG HIỆN POPUP
        if (currentItems.length > 0) {
          const isAutoPrintActivated = !!(
            appStore.settings?.autoPrintTypeAfterDeliveryNote_Activated ||
            (appStore.settings as any)?.AutoPrintTypeAfterDeliveryNote_Activated ||
            appStore.session?.settings?.autoPrintTypeAfterDeliveryNote_Activated ||
            (appStore.session as any)?.autoPrintTypeAfterDeliveryNote_Activated ||
            authStore.settings?.autoPrintTypeAfterDeliveryNote_Activated ||
            (authStore.settings as any)?.AutoPrintTypeAfterDeliveryNote_Activated ||
            authStore.session?.settings?.autoPrintTypeAfterDeliveryNote_Activated ||
            (authStore.session as any)?.autoPrintTypeAfterDeliveryNote_Activated
          );

          if (isAutoPrintActivated) {
            console.log('[useTableOrderDetail] ⚡ autoPrintTypeAfterDeliveryNote_Activated = true -> Tự động in thẳng vào máy in');
            printKitchenFromCart(currentTable, currentItems, {
              isCancel: false
            }).catch(err => {
              console.error('[useTableOrderDetail] ❌ Lỗi tự động in bếp:', err);
            });
          }
        }
      }
    });
  };

  // 10. In Hóa đơn / Tạm tính
  const handlePrintBill = async (isProvisional: boolean = true) => {
    const currentTable = table();
    await printBillFromCart(currentTable, cart.cartItems.value, {
      isProvisional,
      orderNote: orderNote.value,
      customerName: customerSearch.value || 'Bán cho người tiêu dùng'
    });
  };

  // 11. In Phiếu Bếp / Hủy Món
  const handlePrintKitchen = async (isCancel: boolean = false) => {
    const currentTable = table();
    await printKitchenFromCart(currentTable, cart.cartItems.value, {
      isCancel
    });
  };

  // 12. Hủy đơn / Xóa sạch giỏ hàng của bàn trong Dexie DB & đẩy vào Queue gọi API deleteOrderCache
  const handleCancelOrder = async () => {
    const currentTable = table();
    const currentItems = [...cart.cartItems.value];

    const confirmed = await confirmDelete(
      `Bạn có chắc chắn muốn hủy đơn của ${currentTable?.name || 'bàn này'} không?`,
      'Toàn bộ món trong giỏ hàng sẽ bị xóa và bàn sẽ được đưa về trạng thái trống.'
    );
    if (!confirmed) return false;

    // Xóa giỏ hàng trên UI ngay lập tức
    cart.clearCart();

    await cancelOrderFn(currentTable, currentItems, {
      onRollback: (previousItems) => {
        cart.cartItems.value = [...previousItems];
      },
      onSuccess: () => {
        console.log('[useTableOrderDetail] ⚡ Đã xử lý hủy đơn bàn:', currentTable?.id);
      }
    });

    return true;
  };

  // 13. Theo dõi thay đổi bàn để nạp chi tiết giỏ hàng từ Dexie / API & phát sang màn hình phụ
  watch(
    () => table()?.id,
    () => {
      const currentTable = table();
      loadCartOrderDetail(currentTable, (items) => {
        cart.setCartItems(items);
        syncToCustomerDisplay();
      });
    },
    { immediate: true }
  );

  // Theo dõi cập nhật từng món trong giỏ hoặc tên khách để cập nhật màn hình phụ ngay tức thì
  watch(
    [() => cart.cartItems.value, () => customerSearch.value],
    () => {
      syncToCustomerDisplay();
    },
    { deep: true }
  );

  onUnmounted(() => {
    broadcastIdle();
  });

  // 14. Khởi tạo dữ liệu và lắng nghe SignalR cập nhật giỏ hàng theo thời gian thực (Real-time Cart Sync)
  onMounted(() => {
    // ⚡ Lắng nghe tín hiệu SignalR khi người khác đặt món / sửa món bàn này
    const unsubSignalR = signalRService.onReceivedSystemMessagePos(async (data: any) => {
      const payloadData = data?.Data || data?.data || data;
      const targetId = Number(payloadData?.TargetId || payloadData?.targetId || payloadData?.TableId || payloadData?.tableId || 0);
      const noteId = Number(payloadData?.NoteId || payloadData?.noteId || 0);
      const currentTable = table();

      if (currentTable && currentTable.id === targetId) {
        console.log(`⚡ [useTableOrderDetail] Bàn ${currentTable.name || targetId} vừa có người khác đặt món -> Cập nhật giỏ hàng ngay lập tức`);

        // 1. Thử đọc từ Dexie Cart trước
        const cachedCart = await posCartCacheService.getTableCart(targetId);
        if (cachedCart && cachedCart.length > 0) {
          cart.setCartItems(cachedCart);
        }

        // 2. Tải chi tiết mới nhất từ server và gán vào giỏ hàng
        const selectedStore: any = authStore.selectedStore;
        const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || payloadData?.StoreId || 0;

        if (storeId && noteId) {
          try {
            const res: any = await getOrderDetailApi(storeId, noteId, targetId);
            const dataObj = res?.data?.Data || res?.Data || res?.data || {};
            const noteItems = dataObj?.noteItems || dataObj?.NoteItems || [];
            const items = mapDeliveryNoteItemsToCart(noteItems);

            if (items.length > 0) {
              cart.setCartItems(items);
              await posCartCacheService.saveTableCart(targetId, noteId, items);
            }
          } catch (err) {
            console.warn('[useTableOrderDetail] Lỗi tải chi tiết đơn hàng SignalR:', err);
          }
        }
      }
    });

    onUnmounted(() => {
      unsubSignalR();
    });

    // Nạp cache sản phẩm
    posProductCacheService.hasProducts().then(hasProducts => {
      if (hasProducts) {
        loadProductsFromCache();
      } else {
        fetchProducts();
      }
    });

    // Nạp cache nhóm sản phẩm
    posProductCacheService.hasProductGroups().then(hasGroups => {
      if (hasGroups) {
        loadProductGroupsFromCache();
      } else {
        fetchProductGroupOptions();
      }
    });
  });

  // 15. Hàm làm mới giỏ hàng trực tiếp từ Dexie DB (dùng sau khi tách bàn)
  const refreshCartFromLocal = async () => {
    const currentTable = table();
    if (!currentTable?.id) return;
    const items = await posCartCacheService.getTableCart(currentTable.id);
    cart.setCartItems(items || []);
  };

  return {
    // Menu & Filter
    products,
    productsLoading,
    productGroups,
    selectedGroupId,
    productSearchQuery,
    filteredProducts,
    visibleProducts,
    hasMoreProducts,
    loadMoreProducts,
    isRefreshingProducts,
    handleReloadProducts,

    // Cart Operations & Computeds
    ...cart,

    // Order Actions & States
    isCartLoading,
    loadCartOrderDetail,
    refreshCartFromLocal,
    isSavingOrder,
    isCancelling,
    handleSaveOrder,
    handleCancelOrder,

    // Printing Actions & States
    isPrinting,
    handlePrintBill,
    handlePrintKitchen,

    // UI States
    isMobileCartOpen,
    customerSearch,
    isExportInvoice,
    orderNote
  };
}
