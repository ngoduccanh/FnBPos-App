import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/appStore';
import { usePosInit } from '../composables/usePosInit';
import { useTableOptions } from '../hooks/useTables';
import { useOrderFromCache } from '../hooks/useOrderFromCache';
import { useTableArea } from '../hooks/useTableArea';
import { useFilterTables } from '../composables/useFilterTables';
import { useMapOrderToTable } from '../composables/useMapOrderToTable';
import { posTableCacheService } from '@/services/posDexieDB/posTableCacheService';
import { posOrderCacheService } from '@/services/posDexieDB/posOrderCacheService';
import { posProductCacheService } from '@/services/posDexieDB/posProductCacheService';
import { posCartCacheService } from '@/services/posDexieDB/posCartCacheService';
import { clearAllPosDatabase } from '@/services/posDexieDB/posDatabase';
import { signalRService } from '@/services/signalr/signalRService';
import { getOrderDetailApi } from '../api/getOrderDetailApi';
import { mapDeliveryNoteItemsToCart } from '../mappers/orderDetailMapper';
import type { DeliveryNoteWithRoundsModel } from '@/shared/types/deliveryNote.types';
import { useProducts } from '../hooks/useProducts';
import { useProductGroupOptions } from '../hooks/useProductGroupOptions';
import { useToast } from '@/shared/components/toast/composables/useToast';
import { playNotificationSound } from '@/utils/notificationSound';
import { formatTime } from '@/shared/utils/dateFormatter';
import type { PosTableItem } from '../types/tables.types';


