<template>
  <!-- 🟢 CỘT BÊN TRÁI: DANH SÁCH SẢN PHẨM & THANH NHÓM SẢN PHẨM Ở TRÊN -->
  <div class="flex-1 flex flex-col bg-slate-50/50 overflow-hidden min-w-0 relative border-r border-slate-200">
    
    <!-- 📌 1A. THANH TÌM KIẾM & THAO TÁC (SEARCH BAR & REFRESH BUTTON) -->
    <div class="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
      
      <!-- THÀNH PHẦN SEARCH DÙNG CHUNG AppSearchInput TỪ SHARED COMPONENTS -->
      <div class="flex-1 min-w-[200px]">
        <AppSearchInput
          :model-value="searchQuery"
          @update:model-value="$emit('update:searchQuery', $event)"
          placeholder="Tìm tên sản phẩm, mã SKU..."
          :delay="500"
        />
      </div>

      <div class="flex items-center gap-2">
        <!-- NÚT MỞ GIỎ HÀNG TRÊN MOBILE & TABLET -->
        <button
          @click="$emit('open-mobile-cart')"
          class="lg:hidden w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25 active:scale-95 transition-all shrink-0 cursor-pointer relative"
          title="Mở giỏ hàng"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <span v-if="cartTotalQuantity > 0" class="absolute -top-1.5 -right-1.5 min-w-[18px] h-4 px-1 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center border border-white shadow-xs">
            {{ cartTotalQuantity }}
          </span>
        </button>

        <!-- NÚT REFRESH TẢI LẠI SẢN PHẨM & NHÓM SẢN PHẨM -->
        <AppRefreshButton
          :isRefreshing="isRefreshing"
          :cooldownSeconds="10"
          @click="$emit('reload-products')"
        />
      </div>
    </div>

    <!-- 📌 1B. THANH LỌC NHÓM SẢN PHẨM CUỘN NGANG -->
    <div class="bg-white border-b border-slate-200/90 px-3 py-2 flex items-center gap-2 overflow-x-auto custom-blue-scrollbar shrink-0 shadow-2xs">
      <!-- NÚT TẤT CẢ NHÓM SẢN PHẨM -->
      <button
        @click="$emit('update:selectedGroupId', 0)"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 flex items-center gap-1.5"
        :class="[
          selectedGroupId === 0
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25 scale-[1.02]'
            : 'bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200'
        ]"
      >
        <span>TẤT CẢ</span>
      </button>

      <!-- DANH SÁCH NHÓM SẢN PHẨM -->
      <button
        v-for="group in productGroups"
        :key="group.id"
        @click="$emit('update:selectedGroupId', group.id)"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap"
        :class="[
          selectedGroupId === group.id
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25 scale-[1.02]'
            : 'bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200'
        ]"
      >
        {{ group.name }}
      </button>
    </div>

    <!-- 📌 1C. KHU VỰC LƯỚI SẢN PHẨM (TOUCH SWIPE CẢM ỨNG & ANIMATION LƯỚT MƯỢT) -->
    <div
      ref="gridContainerRef"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
      class="flex-1 overflow-y-auto p-3 sm:p-4 custom-blue-scrollbar flex flex-col justify-between touch-pan-y"
    >
      <!-- LOADING STATE -->
      <div v-if="isLoading" class="h-full flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
        <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-semibold">Đang nạp thực đơn món...</p>
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="filteredProducts.length === 0" class="h-full flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
        <svg class="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p class="text-xs font-semibold">Không tìm thấy món ăn nào</p>
      </div>

      <!-- LƯỚI RENDER 20 MÓN VỚI HIỆU ỨNG SLIDE MƯỢT NHẸ -->
      <Transition :name="slideTransition" mode="out-in">
        <div
          :key="currentPage"
          class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pb-2 will-change-transform"
        >
          <ProductCard
            v-for="product in pageProducts"
            :key="product.productId"
            :product="product"
            :cart-quantity="getCartQuantity(product.productId)"
            @add-to-cart="$emit('add-to-cart', product)"
            @increase-cart="$emit('add-to-cart', product)"
            @decrease-cart="$emit('decrease-cart', product)"
          />
        </div>
      </Transition>
    </div>

    <!-- 📌 1D. THANH ĐIỀU HƯỚNG TRANG CẢM ỨNG POS (CHỐNG GIẬT LAG 100% TRÊN MÁY ANDROID) -->
    <div
      v-if="!isLoading && filteredProducts.length > PAGE_SIZE"
      class="bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-between gap-2 shrink-0 select-none shadow-sm"
    >
      <!-- NÚT TRANG TRƯỚC -->
      <button
        @click="prevPage"
        :disabled="currentPage === 1"
        class="px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        :class="[
          currentPage === 1
            ? 'bg-slate-100 text-slate-400 border-slate-200'
            : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
        ]"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Trang trước</span>
      </button>

      <!-- THÔNG TIN PHÂN TRANG -->
      <div class="text-xs font-bold text-slate-600 flex items-center gap-1.5">
        <span class="text-blue-600 font-extrabold text-sm">Trang {{ currentPage }}</span>
        <span>/ {{ totalPages }}</span>
        <span class="text-slate-400 font-normal">({{ filteredProducts.length }} món)</span>
      </div>

      <!-- NÚT TRANG SAU -->
      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        :class="[
          currentPage === totalPages
            ? 'bg-slate-100 text-slate-400 border-slate-200'
            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm shadow-blue-500/20'
        ]"
      >
        <span>Trang sau</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import ProductCard from '../ProductCard.vue';
