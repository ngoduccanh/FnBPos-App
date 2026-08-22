<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 animate-fade-in"
      @click.self="close"
    >
      <div class="bg-slate-50 w-full max-w-5xl h-[85vh] min-h-[550px] max-h-[850px] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scale-up will-change-transform">
        
        <!-- 🟢 1. HEADER MODAL -->
        <OrderManagementHeader
          :hasOrders="orders.length > 0"
          :isProcessing="isActionProcessing"
          @close="close"
          @delete-all="deleteAllOrders"
        />

        <!-- 🔵 2. THANH TABS 4 TRẠNG THÁI (PILL BUTTONS - 0 SCROLLBAR) -->
        <OrderManagementTabs
          v-model:activeTab="activeTab"
          :pendingCount="pendingCount"
          :approvedCount="approvedCount"
        />

        <!-- 🟡 3. DANH SÁCH ĐƠN HÀNG (BODY CONTENT) - CHIỀU DÀI CỐ ĐỊNH SCROLL NỘI BỘ -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 gpu-scroll">
          
          <!-- SKELETON / LOADING (CHỈ KHI CHƯA CÓ DỮ LIỆU ĐƠN NÀO) -->
          <div v-if="isLoading && orders.length === 0" class="h-full min-h-[320px] flex flex-col items-center justify-center gap-3 py-16">
            <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs text-slate-400 font-bold">Đang nạp danh sách đơn hàng online...</p>
          </div>

          <!-- EMPTY STATE KHI KHÔNG CÓ ĐƠN -->
          <OrderManagementEmptyState
            v-else-if="orders.length === 0"
            :title="emptyTitle"
            :description="emptyDesc"
          />

          <!-- DANH SÁCH CÁC BÀN VÀ ĐƠN HÀNG -->
          <template v-else>
            <OrderManagementTableGroup
              v-for="order in orders"
              :key="order.noteId || order.targetId"
              :order="order"
              :getTableName="getTableName"
              :showCheckbox="activeTab === 'pending'"
              :showApproveBtn="activeTab === 'pending'"
              :showPrintBtn="activeTab === 'approved' || activeTab === 'current'"
              :showRejectBtn="activeTab === 'pending'"
              :showDeleteTableBtn="activeTab === 'current'"
              :isProcessing="isActionProcessing"
              :isItemSelected="isItemSelected"
              :isAllSelectedInRound="isAllSelectedInRound"
              @toggle-select-all-in-round="toggleSelectAllInRound"
              @toggle-select-item="toggleSelectItem"
              @approve-round="approveRound"
              @reject-round="rejectRound"
              @reject-single-item="rejectSingleItem"
              @delete-table-order="deleteTableOrder"
              @print-kitchen="handlePrintKitchen"
            />
          </template>

        </div>

        <!-- 🔴 4. FOOTER: THANH HÀNH ĐỘNG DUYỆT & TỪ CHỐI NHIỀU MÓN KHI CÓ TICK CHECKBOX -->
        <div
          v-if="activeTab === 'pending' && selectedItemIds.size > 0"
          class="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 shadow-lg animate-fade-in"
        >
          <div class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>Đã chọn:</span>
            <span class="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-sm font-black border border-blue-100">
              {{ selectedItemIds.size }}
            </span>
            <span>món</span>
          </div>

          <div class="flex items-center gap-2.5">
            <!-- NÚT TỪ CHỐI CÁC MÓN ĐÃ CHỌN -->
            <button
              @click="handleRejectSelected"
              :disabled="isActionProcessing"
              class="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 disabled:opacity-50 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Từ chối đã chọn ({{ selectedItemIds.size }})</span>
            </button>

            <!-- NÚT DUYỆT CÁC MÓN ĐÃ CHỌN -->
            <button
              @click="handleApproveSelected"
              :disabled="isActionProcessing"
              class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Duyệt đã chọn ({{ selectedItemIds.size }})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import OrderManagementHeader from './order-management/OrderManagementHeader.vue';
import OrderManagementTabs from './order-management/OrderManagementTabs.vue';
import OrderManagementTableGroup from './order-management/OrderManagementTableGroup.vue';
import OrderManagementEmptyState from './order-management/OrderManagementEmptyState.vue';
import { usePosOrderManagement } from '../composables/usePosOrderManagement';
import { usePosPrinter } from '../composables/usePosPrinter';
import type { DeliveryNoteWithRoundsModel, OrderRoundModel } from '@/shared/types/deliveryNote.types';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const {
  activeTab,
  orders,
  isLoading,
  isActionProcessing,
  pendingCount,
  approvedCount,
  selectedItemIds,
  getTableName,
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
} = usePosOrderManagement(() => props.isOpen);

const { printKitchenFromCart } = usePosPrinter();

const close = () => {
  emit('close');
};

const handleApproveSelected = async () => {
  // Lấy noteId của đơn đầu tiên có món được tick
  const firstOrder = orders.value.find(o => 
    o.noteItems?.some(i => selectedItemIds.value.has(i.noteItemId))
  );
  if (firstOrder && firstOrder.noteId) {
    await approveSelectedItems(firstOrder.noteId);
  }
};

const handleRejectSelected = async () => {
  // Lấy noteId của đơn đầu tiên có món được tick
  const firstOrder = orders.value.find(o => 
    o.noteItems?.some(i => selectedItemIds.value.has(i.noteItemId))
  );
  if (firstOrder && firstOrder.noteId) {
    await rejectSelectedItems(firstOrder.noteId);
  }
};

const handlePrintKitchen = async (order: DeliveryNoteWithRoundsModel, round?: OrderRoundModel) => {
  const items = round?.items || order.noteItems || [];
  const fakeTable: any = {
    id: order.targetId,
    name: getTableName(order.targetId, order.name),
    customerName: order.customerName,
    noteId: order.noteId
  };

  const cartItemsForPrint: any[] = items.map(i => ({
    product: {
      productId: i.productId,
      productName: i.prodName || i.productCode,
      productCode: i.productCode,
      retailUnitName: i.unit,
      retailOutPrice: i.price
    },
    quantity: i.quantity
  }));

  await printKitchenFromCart(fakeTable, cartItemsForPrint);
};

const emptyTitle = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return 'Không có đơn hàng mới nào';
    case 'approved':
      return 'Chưa có đơn hàng nào được duyệt';
    case 'rejected':
      return 'Không có đơn hàng nào bị từ chối';
    default:
      return 'Hiện tại không có đơn hàng nào đang hoạt động';
  }
});

const emptyDesc = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return 'Khi khách hàng quét mã QR tại bàn và gửi yêu cầu gọi món, danh sách sẽ tự động hiển thị ở đây.';
    case 'approved':
      return 'Các món ăn và lượt gọi món sau khi thu ngân duyệt sẽ chuyển sang đây.';
    case 'rejected':
      return 'Danh sách các món ăn bị từ chối phục vụ.';
    default:
      return 'Danh sách tất cả các đơn hàng từ trước đến nay của các bàn.';
  }
});
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.97) translateZ(0); }
  to { opacity: 1; transform: scale(1) translateZ(0); }
}

.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}

.animate-scale-up {
  animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.gpu-scroll {
  -webkit-overflow-scrolling: touch;
  transform: translateZ(0);
}
</style>
