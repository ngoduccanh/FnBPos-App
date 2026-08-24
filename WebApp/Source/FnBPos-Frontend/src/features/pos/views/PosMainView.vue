<template>
  <div class="h-screen w-screen bg-slate-100 text-slate-800 flex flex-col overflow-hidden select-none">
    
    <PosHeader
      :storeName="session?.storeName || (authStore?.selectedStore as any)?.name || (authStore?.selectedStore as any)?.Name"
      :storeAddress="session?.storeAddresses || (authStore?.selectedStore as any)?.address || (authStore?.selectedStore as any)?.Address"
      :userName="authStore?.user?.fullName || authStore?.user?.username || (authStore?.user as any)?.UserName || 'Thu ngân'"
      :userEmail="authStore?.user?.email || (authStore?.user as any)?.Email || 'user@gmail.com'"
      :userRole="authStore?.isAdmin ? 'Quản trị viên' : 'Nhân viên'"
      :isAdmin="authStore?.isAdmin"
      @logout="handleLogout"
      @switch-store="handleSwitchStore"
      @refresh-store="handleRefreshStore"
      @open-orders="isOrderModalOpen = true"
    />

    <div class="flex-1 flex overflow-hidden relative">

      <!-- ⏳ TRẠNG THÁI LOADING KHI VỪA VÀO TRANG (GIỮ HEADER, NỀN TRẮNG TOÀN BỘ, DẤU CHẤM CHẠY LÊN XUỐNG) -->
      <div
        v-if="isInitialSyncLoading"
        class="flex-1 flex flex-col items-center justify-center bg-white z-40 select-none animate-in fade-in duration-150"
      >
        <div class="flex flex-col items-center justify-center p-8 text-center max-w-sm">
          <!-- 🔵 CÁC DẤU CHẤM NẰM TRÊN CÙNG 1 HÀNG CHẠY LÊN CHẠY XUỐNG (WAVE BOUNCE) -->
          <div class="flex items-center justify-center gap-3 h-14 mb-2">
            <span class="inline-block w-4 h-4 rounded-full bg-blue-600 dot-1 shadow-sm"></span>
            <span class="inline-block w-4 h-4 rounded-full bg-blue-500 dot-2 shadow-sm"></span>
            <span class="inline-block w-4 h-4 rounded-full bg-blue-500 dot-3 shadow-sm"></span>
            <span class="inline-block w-4 h-4 rounded-full bg-blue-600 dot-4 shadow-sm"></span>
          </div>

          <h3 class="text-lg font-bold text-slate-800 tracking-tight">
            Đang tải dữ liệu...
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            Đang đồng bộ sơ đồ bàn và thực đơn
          </p>
        </div>
      </div>

      <!-- 🟢 1. HIỂN THỊ MÀN HÌNH CHI TIẾT ĐƠN BÀN KHI ĐÃ CHỌN BÀN (TABLE ORDER DETAIL VIEW) -->
      <TableOrderDetailView
        v-else-if="selectedTable"
        :table="selectedTable"
        :allTables="tables"
        @back="handleBackToTables"
        @refresh-tables="handleRefreshTablesFromTransfer"
      />

      <!-- 🟢 2. HIỂN THỊ SƠ ĐỒ BÀN KHI CHƯA CHỌN BÀN (TABLE GRID VIEW) -->
      <div v-else class="flex-1 flex overflow-hidden min-w-0">
        <TakeawaySidebar
          :isOpen="isMobilePanelOpen"
          @close="isMobilePanelOpen = false"
          @create-takeaway="handleSelectTable"
        />

        <main class="flex-1 flex flex-col bg-slate-50 overflow-hidden min-w-0">
          <TableAreaFilter
            :selectedGroupId="selectedGroupId"
            :totalCount="tables.length"
            :groups="tablesArea"
            @change-group="filterByGroup"
          />

          <div class="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200/80 shrink-0 space-y-2">
            <div class="flex items-center gap-2">
              <div class="flex-1">
                <AppSearchInput
                  v-model="searchQuery"
                  placeholder="Tìm kiếm theo tên bàn, mã bàn hoặc tên khách hàng..."
                  :delay="400"
                  @search="handleSearchTable"
                  @clear="handleSearchTable('')"
                />
              </div>

              <AppRefreshButton
                :isRefreshing="isRefreshing"
                :cooldownSeconds="10"
                @click="handleRefreshTables"
              />
            </div>

            <TableStatusFilter
              :selectedStatus="selectedStatus"
              @change-status="filterByStatus"
            />
          </div>

          <TableGrid
            :tables="filteredTables"
            :selectedTableId="selectedTable?.id"
            :isLoading="tablesLoading"
            :error="tablesError"
            @select-table="handleSelectTable"
            @open-qr="handleOpenTableQr"
            @retry="fetchTableOptions"
          />
        </main>
      </div>

    </div>

    <!-- 🔵 MODAL XEM VÀ IN MÃ QR BÀN TỪ SƠ ĐỒ BÀN -->
    <TableQrModal
      :isOpen="isTableQrModalOpen"
      :targetId="qrTable?.id || 0"
      :tableName="qrTable?.name"
      @close="isTableQrModalOpen = false"
    />

    <!-- 📋 MODAL QUẢN LÝ ĐƠN HÀNG ONLINE TỪ MÃ QR -->
    <OrderManagementModal
      :isOpen="isOrderModalOpen"
      @close="isOrderModalOpen = false"
    />

    <!-- 📡 OFFLINE BANNER — hiển thị ở dưới cùng, tự động đẩy toàn bộ giao diện lên -->
    <Transition name="offline-banner">
      <div
        v-if="isOffline"
        class="shrink-0 flex items-center justify-center gap-2.5 py-2 px-4 bg-rose-50 border-t-2 border-rose-300 select-none z-50"
      >
        <!-- DOT NHẤP NHÁY -->
        <span class="relative flex h-2 w-2 shrink-0">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>

        <!-- NỘI DUNG THÔNG BÁO -->
        <p class="text-xs font-medium text-center text-rose-700">
          Hiện bạn đang ở trạng thái <span class="font-bold">ngoại tuyến</span>
          — mọi dữ liệu sẽ được đồng bộ khi có mạng trở lại.
        </p>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PosHeader from '@/shared/components/layout/PosHeader.vue';
