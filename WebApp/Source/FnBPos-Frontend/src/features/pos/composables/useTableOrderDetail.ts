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
import { getOrderFromCacheApi } from '../api/getOrderApi';
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

    const displayItems: CustomerDisplayCartItem[] = (cart.cartItems?.value || []).map((item: any) => {
      const prod = item?.product || item || {};
      const price = Number(prod.retailOutPrice || prod.retailPrice || 0);
      const qty = Number(item?.quantity || 1);
      return {
        productId: Number(prod.productId || prod.id || 0),
        productCode: String(prod.productCode || prod.code || ''),
        productName: String(prod.productName || prod.name || prod.prodName || 'Món ăn'),
        unitName: String(prod.retailUnitName || prod.unitName || prod.unit || ''),
        quantity: qty,
        price: price,
        totalAmount: price * qty,
        note: String(item?.note || prod.note || '')
      };
    });

    const totalAmount = displayItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalQty = displayItems.reduce((sum, item) => sum + item.quantity, 0);

    broadcastOrdering(
      currentTable.name || `Bàn #${currentTable.id}`,
      displayItems,
      cart.cartTotalQuantity?.value || totalQty,
      cart.cartTotalAmount?.value || totalAmount,
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
    // ⚡ Hàm nạp lại giỏ hàng từ Server và ghi vào Dexie DB & cập nhật UI trực tiếp
    const syncCurrentTableCartFromServer = async (sourceId?: number, targetId?: number) => {
      const currentTable = table();
      if (!currentTable?.id) return;

      const currentId = currentTable.id;
      const selectedStore: any = authStore.selectedStore;
      const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;

      if (!storeId) return;

      // ── Luôn gọi DUY NHẤT 1 API getOrderFromCacheApi từ Server
      try {
        const orderRes: any = await getOrderFromCacheApi(storeId);
        const rawOrders = orderRes?.data?.result || orderRes?.data?.Result || orderRes?.data || orderRes?.result || [];
        const matchedOrder = rawOrders.find((o: any) => Number(o.targetId || o.TargetId || o.tableId || o.TableId) === currentId);

        if (!matchedOrder) {
          // Bàn không còn đơn trên server -> làm trống giỏ hàng
          cart.setCartItems([]);
          await posCartCacheService.deleteTableCart(currentId);
          syncToCustomerDisplay();
          if (sourceId && currentId === sourceId) {
            showSuccess(`Bàn ${currentTable.name || currentId} đã được chuyển toàn bộ sang bàn khác.`);
          }
          return;
        }

        const noteId = matchedOrder.noteId || matchedOrder.id || 0;
        const noteItems = matchedOrder.noteItems || [];
        const items = mapDeliveryNoteItemsToCart(noteItems);

        if (items.length > 0) {
          cart.setCartItems(items);
          await posCartCacheService.saveTableCart(currentId, noteId, items);
          syncToCustomerDisplay();

          if (targetId && currentId === targetId) {
            showSuccess(`Bàn ${currentTable.name || currentId} vừa nhận thêm món mới chuyển sang!`);
          } else if (sourceId && currentId === sourceId) {
            showSuccess(`Bàn ${currentTable.name || currentId} vừa tách bớt món sang bàn khác.`);
          }
          console.log(`⚡ [useTableOrderDetail] Đã nạp thành công ${items.length} món từ server cho Bàn #${currentId}`);
        } else {
          cart.setCartItems([]);
          await posCartCacheService.deleteTableCart(currentId);
          syncToCustomerDisplay();
        }
      } catch (err) {
        console.warn('[useTableOrderDetail] Lỗi nạp lại giỏ hàng từ server:', err);
      }
    };

    // ⚡ Lắng nghe TẤT CẢ các loại bản tin SignalR (POS / Transfer / System / Broadcast)
    const handleAnySignalR = async (data: any) => {
      const payloadData = data?.Data || data?.data || data || {};
      const sourceId = Number(payloadData?.SourceTableId || payloadData?.sourceTableId || payloadData?.FromTableId || payloadData?.fromTableId || payloadData?.SourceId || payloadData?.sourceId || 0);
      const targetId = Number(payloadData?.TargetId || payloadData?.targetId || payloadData?.TargetTableId || payloadData?.targetTableId || payloadData?.TableId || payloadData?.tableId || payloadData?.ToTableId || payloadData?.toTableId || payloadData?.Id || payloadData?.id || 0);

      console.log(`⚡ [useTableOrderDetail] 🔔 Nhận SignalR -> Gọi API lấy dữ liệu từ server (Source: ${sourceId}, Target: ${targetId})`);
      await syncCurrentTableCartFromServer(sourceId, targetId);
    };

    const unsubSignalR = signalRService.onReceivedSystemMessagePos(handleAnySignalR);
    const unsubTransfer = signalRService.onReceivedTableTransferPos(handleAnySignalR);
    const unsubSystem = signalRService.onReceivedSystemMessage(handleAnySignalR);

    onUnmounted(() => {
      unsubSignalR();
      unsubTransfer();
      unsubSystem();
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
