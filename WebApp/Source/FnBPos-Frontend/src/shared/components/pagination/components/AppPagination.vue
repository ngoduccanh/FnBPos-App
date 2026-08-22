<template>
  <div v-if="totalPages > 0" class="fnb-pagination-container">
    
    <!-- 1. THÔNG TIN TỔNG SỐ BẢN GHI -->
    <div v-if="showTotal" class="fnb-pagination-info">
      Hiển thị <span class="fnb-pagination-info-number">{{ fromItem }}</span> -
      <span class="fnb-pagination-info-number">{{ toItem }}</span>
      trong tổng số <span class="fnb-pagination-info-number">{{ formatNumber(totalItems) }}</span> bản ghi
    </div>

    <!-- 2. CỤM NÚT CHUYỂN TRANG -->
    <div class="fnb-pagination-nav">
      <!-- VỀ TRANG ĐẦU -->
      <button
        type="button"
        @click="goToPage(0)"
        :disabled="isFirstPage"
        title="Trang đầu"
        class="fnb-pagination-btn"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      <!-- TRANG TRƯỚC -->
      <button
        type="button"
        @click="goToPage(currentPageIndex - 1)"
        :disabled="isFirstPage"
        title="Trang trước"
        class="fnb-pagination-btn"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- DANH SÁCH SỐ TRANG -->
      <template v-for="(page, idx) in visiblePages" :key="idx">
        <span v-if="page === '...'" class="fnb-pagination-ellipsis">
          ...
        </span>

        <button
          v-else
          type="button"
          @click="goToPage((page as number) - 1)"
          :class="[
            'fnb-pagination-btn',
            currentPageIndex === (page as number) - 1 ? 'fnb-pagination-btn-active' : ''
          ]"
        >
          {{ page }}
        </button>
      </template>

      <!-- TRANG SAU -->
      <button
        type="button"
        @click="goToPage(currentPageIndex + 1)"
        :disabled="isLastPage"
        title="Trang sau"
        class="fnb-pagination-btn"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- TRANG CUỐI -->
      <button
        type="button"
        @click="goToPage(totalPages - 1)"
        :disabled="isLastPage"
        title="Trang cuối"
        class="fnb-pagination-btn"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- 3. BỘ CHỌN SỐ LƯỢNG BẢN GHI TRÊN MỖI TRANG -->
    <div v-if="showSizeChanger" class="fnb-pagination-size-changer">
      <span class="text-xs text-slate-500 hidden sm:inline">Hiển thị:</span>
      <select
        :value="pageSize"
        @change="onPageSizeChange"
        class="fnb-pagination-select"
      >
        <option v-for="option in pageSizeOptions" :key="option" :value="option">
          {{ option }} / trang
        </option>
      </select>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { PaginationProps, PaginationEmits } from '../types/pagination.types';
import { usePagination } from '../composables/usePagination';
import '../styles/pagination.css';

const props = withDefaults(defineProps<PaginationProps>(), {
  pageIndex: 0,
  pageSize: 10,
  pageSizeOptions: () => [10, 20, 50, 100],
  showSizeChanger: true,
  showTotal: false,
  maxPageButtons: 3
});

const emit = defineEmits<PaginationEmits>();

const {
  currentPageIndex,
  totalPages,
  isFirstPage,
  isLastPage,
  fromItem,
  toItem,
  visiblePages,
  pageSizeOptions,
  showSizeChanger,
  showTotal,
  goToPage,
  onPageSizeChange,
  formatNumber
} = usePagination(props, emit);
</script>
