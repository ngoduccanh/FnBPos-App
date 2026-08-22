import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/appStore';
import { useToast } from '@/shared/components/toast/composables/useToast';
import { useConfirm } from '@/shared/components/confirm/composables/useConfirm';
import { signalRService } from '@/services/signalr/signalRService';
import { enqueueJob } from '@/services/posQueue/posQueueService';
import { POS_JOB_TYPES, type HandleNoteItemsJobPayload, type HandleNoteItemsRollbackPayload, type SyncOrdersJobPayload } from '@/services/posQueue/posQueue.types';
import { deleteOrderCacheApi } from '../api/deleteOrderCacheApi';
import { posOrderCacheService } from '@/services/posDexieDB/posOrderCacheService';
import { posCartCacheService } from '@/services/posDexieDB/posCartCacheService';
import { posTableCacheService } from '@/services/posDexieDB/posTableCacheService';
import type { DeliveryNoteWithRoundsModel } from '@/shared/types/deliveryNote.types';
import type { ProductDeliveryItem } from '@/shared/types/productDeliveryItem.types';

export type OrderManagementTabKey = 'pending' | 'approved' | 'rejected' | 'current';

export const TAB_STATUS_MAP: Record<OrderManagementTabKey, number> = {
  pending: 0,   // Mới (Chờ duyệt)
  approved: 1,  // Đã duyệt
  rejected: 2,  // Đã từ chối
  current: -1   // Đơn hiện tại (Toàn bộ)
};

/**
 * 🎯 usePosOrderManagement — Quản lý toàn bộ nghiệp vụ Modal Quản lý Đơn Hàng Online (Offline-first, Pure Frontend Filtering + POS Queue)
 */
