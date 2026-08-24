<template>
  <header class="h-16 bg-blue-600 text-white px-6 flex items-center justify-between shrink-0 shadow-sm z-50 relative select-none">
    
    <!-- 1. LOGO THƯƠNG HIỆU & THÔNG TIN CỬA HÀNG -->
    <div class="flex items-center gap-6 overflow-hidden">
      <!-- LOGO BEEPOS247 (hover → hiện icon refresh) -->
      <div
        class="relative group/logo flex items-center gap-3 shrink-0 cursor-pointer"
        @click="handleRefreshStore"
        title="Click để cập nhật thông tin cửa hàng"
      >
        <!-- LOGO BOX -->
        <div class="relative w-10 h-10 bg-white rounded-xl p-1.5 flex items-center justify-center border border-white/20 shadow-xs overflow-hidden">
          <!-- LOGO GỐC -->
          <img
            src="/assets/images/fnb_pos_logo.png"
            alt="BeePos247 Logo"
            class="w-full h-full object-contain transition-opacity duration-200"
            :class="{ 'opacity-0': isRefreshingStore }"
          />

          <!-- ICON REFRESH (hiện khi hover hoặc đang loading) -->
          <div
            class="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
            :class="isRefreshingStore ? 'opacity-100 bg-blue-50' : 'opacity-0 group-hover/logo:opacity-100 bg-white/90'"
          >
            <svg
              class="w-5 h-5 text-blue-600"
              :class="{ 'animate-spin': isRefreshingStore }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>

        <!-- TÊN APP (mờ nhẹ khi hover) -->
        <h1
          class="text-base font-bold text-white tracking-tight transition-opacity duration-200"
          :class="isRefreshingStore ? 'opacity-60' : 'group-hover/logo:opacity-80'"
        >BeePos247</h1>
      </div>

      <!-- TÊN & ĐỊA CHỈ CỬA HÀNG -->
      <div class="flex items-center gap-3 border-l border-white/20 pl-6 text-sm text-white/90 overflow-hidden">
        <!-- ICON CỬA HÀNG STOREFRONT VECTOR TRẮNG MINIMALIST -->
        <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h18v2H3V3zm2 4h14l-1 4H6L5 7zm1 6h12v8H6v-8zm3 2v4h6v-4H9z" />
          </svg>
        </div>
        <div class="leading-tight truncate">
          <div class="font-semibold text-white text-sm truncate flex items-center gap-2.5">
            <span class="text-sm font-bold">{{ storeName || 'Cửa hàng POS' }}</span>
            <button
              @click.stop="$emit('switch-store')"
              class="inline-flex px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-white/30 items-center gap-1.5 active:scale-95 shadow-2xs"
              title="Đổi sang cửa hàng khác"
            >
              <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span class="font-bold">Đổi cửa hàng</span>
            </button>
          </div>
          <p v-if="storeAddress" class="text-xs text-white/75 font-normal truncate mt-0.5 flex items-center gap-1">
            <svg class="w-3 h-3 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{{ storeAddress }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 2. THỜI GIAN THỰC CHẠY THEO GIÂY & USER ACTION -->
    <div class="flex items-center gap-6 shrink-0">
      
      <!-- ĐỒNG HỒ THỜI GIAN THỰC -->
      <div class="hidden lg:flex items-center gap-3 border-r border-white/20 pr-6 text-xs">
        <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="leading-tight text-left">
          <div class="font-mono font-semibold text-white text-sm tracking-wider">
            {{ currentTime }}
          </div>
          <div class="text-xs text-white/75 font-normal">
            {{ currentDate }}
          </div>
        </div>
      </div>

      <!-- BADGE TRẠNG THÁI MẠNG & ĐỒNG BỘ -->
      <div class="hidden sm:flex items-center border-r border-white/20 pr-6">

        <!-- OFFLINE -->
        <div
          v-if="isOffline"
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/90 border border-red-400/50 shadow-sm"
        >
          <span class="relative flex h-2.5 w-2.5 shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span class="text-white font-bold text-xs whitespace-nowrap">📡 Offline</span>
        </div>

        <!-- ĐANG ĐỒNG BỘ (online + có job pending) -->
        <div
          v-else-if="pendingCount > 0"
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-300/40"
        >
          <span class="relative flex h-2.5 w-2.5 shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300"></span>
          </span>
          <span class="text-white/90 font-semibold text-xs whitespace-nowrap">Đồng bộ {{ pendingCount }} thao tác...</span>
        </div>

        <!-- ONLINE BÌNH THƯỜNG -->
        <div
          v-else
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-400/30"
        >
          <span class="inline-flex rounded-full h-2.5 w-2.5 bg-green-300 shrink-0"></span>
          <span class="text-white/90 font-semibold text-xs whitespace-nowrap">Online</span>
        </div>

      </div>

      <!-- USER INFO & LỰA CHỌN -->
      <div class="flex items-center gap-2.5">
        
        <!-- 📋 NÚT QUẢN LÝ ĐƠN HÀNG ONLINE TỪ MÃ QR -->
        <button
          @click="$emit('open-orders')"
          class="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center gap-2 transition-all cursor-pointer border border-white/25 shadow-xs shrink-0 active:scale-95"
          title="Quản lý đơn hàng online từ mã QR"
        >
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span class="font-bold text-xs hidden md:inline">Đơn Online</span>
        </button>

        <!-- 📺 NÚT MỞ MÀN HÌNH PHỤ (CUSTOMER FACING DISPLAY) -->
        <button
          @click="openCustomerDisplayWindow"
          class="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center gap-1.5 transition-all cursor-pointer border border-white/25 shadow-xs shrink-0 active:scale-95"
          title="Mở màn hình phụ cho khách hàng (Customer Display)"
        >
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span class="font-bold text-xs hidden xl:inline">Màn hình phụ</span>
        </button>

        <!-- 🖥️ NÚT PHÓNG TO TOÀN MÀN HÌNH (FULLSCREEN TOGGLE) -->
        <button
          @click="toggleFullscreen"
          class="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer border border-white/25 shadow-xs shrink-0 active:scale-95"
          :title="isFullscreen ? 'Thoát toàn màn hình' : 'Phóng to toàn màn hình'"
        >
          <!-- ICON THOÁT FULLSCREEN (KHI ĐANG PHÓNG TO) -->
          <svg v-if="isFullscreen" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9L4 4m0 0v4m0-4h4m11 5l-5-5m0 0v4m0-4h4M9 15l-5 5m0 0v-4m0 4h4m11-5l-5 5m0 0v-4m0 4h4" />
          </svg>
          <!-- ICON PHÓNG TO FULLSCREEN (KHI ĐANG BÌNH THƯỜNG) -->
          <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        <!-- NÚT ĐỔI CỬA HÀNG ICON TRÊN MOBILE (V-IF ISADMIN) -->
        <button
          v-if="isAdmin"
          @click="$emit('switch-store')"
          class="sm:hidden w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm transition-all cursor-pointer border border-white/25 shadow-xs"
          title="Đổi cửa hàng"
        >
          🔄
        </button>

        <!-- AVATAR & DROPDOWN MENU NGUỜI DÙNG GIỐNG MẪU THIẾT KẾ -->
        <div class="relative group">
          
          <!-- NUT KÍCH HOẠT DROPDOWN (CLICK HOẶC HOVER) -->
          <div
            @click="isDropdownOpen = !isDropdownOpen"
            class="flex items-center gap-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 shadow-xs cursor-pointer transition-all select-none"
          >
            <!-- AVATAR 3D HOẶC KÝ TỰ TÊN -->
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-300 text-white font-bold flex items-center justify-center text-sm overflow-hidden shadow-xs border border-white/40 shrink-0">
              <span class="text-white drop-shadow-xs">{{ (userName || 'U').charAt(0).toUpperCase() }}</span>
            </div>
            
            <div class="text-left text-xs leading-tight hidden sm:block">
              <p class="font-bold text-white max-w-[130px] truncate text-xs">{{ userName }}</p>
              <p class="text-[10px] text-white/80 font-medium capitalize">{{ userRole }}</p>
            </div>

            <svg class="w-3.5 h-3.5 text-white/80 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <!-- DROPDOWN MENU THÔNG TIN NGƯỜI DÙNG -->
          <div
            class="absolute right-0 top-full mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 z-50 text-slate-800 transition-all duration-200 origin-top-right select-none opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 translate-y-2"
            :class="{ '!opacity-100 !visible !translate-y-0': isDropdownOpen }"
          >
            <!-- HEADER DROPDOWN -->
            <h3 class="text-base font-bold text-slate-800 mb-4">Thông tin người dùng</h3>

            <!-- USER CARD PROFILE -->
            <div class="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <!-- AVATAR 3D TO -->
              <div class="w-14 h-14 rounded-full bg-slate-200/80 p-0.5 border border-slate-200/60 shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
                <div class="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-extrabold text-xl">
                  {{ (userName || 'U').charAt(0).toUpperCase() }}
                </div>
              </div>

              <!-- INFO DETAILS -->
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-900 text-sm truncate">{{ userName || 'User Name' }}</h4>
                
                <!-- ROLE BADGE -->
                <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold mt-1">
                  <span>f Vai trò: {{ userRole || 'User' }}</span>
                </div>

                <!-- EMAIL -->
                <div class="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5 truncate">
                  <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span class="truncate">{{ userEmail || 'user@gmail.com' }}</span>
                </div>
              </div>
            </div>

            <!-- MENU ITEMS LIST -->
            <div class="py-3 space-y-1">
              
              <!-- THÔNG TIN CỬA HÀNG -->
              <button
                @click="$emit('switch-store'); isDropdownOpen = false"
                class="w-full flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer text-left group/item"
              >
                <div class="w-10 h-10 rounded-2xl bg-blue-50/80 text-blue-600 flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-105">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p class="font-bold text-slate-800 text-sm">Thông tin cửa hàng</p>
                  <p class="text-xs text-slate-400">Xem chi tiết / Cài đặt</p>
                </div>
              </button>

              <!-- ĐỔI MẬT KHẨU -->
              <button
                class="w-full flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer text-left group/item"
              >
                <div class="w-10 h-10 rounded-2xl bg-indigo-50/80 text-indigo-600 flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-105">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <p class="font-bold text-slate-800 text-sm">Đổi mật khẩu</p>
                </div>
              </button>

            </div>

            <!-- FOOTER ACTION: NÚT ĐĂNG XUẤT VIỀN XANH CHUẨN MẪU -->
            <div class="pt-2">
              <button
                @click="$emit('logout')"
                class="w-full py-2.5 px-4 border-2 border-blue-500 hover:bg-blue-50 text-blue-600 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>

          </div>

        </div>

        <!-- ⚙️ NÚT CÀI ĐẶT HỆ THỐNG (BÊN PHẢI BOX QUẢN TRỊ VIÊN) -->
        <div class="relative group/settings">
          <button
            @click="isSettingsMenuOpen = !isSettingsMenuOpen"
            class="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center cursor-pointer border border-white/30 transition-all text-white active:scale-95 shadow-xs shrink-0"
            title="Cài đặt hệ thống"
          >
            <svg class="w-5 h-5 text-white transition-transform duration-300 group-hover/settings:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <!-- MENU CON KHI HOVER / CLICK -->
          <div
            class="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 p-1.5 z-50 text-slate-800 transition-all duration-200 origin-top-right select-none opacity-0 invisible group-hover/settings:opacity-100 group-hover/settings:visible group-hover/settings:translate-y-0 translate-y-2"
            :class="{ '!opacity-100 !visible !translate-y-0': isSettingsMenuOpen }"
          >
            <button
              @click="isPrinterModalOpen = true; isSettingsMenuOpen = false"
              class="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-blue-50 text-left text-xs font-bold text-slate-700 hover:text-blue-600 rounded-xl transition-colors cursor-pointer"
            >
              <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
              <div>
                <p class="font-bold">Cài đặt máy in</p>
                <p class="text-[10px] text-slate-400 font-normal">QZ Tray / USB / WiFi</p>
              </div>
            </button>
          </div>
        </div>

      </div>

    </div>

    <!-- 🖨️ MODAL CÀI ĐẶT MÁY IN -->
    <PosPrinterSettingsModal
      :isOpen="isPrinterModalOpen"
      @close="isPrinterModalOpen = false"
    />

  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useNetworkStatus } from '@/services/useNetworkStatus';
