<template>
  <div class="p-2.5 sm:p-3 bg-white hover:bg-slate-50/80 transition-all border-b border-slate-100 flex items-center gap-2 sm:gap-3 text-xs group">
    
    <!-- 1. STT TRONG VÒNG TRÒN DỊU -->
    <div class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100/80 text-slate-500 font-extrabold text-[10px] sm:text-[11px] flex items-center justify-center shrink-0">
      {{ index + 1 }}
    </div>

    <!-- 2. TÊN SẢN PHẨM & BADGE ĐƠN VỊ TÍNH NẰM CẠNH NHAU (HOÀN TOÀN TỰ ĐỘNG XUỐNG HÀNG TRÊN MOBILE ĐỂ KHÔNG BỊ TRUY CẮT "B... CÁI") -->
    <div class="flex-1 min-w-0 pr-1">
      <div class="flex flex-wrap items-center gap-1.5">
        <h5 class="font-bold text-slate-800 text-xs sm:text-sm leading-snug group-hover:text-blue-600 transition-colors break-words max-w-full" :title="item.product.productName">
          {{ item.product.productName }}
        </h5>
        <!-- BADGE ĐƠN VỊ TÍNH HIỆN ĐẠI (CHỮ BLUE DỊU) -->
        <span v-if="item.product.retailUnitName" class="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-extrabold text-[10px] shrink-0 border border-blue-100">
          {{ item.product.retailUnitName }}
        </span>
      </div>

      <!-- ĐƠN GIÁ NHỎ PHÍA DƯỚI -->
      <div class="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
        Đơn giá: <span class="font-semibold text-slate-600">{{ formatPriceOnly(item.product.retailOutPrice) }}đ</span>
      </div>
    </div>

    <!-- 3. BỘ TĂNG GIẢM SỐ LƯỢNG MÓN (- 1 +) KHUNG THON GỌN TRÊN MOBILE -->
    <div class="flex items-center bg-slate-100/80 border border-slate-200/60 rounded-xl p-0.5 shadow-2xs shrink-0">
      <!-- NÚT GIẢM (-) -->
      <button
        @click="$emit('decrease')"
        class="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-black flex items-center justify-center text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
        title="Giảm số lượng"
      >
        -
      </button>

      <!-- SỐ LƯỢNG MÓN -->
      <span class="w-5 sm:w-7 text-center font-extrabold text-xs text-blue-700 select-none">
        {{ item.quantity }}
      </span>

      <!-- NÚT TĂNG (+) XANH DƯƠNG -->
      <button
        @click="$emit('increase')"
        class="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black flex items-center justify-center text-xs shadow-xs shadow-blue-500/25 transition-all cursor-pointer"
        title="Tăng số lượng"
      >
        +
      </button>
    </div>

    <!-- 4. THÀNH TIỀN CHỮ XANH NỔI BẬT KHÔNG BỊ CO NÉN -->
    <div class="shrink-0 text-right font-black text-blue-600 text-xs sm:text-base tracking-tight min-w-[55px] sm:min-w-[75px]">
      {{ formatMoney((item.product.retailOutPrice || 0) * item.quantity) }}
    </div>

    <!-- 5. THAO TÁC: NOTE & THÙNG RÁC XÓA (NÚT PHÓNG TO RỘNG RÃI DỄ CHẠM BẤM) -->
    <div class="flex items-center gap-1.5 shrink-0 pl-0.5">
      <!-- ICON GHI CHÚ (NÚT VÀ ICON ĐƯỢC PHÓNG TO) -->
      <button
        @click="$emit('note')"
        class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100/70 text-slate-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all cursor-pointer border border-slate-200/80 active:scale-95 shadow-2xs"
        title="Ghi chú món"
      >
        <svg class="w-5 h-5 sm:w-5.5 sm:h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 10h8M8 14h5m-5 4h8a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>

      <!-- ICON THÙNG RÁC XÓA (NÚT VÀ ICON ĐƯỢC PHÓNG TO) -->
      <button
        @click="$emit('remove')"
        class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100/70 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer border border-slate-200/80 active:scale-95 shadow-2xs"
        title="Xóa món khỏi giỏ"
      >
        <svg class="w-5 h-5 sm:w-5.5 sm:h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { PosProductItem } from '../types/products.types';

export interface CartItem {
  product: PosProductItem;
  quantity: number;
}

withDefaults(
  defineProps<{
    item: CartItem;
    index: number;
  }>(),
  {
    index: 0
  }
);

defineEmits<{
  (e: 'increase'): void;
  (e: 'decrease'): void;
  (e: 'remove'): void;
  (e: 'note'): void;
}>();

const formatPriceOnly = (val?: number): string => {
  if (!val && val !== 0) return '0';
  return val.toLocaleString('vi-VN');
};

const formatMoney = (val: number): string => {
  if (!val && val !== 0) return '0đ';
  return val.toLocaleString('vi-VN') + 'đ';
};
</script>