export function usePosOrderManagement(isOpen: () => boolean) {
  const authStore = useAuthStore();
  const appStore = useAppStore();
  const { showSuccess, showError } = useToast();
  const { confirmApprove, confirmReject, confirmDelete } = useConfirm();

  const activeTab = ref<OrderManagementTabKey>('pending');
  const rawOrders = ref<DeliveryNoteWithRoundsModel[]>([]); // ⚡ Lưu toàn bộ đơn trong RAM
  const orders = ref<DeliveryNoteWithRoundsModel[]>([]);    // Danh sách đơn đã lọc theo tab
  const isLoading = ref<boolean>(false);
  const isActionProcessing = ref<boolean>(false);

  // Badge số lượng từng tab (Tính tức thời trong RAM 0.01ms)
  const pendingCount = ref<number>(0);
  const approvedCount = ref<number>(0);
  const rejectedCount = ref<number>(0);

  // Tập hợp các ID món đang được tick checkbox
  const selectedItemIds = ref<Set<number>>(new Set());

  // Bảng tra cứu tên bàn từ targetId (Cached in RAM)
  const tablesMap = ref<Map<number, string>>(new Map());

  const loadTablesMap = async () => {
    try {
      const allTables = await posTableCacheService.getTables();
      const map = new Map<number, string>();
      allTables.forEach(t => {
        if (t.id) map.set(t.id, t.name);
      });
      tablesMap.value = map;
    } catch (e) {
      console.warn('[usePosOrderManagement] Không thể nạp danh sách bàn:', e);
    }
  };

  /**
   * 🏷️ Hàm chuyển đổi targetId thành Tên bàn chuẩn (ví dụ: BAN 3, Bàn 10)
   */
  const getTableName = (targetId: number, fallbackName?: string): string => {
    if (targetId && tablesMap.value.has(targetId)) {
      return tablesMap.value.get(targetId)!;
    }
    if (fallbackName && !fallbackName.startsWith('Bàn #') && !fallbackName.startsWith('#')) {
      return fallbackName;
    }
    return targetId ? `Bàn #${targetId}` : (fallbackName || 'Mang về');
  };

  const getStoreId = (): number => {
    const selectedStore: any = authStore.selectedStore;
    return appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;
  };

  /**
   * 📊 TÍNH BADGE COUNTS TRỰC TIẾP TRÊN RAM (0.01ms siêu tốc)
   */
  const computeBadgeCountsFromMemory = () => {
    let p = 0;
    let a = 0;
    let r = 0;

    for (const ord of rawOrders.value) {
      if (ord.noteItems) {
        for (const item of ord.noteItems) {
          const s = item.productStatusId ?? 0;
          if (s === 0) p += item.quantity || 1;
          else if (s === 1) a += item.quantity || 1;
          else if (s === 2 || s === 3 || s === 4) r += item.quantity || 1;
        }
      }
    }

    pendingCount.value = p;
    approvedCount.value = a;
    rejectedCount.value = r;
  };

  /**
   * ⚡ LỌC ĐƠN HÀNG TRỰC TIẾP TRÊN RAM TRONG 0.01ms (KHÔNG QUERY INDEXEDDB KHI ĐỔI TAB)
   */
  const filterOrdersFromMemory = (tabKey: OrderManagementTabKey = activeTab.value) => {
    const statusId = TAB_STATUS_MAP[tabKey];
    if (statusId === -1) {
      orders.value = rawOrders.value;
      return;
    }

    const result: DeliveryNoteWithRoundsModel[] = [];

    for (const ord of rawOrders.value) {
      if (!ord.orderRounds || ord.orderRounds.length === 0) {
        const hasMatchedItems = ord.noteItems?.some(item => {
          const s = item.productStatusId ?? 0;
          if (statusId === 2) return s === 2 || s === 3 || s === 4;
          return s === statusId;
        });
        if (hasMatchedItems) {
          result.push(ord);
        }
        continue;
      }

      const matchedRounds = [];
      for (const round of ord.orderRounds) {
        const matchedItems = (round.items || []).filter(item => {
          const s = item.productStatusId ?? 0;
          if (statusId === 2) return s === 2 || s === 3 || s === 4;
          return s === statusId;
        });

        if (matchedItems.length > 0) {
          matchedRounds.push({
            ...round,
            items: matchedItems
          });
        }
      }

      if (matchedRounds.length > 0) {
        result.push({
          ...ord,
          orderRounds: matchedRounds
        });
      }
    }

    orders.value = result;
  };

  /**
   * ⚡ 1. NẠP DỮ LIỆU TỪ DEXIE DB VÀO RAM
   */
  const loadOrders = async (tabKey: OrderManagementTabKey = activeTab.value) => {
    try {
      if (tablesMap.value.size === 0) {
        loadTablesMap(); // nạp ngầm
      }
      const all = await posOrderCacheService.getOrders();
      rawOrders.value = all;
      computeBadgeCountsFromMemory();
      filterOrdersFromMemory(tabKey);
    } catch (err: any) {
      console.error('[usePosOrderManagement] Lỗi nạp đơn hàng từ Dexie:', err);
    }
  };

  /**
   * 📊 2. TÍNH TOÁN SỐ LƯỢNG BADGE
   */
  const refreshBadgeCounts = async () => {
    computeBadgeCountsFromMemory();
  };

  /**
   * 🌐 3. ĐỒNG BỘ ĐƠN HÀNG TỪ SERVER VÀO DEXIE DB (SILENT SYNC - KHÔNG GÂY LOADING UI)
   */
  const syncFromServer = async (silent = true) => {
    const storeId = getStoreId();
    if (!storeId) return;

    // Chỉ hiển thị loading nếu chưa có bất kỳ dữ liệu nào trong RAM và không phải silent sync
    if (!silent && rawOrders.value.length === 0) {
      isLoading.value = true;
    }

    try {
      const all = await posOrderCacheService.syncOrdersFromServer(storeId);
      rawOrders.value = all;
      computeBadgeCountsFromMemory();
      filterOrdersFromMemory(activeTab.value);
    } catch (e) {
      console.warn('[usePosOrderManagement] Lỗi đồng bộ ordersFromCache:', e);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * ✅ 4. DUYỆT CẢ LƯỢT GỌI MÓN (OPTIMISTIC UI TRƯỚC ➔ POS QUEUE)
   */
  const approveRound = async (noteId: number, items: ProductDeliveryItem[]) => {
    const storeId = getStoreId();
    if (!storeId || !noteId || !items || items.length === 0) return;

    const noteItemIds = items.map(i => i.noteItemId).filter(id => id > 0);
    if (noteItemIds.length === 0) return;

    const confirmed = await confirmApprove(
      `Bạn có chắc chắn muốn duyệt tất cả ${noteItemIds.length} món trong lượt này không?`,
      noteItemIds.length
    );
    if (!confirmed) return;

    isActionProcessing.value = true;
    try {
      // ⚡ 1. CẬP NHẬT TRỰC TIẾP TRONG DEXIE DB (0ms)
      await posOrderCacheService.updateItemStatus(noteId, noteItemIds, 1);
      noteItemIds.forEach(id => selectedItemIds.value.delete(id));

      // Cập nhật ngay giao diện và badge count trên front
      await Promise.all([
        loadOrders(),
        refreshBadgeCounts()
      ]);

      showSuccess('Đã duyệt đợt gọi món thành công!');

      // 📥 2. ĐẨY JOB VÀO POS QUEUE XỬ LÝ NGẦM
      const payload: HandleNoteItemsJobPayload = {
        storeId,
        noteId,
        noteItemIds
      };

      const rollbackPayload: HandleNoteItemsRollbackPayload = {
        noteId,
        noteItemIds,
        previousStatus: 0
      };

      await enqueueJob<HandleNoteItemsJobPayload>(
        POS_JOB_TYPES.APPROVE_NOTE_ITEMS,
        payload,
        {
          rollbackPayload,
          onFailed: (err: string) => {
            showError(`Duyệt món thất bại: ${err}. Dữ liệu đã được hoàn tác.`);
            loadOrders();
            refreshBadgeCounts();
          }
        }
      );
    } catch (err: any) {
      console.error('[usePosOrderManagement] Lỗi duyệt món:', err);
      showError(err?.message || 'Không thể duyệt món.');
    } finally {
      isActionProcessing.value = false;
    }
  };

  /**
   * ✅ 5. DUYỆT CÁC MÓN ĐƯỢC CHỌN (OPTIMISTIC UI TRƯỚC ➔ POS QUEUE)
   */
  const approveSelectedItems = async (noteId: number) => {
    const storeId = getStoreId();
    if (!storeId || !noteId) return;

    const itemIdsToApprove = Array.from(selectedItemIds.value);
    if (itemIdsToApprove.length === 0) {
      showError('Vui lòng chọn ít nhất 1 món để duyệt.');
      return;
    }

    const confirmed = await confirmApprove(
      `Bạn có chắc chắn muốn duyệt ${itemIdsToApprove.length} món đã chọn không?`,
      itemIdsToApprove.length
    );
    if (!confirmed) return;

    isActionProcessing.value = true;
    try {
      // ⚡ 1. Cập nhật trực tiếp trạng thái trong Dexie DB (0ms)
      await posOrderCacheService.updateItemStatus(noteId, itemIdsToApprove, 1);
      selectedItemIds.value.clear();

      await Promise.all([
        loadOrders(),
        refreshBadgeCounts()
      ]);

      showSuccess(`Đã duyệt ${itemIdsToApprove.length} món thành công!`);

      // 📥 2. Đẩy job vào Queue
      const payload: HandleNoteItemsJobPayload = {
        storeId,
        noteId,
        noteItemIds: itemIdsToApprove
      };

      const rollbackPayload: HandleNoteItemsRollbackPayload = {
        noteId,
        noteItemIds: itemIdsToApprove,
        previousStatus: 0
      };

      await enqueueJob<HandleNoteItemsJobPayload>(
        POS_JOB_TYPES.APPROVE_NOTE_ITEMS,
        payload,
        {
          rollbackPayload,
          onFailed: (err: string) => {
            showError(`Duyệt món thất bại: ${err}. Dữ liệu đã được hoàn tác.`);
            loadOrders();
            refreshBadgeCounts();
          }
        }
      );
    } catch (err: any) {
      console.error('[usePosOrderManagement] Lỗi duyệt món đã chọn:', err);
      showError(err?.message || 'Không thể duyệt món.');
    } finally {
      isActionProcessing.value = false;
    }
  };

  /**
   * ❌ 6. TỪ CHỐI CẢ LƯỢT GỌI MÓN (OPTIMISTIC UI TRƯỚC ➔ POS QUEUE)
   */
  const rejectRound = async (noteId: number, items: ProductDeliveryItem[]) => {
    const storeId = getStoreId();
    if (!storeId || !noteId || !items || items.length === 0) return;

    const noteItemIds = items.map(i => i.noteItemId).filter(id => id > 0);
    if (noteItemIds.length === 0) return;

    const confirmed = await confirmReject(
      `Bạn có chắc chắn muốn từ chối tất cả ${noteItemIds.length} món trong lượt này không?`,
      noteItemIds.length
    );
    if (!confirmed) return;

    isActionProcessing.value = true;
    try {
      // ⚡ 1. CẬP NHẬT TRỰC TIẾP TRONG DEXIE DB (0ms)
      await posOrderCacheService.updateItemStatus(noteId, noteItemIds, 2);
      noteItemIds.forEach(id => selectedItemIds.value.delete(id));

      await Promise.all([
        loadOrders(),
        refreshBadgeCounts()
      ]);

      showSuccess(`Đã từ chối ${noteItemIds.length} món trong lượt.`);

      // 📥 2. ĐẨY JOB VÀO POS QUEUE
      const payload: HandleNoteItemsJobPayload = {
        storeId,
        noteId,
        noteItemIds
      };

      const rollbackPayload: HandleNoteItemsRollbackPayload = {
        noteId,
        noteItemIds,
        previousStatus: 0
      };

      await enqueueJob<HandleNoteItemsJobPayload>(
        POS_JOB_TYPES.REJECT_NOTE_ITEMS,
        payload,
        {
          rollbackPayload,
          onFailed: (err: string) => {
            showError(`Từ chối món thất bại: ${err}. Dữ liệu đã được hoàn tác.`);
            loadOrders();
            refreshBadgeCounts();
          }
        }
      );
    } catch (err: any) {
      console.error('[usePosOrderManagement] Lỗi từ chối lượt món:', err);
      showError(err?.message || 'Không thể từ chối lượt món.');
    } finally {
      isActionProcessing.value = false;
    }
  };

  /**
   * ❌ 7. TỪ CHỐI CÁC MÓN ĐƯỢC CHỌN (OPTIMISTIC UI TRƯỚC ➔ POS QUEUE)
   */
  const rejectSelectedItems = async (noteId: number) => {
    const storeId = getStoreId();
    if (!storeId || !noteId) return;

    const itemIdsToReject = Array.from(selectedItemIds.value);
    if (itemIdsToReject.length === 0) {
      showError('Vui lòng chọn ít nhất 1 món để từ chối.');
      return;
    }

    const confirmed = await confirmReject(
      `Bạn có chắc chắn muốn từ chối ${itemIdsToReject.length} món đã chọn không?`,
      itemIdsToReject.length
    );
    if (!confirmed) return;

    isActionProcessing.value = true;
    try {
      // ⚡ 1. Cập nhật trực tiếp trạng thái trong Dexie DB (0ms)
      await posOrderCacheService.updateItemStatus(noteId, itemIdsToReject, 2);
      selectedItemIds.value.clear();

      await Promise.all([
        loadOrders(),
        refreshBadgeCounts()
      ]);

      showSuccess(`Đã từ chối ${itemIdsToReject.length} món thành công!`);

      // 📥 2. Đẩy job vào Queue
      const payload: HandleNoteItemsJobPayload = {
        storeId,
        noteId,
        noteItemIds: itemIdsToReject
      };

      const rollbackPayload: HandleNoteItemsRollbackPayload = {
        noteId,
        noteItemIds: itemIdsToReject,
        previousStatus: 0
      };

      await enqueueJob<HandleNoteItemsJobPayload>(
        POS_JOB_TYPES.REJECT_NOTE_ITEMS,
        payload,
        {
          rollbackPayload,
          onFailed: (err: string) => {
            showError(`Từ chối món thất bại: ${err}. Dữ liệu đã được hoàn tác.`);
            loadOrders();
            refreshBadgeCounts();
          }
        }
      );
    } catch (err: any) {
      console.error('[usePosOrderManagement] Lỗi từ chối món đã chọn:', err);
      showError(err?.message || 'Không thể từ chối các món đã chọn.');
    } finally {
      isActionProcessing.value = false;
    }
  };

  /**
   * ❌ 8. TỪ CHỐI 1 MÓN LẺ (OPTIMISTIC UI TRƯỚC ➔ POS QUEUE)
   */
  const rejectSingleItem = async (noteId: number, noteItemId: number) => {
    const storeId = getStoreId();
    if (!storeId || !noteId || !noteItemId) return;

    const confirmed = await confirmReject('Bạn có chắc chắn muốn từ chối món ăn này không?');
    if (!confirmed) return;

    isActionProcessing.value = true;
    try {
      // ⚡ 1. Cập nhật trực tiếp status = 2 trong Dexie DB (0ms)
      await posOrderCacheService.updateItemStatus(noteId, [noteItemId], 2);
      selectedItemIds.value.delete(noteItemId);

      await Promise.all([
        loadOrders(),
        refreshBadgeCounts()
      ]);

      showSuccess('Đã từ chối món.');

      // 📥 2. Đẩy job vào Queue
      const payload: HandleNoteItemsJobPayload = {
        storeId,
        noteId,
        noteItemIds: [noteItemId]
      };

      const rollbackPayload: HandleNoteItemsRollbackPayload = {
        noteId,
        noteItemIds: [noteItemId],
        previousStatus: 0
      };

      await enqueueJob<HandleNoteItemsJobPayload>(
        POS_JOB_TYPES.REJECT_NOTE_ITEMS,
        payload,
        {
          rollbackPayload,
          onFailed: (err: string) => {
            showError(`Từ chối món thất bại: ${err}. Dữ liệu đã được hoàn tác.`);
            loadOrders();
            refreshBadgeCounts();
          }
        }
      );
    } catch (err: any) {
      console.error('[usePosOrderManagement] Lỗi từ chối món:', err);
      showError(err?.message || 'Không thể từ chối món.');
    } finally {
      isActionProcessing.value = false;
    }
  };

  /**
   * 🗑️ 9. XÓA / HỦY TOÀN BỘ ĐƠN HÀNG CỦA 1 BÀN
   */
  const deleteTableOrder = async (targetId: number, noteId: number) => {
    const storeId = getStoreId();
    if (!storeId || !targetId) return;

    const confirmed = await confirmDelete(
      'Bạn có chắc chắn muốn xóa toàn bộ đơn hàng của bàn này không?',
      'Bàn sẽ được giải phóng về trạng thái trống.'
    );
    if (!confirmed) return;

    isActionProcessing.value = true;
    try {
      // Xóa trong cache trước (0ms)
      await posOrderCacheService.deleteOrderByTargetId(targetId);
      await posCartCacheService.deleteTableCart(targetId);
      await posTableCacheService.clearTableOrderOptimistic(targetId);

      await Promise.all([
        loadOrders(),
        refreshBadgeCounts()
      ]);

      // Gọi API xóa đơn
      if (noteId > 0) {
        await deleteOrderCacheApi(storeId, {
          storeId,
          targetId,
          noteId,
          noteNumber: 0
        });
      }
    } catch (err: any) {
      console.error('[usePosOrderManagement] Lỗi xóa đơn:', err);
      showError(err?.message || 'Không thể xóa đơn.');
    } finally {
      isActionProcessing.value = false;
    }
  };

  /**
   * 🗑️ 10. XÓA TẤT CẢ ĐƠN HÀNG TRÊN HỆ THỐNG
   */
  const deleteAllOrders = async () => {
    if (orders.value.length === 0) return;
    
    const confirmed = await confirmDelete(
      'CẢNH BÁO: Thao tác này sẽ xóa toàn bộ tất cả đơn hàng đang có.',
      'Tất cả các bàn sẽ được đưa về trạng thái trống. Hành động này không thể hoàn tác!'
    );
    if (!confirmed) return;

    isActionProcessing.value = true;
    try {
      for (const ord of orders.value) {
        if (ord.targetId && ord.noteId) {
          await deleteTableOrder(ord.targetId, ord.noteId);
        }
      }
      showSuccess('Đã xóa tất cả đơn hàng!');
    } catch (e: any) {
      showError(e?.message || 'Không thể xóa tất cả đơn.');
    } finally {
      isActionProcessing.value = false;
    }
  };

  // Checkbox helpers
  const toggleSelectItem = (itemId: number) => {
    if (selectedItemIds.value.has(itemId)) {
      selectedItemIds.value.delete(itemId);
    } else {
      selectedItemIds.value.add(itemId);
    }
  };

  const toggleSelectAllInRound = (items: ProductDeliveryItem[]) => {
    const validItems = items.filter(i => i.noteItemId > 0);
    const allSelected = validItems.every(i => selectedItemIds.value.has(i.noteItemId));

    if (allSelected) {
      validItems.forEach(i => selectedItemIds.value.delete(i.noteItemId));
    } else {
      validItems.forEach(i => selectedItemIds.value.add(i.noteItemId));
    }
  };

  const isItemSelected = (itemId: number): boolean => {
    return selectedItemIds.value.has(itemId);
  };

  const isAllSelectedInRound = (items: ProductDeliveryItem[]): boolean => {
    const validItems = items.filter(i => i.noteItemId > 0);
    return validItems.length > 0 && validItems.every(i => selectedItemIds.value.has(i.noteItemId));
  };

  // ⚡ KHI CHUYỂN TAB -> LỌC NGAY TRÊN RAM TRONG 0.01ms (ĐỒNG BỘ, KHÔNG CHỜ ASYNC DEXIE)
  watch(activeTab, (newTab) => {
    selectedItemIds.value.clear();
    filterOrdersFromMemory(newTab);
  });

  // ⚡ KHI MỞ MODAL -> NẠP NGAY TỪ DEXIE DB (0ms), ĐỒNG BỘ NỀN SILENT KHÔNG LOADING
  watch(
    () => isOpen(),
    async (open) => {
      if (open) {
        selectedItemIds.value.clear();
        const hasOrdersInDb = await posOrderCacheService.hasOrders();
        if (hasOrdersInDb) {
          await loadOrders(); // Render ngay lập tức dữ liệu hiện có
          syncFromServer(true); // Đồng bộ nền không làm giật UI
        } else {
          await syncFromServer(false); // Lần đầu tiên chưa có gì mới hiện loading
        }
      }
    }
  );

  onMounted(() => {
    // ⚡ LẮNG NGHE SIGNALR KHI CÓ ĐƠN ONLINE MỚI BẮN VỀ ➔ TỰ ĐỘNG GỌI API & CẬP NHẬT NGẦM (SILENT)
    let debounceTimer: any = null;

    const handleSignalSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const storeId = getStoreId();
        if (!storeId) return;

        console.log('⚡ [usePosOrderManagement] SignalR nhận đơn mới -> Cập nhật ngầm không gián đoạn UI...');
        try {
          await syncFromServer(true); // Luôn silent khi nhận SignalR
        } catch (err) {
          console.warn('[usePosOrderManagement] Lỗi tự động đồng bộ đơn online sau SignalR:', err);
        }
      }, 300);
    };

    const unsubPos = signalRService.onReceivedSystemMessagePos(handleSignalSync);
    const unsubTransfer = signalRService.onReceivedTableTransferPos(handleSignalSync);
    const unsubSys = signalRService.onReceivedSystemMessage(handleSignalSync);
    const unsubBroadcast = signalRService.onBroadcast((data) => {
      const msg = String(data?.Message || data?.message || '').toLowerCase();
      if (msg.includes('đơn') || msg.includes('món') || msg.includes('order') || msg.includes('bàn') || msg.includes('note')) {
        handleSignalSync();
      }
    });

    onUnmounted(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubPos();
      unsubTransfer();
      unsubSys();
      unsubBroadcast();
    });
  });

  return {
    activeTab,
    orders,
    isLoading,
    isActionProcessing,
    pendingCount,
    approvedCount,
    rejectedCount,
    selectedItemIds,
    getTableName,
    loadOrders,
    syncFromServer,
    refreshBadgeCounts,
    approveRound,
    approveSelectedItems,
    rejectRound,
    rejectSelectedItems,
    rejectSingleItem,
    deleteTableOrder,
    deleteAllOrders,
    toggleSelectItem,
    toggleSelectAllInRound,
    isItemSelected,
    isAllSelectedInRound
  };
}
