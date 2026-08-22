<template>
  <div class="w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden transition-all">
    
    <!-- DẢI TRANG TRÍ MÀU XANH THỂ HIỆN THƯƠNG HIỆU FNB -->
    <div class="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
    <div class="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

    <!-- HEADER: BIỂU TƯỢNG NHÀ HÀNG & TIÊU ĐỀ -->
    <div class="text-center space-y-3 relative">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg shadow-blue-500/20 ring-4 ring-blue-50/80 p-1.5 overflow-hidden">
        <img src="/assets/images/fnb_pos_logo.png" alt="BeePos247 Logo" class="w-full h-full object-contain" />
      </div>
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">BeePos247</h1>
        <p class="text-xs sm:text-sm text-slate-500 font-medium mt-1">Hệ thống Quản lý & Bán hàng Nhà hàng</p>
      </div>
    </div>

    <!-- KHUNG THÔNG BÁO LỖI (NẾU CÓ) -->
    <transition name="fade">
      <div v-if="errorMessage" class="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-rose-700 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span class="leading-relaxed">{{ errorMessage }}</span>
      </div>
    </transition>

    <!-- FORM ĐĂNG NHẬP (CÓ CHUẨN AUTOCOMPLETE CHO CHROME/GMAIL SAVER) -->
    <form @submit.prevent="handleLogin" class="space-y-4" method="post">
      
      <!-- Ô TÊN ĐĂNG NHẬP -->
      <div class="space-y-1.5">
        <label for="username" class="text-xs font-bold text-slate-700 uppercase tracking-wider block">Tên đăng nhập</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            id="username"
            name="username"
            v-model="credentials.username"
            type="text"
            required
            autocomplete="username"
            placeholder="Nhập tên tài khoản thu ngân..."
            class="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
          />
        </div>
      </div>

      <!-- Ô MẬT KHẨU -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label for="password" class="text-xs font-bold text-slate-700 uppercase tracking-wider block">Mật khẩu</label>
        </div>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="password"
            name="password"
            v-model="credentials.password"
            :type="showPassword ? 'text' : 'password'"
            required
            autocomplete="current-password"
            placeholder="Nhập mật khẩu..."
            class="w-full pl-10 pr-11 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
            aria-label="Ẩn hiện mật khẩu"
          >
            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 013.122-.463c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m-9.537-9.537L3 3l18 18" />
            </svg>
          </button>
        </div>
      </div>

      <!-- TÙY CHỌN GHI NHỚ ĐĂNG NHẬP -->
      <div class="flex items-center justify-between text-xs pt-1">
        <label class="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
          <input
            v-model="rememberMe"
            type="checkbox"
            class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <span>Ghi nhớ tài khoản đăng nhập</span>
        </label>
      </div>

      <!-- NÚT ĐĂNG NHẬP VỚI NATIVE MICRO-INTERACTION -->
      <button
        type="submit"
        :disabled="isLoading"
        class="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed mt-2"
      >
        <span v-if="!isLoading">Đăng nhập ngay</span>
        <span v-else class="flex items-center gap-2">
          <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang xác thực...
        </span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useLogin } from '../hooks/useLogin';
import '../styles/auth.css';

const showPassword = ref(false);

const {
  credentials,
  isLoading,
  errorMessage,
  rememberMe,
  handleLogin
} = useLogin();
</script>
