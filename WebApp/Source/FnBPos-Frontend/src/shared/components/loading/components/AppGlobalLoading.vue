<template>
  <Teleport to="body">
    <Transition name="fade-loading">
      <div
        v-if="isLoading"
        class="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm select-none"
        aria-live="polite"
        role="status"
      >
        <div class="relative bg-white/95 rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/60 flex flex-col items-center justify-center max-w-[320px] sm:max-w-xs w-[90%] mx-auto text-center transform transition-all animate-in fade-in zoom-in-95 duration-200">
          
          <!-- 🔵 CÁC DẤU CHẤM NẰM TRÊN CÙNG 1 HÀNG CHẠY LÊN CHẠY XUỐNG (WAVE BOUNCE) -->
          <div class="flex items-center justify-center gap-3 h-14 mb-2">
            <span class="inline-block w-4 h-4 rounded-full bg-blue-600 dot-1 shadow-sm"></span>
            <span class="inline-block w-4 h-4 rounded-full bg-blue-500 dot-2 shadow-sm"></span>
            <span class="inline-block w-4 h-4 rounded-full bg-blue-500 dot-3 shadow-sm"></span>
            <span class="inline-block w-4 h-4 rounded-full bg-blue-600 dot-4 shadow-sm"></span>
          </div>

          <!-- 📝 TIÊU ĐỀ THÔNG ĐIỆP -->
          <h4 class="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-snug">
            {{ loadingMessage }}
          </h4>

          <!-- 💬 PHỤ ĐỀ HỖ TRỢ (NẾU CÓ) -->
          <p v-if="loadingSubMessage" class="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {{ loadingSubMessage }}
          </p>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useLoading } from '../composables/useLoading';

const { isLoading, loadingMessage, loadingSubMessage } = useLoading();
</script>

<style scoped>
.fade-loading-enter-active,
.fade-loading-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-loading-enter-from,
.fade-loading-leave-to {
  opacity: 0;
}

/* ANIMATION DOT-WAVE CHO LOADING — các dấu chấm nhấp nhô lượn sóng lên xuống */
@keyframes dot-wave {
  0%, 100% {
    transform: translateY(0) scale(0.85);
    opacity: 0.35;
  }
  50% {
    transform: translateY(-20px) scale(1.25);
    opacity: 1;
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.5);
  }
}

.dot-1 {
  animation: dot-wave 1.1s infinite ease-in-out;
  animation-delay: 0s;
}

.dot-2 {
  animation: dot-wave 1.1s infinite ease-in-out;
  animation-delay: 0.18s;
}

.dot-3 {
  animation: dot-wave 1.1s infinite ease-in-out;
  animation-delay: 0.36s;
}

.dot-4 {
  animation: dot-wave 1.1s infinite ease-in-out;
  animation-delay: 0.54s;
}
</style>
