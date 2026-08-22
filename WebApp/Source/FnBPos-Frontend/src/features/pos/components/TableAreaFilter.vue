<template>
  <div class="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-xs overflow-x-auto no-scrollbar">
    
    <!-- 🏢 1. KHU VỰC / TẦNG (TAB AREA FILTERS) -->
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
      
      <!-- 🛍️ NÚT MANG VỀ (CHỈ HIỂN THỊ TRÊN MOBILE / TABLET màn hình nhỏ) -->
      <button
        @click="$emit('change-group', -1)"
        class="lg:hidden px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer"
        :class="[
          selectedGroupId === -1
            ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/30'
            : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
        ]"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <span>Mang về</span>
      </button>

      <!-- NÚT TẤT CẢ KHU VỰC -->
      <button
        @click="$emit('change-group', 0)"
        class="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer"
        :class="[
          selectedGroupId === 0
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
        ]"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4" />
        </svg>
        <span>Tất cả</span>
        <span
          class="px-2 py-0.5 rounded-full text-[10px] font-bold"
          :class="selectedGroupId === 0 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'"
        >
          {{ totalCount }}
        </span>
      </button>

      <!-- DANH SÁCH CÁC KHU VỰC NẠP TỪ API -->
      <button
        v-for="group in groups"
        :key="group.id"
        @click="$emit('change-group', group.id)"
        class="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer"
        :class="[
          selectedGroupId === group.id
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
        ]"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
        <span>{{ group.name }}</span>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
interface AreaGroup {
  id: number;
  name: string;
  [key: string]: any;
}

defineProps<{
  selectedGroupId: number;
  totalCount: number;
  groups?: AreaGroup[] | null;
}>();

defineEmits<{
  (e: 'change-group', groupId: number): void;
}>();
</script>
