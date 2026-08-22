<template>
  <div class="px-6 py-3 bg-white border-b border-slate-200/90 flex items-center gap-2.5 shrink-0 overflow-hidden select-none">
    
    <!-- TAB 1: MỚI (CHỜ DUYỆT) -->
    <button
      @click="$emit('update:activeTab', 'pending')"
      class="px-4.5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
      :class="[
        activeTab === 'pending'
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
      ]"
    >
      <span>MỚI</span>
      <span
        v-if="pendingCount > 0"
        class="px-2 py-0.5 rounded-full text-[11px] font-black"
        :class="activeTab === 'pending' ? 'bg-amber-400 text-slate-900 shadow-2xs animate-pulse' : 'bg-amber-500 text-white'"
      >
        {{ pendingCount }}
      </span>
    </button>

    <!-- TAB 2: ĐÃ DUYỆT -->
    <button
      @click="$emit('update:activeTab', 'approved')"
      class="px-4.5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
      :class="[
        activeTab === 'approved'
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
      ]"
    >
      <span>ĐÃ DUYỆT</span>
      <span
        v-if="approvedCount > 0"
        class="px-2 py-0.5 rounded-full text-[11px] font-black"
        :class="activeTab === 'approved' ? 'bg-emerald-400 text-slate-900 shadow-2xs' : 'bg-emerald-500 text-white'"
      >
        {{ approvedCount }}
      </span>
    </button>

    <!-- TAB 3: ĐÃ TỪ CHỐI -->
    <button
      @click="$emit('update:activeTab', 'rejected')"
      class="px-4.5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
      :class="[
        activeTab === 'rejected'
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
      ]"
    >
      <span>ĐÃ TỪ CHỐI</span>
    </button>

    <!-- TAB 4: ĐƠN HIỆN TẠI (TOÀN BỘ) -->
    <button
      @click="$emit('update:activeTab', 'current')"
      class="px-4.5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
      :class="[
        activeTab === 'current'
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
      ]"
    >
      <span>ĐƠN HIỆN TẠI</span>
    </button>

  </div>
</template>

<script setup lang="ts">
import type { OrderManagementTabKey } from '../../composables/usePosOrderManagement';

defineProps<{
  activeTab: OrderManagementTabKey;
  pendingCount: number;
  approvedCount: number;
}>();

defineEmits<{
  (e: 'update:activeTab', tab: OrderManagementTabKey): void;
}>();
</script>