import AppSearchInput from '@/shared/components/search/components/AppSearchInput.vue';
import AppRefreshButton from '@/shared/components/button/components/AppRefreshButton.vue';
import type { PosProductItem } from '../../types/products.types';

const PAGE_SIZE = 20;

const props = defineProps<{
  searchQuery: string;
  cartTotalQuantity: number;
  isRefreshing: boolean;
  selectedGroupId: number;
  productGroups: any[];
  isLoading: boolean;
  filteredProducts: PosProductItem[];
  getCartQuantity: (productId: number) => number;
}>();

defineEmits<{
  (e: 'update:searchQuery', val: string): void;
  (e: 'update:selectedGroupId', id: number): void;
  (e: 'open-mobile-cart'): void;
  (e: 'reload-products'): void;
  (e: 'add-to-cart', product: PosProductItem): void;
  (e: 'decrease-cart', product: PosProductItem): void;
}>();

const gridContainerRef = ref<HTMLElement | null>(null);
const currentPage = ref<number>(1);
const slideTransition = ref<string>('slide-next');

// 1. Tính toán tổng số trang
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.filteredProducts.length / PAGE_SIZE));
});

// 2. Cắt chính xác 20 sản phẩm cho trang hiện tại
const pageProducts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return props.filteredProducts.slice(start, start + PAGE_SIZE);
});

// 3. Điều hướng trang mượt mà
const scrollToTop = () => {
  if (gridContainerRef.value) {
    gridContainerRef.value.scrollTop = 0;
  }
};

const scrollToBottom = () => {
  if (gridContainerRef.value) {
    gridContainerRef.value.scrollTop = gridContainerRef.value.scrollHeight;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    slideTransition.value = 'slide-prev';
    currentPage.value--;
    // ⚡ Khi lướt lên: Đặt vị trí cuộn ở ĐÁY trang trước để người dùng tiếp tục xem từ dưới lên trên!
    setTimeout(() => {
      scrollToBottom();
    }, 10);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    slideTransition.value = 'slide-next';
    currentPage.value++;
    // ⚡ Khi kéo xuống: Đặt vị trí cuộn ở ĐẦU trang để người dùng xem từ trên xuống dưới!
    scrollToTop();
  }
};

// 4. Reset về trang 1 khi lọc nhóm hoặc tìm kiếm
watch(
  [() => props.selectedGroupId, () => props.searchQuery],
  () => {
    slideTransition.value = 'slide-next';
    currentPage.value = 1;
    scrollToTop();
  }
);

// 5. Cử chỉ Vuốt cảm ứng thông minh: Phân biệt chính xác giữa Cuộn Dọc và Vuốt Ngang
let touchStartX = 0;
let touchStartY = 0;

const handleTouchStart = (e: TouchEvent) => {
  if (e.touches && e.touches[0]) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
};

const handleTouchEnd = (e: TouchEvent) => {
  if (totalPages.value <= 1 || !e.changedTouches || !e.changedTouches[0]) return;
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const deltaX = touchStartX - touchEndX;
  const deltaY = touchStartY - touchEndY;

  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  // ⚡ CHỈ KÍCH HOẠT ĐỔI TRANG KHI LÀ THAO TÁC VUỐT NGANG CÓ CHỦ ĐÍCH:
  // 1. Quãng đường lướt ngang rõ ràng (absX >= 45px)
  // 2. Chuyển động thuần ngang vượt trội chiều dọc (absX > absY * 1.8)
  // 3. Độ lệch dọc nhỏ (absY < 40px) -> Triệt tiêu hoàn toàn trường hợp vuốt dọc vô tình lệch tay
  const isIntentionalHorizontalSwipe = absX >= 45 && absX > (absY * 1.8) && absY < 40;

  if (isIntentionalHorizontalSwipe) {
    if (deltaX > 0 && currentPage.value < totalPages.value) {
      nextPage(); // Vuốt sang trái -> Trang sau
    } else if (deltaX < 0 && currentPage.value > 1) {
      prevPage(); // Vuốt sang phải -> Trang trước
    }
  }
};
</script>

<style scoped>
/* ⚡ HIỆU ỨNG SLIDE MƯỢT MÀ CHUẨN GPU 60FPS CHO MÁY POS */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: opacity 0.2s ease-out, transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  will-change: transform, opacity;
}

.slide-next-enter-from {
  opacity: 0;
  transform: translate3d(20px, 0, 0);
}

.slide-next-leave-to {
  opacity: 0;
  transform: translate3d(-20px, 0, 0);
}

.slide-prev-enter-from {
  opacity: 0;
  transform: translate3d(-20px, 0, 0);
}

.slide-prev-leave-to {
  opacity: 0;
  transform: translate3d(20px, 0, 0);
}
</style>
