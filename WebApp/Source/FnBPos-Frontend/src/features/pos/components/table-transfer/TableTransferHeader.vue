<template>
  <div class="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white text-lg font-black">
        ⇆
      </div>
      <div>
        <h3 class="font-black text-lg leading-tight">Chuyển / Tách Bàn</h3>
        <p class="text-xs text-blue-100 font-semibold mt-0.5">
          Bàn hiện tại: <span class="uppercase font-black bg-white/20 px-2 py-0.5 rounded-md">{{ tableName || 'Bàn nguồn' }}</span>
          ({{ itemCount }} món)
        </p>
      </div>
    </div>

    <button
      @click="$emit('close')"
      class="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-base font-bold transition-all cursor-pointer"
    >
      ✕
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tableName?: string;
  itemCount: number;
}>();

defineEmits<{
  (e: 'close'): void;
}>();
</script>
