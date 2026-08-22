<template>
  <div class="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shrink-0 shadow-md">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-inner">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>
      <div>
        <h3 class="font-black text-lg leading-tight tracking-wide">Quản Lý Đơn Hàng Online</h3>
        <p class="text-xs text-blue-100 font-semibold mt-0.5">
          Tự động đồng bộ các đơn gọi món từ mã QR tại bàn
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2.5">
      <!-- NÚT XÓA TOÀN BỘ ĐƠN HÀNG (nếu có đơn) -->
      <button
        v-if="hasOrders"
        @click="$emit('delete-all')"
        :disabled="isProcessing"
        class="px-4 py-2 rounded-xl bg-red-500/25 hover:bg-red-500/40 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50 border border-white/20 shadow-2xs"
      >
        <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span class="hidden sm:inline">Xóa toàn bộ đơn</span>
      </button>

      <!-- NÚT ĐÓNG MODAL -->
      <button
        @click="$emit('close')"
        class="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-base font-bold transition-all cursor-pointer active:scale-95"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hasOrders: boolean;
  isProcessing?: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'delete-all'): void;
}>();
</script>