import { useNetworkStatus } from '@/services/useNetworkStatus';
import { usePreventOfflineRefresh } from '../composables/usePreventOfflineRefresh';
import { useToast } from '@/shared/components/toast/composables/useToast';
import { useAppStore } from '@/stores/appStore';
import { QzTrayDriver } from '@/services/printer/drivers/qzTrayDriver';
import { posTableCacheService } from '@/services/posDexieDB/posTableCacheService';
import { posProductCacheService } from '@/services/posDexieDB/posProductCacheService';
import TakeawaySidebar from '../components/TakeawaySidebar.vue';
import TableQrModal from '../components/TableQrModal.vue';
import OrderManagementModal from '../components/OrderManagementModal.vue';
import TableAreaFilter from '../components/TableAreaFilter.vue';
import TableGrid from '../components/TableGrid.vue';
import AppSearchInput from '@/shared/components/search/components/AppSearchInput.vue';
import AppRefreshButton from '@/shared/components/button/components/AppRefreshButton.vue';
import TableStatusFilter from '../components/TableStatusFilter.vue';
import TableOrderDetailView from '../components/TableOrderDetailView.vue';
import { usePosMain } from '../composables/usePosMain';
import { useCustomerDisplayBridge } from '../composables/useCustomerDisplayBridge';
import { useProducts } from '../hooks/useProducts';
import { useProductGroupOptions } from '../hooks/useProductGroupOptions';
import type { PosTableItem } from '../types/tables.types';

const { broadcastIdle } = useCustomerDisplayBridge();

const {
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
  filterByGroup,
  filterByStatus,
  handleSelectTable,
  handleSearchTable,
  handleRefreshTables,
  handleLogout,
  handleSwitchStore,
  selectTable
} = usePosMain();

// 🔌 Khởi tạo trước kết nối QZ Tray & Tải sẵn thực đơn vào RAM (Warm-up)
const { loadProductsFromCache, fetchProducts } = useProducts();
const { loadProductGroupsFromCache, fetchProductGroupOptions } = useProductGroupOptions();

