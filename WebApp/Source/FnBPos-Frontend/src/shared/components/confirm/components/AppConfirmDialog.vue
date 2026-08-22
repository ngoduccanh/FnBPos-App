<template>
  <Teleport to="body">
    <div
      v-if="state.isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 animate-fade-in select-none"
      @click.self="handleCancel"
    >
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 flex flex-col items-center text-center animate-scale-up will-change-transform">
        
        <!-- ICON BADGE THEO LOẠI XÁC NHẬN -->
        <div
          class="w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg mb-4"
          :class="badgeClass"
        >
          <!-- SUCCESS ICON (DUYỆT MÓN) -->
          <svg v-if="state.type === 'success'" class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>

          <!-- DANGER ICON (TỪ CHỐI / HỦY / XÓA) -->
          <svg v-else-if="state.type === 'danger'" class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>

          <!-- WARNING ICON (CẢNH BÁO) -->
          <svg v-else-if="state.type === 'warning'" class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>

          <!-- INFO ICON (THÔNG TIN / XÁC NHẬN) -->
          <svg v-else class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <!-- TIÊU ĐỀ HỘP THOẠI -->
        <h3 class="font-black text-lg text-slate-900 leading-tight">
          {{ state.title }}
        </h3>

        <!-- NỘI DUNG CHÍNH -->
        <p class="text-sm font-bold text-slate-700 mt-2 max-w-sm">
          {{ state.message }}
        </p>

        <!-- NỘI DUNG PHỤ / GHI CHÚ BỔ SUNG -->
        <p v-if="state.subMessage" class="text-xs font-semibold text-slate-400 mt-1 max-w-sm">
          {{ state.subMessage }}
        </p>

        <!-- CÁC NÚT BẤM HÀNH ĐỘNG -->
        <div class="grid grid-cols-2 gap-3 w-full mt-6">
          <button
            type="button"
            @click="handleCancel"
            class="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all cursor-pointer active:scale-95"
          >
            {{ state.cancelText }}
          </button>

          <button
            type="button"
            @click="handleConfirm"
            class="w-full py-3 px-4 rounded-2xl text-white text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
            :class="confirmBtnClass"
          >
            {{ state.confirmText }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useConfirm } from '../composables/useConfirm';

const { state, handleConfirm, handleCancel } = useConfirm();

const badgeClass = computed(() => {
  switch (state.value.type) {
    case 'success':
      return 'bg-emerald-600 shadow-emerald-500/25 text-white';
    case 'danger':
      return 'bg-rose-600 shadow-rose-500/25 text-white';
    case 'warning':
      return 'bg-amber-500 shadow-amber-500/25 text-white';
    default:
      return 'bg-blue-600 shadow-blue-500/25 text-white';
  }
});

const confirmBtnClass = computed(() => {
  switch (state.value.type) {
    case 'success':
      return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25';
    case 'danger':
      return 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25';
    case 'warning':
      return 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25';
    default:
      return 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25';
  }
});

const handleKeyDown = (e: KeyboardEvent) => {
  if (state.value.isOpen) {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter') {
      handleConfirm();
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95) translateZ(0); }
  to { opacity: 1; transform: scale(1) translateZ(0); }
}

.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}

.animate-scale-up {
  animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
