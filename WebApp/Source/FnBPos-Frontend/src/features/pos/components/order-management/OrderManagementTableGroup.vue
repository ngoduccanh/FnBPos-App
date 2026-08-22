<template>
  <div class="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
    
    <!-- HEADER BÀN (TABLE HEADER) -->
    <div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <!-- ICON BÀN SVG MÀU TRẮNG TRÊN NỀN GRADIENT XANH -->
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M10 3v18M14 3v18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        </div>
        <div>
          <h4 class="font-black text-base text-slate-900 leading-tight">
            {{ resolvedTableName }}
          </h4>
          <p class="text-xs text-slate-400 font-semibold mt-0.5">
            {{ order.customerName || 'Khách lẻ' }} • {{ order.prodCount }} món • 
            <strong class="text-blue-600 font-black">{{ formatCurrency(order.totalAmount) }}</strong>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- NÚT XÓA ĐƠN HÀNG CỦA BÀN NÀY (ở tab Đơn hiện tại) -->
        <button
          v-if="showDeleteTableBtn"
          @click="$emit('delete-table-order', order.targetId, order.noteId)"
          class="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border border-red-200/60"
        >
          <svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Xóa Đơn hàng</span>
        </button>
      </div>
    </div>

    <!-- DANH SÁCH CÁC LƯỢT GỌI MÓN (ROUNDS) CỦA BÀN -->
    <div class="space-y-3">
      <OrderManagementRoundItem
        v-for="round in order.orderRounds || []"
        :key="round.roundNumber"
        :round="round"
        :showCheckbox="showCheckbox"
        :isAllSelected="isAllSelectedInRound(round.items || [])"
        :showApproveBtn="showApproveBtn"
        :showPrintBtn="showPrintBtn"
        :showRejectBtn="showRejectBtn"
        :isProcessing="isProcessing"
        :isItemSelected="isItemSelected"
        @toggle-select-all="$emit('toggle-select-all-in-round', round.items || [])"
        @toggle-select-item="$emit('toggle-select-item', $event)"
        @approve-round="$emit('approve-round', order.noteId, $event)"
        @reject-round="$emit('reject-round', order.noteId, $event)"
        @reject-single-item="$emit('reject-single-item', order.noteId, $event)"
        @print-kitchen="$emit('print-kitchen', order, round)"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import OrderManagementRoundItem from './OrderManagementRoundItem.vue';
import type { DeliveryNoteWithRoundsModel, OrderRoundModel } from '@/shared/types/deliveryNote.types';
import type { ProductDeliveryItem } from '@/shared/types/productDeliveryItem.types';

const props = defineProps<{
  order: DeliveryNoteWithRoundsModel;
  showCheckbox?: boolean;
  showApproveBtn?: boolean;
  showPrintBtn?: boolean;
  showRejectBtn?: boolean;
  showDeleteTableBtn?: boolean;
  isProcessing?: boolean;
  getTableName?: (targetId: number, fallbackName?: string) => string;
  isItemSelected: (itemId: number) => boolean;
  isAllSelectedInRound: (items: ProductDeliveryItem[]) => boolean;
}>();

defineEmits<{
  (e: 'toggle-select-all-in-round', items: ProductDeliveryItem[]): void;
  (e: 'toggle-select-item', itemId: number): void;
  (e: 'approve-round', noteId: number, items: ProductDeliveryItem[]): void;
  (e: 'reject-round', noteId: number, items: ProductDeliveryItem[]): void;
  (e: 'reject-single-item', noteId: number, itemId: number): void;
  (e: 'delete-table-order', targetId: number, noteId: number): void;
  (e: 'print-kitchen', order: DeliveryNoteWithRoundsModel, round: OrderRoundModel): void;
}>();

const resolvedTableName = computed(() => {
  if (props.getTableName) {
    return props.getTableName(props.order.targetId, props.order.name);
  }
  return props.order.name || (props.order.targetId ? `Bàn #${props.order.targetId}` : 'Mang về');
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};
</script>