onMounted(() => {
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  if (!isAndroid) {
    QzTrayDriver.connect();
  }

  // ⚡ Tải trước toàn bộ thực đơn vào RAM ngay khi mở app POS (Warm-up Menu)
  posProductCacheService.hasProducts().then(has => {
    if (has) loadProductsFromCache();
    else fetchProducts();
  });
  posProductCacheService.hasProductGroups().then(has => {
    if (has) loadProductGroupsFromCache();
    else fetchProductGroupOptions();
  });

  // Khởi tạo trạng thái Chờ cho màn hình phụ
  const selectedStore: any = authStore?.selectedStore;
  broadcastIdle({
    storeName: session?.storeName || appStore.session?.storeName || selectedStore?.name || selectedStore?.Name || 'BeePos247',
    storeAddress: session?.storeAddresses || appStore.session?.storeAddresses || selectedStore?.address || selectedStore?.Address || '',
    storePhone: selectedStore?.phone || selectedStore?.Phone || ''
  });
});

const handleBackToTables = async () => {
  selectTable(null);
  tables.value = await posTableCacheService.getTables();

  const selectedStore: any = authStore?.selectedStore;
  broadcastIdle({
    storeName: session?.storeName || appStore.session?.storeName || selectedStore?.name || selectedStore?.Name || 'BeePos247',
    storeAddress: session?.storeAddresses || appStore.session?.storeAddresses || selectedStore?.address || selectedStore?.Address || '',
    storePhone: selectedStore?.phone || selectedStore?.Phone || ''
  });
};

// Fix lỗi 1: Reload tables.value từ Dexie sau khi chuyển bàn xong (trên máy thao tác)
const handleRefreshTablesFromTransfer = async () => {
  tables.value = await posTableCacheService.getTables();
};

// 📲 XỬ LÝ MỞ MODAL MÃ QR BÀN TỪ SƠ ĐỒ BÀN
const isTableQrModalOpen = ref<boolean>(false);
const qrTable = ref<PosTableItem | null>(null);

// 📋 XỬ LÝ MỞ MODAL QUẢN LÝ ĐƠN HÀNG ONLINE
const isOrderModalOpen = ref<boolean>(false);

const handleOpenTableQr = (table: PosTableItem) => {
  qrTable.value = table;
  isTableQrModalOpen.value = true;
};

// TRẠNG THÁI MẠNG
const { isOffline } = useNetworkStatus();
const toast = useToast();
const appStore = useAppStore();

// 🛡️ CHẶN F5 / CTRL+R KHI OFFLINE
usePreventOfflineRefresh(() => {
  toast.showWarning('Đang ngoại tuyến! Không thể tải lại trang lúc này.', 'Ngoại tuyến');
});

/**
 * 🔄 Cập nhật thông tin cửa hàng từ API (forceReload)
 * Trigger bởi click vào logo trong PosHeader.
 */
const handleRefreshStore = async () => {
  const selectedStore: any = authStore?.selectedStore;
  const storeId = appStore.session?.id
    || appStore.currentStoreId
    || selectedStore?.id
    || selectedStore?.Id
    || 0;

  if (!storeId) {
    toast.showError('Không xác định được cửa hàng.', 'Lỗi');
    return;
  }

  try {
    await appStore.loadStoreSession(storeId, true); // forceReload = true
    toast.showSuccess('Cập nhật thông tin cửa hàng thành công!', 'Cập nhật');
  } catch {
    toast.showError('Không thể cập nhật cửa hàng. Vui lòng thử lại.', 'Lỗi');
  }
};
</script>

<style scoped>
/* ANIMATION DOT-WAVE CHO LOADING — các dấu chấm nhấp nhô lượn sóng lên xuống */
@keyframes dot-wave {
  0%, 100% {
    transform: translateY(0) scale(0.85);
    opacity: 0.35;
  }
  50% {
    transform: translateY(-20px) scale(1.25);
    opacity: 1;
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.5);
  }
}

.dot-1 {
  animation: dot-wave 1.1s infinite ease-in-out;
  animation-delay: 0s;
}

.dot-2 {
  animation: dot-wave 1.1s infinite ease-in-out;
  animation-delay: 0.18s;
}

.dot-3 {
  animation: dot-wave 1.1s infinite ease-in-out;
  animation-delay: 0.36s;
}

.dot-4 {
  animation: dot-wave 1.1s infinite ease-in-out;
  animation-delay: 0.54s;
}
</style>


