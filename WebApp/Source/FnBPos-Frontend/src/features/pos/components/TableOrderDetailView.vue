<template>
  <div class="h-full flex-1 flex bg-slate-100 overflow-hidden select-none">
    
    <!-- 🟢 1. CỘT BÊN TRÁI: DANH SÁCH SẢN PHẨM & THANH NHÓM SẢN PHẨM Ở TRÊN -->
    <TableOrderProductCatalog
      v-model:searchQuery="productSearchQuery"
      v-model:selectedGroupId="selectedGroupId"
      :cartTotalQuantity="cartTotalQuantity"
      :isRefreshing="isRefreshingProducts"
      :productGroups="productGroups"
      :isLoading="productsLoading"
      :filteredProducts="filteredProducts"
      :visibleProducts="visibleProducts"
      :hasMoreProducts="hasMoreProducts"
      :getCartQuantity="getCartQuantity"
      @open-mobile-cart="isMobileCartOpen = true"
      @reload-products="handleReloadProducts"
      @add-to-cart="addToCart"
      @decrease-cart="decreaseCartByProduct"
      @load-more="loadMoreProducts"
    />

    <!-- 🔵 BACKDROP OVERLAY TRÊN MOBILE KHI MỞ GIỎ HÀNG -->
    <div
      v-if="isMobileCartOpen"
      @click="isMobileCartOpen = false"
      class="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity duration-300"
    ></div>

    <!-- 🔵 2. CỘT BÊN PHẢI: GIỎ HÀNG & THÔNG TIN ĐƠN HÀNG -->
    <div
      class="fixed lg:relative inset-y-0 right-0 z-50 lg:z-10 w-full sm:w-[520px] lg:w-[550px] xl:w-[620px] 2xl:w-[680px] bg-white flex flex-col shrink-0 overflow-hidden shadow-2xl border-l border-slate-200/90 transition-transform duration-300 ease-in-out"
      :class="[
        isMobileCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- HEADER GIỎ HÀNG: ĐỔI BÀN, CHUYỂN BÀN, TÌM KHÁCH HÀNG -->
      <TableOrderCartHeader
        :tableName="table?.name"
        v-model:customerSearch="customerSearch"
        @close-mobile-cart="isMobileCartOpen = false"
        @back="$emit('back')"
        @clear-cart="onCancelOrder"
        @transfer-table="isTransferModalOpen = true"
      />

      <!-- DANH SÁCH MÓN TRONG GIỎ HÀNG -->
      <TableOrderCartList
        :cartItems="cartItems"
        @increase="increaseQty"
        @decrease="decreaseQty"
        @remove="removeCartItem"
      />

      <!-- FOOTER GIỎ HÀNG: XUẤT HÓA ĐƠN, ĐẶT MÓN, TẠM TÍNH, THANH TOÁN & IN ẤN -->
      <TableOrderCartFooter
        v-model:isExportInvoice="isExportInvoice"
        v-model:orderNote="orderNote"
        :isSavingOrder="isSavingOrder"
        :isCancelling="isCancelling"
        :cartTotalQuantity="cartTotalQuantity"
        :formattedCartTotal="formattedCartTotal"
        @save-order="onSaveOrder"
        @cancel-order="onCancelOrder"
        @show-qr="isQrModalOpen = true"
        @print-bill="handlePrintBill"
        @print-kitchen="handlePrintKitchen"
      />
    </div>

    <!-- 🔵 MODAL XEM VÀ IN MÃ QR BÀN -->
    <TableQrModal
      :isOpen="isQrModalOpen"
      :targetId="table?.id || 0"
      :tableName="table?.name"
      @close="isQrModalOpen = false"
    />

    <!-- 🔵 MODAL CHUYỂN / TÁCH BÀN -->
    <TableTransferModal
      :isOpen="isTransferModalOpen"
      :sourceTable="table"
      :tables="allTables || []"
      :cartItems="cartItems"
      :isProcessing="isTransferring"
      @close="isTransferModalOpen = false"
      @confirm-transfer="onConfirmTransfer"
    />

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TableOrderProductCatalog from './order-detail/TableOrderProductCatalog.vue';
import TableOrderCartHeader from './order-detail/TableOrderCartHeader.vue';
import TableOrderCartList from './order-detail/TableOrderCartList.vue';
import TableOrderCartFooter from './order-detail/TableOrderCartFooter.vue';
import TableQrModal from './TableQrModal.vue';
import TableTransferModal from './TableTransferModal.vue';
import { useTableOrderDetail } from '../composables/useTableOrderDetail';
import { usePosTransferTable } from '../composables/usePosTransferTable';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/auth';
import type { PosTableItem } from '../types/tables.types';
import type { TransferItemDto } from '../types/tableTransfer.types';

const isQrModalOpen = ref<boolean>(false);
const isTransferModalOpen = ref<boolean>(false);

const props = defineProps<{
  table: PosTableItem | null;
  allTables?: PosTableItem[];
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'refresh-tables'): void;
}>();

const appStore = useAppStore();
const authStore = useAuthStore();
const { isTransferring, executeTransferTable } = usePosTransferTable();

const {
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
  cartItems,
  cartTotalQuantity,
  formattedCartTotal,
  getCartQuantity,
  addToCart,
  decreaseCartByProduct,
  increaseQty,
  decreaseQty,
  removeCartItem,
  refreshCartFromLocal,
  isSavingOrder,
  isCancelling,
  handleSaveOrder,
  handleCancelOrder,
  handlePrintBill,
  handlePrintKitchen,
  isMobileCartOpen,
  customerSearch,
  isExportInvoice,
  orderNote
} = useTableOrderDetail(() => props.table);

// ⚡ Khi đặt món xong -> Vẫn ở lại màn hình giỏ hàng của bàn hiện tại
const onSaveOrder = async () => {
  await handleSaveOrder();
};

// ⚡ Chỉ khi hủy/xóa đơn xong -> Lập tức thoát ra màn hình chọn bàn
const onCancelOrder = async () => {
  const success = await handleCancelOrder();
  if (success) {
    emit('back');
  }
};

// ⚡ Xử lý chuyển / tách bàn
const onConfirmTransfer = async (payload: {
  targetTable: PosTableItem;
  isTransferAll: boolean;
  itemsToMove: TransferItemDto[];
}) => {
  if (!props.table) return;

  const selectedStore: any = authStore.selectedStore;
  const storeId = appStore.session?.id || appStore.currentStoreId || selectedStore?.id || selectedStore?.Id || 0;

  const success = await executeTransferTable(
    storeId,
    props.table,
    payload.targetTable,
    payload.isTransferAll,
    payload.itemsToMove,
    // onSuccess: Notify PosMainView reload tables.value từ Dexie (fix lỗi UI không cập nhật)
    () => { emit('refresh-tables'); },
    cartItems.value
  );

  if (success) {
    isTransferModalOpen.value = false;
    if (payload.isTransferAll) {
      // Chuyển toàn bộ bàn -> Quay về sơ đồ bàn
      emit('back');
    } else {
      // Tách bàn -> Nạp lại chi tiết món còn lại của bàn nguồn từ Dexie DB
      await refreshCartFromLocal();
    }
  }
};
</script>

