<template>
  <!-- 🛒 DANH SÁCH MÓN ĐÃ CHỌN HOẶC TRẠNG THÁI GIỎ HÀNG RỖNG -->
  <div class="flex-1 flex flex-col overflow-hidden bg-white">
    
    <!-- HEADER GIỎ HÀNG CHUẨN HIỆN ĐẠI MINIMALIST -->
    <div class="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 select-none">
      <span>DANH SÁCH MÓN ĐÃ CHỌN</span>
      <span>THÀNH TIỀN</span>
    </div>

    <!-- BODY DANH SÁCH MÓN ĐÃ CHỌN CUỘN TRONG (INTERNAL SCROLL) -->
    <div class="flex-1 overflow-y-auto custom-blue-scrollbar">
      <!-- TRẠNG THÁI GIỎ HÀNG RỖNG -->
      <div v-if="cartItems.length === 0" class="h-full flex flex-col items-center justify-center py-16 text-cyan-500 space-y-3">
        <div class="w-20 h-20 rounded-full bg-cyan-50 flex items-center justify-center border border-cyan-100 shadow-inner">
          <svg class="w-10 h-10 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
        <p class="text-xs font-bold text-cyan-500">Giỏ hàng đang trống</p>
      </div>

      <!-- DANH SÁCH THẺ DẠNG BẢNG CHUẨN IPOS -->
      <div v-else class="divide-y divide-slate-100 contain-content">
        <PosCartItemCard
          v-for="(item, index) in cartItems"
          :key="item.product.productId"
          :item="item"
          :index="index"
          @increase="$emit('increase', index)"
          @decrease="$emit('decrease', index)"
          @remove="$emit('remove', index)"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import PosCartItemCard from '../PosCartItemCard.vue';
import type { CartItem } from '../../mappers/orderDetailMapper';

defineProps<{
  cartItems: CartItem[];
}>();

defineEmits<{
  (e: 'increase', index: number): void;
  (e: 'decrease', index: number): void;
  (e: 'remove', index: number): void;
}>();
</script>
