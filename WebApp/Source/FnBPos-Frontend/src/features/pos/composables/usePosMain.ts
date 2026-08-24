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
import { posCartCacheService, type TableCartCacheRecord } from '@/services/posDexieDB/posCartCacheService';
import { clearAllPosDatabase } from '@/services/posDexieDB/posDatabase';
import { signalRService } from '@/services/signalr/signalRService';
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
  const { session } = usePosInit();
  const { showSuccess, showError } = useToast();
  const searchQuery = ref<string>('');
  const isInitialSyncLoading = ref<boolean>(true);


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
   * - Sử dụng 1 request duy nhất ordersFromCache
   * - Trích xuất 100% noteItems lưu thẳng vào Dexie Cart của tất cả các bàn (0ms, KHÔNG gọi getOrderDetailApi)
   */
  const syncDataFromServer = async (silent = false) => {
    // 1. Gọi ordersFromCache (1 request duy nhất)
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

    // 4. 🚀 LẤY 100% noteItems TỪ ordersFromCache VÀ BULK PUT VÀO DEXIE CART (0ms)
    const bulkCartRecords: TableCartCacheRecord[] = [];
    const activeTargetIds = new Set<number>();

    (rawOrders || []).forEach(order => {
      const targetId = order.targetId || 0;
      const noteId = order.noteId || (order as any).id || 0;
      const rawNoteItems = order.noteItems || [];

      if (targetId > 0) {
        activeTargetIds.add(targetId);
        if (Array.isArray(rawNoteItems) && rawNoteItems.length > 0) {
          const cartItems = mapDeliveryNoteItemsToCart(rawNoteItems);
          if (cartItems.length > 0) {
            bulkCartRecords.push({
              targetId,
              noteId,
              items: cartItems,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
    });

    // Tự động dọn dẹp các giỏ hàng không còn đơn trong Dexie DB
    const existingCarts = await posCartCacheService.getAllTableCarts();
    const cartsToDelete = existingCarts.filter(c => !activeTargetIds.has(c.targetId));
    if (cartsToDelete.length > 0) {
      await Promise.all(cartsToDelete.map(c => posCartCacheService.deleteTableCart(c.targetId)));
    }

    // 5. Ghi đồng loạt giỏ hàng và danh sách bàn vào Dexie DB trong 1 lệnh duy nhất
    await Promise.all([
      bulkCartRecords.length > 0 ? posCartCacheService.saveBulkTableCarts(bulkCartRecords) : Promise.resolve(),
      posOrderCacheService.saveOrders(rawOrders || []),
      posTableCacheService.saveTables(finalTables)
    ]);

    // 6. 🎯 Render UI sơ đồ bàn ngay lập tức (0ms)
    tables.value = finalTables;
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
    router.push('/stores');
  };

  const handleRefreshStore = async () => {
    if (!session.value?.id) return;
    try {
      await appStore.loadStoreSession(session.value.id);
      showSuccess('Làm mới thông tin cửa hàng thành công!', 'Thành công');
    } catch (err: any) {
      showError(err?.message || 'Không thể làm mới thông tin cửa hàng', 'Thất bại');
    }
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
        } catch (err) {
          console.error('[usePosMain] Lỗi tự động đồng bộ sau SignalR broadcast:', err);
        }
      }, 300);
    };

    const unsubPos = signalRService.onReceivedSystemMessagePos(handlePosSignal);

    // ⚡ Handler riêng cho TRANSFER TABLE từ SignalR
    const handleTransferSignal = async (data: any) => {
      console.log('⚡ [usePosMain] Nhận tín hiệu SignalR TRANSFER TABLE:', data);

      const payloadData = data?.Data || data?.data || data || {};
      const sourceTableId = Number(payloadData?.SourceTableId || payloadData?.sourceTableId || payloadData?.FromTableId || payloadData?.fromTableId || payloadData?.SourceId || payloadData?.sourceId || 0);
      const targetId = Number(payloadData?.TargetId || payloadData?.targetId || payloadData?.TargetTableId || payloadData?.targetTableId || payloadData?.TableId || payloadData?.tableId || payloadData?.ToTableId || payloadData?.toTableId || 0);
      const isTransferAll = Boolean(payloadData?.IsTransferAll ?? payloadData?.isTransferAll ?? false);

      try {
        if (sourceTableId > 0 && isTransferAll) {
          await posCartCacheService.deleteTableCart(sourceTableId);
        }

        // Đồng bộ toàn bộ dữ liệu bàn và giỏ hàng từ ordersFromCache
        await syncDataFromServer(true);
        tables.value = await posTableCacheService.getTables();
        console.log(`⚡ [usePosMain] Đã đồng bộ xong chuyển bàn (Source: ${sourceTableId}, Target: ${targetId})`);
      } catch (err) {
        console.error('[usePosMain] Lỗi xử lý SignalR Transfer:', err);
      }
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

    // 2. Nạp dữ liệu ban đầu: Đồng bộ dữ liệu ngầm và nạp vào Dexie DB
    isInitialSyncLoading.value = true;
    try {
      fetchTableArea();
      await syncDataFromServer(true);
    } catch (err) {
      console.warn('[usePosMain] Lỗi đồng bộ khởi tạo:', err);
      // Fallback nạp từ Dexie nếu mất mạng
      tables.value = await posTableCacheService.getTables();
    } finally {
      isInitialSyncLoading.value = false;
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
    isInitialSyncLoading,
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
