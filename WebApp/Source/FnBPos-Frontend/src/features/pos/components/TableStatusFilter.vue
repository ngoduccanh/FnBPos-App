<template>
  <div class="flex items-center justify-between gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80 w-full sm:w-auto shrink-0 select-none">
    
    <!-- BÀN TRỐNG -->
    <button
      @click="$emit('change-status', ETableStatusFilter.EMPTY)"
      class="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs"
      :class="[
        selectedStatus === ETableStatusFilter.EMPTY
          ? 'bg-slate-200 text-slate-900 font-extrabold shadow-2xs scale-102'
          : 'hover:bg-slate-200/60'
      ]"
    >
      <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
      <span>Bàn trống</span>
    </button>

    <div class="w-px h-3.5 bg-slate-300"></div>

    <!-- ĐANG CÓ KHÁCH -->
    <button
      @click="$emit('change-status', ETableStatusFilter.USING)"
      class="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs"
      :class="[
        selectedStatus === ETableStatusFilter.USING
          ? 'bg-blue-600 text-white font-extrabold shadow-xs shadow-blue-500/30 scale-102'
          : 'hover:bg-blue-50 text-blue-700 font-semibold'
      ]"
    >
      <span 
        class="w-2.5 h-2.5 rounded-full"
        :class="selectedStatus === ETableStatusFilter.USING ? 'bg-white' : 'bg-blue-600'"
      ></span>
      <span>Có khách</span>
    </button>

    <div class="w-px h-3.5 bg-slate-300"></div>

    <!-- ĐẶT TRƯỚC -->
    <button
      @click="$emit('change-status', ETableStatusFilter.RESERVED)"
      class="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs"
      :class="[
        selectedStatus === ETableStatusFilter.RESERVED
          ? 'bg-amber-500 text-white font-extrabold shadow-xs shadow-amber-500/30 scale-102'
          : 'hover:bg-amber-50 text-amber-700 font-semibold'
      ]"
    >
      <span 
        class="w-2.5 h-2.5 rounded-full"
        :class="selectedStatus === ETableStatusFilter.RESERVED ? 'bg-white' : 'bg-amber-500'"
      ></span>
      <span>Đặt trước</span>
    </button>

  </div>
</template>

<script setup lang="ts">
import { ETableStatusFilter } from '../enums/tableStatusFilter.enum';

defineProps<{
  selectedStatus?: ETableStatusFilter;
}>();

defineEmits<{
  (e: 'change-status', status: ETableStatusFilter): void;
}>();
</script>
