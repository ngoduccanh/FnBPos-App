<template>
  <!-- MÀN HÌNH ĐĂNG NHẬP VỚI HÌNH NỀN NHÂN VIÊN NHÀ HÀNG & LỚP OVERLAY XANH DƯƠNG CAO CẤP -->
  <div class="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
    
    <!-- 1. HÌNH NỀN NHÂN VIÊN PHỤC VỤ ĐỨNG TẠI QUẦY POS -->
    <img
      src="/assets/images/fnb_pos_login_bg.png"
      alt="FnB Restaurant POS Background"
      class="absolute inset-0 w-full h-full object-cover object-center scale-105 animate-pulse-subtle pointer-events-none"
    />

    <!-- 2. LỚP OVERLAY MÀU XANH DƯƠNG PHỦ TRÊN ẢNH (BLUE GRADIENT OVERLAY) -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-950/85 via-slate-900/85 to-blue-900/90 backdrop-blur-[3px] pointer-events-none"></div>

    <!-- 3. QUẦNG SÁNG TẠO ĐIỂM NHẤN -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

    <!-- 4. KHUNG FORM ĐĂNG NHẬP (CENTERED FLOATING CARD) -->
    <div class="relative z-10 w-full flex justify-center drop-shadow-2xl">
      <LoginForm />
    </div>

  </div>
</template>

<script setup lang="ts">
import LoginForm from '../components/LoginForm.vue';
</script>