export function usePosMain() {
  const router = useRouter();
  const authStore = useAuthStore();
  const appStore = useAppStore();
  const { showSuccess, showError, showInfo } = useToast();
  const { session } = usePosInit();
  const searchQuery = ref<string>('');


  const { 
    tables, 
    isLoading: tablesLoading, 
    error: tablesError, 
    fetchTableOptions 
  } = useTableOptions();

  const { 
    fetchOrdersFromCache 
  } = useOrderFromCache();


  const { 
    mapOrderToTable 
  } = useMapOrderToTable();


  const {
    selectedGroupId,
    selectedStatus,
    selectedTable,
    filteredTables,
    filterByGroup,
    filterByStatus,
    selectTable
  } = useFilterTables(tables);

  const {
    tablesArea,
    fetchTableArea
  } = useTableArea();

  const isMobilePanelOpen = ref<boolean>(false);

  const handleFilterGroup = (groupId: number) => {
    filterByGroup(groupId);
    if (groupId === -1) {
      isMobilePanelOpen.value = true;
    } else {
      isMobilePanelOpen.value = false;
    }
  };

  const handleSelectTable = (table: PosTableItem) => {
    selectTable(table);

    if (table.id !== 0) {
      isMobilePanelOpen.value = false;
    }
  };


  const handleSearchTable = async (queryText?: string) => {
    const keyword = queryText !== undefined ? queryText : searchQuery.value;
    
    if (!keyword || !keyword.trim()) {
      tables.value = await posTableCacheService.getTables();
      return;
    }


    const matchedTables = await posTableCacheService.searchTables(keyword);

    const matchedOrders = await posOrderCacheService.searchOrders(keyword);
    const matchedTargetIds = matchedOrders.map(o => o.targetId).filter(Boolean);

    const allTables = await posTableCacheService.getTables();
    const extraTablesFromOrders = allTables.filter(t => matchedTargetIds.includes(t.id));
    const tableMap = new Map<number, PosTableItem>();
    matchedTables.forEach(t => tableMap.set(t.id, t));
    extraTablesFromOrders.forEach(t => tableMap.set(t.id, t));

    tables.value = Array.from(tableMap.values());
  };

  const isRefreshing = ref<boolean>(false);

  
  /**
   * ⚡ ĐỒNG BỘ DỮ LIỆU TỪ SERVER:
   * - Chỉ gọi ordersFromCache để lấy trạng thái đơn mới nhất
   * - KHÔNG gọi lại /Objects (khu vực) vì đã lưu trong Dexie
   */
  const syncDataFromServer = async (silent = false) => {
    // 1. Chỉ gọi ordersFromCache (1 request duy nhất)
    const rawOrders = await fetchOrdersFromCache({}, silent);

    // 2. Lấy danh sách bàn hiện tại từ RAM hoặc Dexie
    let currentTables = tables.value;
    if (!currentTables || currentTables.length === 0) {
      currentTables = await posTableCacheService.getTables();
      if (!currentTables || currentTables.length === 0) {
        currentTables = await fetchTableOptions({}, silent);
      }
    }

    // 3. Map trạng thái đơn hàng vào sơ đồ bàn
    const finalTables = mapOrderToTable(currentTables, rawOrders || []);

    // 4. Lưu lại vào Dexie DB & cập nhật UI
    await Promise.all([
      posOrderCacheService.saveOrders(rawOrders || []),
      posTableCacheService.saveTables(finalTables)
    ]);

    tables.value = finalTables;
  };

  /**
   * 🚀 PRELOAD CHI TIẾT GIỎ HÀNG CỦA TẤT CẢ BÀN ĐANG CÓ ĐƠN
   *
   * Chạy ngầm sau khi init xong, KHÔNG block UI (không await ở ngoài).
   * Mỗi bàn có noteId → gọi getOrderDetail → lưu vào Dexie Cart.
   * Khi user bấm vào bàn → useOrderDetail đọc từ Dexie 0ms, không gọi API nữa.
   *
   * - Bỏ qua bàn đã có cache trong Dexie (kiểm tra 0ms trước khi gọi API)
   * - Chạy song song tối đa CONCURRENCY=3 request cùng lúc (tránh overload server)
   * - Lỗi từng bàn riêng lẻ không ảnh hưởng các bàn khác (Promise.allSettled)
   */
  const preloadAllTableOrderDetails = async () => {
    const selectedStore: any = authStore.selectedStore;
    const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;
    if (!storeId) return;

    const allTables = await posTableCacheService.getTables();

    // Chỉ preload những bàn đang có đơn (noteId > 0)
    const activeTables = allTables.filter(t => {
      const noteId = t.noteId
        || (t as any).activeOrder?.noteId
        || (t as any).orderInfo?.noteId
        || 0;
      return t.id > 0 && noteId > 0;
    });

    if (activeTables.length === 0) return;

    console.log(`🚀 [Preload] Bắt đầu preload ${activeTables.length} bàn đang có đơn vào Dexie Cart...`);

    // Chạy song song theo batch 3 request để không overload server
    const CONCURRENCY = 3;
    for (let i = 0; i < activeTables.length; i += CONCURRENCY) {
      const batch = activeTables.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map(async (t) => {
        const targetId = t.id;
        const noteId = t.noteId
          || (t as any).activeOrder?.noteId
          || (t as any).orderInfo?.noteId
          || 0;

        if (!noteId) return;

        // Bỏ qua nếu Dexie đã có cache rồi (0ms)
        const existingCache = await posCartCacheService.getTableCart(targetId);
        if (existingCache && existingCache.length > 0) {
          console.log(`⚡ [Preload] Bàn ID ${targetId} đã có cache (${existingCache.length} món) - bỏ qua`);
          return;
        }

        try {
          const res: any = await getOrderDetailApi(storeId, noteId, targetId);
          const dataObj = res?.data?.Data || res?.Data || res?.data || {};
          const noteItems = dataObj?.noteItems || dataObj?.NoteItems || [];
          const cartItems = mapDeliveryNoteItemsToCart(noteItems);

          if (cartItems.length > 0) {
            await posCartCacheService.saveTableCart(targetId, noteId, cartItems);
            console.log(`✅ [Preload] Bàn ID ${targetId}: cache ${cartItems.length} món`);
          }
        } catch (err) {
          // Lỗi 1 bàn không ảnh hưởng bàn khác
          console.warn(`[Preload] Bỏ qua Bàn ID ${targetId}:`, err);
        }
      }));
    }

    console.log('✅ [Preload] Hoàn tất - tất cả bàn đã được preload vào Dexie Cart.');
  };


  const handleRefreshTables = async () => {
    if (isRefreshing.value) return;
    isRefreshing.value = true;

    try {
      await syncDataFromServer(false);
      showSuccess('Cập nhật danh sách bàn thành công!', 'Thành công');
    } catch (err: any) {
      console.error('[Refresh Tables Error]:', err);
      showError(err?.message || 'Không thể cập nhật danh sách bàn. Vui lòng thử lại!', 'Thất bại');
    } finally {
      isRefreshing.value = false;
    }
  };

  const handleLogout = async () => {
    await clearAllPosDatabase();
    authStore.logout();
    router.push('/login');
  };

  const handleSwitchStore = async () => {
    await clearAllPosDatabase();
    appStore.clearAppStore();
    authStore.selectedStore = null;
    router.push('/select-store');
  };

  let unsubSignalR: (() => void) | null = null;

  onMounted(async () => {
    // 1. Khởi động kết nối SignalR và lắng nghe Real-time broadcast từ server
    signalRService.start();

    let debounceTimer: any = null;

    const handlePosSignal = async (data: any) => {
      console.log('⚡ [usePosMain] Nhận tín hiệu SignalR POS -> Cập nhật UI & Dexie ngay lập tức (0ms):', data);

      const payloadData = data?.Data || data?.data || data;
      const noteId = Number(payloadData?.NoteId || payloadData?.noteId || 0);
      const targetId = Number(payloadData?.TargetId || payloadData?.targetId || payloadData?.TableId || payloadData?.tableId || 0);
      const tableName = payloadData?.TableName || payloadData?.tableName || '';
      const selectedStore: any = authStore.selectedStore;
      const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || payloadData?.StoreId || 0;

      const msgText = String(data?.Message || data?.message || payloadData?.Message || payloadData?.message || (typeof payloadData === 'string' ? payloadData : '')).toLowerCase();
      const isDeleteAction = payloadData?.OrderAction === 'DELETE' || payloadData?.Action === 'DeleteOrder' || msgText.includes('xóa đơn') || msgText.includes('xoá đơn') || msgText.includes('hủy đơn') || msgText.includes('huỷ đơn');

      // ⚡ BƯỚC 1: CẬP NHẬT GIAO DIỆN & DEXIE DB NGAY TỨC THÌ (0ms)
      if (isDeleteAction && targetId) {
        posCartCacheService.deleteTableCart(targetId);
        posOrderCacheService.deleteOrderByTargetId(targetId);
        await posTableCacheService.clearTableOrderOptimistic(targetId);
        tables.value = await posTableCacheService.getTables();

        if (selectedTable.value?.id === targetId) {
          console.log(`⚡ [SignalR] Bàn ${tableName || targetId} đã bị xóa từ tài khoản khác -> Thoát ra sơ đồ bàn`);
          selectTable(null);
        }
      } else if (targetId) {
        const prodCount = Number(payloadData?.ProdCount || payloadData?.prodCount || payloadData?.TotalCount || payloadData?.totalCount || 0);
        const totalAmount = Number(payloadData?.TotalAmount || payloadData?.totalAmount || 0);
        const timeStarted = payloadData?.NoteDate ? formatTime(payloadData.NoteDate) : new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
        const customerName = payloadData?.CustomerName || payloadData?.customerName || 'Bán cho người tiêu dùng';

        if (prodCount > 0 || totalAmount > 0 || noteId > 0) {
          await posTableCacheService.updateTableOrderOptimistic(targetId, {
            prodCount,
            totalAmount,
            timeStarted,
            customerName,
            noteId
          });
          tables.value = await posTableCacheService.getTables();
        }
      }

      // ⚡ BƯỚC 2: ĐỒNG BỘ NỀN VỚI SERVER ĐỂ BẢO ĐẢM TOÀN VẸN DỮ LIỆU
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          await syncDataFromServer(true);
          tables.value = await posTableCacheService.getTables();

          // Cập nhật luôn giỏ hàng của bàn vừa nhận signal
          if (!isDeleteAction && storeId && noteId && targetId) {
            try {
              const res: any = await getOrderDetailApi(storeId, noteId, targetId);
              const dataObj = res?.data?.Data || res?.Data || res?.data || {};
              const noteItems = dataObj?.noteItems || dataObj?.NoteItems || [];
              const cartItems = mapDeliveryNoteItemsToCart(noteItems);

              if (cartItems.length > 0) {
                await posCartCacheService.saveTableCart(targetId, noteId, cartItems);
                console.log(`⚡ [SignalR] Đã nạp và lưu chi tiết món cho ${tableName || `Bàn ID ${targetId}`}:`, cartItems.length, 'món');
              }
            } catch (detailErr) {
              console.warn('[SignalR] Không thể nạp chi tiết đơn hàng:', detailErr);
            }
          }
        } catch (err) {
          console.error('[usePosMain] Lỗi tự động đồng bộ sau SignalR broadcast:', err);
        }
      }, 300);
    };

    const unsubPos = signalRService.onReceivedSystemMessagePos(handlePosSignal);

    // ⚡ Handler riêng cho TRANSFER TABLE — xử lý cả bàn nguồn lẫn bàn đích
    const handleTransferSignal = async (data: any) => {
      console.log('⚡ [usePosMain] Nhận tín hiệu SignalR TRANSFER TABLE:', data);

      const payloadData = data?.Data || data?.data || data;
      const sourceTableId = Number(payloadData?.SourceTableId || payloadData?.sourceTableId || 0);
      const targetId = Number(payloadData?.TargetId || payloadData?.targetId || payloadData?.TableId || payloadData?.tableId || 0);
      const noteId = Number(payloadData?.NoteId || payloadData?.noteId || 0);
      const selectedStore: any = authStore.selectedStore;
      const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || payloadData?.StoreId || 0;
      const isTransferAll = payloadData?.IsTransferAll ?? payloadData?.isTransferAll ?? true;

      // ── 1. Xử lý BÀN NGUỒN: Xóa cart & reset trạng thái trong Dexie ─────────
      if (sourceTableId > 0) {
        if (isTransferAll) {
          // Chuyển toàn bộ → xóa hết cart bàn nguồn
          await posCartCacheService.deleteTableCart(sourceTableId);
          await posTableCacheService.clearTableOrderOptimistic(sourceTableId);
        } else {
          // Tách bàn → xóa cache cart bàn nguồn (sẽ được load lại khi user click vào)
          await posCartCacheService.deleteTableCart(sourceTableId);
        }
        console.log(`⚡ [Transfer Signal] Đã reset Dexie Cart & trạng thái Bàn nguồn ID ${sourceTableId}`);
      }

      // ── 2. Xử lý BÀN ĐÍCH: Xóa cache cart cũ → sẽ được reload khi click vào ─
      if (targetId > 0) {
        await posCartCacheService.deleteTableCart(targetId);
      }

      // ── 3. Reload tables.value từ Dexie ngay (0ms) ──────────────────────────
      tables.value = await posTableCacheService.getTables();

      // ── 4. Đồng bộ nền: syncDataFromServer + reload cart bàn đích từ server ──
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          await syncDataFromServer(true);
          tables.value = await posTableCacheService.getTables();

          // Reload cart bàn đích từ server
          if (storeId && noteId && targetId) {
            try {
              const res: any = await getOrderDetailApi(storeId, noteId, targetId);
              const dataObj = res?.data?.Data || res?.Data || res?.data || {};
              const noteItems = dataObj?.noteItems || dataObj?.NoteItems || [];
              const cartItems = mapDeliveryNoteItemsToCart(noteItems);
              if (cartItems.length > 0) {
                await posCartCacheService.saveTableCart(targetId, noteId, cartItems);
                console.log(`⚡ [Transfer Signal] Đã cache ${cartItems.length} món cho Bàn đích ID ${targetId}`);
              }
            } catch (detailErr) {
              console.warn('[Transfer Signal] Không thể nạp chi tiết bàn đích:', detailErr);
            }
          }
        } catch (err) {
          console.error('[usePosMain] Lỗi đồng bộ sau SignalR transfer:', err);
        }
      }, 300);
    };

    const unsubTransfer = signalRService.onReceivedTableTransferPos(handleTransferSignal);
    const unsubSys = signalRService.onReceivedSystemMessage(() => {
      syncDataFromServer(true).catch(console.error);
    });

    const unsubReconnect = signalRService.onReconnected(async () => {
      console.log('⚡ [usePosMain] SignalR đã kết nối lại -> Tự động đồng bộ lại toàn bộ dữ liệu bàn từ server');
      try {
        await syncDataFromServer(true);
        tables.value = await posTableCacheService.getTables();
      } catch (err) {
        console.warn('[usePosMain] Lỗi đồng bộ lại sau khi SignalR reconnect:', err);
      }
    });

    unsubSignalR = () => {
      unsubPos();
      unsubTransfer();
      unsubSys();
      unsubReconnect();
    };

    // 2. Nạp dữ liệu ban đầu
    fetchTableArea();
    const hasLocalTables = await posTableCacheService.hasTables();

    if (hasLocalTables) {
      tables.value = await posTableCacheService.getTables();
    } else {
      await syncDataFromServer();
    }

    const [hasProducts, hasGroups] = await Promise.all([
      posProductCacheService.hasProducts(),
      posProductCacheService.hasProductGroups()
    ]);

    if (!hasProducts) {
      const { fetchProducts } = useProducts();
      fetchProducts();
    }

    if (!hasGroups) {
      const { fetchProductGroupOptions } = useProductGroupOptions();
      fetchProductGroupOptions();
    }

    // 3. 🚀 Preload ngầm chi tiết giỏ hàng tất cả bàn đang có đơn vào Dexie Cart
    // Chạy KHÔNG await → không block UI, hoạt động hoàn toàn ở nền
    preloadAllTableOrderDetails().catch(err => {
      console.warn('[usePosMain] Preload ngầm bị lỗi (không ảnh hưởng UI):', err);
    });
  });

  onUnmounted(() => {
    if (unsubSignalR) {
      unsubSignalR();
      unsubSignalR = null;
    }
  });

  return {
    authStore,
    session,
    searchQuery,
    tables,
    tablesLoading,
    tablesError,
    selectedGroupId,
    selectedStatus,
    selectedTable,
    filteredTables,
    tablesArea,
    isMobilePanelOpen,
    isRefreshing,
    fetchTableOptions,
    filterByGroup: handleFilterGroup,
    filterByStatus,
    handleSelectTable,
    selectTable,
    handleSearchTable,
    handleRefreshTables,
    syncDataFromServer,
    handleLogout,
    handleSwitchStore
  };
}
