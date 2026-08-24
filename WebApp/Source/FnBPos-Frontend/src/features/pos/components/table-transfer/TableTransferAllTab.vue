<template>
  <div class="space-y-6">
    <!-- THÔNG TIN CHUYỂN BÀN NGUỒN ➔ ĐÍCH -->
    <div class="bg-blue-50/90 border border-blue-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-2xs">
      <div class="flex items-center gap-3.5">
        <div class="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
          NGUỒN
        </div>
        <div>
          <h4 class="font-black text-slate-800 text-lg leading-tight">{{ sourceTable?.name }}</h4>
          <p class="text-sm text-slate-500 font-bold mt-0.5">{{ totalQuantity }} món • {{ formattedTotalAmount }}</p>
        </div>
      </div>

      <div class="text-3xl text-blue-600 font-black animate-pulse">➔</div>

      <div class="flex items-center gap-3.5">
        <div
          class="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-base shadow-sm"
          :class="selectedTargetTable ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'"
        >
          ĐÍCH
        </div>
        <div>
          <h4 class="font-black text-lg leading-tight" :class="selectedTargetTable ? 'text-indigo-950' : 'text-slate-400'">
            {{ selectedTargetTable ? selectedTargetTable.name : 'Chưa chọn bàn đích' }}
          </h4>
          <p class="text-sm font-bold mt-0.5" :class="selectedTargetTable ? 'text-indigo-600' : 'text-slate-400'">
            {{ selectedTargetTable ? (selectedTargetTable.status === 'USING' ? 'Đang có khách (Sẽ gộp đơn)' : 'Bàn trống') : 'Hãy chọn bàn bên dưới' }}
          </p>
        </div>
      </div>
    </div>

    <!-- CHỌN BÀN ĐÍCH -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <label class="font-black text-sm text-slate-800 uppercase tracking-wide">
          1. Chọn Bàn Muốn Chuyển Sang:
        </label>
        <span class="text-xs text-slate-400 font-bold">({{ selectableTables.length }} bàn khả dụng)</span>
      </div>

      <!-- LƯỚI DANH SÁCH BÀN -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 max-h-[320px] overflow-y-auto p-1 contain-content">
        <button
          v-for="tbl in selectableTables"
          :key="tbl.id"
          v-memo="[tbl.id, selectedTargetTable?.id === tbl.id, tbl.status]"
          @click="$emit('update:selectedTargetTable', tbl)"
          class="p-4 rounded-2xl border text-left transition-colors duration-100 cursor-pointer flex flex-col justify-between h-24 shadow-2xs"
          :class="[
            selectedTargetTable?.id === tbl.id
              ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-600/30 shadow-md'
              : tbl.status === 'USING'
              ? 'border-blue-200 bg-white hover:border-blue-400'
              : 'border-slate-200 bg-white hover:border-slate-300'
          ]"
        >
          <div class="flex items-center justify-between">
            <span class="font-black text-base text-slate-900">{{ tbl.name }}</span>
            <span
              class="px-2.5 py-1 rounded-lg text-xs font-black uppercase"
              :class="tbl.status === 'USING' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'"
            >
              {{ tbl.status === 'USING' ? 'Có khách' : 'Trống' }}
            </span>
          </div>
          <p class="text-xs text-slate-400 font-medium truncate">{{ tbl.groupName || 'Khu vực chung' }}</p>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PosTableItem } from '../../types/tables.types';

defineProps<{
  sourceTable: PosTableItem | null;
  selectedTargetTable: PosTableItem | null;
  selectableTables: PosTableItem[];
  totalQuantity: number;
  formattedTotalAmount: string;
}>();

defineEmits<{
  (e: 'update:selectedTargetTable', table: PosTableItem): void;
}>();
</script>