import { usePosQueue } from '@/features/pos/composables/usePosQueue';
import { useToast } from '@/shared/components/toast/composables/useToast';
import { useCustomerDisplayBridge } from '@/features/pos/composables/useCustomerDisplayBridge';
import PosPrinterSettingsModal from '@/shared/components/printer/PosPrinterSettingsModal.vue';

const { openCustomerDisplayWindow } = useCustomerDisplayBridge();

defineProps<{
  storeName?: string;
  storeAddress?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  isAdmin?: boolean;
}>();

const emit = defineEmits<{
  (e: 'logout'): void;
  (e: 'switch-store'): void;
  (e: 'refresh-store'): void;
  (e: 'open-orders'): void;
}>();

const isDropdownOpen      = ref(false);
const isSettingsMenuOpen  = ref(false);
const isPrinterModalOpen  = ref(false);
const isRefreshingStore   = ref(false);

// TRẠNG THÁI MẠNG & QUEUE
const { isOffline }    = useNetworkStatus();
const { pendingCount } = usePosQueue();
const toast = useToast();

/**
 * 🔄 Refresh cửa hàng — call lại GetHomeViewModel (forceReload)
 */
const handleRefreshStore = async () => {
  if (isRefreshingStore.value) return;

  if (isOffline.value) {
    toast.showWarning('Không thể cập nhật khi đang ngoại tuyến.', 'Ngoại tuyến');
    return;
  }

  isRefreshingStore.value = true;
  try {
    emit('refresh-store');
    // Đợi 1 chút để animation đẹp, parent sẽ xử lý async
    await new Promise(resolve => setTimeout(resolve, 600));
  } finally {
    isRefreshingStore.value = false;
  }
};

// LOGIC ĐỒNG HỒ THỜI GIAN THỰC & TOÀN MÀN HÌNH (FULLSCREEN)
const currentTime = ref('');
const currentDate = ref('');
const isFullscreen = ref(false);
let timer: any = null;

const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  currentDate.value = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
};

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

/**
 * ⚡ CHUYỂN ĐỔI CHẾ ĐỘ PHÓNG TO TOÀN MÀN HÌNH (FULLSCREEN)
 */
const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        await (document.documentElement as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    }
  } catch (err) {
    console.warn('Không thể bật chế độ Toàn màn hình:', err);
  }
};

onMounted(() => {
  updateClock();
  timer = setInterval(updateClock, 1000);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
});
</script>
