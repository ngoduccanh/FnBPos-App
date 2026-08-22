<template>
  <div class="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-2xs">
    
    <!-- HEADER LƯỢT GỌI MÓN (ORDER ROUND) -->
    <div class="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <!-- CHECKBOX CHỌN CẢ LƯỢT (ở tab Mới/Pending) -->
        <input
          v-if="showCheckbox"
          type="checkbox"
          :checked="isAllSelected"
          @change="$emit('toggle-select-all')"
          class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />

        <span class="text-xs font-black text-blue-600 uppercase tracking-wide">
          LƯỢT #{{ round.roundNumber }}
        </span>

        <span v-if="round.time" class="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ formatTime(round.time) }}</span>
        </span>
      </div>

      <div class="flex items-center gap-2">
        <!-- NÚT TỪ CHỐI CẢ LƯỢT (ở tab Mới/Pending) -->
        <button
          v-if="showRejectBtn && showApproveBtn"
          @click="$emit('reject-round', round.items || [])"
          :disabled="isProcessing"
          class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 disabled:opacity-50 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          title="Từ chối toàn bộ món trong lượt này"
        >
          <svg class="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Từ chối lượt</span>
        </button>

        <!-- NÚT DUYỆT CẢ LƯỢT (ở tab Mới/Pending) -->
        <button
          v-if="showApproveBtn"
          @click="$emit('approve-round', round.items || [])"
          :disabled="isProcessing"
          class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
        >
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span>Duyệt lượt này</span>
        </button>

        <!-- NÚT IN BẾP CHO LƯỢT (ở tab Đã duyệt / Đơn hiện tại) -->
        <button
          v-if="showPrintBtn"
          @click="$emit('print-kitchen', round)"
          class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
          title="In phiếu bếp cho đợt này"
        >
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>In bếp</span>
        </button>
      </div>
    </div>

    <!-- DANH SÁCH MÓN TRONG LƯỢT -->
    <div class="divide-y divide-slate-100">
      <OrderManagementProductRow
        v-for="item in round.items || []"
        :key="item.noteItemId || item.productId"
        :item="item"
        :showCheckbox="showCheckbox"
        :isSelected="isItemSelected(item.noteItemId)"
        :showRejectBtn="showRejectBtn"
        @toggle-select="$emit('toggle-select-item', $event)"
        @reject-item="$emit('reject-single-item', item.noteItemId)"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import OrderManagementProductRow from './OrderManagementProductRow.vue';
import type { OrderRoundModel } from '@/shared/types/deliveryNote.types';
import type { ProductDeliveryItem } from '@/shared/types/productDeliveryItem.types';

const props = defineProps<{
  round: OrderRoundModel;
  showCheckbox?: boolean;
  isAllSelected?: boolean;
  showApproveBtn?: boolean;
  showPrintBtn?: boolean;
  showRejectBtn?: boolean;
  isProcessing?: boolean;
  isItemSelected: (itemId: number) => boolean;
}>();

defineEmits<{
  (e: 'toggle-select-all'): void;
  (e: 'toggle-select-item', itemId: number): void;
  (e: 'approve-round', items: ProductDeliveryItem[]): void;
  (e: 'reject-round', items: ProductDeliveryItem[]): void;
  (e: 'reject-single-item', itemId: number): void;
  (e: 'print-kitchen', round: OrderRoundModel): void;
}>();

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
  } catch {}
  return timeStr;
};
</script>
