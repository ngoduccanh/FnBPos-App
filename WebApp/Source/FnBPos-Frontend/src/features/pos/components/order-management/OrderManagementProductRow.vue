<template>
  <div class="py-3 px-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
    <!-- BÊN TRÁI: CHECKBOX + TÊN MÓN + SỐ LƯỢNG + BADGE TRẠNG THÁI -->
    <div class="flex items-center gap-3 min-w-0">
      <!-- CHECKBOX CHỌN MÓN (ở tab Mới/Pending) -->
      <input
        v-if="showCheckbox"
        type="checkbox"
        :checked="isSelected"
        @change="$emit('toggle-select', item.noteItemId)"
        class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />

      <!-- TÊN MÓN & SỐ LƯỢNG -->
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-extrabold text-sm text-slate-900 truncate">
            {{ item.prodName || item.productCode || 'Món ăn' }}
          </span>

          <!-- SỐ LƯỢNG MÓN -->
          <span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-black">
            x{{ item.quantity }}
          </span>

          <!-- BADGE TRẠNG THÁI MÓN VỚI ICON TRẮNG CHUYÊN NGHIỆP -->
          <span
            class="px-2.5 py-0.5 rounded-lg text-[11px] font-black flex items-center gap-1.5 shadow-2xs text-white"
            :class="statusBadgeBgClass"
          >
            <!-- ICON SVG TRẮNG -->
            <svg v-if="item.productStatusId === 0" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else-if="item.productStatusId === 1" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else-if="item.productStatusId === 2 || item.productStatusId === 3 || item.productStatusId === 4" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <svg v-else class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>

            <span>{{ statusBadgeLabel }}</span>
          </span>
        </div>

        <span v-if="item.unit" class="text-[11px] text-slate-400 font-semibold block mt-0.5">
          {{ item.unit }}
        </span>
      </div>
    </div>

    <!-- BÊN PHẢI: GIÁ TIỀN + NÚT TỪ CHỐI LẺ -->
    <div class="flex items-center gap-3 shrink-0">
      <span class="font-black text-sm text-slate-800">
        {{ formatCurrency(item.totalAmount || (item.price * item.quantity)) }}
      </span>

      <!-- NÚT TỪ CHỐI LẺ 1 MÓN (ở tab Mới/Pending) -->
      <button
        v-if="showRejectBtn && item.productStatusId === 0"
        @click="$emit('reject-item', item.noteItemId)"
        class="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-black flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
        title="Từ chối món này"
      >
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProductDeliveryItem } from '@/shared/types/productDeliveryItem.types';

const props = defineProps<{
  item: ProductDeliveryItem;
  showCheckbox?: boolean;
  isSelected?: boolean;
  showRejectBtn?: boolean;
}>();

defineEmits<{
  (e: 'toggle-select', itemId: number): void;
  (e: 'reject-item', itemId: number): void;
}>();

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

// Cấu hình hiển thị Badge trạng thái món theo EOrderItemStatus
const statusBadgeLabel = computed(() => {
  switch (props.item.productStatusId) {
    case 0:
      return 'Chờ duyệt';
    case 1:
      return 'Đã nhận món';
    case 2:
      return 'Từ chối';
    case 3:
      return 'Đã hủy';
    case 4:
      return 'Đã xóa';
    default:
      return 'Đơn đã đặt';
  }
});

const statusBadgeBgClass = computed(() => {
  switch (props.item.productStatusId) {
    case 0:
      return 'bg-amber-500';
    case 1:
      return 'bg-emerald-500';
    case 2:
    case 3:
    case 4:
      return 'bg-rose-500';
    default:
      return 'bg-blue-600';
  }
});
</script>
