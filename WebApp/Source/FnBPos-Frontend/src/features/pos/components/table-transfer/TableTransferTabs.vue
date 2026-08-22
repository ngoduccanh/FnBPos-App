<template>
  <div class="px-6 pt-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3 shrink-0">
    <!-- TAB 1: CHUYỂN TOÀN BỘ BÀN -->
    <button
      @click="$emit('update:activeTab', 'transfer_all')"
      class="px-6 py-3.5 rounded-t-2xl font-black text-sm transition-all cursor-pointer flex items-center gap-2.5"
      :class="[
        activeTab === 'transfer_all'
          ? 'bg-white text-blue-600 border-t-2 border-x border-slate-200 shadow-xs translate-y-[1px]'
          : 'text-slate-500 hover:text-slate-800'
      ]"
    >
      <div
        class="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
        :class="activeTab === 'transfer_all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>
      <span>Chuyển toàn bộ bàn (Đổi bàn)</span>
    </button>

    <!-- TAB 2: TÁCH BÀN -->
    <button
      @click="$emit('update:activeTab', 'split_table')"
      class="px-6 py-3.5 rounded-t-2xl font-black text-sm transition-all cursor-pointer flex items-center gap-2.5"
      :class="[
        activeTab === 'split_table'
          ? 'bg-white text-blue-600 border-t-2 border-x border-slate-200 shadow-xs translate-y-[1px]'
          : 'text-slate-500 hover:text-slate-800'
      ]"
    >
      <div
        class="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
        :class="activeTab === 'split_table' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a3 3 0 11-4.242-4.242 3 3 0 014.242 0zM7 7a3 3 0 100 6 3 3 0 000-6z" />
        </svg>
      </div>
      <span>Tách bàn (Chuyển từng món)</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTab: 'transfer_all' | 'split_table';
}>();

defineEmits<{
  (e: 'update:activeTab', tab: 'transfer_all' | 'split_table'): void;
}>();
</script>
