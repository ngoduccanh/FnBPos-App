<template>
  <div class="shrink-0">
    <!-- TOP ACTION BAR: ĐỔI BÀN, CHUYỂN BÀN, BÀN ACTIVE BADGE & NÚT ĐÓNG MOBILE -->
    <div class="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
      <div class="flex items-center gap-2">
        <!-- NÚT ĐÓNG TRÊN MOBILE -->
        <button
          @click="$emit('close-mobile-cart')"
          class="lg:hidden w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center text-sm font-bold cursor-pointer mr-1"
          title="Đóng giỏ hàng"
        >
          ✕
        </button>

        <!-- NÚT QUAY LẠI SƠ ĐỒ BÀN (← ĐỔI BÀN) -->
        <button
          @click="$emit('back')"
          class="px-2.5 py-1.5 sm:p-0 rounded-xl sm:rounded-none bg-blue-50 sm:bg-transparent text-xs sm:text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95"
          title="Đổi bàn (F4)"
        >
          <span class="text-base sm:text-xs font-black">←</span>
          <span class="hidden sm:inline">Đổi bàn(F4)</span>
        </button>
      </div>

      <div class="flex items-center gap-2 sm:gap-2">
        <!-- NÚT LÀM MỚI GIỎ -->
        <button
          @click="$emit('clear-cart')"
          class="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl bg-slate-100/90 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
          title="Làm mới giỏ hàng"
        >
          <span class="text-sm sm:text-xs">🔄</span>
          <span class="hidden sm:inline">Làm mới</span>
        </button>

        <!-- NÚT CHUYỂN / TÁCH BÀN -->
        <button
          @click="$emit('transfer-table')"
          class="w-9 h-9 sm:w-auto sm:h-auto sm:px-3.5 sm:py-1.5 rounded-full sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          title="Chuyển / Tách bàn"
        >
          <span class="text-base sm:text-xs font-black">⇆</span>
          <span class="hidden sm:inline">Chuyển / Tách bàn</span>
        </button>

        <!-- BADGE BÀN ACTIVE MÀU XANH NỔI BẬT -->
        <div class="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span class="uppercase tracking-wide">{{ tableName || 'BÀN' }}</span>
        </div>
      </div>
    </div>

    <!-- SEARCH KHÁCH HÀNG BAR -->
    <div class="p-3 bg-white border-b border-slate-100 flex items-center gap-2 shrink-0">
      <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>

      <div class="flex-1 relative">
        <input
          :value="customerSearch"
          @input="$emit('update:customerSearch', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Tìm nhanh khách hàng (F4)..."
          class="w-full pl-9 pr-3 py-2 text-xs border border-cyan-400 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
        />
        <svg class="w-4 h-4 text-cyan-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <button
        @click="$emit('search-customer')"
        class="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
      >
        🔍 TÌM
      </button>

      <button
        @click="$emit('add-customer')"
        class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer font-bold"
        title="Thêm khách hàng mới"
      >
        +
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tableName?: string;
  customerSearch: string;
}>();

defineEmits<{
  (e: 'close-mobile-cart'): void;
  (e: 'back'): void;
  (e: 'clear-cart'): void;
  (e: 'transfer-table'): void;
  (e: 'update:customerSearch', val: string): void;
  (e: 'search-customer'): void;
  (e: 'add-customer'): void;
}>();
</script>
