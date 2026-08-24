<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 animate-fade-in"
      @click.self="close"
    >
      <div class="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col transform-gpu will-change-transform">
        
        <!-- 🟢 1. HEADER MODAL -->
        <TableTransferHeader
          :tableName="sourceTable?.name"
          :itemCount="cartItems.length"
          @close="close"
        />

        <!-- 🔵 2. TAB CHUYỂN TOÀN BỘ BÀN / TÁCH BÀN -->
        <TableTransferTabs
          v-model:activeTab="activeTab"
        />

        <!-- 🟡 3. BODY CONTENT -->
        <div class="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          <!-- TAB 1: CHUYỂN TOÀN BỘ BÀN -->
          <TableTransferAllTab
            v-if="activeTab === 'transfer_all'"
            :sourceTable="sourceTable"
            v-model:selectedTargetTable="selectedTargetTable"
            :selectableTables="selectableTables"
            :totalQuantity="cartTotalQuantity"
            :formattedTotalAmount="formattedTotalAmount"
          />

          <!-- TAB 2: TÁCH BÀN (CHUYỂN TỪNG MÓN) -->
          <TableTransferSplitTab
            v-else
            :selectableTables="selectableTables"
            v-model:selectedTargetTable="selectedTargetTable"
            :cartItems="cartItems"
            :getSplitQty="getSplitQty"
            :totalSplitQty="totalSplitQty"
            :totalSplitAmount="totalSplitAmount"
            :formatCurrency="formatCurrency"
            @increase-qty="increaseSplitQty"
            @decrease-qty="decreaseSplitQty"
            @set-all-qty="setAllSplitQty"
          />

        </div>

        <!-- 🔴 4. FOOTER: NÚT XÁC NHẬN / HỦY -->
        <TableTransferFooter
          :activeTab="activeTab"
          :canConfirm="canConfirm"
          :isProcessing="isProcessing"
          @close="close"
          @confirm="handleConfirmTransfer"
        />

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import TableTransferHeader from './table-transfer/TableTransferHeader.vue';
import TableTransferTabs from './table-transfer/TableTransferTabs.vue';
import TableTransferAllTab from './table-transfer/TableTransferAllTab.vue';
import TableTransferSplitTab from './table-transfer/TableTransferSplitTab.vue';
import TableTransferFooter from './table-transfer/TableTransferFooter.vue';
import { useTableTransferModal } from '../composables/useTableTransferModal';
import type { PosTableItem } from '../types/tables.types';
import type { CartItem } from '../mappers/orderDetailMapper';
import type { TransferItemDto } from '../types/tableTransfer.types';

const props = defineProps<{
  isOpen: boolean;
  sourceTable: PosTableItem | null;
  tables: PosTableItem[];
  cartItems: CartItem[];
  isProcessing?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm-transfer', payload: {
    targetTable: PosTableItem;
    isTransferAll: boolean;
    itemsToMove: TransferItemDto[];
  }): void;
}>();

const {
  activeTab,
  selectedTargetTable,
  selectableTables,
  cartTotalQuantity,
  formattedTotalAmount,
  getSplitQty,
  increaseSplitQty,
  decreaseSplitQty,
  setAllSplitQty,
  totalSplitQty,
  totalSplitAmount,
  canConfirm,
  formatCurrency,
  buildTransferPayload
} = useTableTransferModal(
  () => props.isOpen,
  () => props.sourceTable,
  () => props.tables,
  () => props.cartItems
);

const close = () => {
  emit('close');
};

const handleConfirmTransfer = () => {
  const payload = buildTransferPayload();
  if (payload) {
    emit('confirm-transfer', payload);
  }
};
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

.animate-scale-up {
  animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
