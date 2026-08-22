<template>
  <div class="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none font-sans relative">
    
    <!-- 🟢 TOP BAR: THÔNG TIN QUÁN & ĐỒNG HỒ THỜI GIAN THỰC -->
    <header class="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-lg">
      <div class="flex items-center gap-3.5">
        <!-- LOGO HOẶC ICON QUÁN -->
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
          <img
            v-if="payload.storeInfo.logoUrl"
            :src="payload.storeInfo.logoUrl"
            alt="Logo"
            class="w-full h-full object-cover rounded-2xl"
          />
          <span v-else>{{ payload.storeInfo.storeName?.charAt(0) || 'F' }}</span>
        </div>

        <div>
          <h1 class="text-base sm:text-lg font-black text-white leading-tight tracking-wide">
            {{ payload.storeInfo.storeName || 'CỬA HÀNG FNB' }}
          </h1>
          <p v-if="payload.storeInfo.storeAddress" class="text-xs font-semibold text-slate-400 mt-0.5 line-clamp-1">
            {{ payload.storeInfo.storeAddress }}
          </p>
        </div>
      </div>

      <!-- ĐỒNG HỒ THỜI GIAN & NÚT FULLSCREEN -->
      <div class="flex items-center gap-4">
        <div class="text-right">
          <div class="text-base sm:text-lg font-black text-blue-400 font-mono tracking-wider">
            {{ currentTime }}
          </div>
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            {{ currentDate }}
          </div>
        </div>

        <button
          @click="toggleFullscreen"
          class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="Toàn màn hình"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </header>

    <!-- 🟡 BODY CONTENT (3 CHẾ ĐỘ HIỂN THỊ) -->
    <main class="flex-1 overflow-hidden relative flex flex-col">

      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <!-- 1. CHẾ ĐỘ CHỜ (IDLE): KHI CHƯA CHỌN BÀN / Ở SƠ ĐỒ BÀN -->
      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <div
        v-if="payload.mode === 'IDLE'"
        class="h-full w-full flex flex-col items-center justify-center p-8 text-center animate-fade-in relative overflow-hidden"
      >
        <!-- HIỆU ỨNG ÁNH SÁNG NỀN -->
        <div class="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20"></div>
        <div class="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20"></div>

        <div class="relative z-10 max-w-2xl space-y-6">
          <!-- ICON CHÀO MỪNG -->
          <div class="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/25 animate-bounce-slow">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div class="space-y-2">
            <span class="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest inline-block">
              WELCOME
            </span>
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Xin Chào Quý Khách!
            </h2>
            <p class="text-sm sm:text-base font-semibold text-slate-400 max-w-lg mx-auto leading-relaxed">
              Chào mừng quý khách đến với <strong class="text-white font-extrabold">{{ payload.storeInfo.storeName || 'Cửa hàng' }}</strong>. Rất hân hạnh được phục vụ quý khách!
            </p>
          </div>

          <!-- BANNER / QUẢNG CÁO MÓN NGON -->
          <div class="grid grid-cols-3 gap-4 pt-4">
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1.5 shadow-lg">
              <div class="text-2xl">☕</div>
              <div class="text-xs font-black text-slate-200">Đồ Uống Đậm Vị</div>
              <div class="text-[11px] font-semibold text-slate-500">Pha chế tươi mới</div>
            </div>
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1.5 shadow-lg">
              <div class="text-2xl">🍰</div>
              <div class="text-xs font-black text-slate-200">Bánh & Điểm Tâm</div>
              <div class="text-[11px] font-semibold text-slate-500">Ngon miệng mỗi ngày</div>
            </div>
            <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1.5 shadow-lg">
              <div class="text-2xl">⚡</div>
              <div class="text-xs font-black text-slate-200">Phục Vụ Nhanh</div>
              <div class="text-[11px] font-semibold text-slate-500">Chu đáo & tận tâm</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <!-- 2. CHẾ ĐỘ ĐANG GỌI MÓN (ORDERING): HIỂN THỊ GIỎ HÀNG KHÁCH HÀNG -->
      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <div
        v-else-if="payload.mode === 'ORDERING'"
        class="h-full w-full flex flex-col p-6 animate-fade-in"
      >
        <!-- BẢN TIN THÔNG TIN BÀN & KHÁCH -->
        <div class="px-6 py-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 mb-4 shrink-0 shadow-md">
          <div class="flex items-center gap-3">
            <div class="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-black tracking-wide flex items-center gap-1.5">
              <span>📍</span>
              <span>{{ payload.tableName || 'MANG VỀ' }}</span>
            </div>
            <span class="text-xs font-bold text-slate-400">
              Khách hàng: <strong class="text-slate-200 font-black">{{ payload.customerName || 'Khách lẻ' }}</strong>
            </span>
          </div>

          <div class="text-xs font-bold text-slate-400">
            Đang gọi: <strong class="text-blue-400 text-sm font-black">{{ payload.cartTotalQuantity }}</strong> món
          </div>
        </div>

        <!-- DANH SÁCH MÓN ĐÃ GỌI (BẢNG GIỎ HÀNG TO RÕ RÀNG) -->
        <div class="flex-1 bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl min-h-0">
          
          <!-- TABLE HEADER -->
          <div class="grid grid-cols-12 gap-3 px-6 py-3 bg-slate-800/80 border-b border-slate-700 text-xs font-black text-slate-400 uppercase tracking-wider shrink-0">
            <div class="col-span-1 text-center">STT</div>
            <div class="col-span-6">TÊN MÓN ĂN / ĐỒ UỐNG</div>
            <div class="col-span-2 text-center">SỐ LƯỢNG</div>
            <div class="col-span-3 text-right">THÀNH TIỀN</div>
          </div>

          <!-- TABLE BODY (SCROLLABLE) -->
          <div class="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
            <div
              v-if="payload.cartItems.length === 0"
              class="h-full flex flex-col items-center justify-center text-slate-500 text-sm font-bold py-12"
            >
              <div class="text-3xl mb-2">🛒</div>
              <span>Chưa có món nào trong giỏ hàng...</span>
            </div>

            <div
              v-else
              v-for="(item, index) in payload.cartItems"
              :key="item.productId || index"
              class="grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-slate-800/40 rounded-xl transition-colors"
            >
              <div class="col-span-1 text-center text-xs font-black text-slate-500">
                #{{ index + 1 }}
              </div>

              <div class="col-span-6">
                <div class="font-black text-sm sm:text-base text-white">
                  {{ item.productName }}
                </div>
                <div v-if="item.unitName" class="text-xs font-semibold text-slate-400 mt-0.5">
                  ĐVT: {{ item.unitName }} • {{ formatCurrency(item.price) }}
                </div>
              </div>

              <div class="col-span-2 text-center">
                <span class="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-black border border-blue-500/30">
                  x{{ item.quantity }}
                </span>
              </div>

              <div class="col-span-3 text-right font-black text-sm sm:text-base text-slate-100">
                {{ formatCurrency(item.totalAmount) }}
              </div>
            </div>
          </div>

          <!-- FOOTER TỔNG TIỀN NỔI BẬT -->
          <div class="px-6 py-4 bg-slate-900 border-t-2 border-slate-800 flex items-center justify-between gap-4 shrink-0">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">
              TỔNG CỘNG ({{ payload.cartTotalQuantity }} MÓN):
            </div>
            <div class="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-400 tracking-tight">
              {{ formatCurrency(payload.cartTotalAmount) }}
            </div>
          </div>

        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <!-- 3. CHẾ ĐỘ THANH TOÁN (CHECKOUT): HIỂN THỊ MÃ QR CHUYỂN KHOẢN -->
      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <div
        v-else-if="payload.mode === 'CHECKOUT'"
        class="h-full w-full grid grid-cols-12 gap-6 p-6 animate-fade-in"
      >
        <!-- CỘT TRÁI (7 CỘT): TÓM TẮT ĐƠN HÀNG -->
        <div class="col-span-7 bg-slate-900/90 rounded-3xl border border-slate-800 p-6 flex flex-col shadow-xl overflow-hidden">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
            <div class="flex items-center gap-2">
              <span class="text-lg">📋</span>
              <h3 class="font-black text-base text-white uppercase tracking-wide">
                Chi Tiết Thanh Toán — {{ payload.tableName || 'BÀN' }}
              </h3>
            </div>
            <span class="text-xs font-bold text-slate-400">{{ payload.customerName || 'Khách lẻ' }}</span>
          </div>

          <div class="flex-1 overflow-y-auto divide-y divide-slate-800/60 my-3 pr-2">
            <div
              v-for="item in payload.cartItems"
              :key="item.productId"
              class="py-2.5 flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <span class="font-black text-white text-sm">{{ item.productName }}</span>
                <span class="text-slate-400 ml-2 font-bold">x{{ item.quantity }}</span>
              </div>
              <span class="font-black text-slate-200 text-sm">{{ formatCurrency(item.totalAmount) }}</span>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-800 space-y-1.5 shrink-0">
            <div class="flex justify-between text-xs font-bold text-slate-400">
              <span>Tổng tiền hàng:</span>
              <span>{{ formatCurrency(payload.cartTotalAmount) }}</span>
            </div>
            <div v-if="payload.checkoutInfo?.discountAmount" class="flex justify-between text-xs font-bold text-emerald-400">
              <span>Giảm giá:</span>
              <span>-{{ formatCurrency(payload.checkoutInfo.discountAmount) }}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-slate-700/80">
              <span class="text-sm font-black text-slate-300 uppercase">CẦN THANH TOÁN:</span>
              <span class="text-2xl sm:text-3xl font-black text-amber-400">
                {{ formatCurrency(payload.checkoutInfo?.finalAmount ?? payload.cartTotalAmount) }}
              </span>
            </div>
          </div>
        </div>

        <!-- CỘT PHẢI (5 CỘT): MÃ QR CHUYỂN KHOẢN NGÂN HÀNG -->
        <div class="col-span-5 bg-gradient-to-b from-blue-950/60 to-slate-900 rounded-3xl border border-blue-500/30 p-6 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
          
          <div class="space-y-1 mb-4">
            <span class="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-black uppercase tracking-widest border border-blue-500/30">
              VIETQR / NGÂN HÀNG
            </span>
            <h4 class="text-base font-black text-white">Quét Mã Chuyển Khoản</h4>
          </div>

          <!-- KHUNG HIỂN THỊ MÃ QR -->
          <div class="p-3 bg-white rounded-2xl shadow-xl shadow-blue-500/10 mb-4 max-w-[240px] w-full aspect-square flex items-center justify-center">
            <img
              v-if="payload.checkoutInfo?.qrBankingUrl"
              :src="payload.checkoutInfo.qrBankingUrl"
              alt="Mã QR Chuyển khoản"
              class="w-full h-full object-contain"
            />
            <div v-else class="text-slate-800 text-center p-4">
              <div class="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p class="text-xs font-bold text-slate-600">Đang tạo mã QR...</p>
            </div>
          </div>

          <!-- THÔNG TIN TÀI KHOẢN -->
          <div class="space-y-1 text-xs text-slate-300 w-full bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div v-if="payload.checkoutInfo?.bankName" class="font-bold text-slate-400">
              {{ payload.checkoutInfo.bankName }}
            </div>
            <div v-if="payload.checkoutInfo?.accountNumber" class="font-mono text-sm font-black text-blue-400 tracking-wider">
              {{ payload.checkoutInfo.accountNumber }}
            </div>
            <div v-if="payload.checkoutInfo?.accountName" class="font-bold uppercase text-white">
              {{ payload.checkoutInfo.accountName }}
            </div>
          </div>

        </div>

      </div>

    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useCustomerDisplayBridge } from '../composables/useCustomerDisplayBridge';

const { currentPayload: payload, initClientListener } = useCustomerDisplayBridge();

// Đồng hồ thời gian thực
const currentTime = ref<string>('');
const currentDate = ref<string>('');
let clockTimer: any = null;

const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  currentDate.value = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
};

onMounted(() => {
  updateClock();
  clockTimer = setInterval(updateClock, 1000);
  const cleanupListener = initClientListener();

  onUnmounted(() => {
    if (clockTimer) clearInterval(clockTimer);
    if (cleanupListener) cleanupListener();
  });
});
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounceSlow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

.animate-bounce-slow {
  animation: bounceSlow 3s ease-in-out infinite;
}
</style>
