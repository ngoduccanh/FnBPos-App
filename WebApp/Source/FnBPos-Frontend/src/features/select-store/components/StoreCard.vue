<template>
  <div
    @click="$emit('select', store)"
    class="store-card"
  >
    <!-- TOP ROW: BADGE MÃ CỬA HÀNG & MŨI TÊN CHỌN -->
    <div class="flex items-center justify-between">
      <div class="store-card-badge">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1m-1-4h.01M9 16h.01M9 12h.01M15 16h.01M15 12h.01M9 8h.01M15 8h.01" />
        </svg>
        <span>{{ store.code || 'CH-01' }}</span>
      </div>

      <div class="store-card-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>

    <!-- CENTER ROW: TÊN CỬA HÀNG -->
    <div>
      <h3 class="store-card-name">{{ store.name }}</h3>
    </div>

    <!-- BOTTOM ROW: ĐỊA CHỈ & THÔNG TIN -->
    <div class="store-card-detail">
      <svg xmlns="http://www.w3.org/2000/svg" class="store-card-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span class="line-clamp-2">{{ store.addresses || 'Chưa cập nhật địa chỉ' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StoreBranch } from '../types/store.types';
import './styles/storeCard.css';

defineProps<{
  store: StoreBranch;
}>();

defineEmits<{
  (e: 'select', store: StoreBranch): void;
}>();
</script>
