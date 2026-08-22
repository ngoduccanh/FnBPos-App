<template>
  <div class="select-store-bg">
    
    <!-- 1. HÌNH NỀN NHÂN VIÊN PHỤC VỤ ĐỨNG TẠI QUẦY POS (GIỐNG MÀN LOGIN) -->
    <img
      src="/assets/images/fnb_pos_login_bg.png"
      alt="FnB Restaurant POS Background"
      class="absolute inset-0 w-full h-full object-cover object-center scale-105 pointer-events-none"
    />

    <!-- 2. LỚP OVERLAY MÀU XANH DƯƠNG PHỦ TRÊN ẢNH (BLUE GRADIENT OVERLAY) -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-950/85 via-slate-900/85 to-blue-900/90 backdrop-blur-[3px] pointer-events-none"></div>

    <!-- 3. QUẦNG SÁNG TẠO ĐIỂM NHẤN -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

    <!-- 4. MAIN CONTAINER CARD (VIEWPORT LOCKED) -->
    <div class="select-store-card">
      
      <!-- HEADER MÀN HÌNH CHỌN CỬA HÀNG (CỐ ĐỊNH) -->
      <div class="select-store-header">
        <div class="select-store-badge-icon">
          <img src="/assets/images/fnb_pos_logo.png" alt="BeePos247 Logo" class="w-full h-full object-contain" />
        </div>
        <h1 class="select-store-title">Chọn Cửa Hàng Làm Việc</h1>
        <p class="select-store-subtitle">
          Xin chào <span class="select-store-user-name">{{ userName }}</span>! Vui lòng chọn chi nhánh làm việc hôm nay:
        </p>
      </div>

      <!-- THANH TÌM KIẾM NHANH CỬA HÀNG (DÙNG COMPONENT CHUNG APP SEARCH INPUT DÙNG CHUNG) -->
      <div class="select-store-search-box">
        <AppSearchInput
          v-model="searchText"
          placeholder="Tìm theo tên hoặc mã cửa hàng..."
          :delay="500"
          @search="handleSearch"
        />
      </div>

      <!-- VÙNG BODY CHÍNH -->
      <div class="select-store-body">
        
        <!-- TRẠNG THÁI NẠP DỮ LIỆU (LOADING) -->
        <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center gap-2">
          <svg class="animate-spin h-7 w-7 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-xs font-medium text-slate-500">Đang tìm kiếm cửa hàng...</span>
        </div>

        <!-- THÔNG BÁO LỖI (NẾU CÓ) -->
        <div v-else-if="errorMessage" class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center text-rose-700 text-xs font-medium my-2">
          {{ errorMessage }}
        </div>

        <!-- VÙNG LƯỚI CỬA HÀNG CUỘN NỘI BỘ (INTERNAL SCROLL CONTAINER) -->
        <template v-else>
          <div class="select-store-grid-container">
            <div v-if="availableStores.length > 0" class="select-store-grid">
              <StoreCard
                v-for="store in availableStores"
                :key="store.id"
                :store="store"
                @select="handleSelectStore"
              />
            </div>

            <div v-else class="py-12 text-center text-slate-400 text-xs font-medium">
              Không tìm thấy cửa hàng nào phù hợp với từ khóa "{{ searchText }}".
            </div>
          </div>

          <!-- COMPONENT PHÂN TRANG DÙNG CHUNG (CỐ ĐỊNH ĐÁY CARD) -->
          <div class="select-store-pagination-wrapper">
            <AppPagination
              v-model:pageIndex="pageIndex"
              v-model:pageSize="pageSize"
              :pageSizeOptions="[10, 20, 50]"
              :totalItems="totalItems"
              @change="handlePageChange"
            />
          </div>
        </template>

      </div>

      <!-- FOOTER NÚT ĐĂNG XUẤT TÀI KHOẢN (CỐ ĐỊNH) -->
      <div class="select-store-footer">
        <button
          @click="handleLogout"
          class="select-store-logout-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Đăng xuất tài khoản khác</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useSelectStore } from '../hooks/useSelectStore';
import StoreCard from '../components/StoreCard.vue';
import AppPagination from '@/shared/components/pagination/components/AppPagination.vue';
import AppSearchInput from '@/shared/components/search/components/AppSearchInput.vue';
import '../styles/selectStore.css';

const authStore = useAuthStore();
const userName = computed(() => authStore.user?.fullName || authStore.user?.username || authStore.user?.name || 'Thu ngân');

const {
  isLoading,
  errorMessage,
  searchText,
  pageIndex,
  pageSize,
  totalItems,
  availableStores,
  handleSearch,
  handlePageChange,
  handleSelectStore,
  handleLogout
} = useSelectStore();
</script>
