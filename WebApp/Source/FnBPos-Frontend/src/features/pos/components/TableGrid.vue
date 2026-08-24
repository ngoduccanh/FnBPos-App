<template>
  <div class="flex-1 p-6 overflow-y-auto bg-slate-50">
    
    <!-- 🔄 1. TRẠNG THÁI LOADING (SKELETON SPINNER) -->
    <div v-if="isLoading" class="h-full flex flex-col items-center justify-center py-16 gap-3">
      <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-slate-500">Đang nạp sơ đồ bàn cửa hàng...</p>
    </div>

    <!-- ⚠️ 2. TRẠNG THÁI BÁO LỖI (ERROR STATE) -->
    <div v-else-if="error" class="h-full flex flex-col items-center justify-center py-16">
      <div class="p-6 bg-red-50 border border-red-200 rounded-2xl text-center max-w-md space-y-2">
        <p class="text-red-600 font-bold text-sm">⚠️ {{ error }}</p>
        <button
          @click="$emit('retry')"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
        >
          Thử lại
        </button>
      </div>
    </div>

    <!-- 📭 3. TRẠNG THÁI TRỐNG (EMPTY STATE) -->
    <div v-else-if="tables.length === 0" class="h-full flex flex-col items-center justify-center py-16 text-center space-y-3">
      <div class="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-3xl text-slate-400">
        🪑
      </div>
      <h4 class="font-bold text-slate-700 text-sm">Chưa có dữ liệu bàn nào</h4>
      <p class="text-xs text-slate-500 max-w-xs">Không tìm thấy danh sách bàn phù hợp trong khu vực này.</p>
    </div>

    <!-- 🟢 4. LƯỚI SƠ ĐỒ BÀN (DƯỚI 18 INCH = 4 BÀN / HÀNG, TRÊN 18 INCH = 5 BÀN / HÀNG) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 min-[1800px]:grid-cols-5 gap-4 sm:gap-5 contain-content">
      <TableCard
        v-for="table in tables"
        :key="table.id"
        :table="table"
        :isSelected="selectedTableId === table.id"
        @select="$emit('select-table', table)"
        @open-qr="$emit('open-qr', table)"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import TableCard from './TableCard.vue';
import type { PosTableItem } from '../types/tables.types';

defineProps<{
  tables: PosTableItem[];
  selectedTableId?: number;
  isLoading?: boolean;
  error?: string | null;
}>();

defineEmits<{
  (e: 'select-table', table: PosTableItem): void;
  (e: 'open-qr', table: PosTableItem): void;
  (e: 'retry'): void;
}>();
</script>
