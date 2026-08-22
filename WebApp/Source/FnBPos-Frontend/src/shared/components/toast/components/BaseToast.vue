<template>
  <!-- CONTAINER CỐ ĐỊNH PHÍA TRÊN CÙNG GIỮA MÀN HÌNH (Z-INDEX CAO NHẤT) -->
  <Teleport to="body">
    <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-3 pointer-events-none w-full max-w-md px-4 select-none">
      <transition-group name="toast-slide">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto w-full bg-white/95 backdrop-blur-md border rounded-2xl p-4 shadow-xl shadow-slate-900/5 flex items-start gap-3.5 transition-all"
        :class="{
          'border-emerald-200/90 shadow-emerald-500/10': toast.type === 'success',
          'border-rose-200/90 shadow-rose-500/10': toast.type === 'error',
          'border-amber-200/90 shadow-amber-500/10': toast.type === 'warning',
          'border-blue-200/90 shadow-blue-500/10': toast.type === 'info'
        }"
      >
        <!-- ICON TRẠNG THÁI -->
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          :class="{
            'bg-emerald-50 text-emerald-600 border border-emerald-100': toast.type === 'success',
            'bg-rose-50 text-rose-600 border border-rose-100': toast.type === 'error',
            'bg-amber-50 text-amber-600 border border-amber-100': toast.type === 'warning',
            'bg-blue-50 text-blue-600 border border-blue-100': toast.type === 'info'
          }"
        >
          <!-- SUCCESS ICON -->
          <svg v-if="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <!-- ERROR ICON -->
          <svg v-else-if="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <!-- WARNING ICON -->
          <svg v-else-if="toast.type === 'warning'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <!-- INFO ICON -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <!-- NỘI DUNG THÔNG BÁO -->
        <div class="flex-1 min-w-0 pt-0.5">
          <h4 v-if="toast.title" class="text-xs font-bold uppercase tracking-wider text-slate-800 mb-0.5">{{ toast.title }}</h4>
          <p class="text-sm font-medium text-slate-600 leading-snug break-words">{{ toast.message }}</p>
        </div>

        <!-- NÚT TẮT NHANH -->
        <button
          @click="removeToast(toast.id)"
          class="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast';
import '../styles/toast.css';

const { toasts, removeToast } = useToast();
</script>
