<template>
  <div
    @click="$emit('add-to-cart', product)"
    class="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-lg transition-all duration-200 group cursor-pointer flex flex-col justify-between overflow-hidden select-none relative active:scale-[0.98] h-full"
  >
    <!-- TOP: KHU VỰC ẢNH SẢN PHẨM HOẶC ICON (CHUẨN SẮC TRẮNG LIỀN MẠCH) -->
    <div class="relative w-full aspect-[4/3] bg-white overflow-hidden shrink-0 flex items-center justify-center">
      
      <!-- 🖼️ ẢNH THUMBNAIL SẢN PHẨM -->
      <img
        v-if="product.imageThumbUrl || product.imageThumbBase64"
        :src="product.imageThumbUrl || product.imageThumbBase64 || ''"
        :alt="product.productName"
        class="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300 ease-out"
      />

      <!-- 🖼️ PLACEHOLDER ICON VECTOR MÓN ĂN THƯƠNG HIỆU (KHI CHƯA CÓ ẢNH) -->
      <div v-else class="w-full h-full flex flex-col items-center justify-center bg-blue-50/50 text-blue-400 group-hover:text-blue-500 transition-colors">
        <svg class="w-10 h-10 text-blue-300 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>

      <!-- 🏷️ BADGE GIÁ NỔI BẬT NẰM ĐÈ LÊN ẢNH -->
      <div class="absolute bottom-2 left-2 z-10">
        <span class="px-2.5 py-1 rounded-lg bg-orange-500 text-white font-extrabold text-xs shadow-sm border border-orange-400 tracking-tight">
          {{ product.formattedPrice }}
        </span>
      </div>

      <!-- BADGE HOT GÓC TRÊN TRÁI -->
      <div v-if="product.isHot" class="absolute top-2 left-2 z-10">
        <span class="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[9px] shadow-xs uppercase tracking-wider">
          🔥 HOT
        </span>
      </div>

      <!-- BADGE TỒN KHO GÓC TRÊN PHẢI -->
      <div v-if="product.lastInventoryQuantity !== undefined" class="absolute top-2 right-2 z-10">
        <span
          class="px-2 py-0.5 rounded-md font-bold text-[10px] shadow-xs border"
          :class="[
            product.lastInventoryQuantity < 0
              ? 'bg-blue-600 text-white border-blue-500'
              : product.lastInventoryQuantity === 0
              ? 'bg-slate-800 text-white border-slate-700'
              : 'bg-emerald-600 text-white border-emerald-500'
          ]"
        >
          Tồn: {{ product.lastInventoryQuantity }}
        </span>
      </div>
    </div>

    <!-- BOTTOM: KHU VỰC TÊN MÓN ĂN & ĐƠN VỊ TÍNH NẰM DƯỚI GÓC NỔI BẬT TỰ VỰNG (CHUẨN IPOS KHÔNG BỊ TO GÂY THÔ) -->
    <div class="p-3 flex flex-col justify-between flex-1 bg-white">
      <div>
        <!-- TÊN MÓN ĂN / SẢN PHẨM -->
        <h4 class="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {{ product.productName }}
        </h4>

        <!-- ROW CÙNG HÀNG TRÊN CÙNG 1 DÒNG: MÃ SP, ĐƠN VỊ TÍNH NẰM CẠNH NÚT "+ THÊM" -->
        <div class="flex items-center justify-between text-[11px] text-slate-400 font-medium mt-2 pt-1 border-t border-slate-100/60">
          <!-- TRÁI: MÃ SẢN PHẨM & BADGE ĐƠN VỊ TÍNH CÙNG DÒNG -->
          <div class="flex items-center gap-1.5 min-w-0">
            <span v-if="product.productCode" class="truncate max-w-[70px] text-slate-400 font-medium text-[10px]">
              {{ product.productCode }}
            </span>
            <span v-if="product.retailUnitName" class="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold text-[10px] shrink-0">
              {{ product.retailUnitName }}
            </span>
          </div>

          <!-- PHẢI: NÚT "+ THÊM" NẰM CÙNG HÀNG NGANG (ON THE EXACT SAME LINE) -->
          <div class="shrink-0">
            <!-- TRẠNG THÁI 1: NÚT "+ Thêm" -->
            <button
              v-if="cartQuantity === 0"
              @click.stop="$emit('add-to-cart', product)"
              class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
            >
              <span>+ Thêm</span>
            </button>

            <!-- TRẠNG THÁI 2: BỘ CỘNG TRỪ SỐ LƯỢNG (- 1 +) RỘNG RÃI RÕ RÀNG DỄ BẤM -->
            <div
              v-else
              @click.stop
              class="flex items-center justify-between gap-1.5 bg-blue-50/90 border border-blue-200 rounded-xl p-1 shadow-2xs min-w-[76px]"
            >
              <!-- NÚT GIẢM (-) RỘNG HƠN -->
              <button
                @click.stop="$emit('decrease-cart', product)"
                class="w-6 h-6 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-black flex items-center justify-center text-xs shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
                title="Giảm số lượng"
              >
                -
              </button>

              <!-- HIỂN THỊ SỐ LƯỢNG ĐÃ CHỌN -->
              <span class="font-extrabold text-blue-700 text-xs px-1 select-none text-center min-w-[16px]">
                {{ cartQuantity }}
              </span>

              <!-- NÚT TĂNG (+) RỘNG HƠN -->
              <button
                @click.stop="$emit('increase-cart', product)"
                class="w-6 h-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center justify-center text-xs shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                title="Tăng số lượng"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PosProductItem } from '../types/products.types';

withDefaults(
  defineProps<{
    product: PosProductItem;
    cartQuantity?: number;
  }>(),
  {
    cartQuantity: 0
  }
);

defineEmits<{
  (e: 'add-to-cart', product: PosProductItem): void;
  (e: 'increase-cart', product: PosProductItem): void;
  (e: 'decrease-cart', product: PosProductItem): void;
}>();
</script>
