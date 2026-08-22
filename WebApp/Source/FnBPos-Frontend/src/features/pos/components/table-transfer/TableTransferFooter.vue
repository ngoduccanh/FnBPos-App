<template>
  <div class="p-5 bg-white border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
    <button
      @click="$emit('close')"
      class="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black transition-all cursor-pointer active:scale-95"
    >
      Hủy bỏ
    </button>

    <button
      @click="$emit('confirm')"
      :disabled="!canConfirm || isProcessing"
      class="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-black shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2.5 active:scale-95"
    >
      <span v-if="isProcessing" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      <span>{{ isProcessing ? 'Đang thực hiện...' : (activeTab === 'transfer_all' ? 'Xác nhận chuyển bàn' : 'Xác nhận tách bàn') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTab: 'transfer_all' | 'split_table';
  canConfirm: boolean;
  isProcessing?: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();
</script>
