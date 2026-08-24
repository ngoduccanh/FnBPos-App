<template>
  <div class="h-screen w-screen bg-slate-50 text-slate-800 flex flex-col overflow-hidden select-none font-sans relative p-1 sm:p-2">

    <!-- 🟡 BODY CONTENT (TỐI ƯU CỰC ĐẠI: 10 MÓN / CỘT = 20 MÓN KHÔNG CẦN CUỘN) -->
    <main class="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-white rounded-xl border border-blue-100/80 shadow-xs">

      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <!-- 1. CHẾ ĐỘ CHỜ (IDLE): KHI CHƯA CHỌN BÀN / Ở SƠ ĐỒ BÀN -->
      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <div
        v-if="payload.mode === 'IDLE'"
        class="h-full w-full flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden bg-gradient-to-br from-blue-50/40 via-white to-sky-50/30"
      >
        <!-- HIỆU ỨNG ÁNH SÁNG NỀN -->
        <div class="absolute w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -top-10 -left-10"></div>
        <div class="absolute w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10"></div>

        <div class="relative z-10 max-w-lg space-y-3.5">
          <!-- ICON CHÀO MỪNG NHỎ GỌN -->
          <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 animate-bounce-slow">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div class="space-y-1">
            <span class="px-3 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest inline-block border border-blue-200">
              KÍNH CHÀO QUÝ KHÁCH
            </span>
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Xin Chào Quý Khách!
            </h2>
            <p class="text-xs font-semibold text-slate-500 max-w-sm mx-auto leading-relaxed">
              Chào mừng quý khách đến với <strong class="text-blue-600 font-extrabold">{{ payload.storeInfo.storeName || 'Quán' }}</strong>. Rất hân hạnh được phục vụ quý khách!
            </p>
          </div>

          <!-- BANNER / TIỆN ÍCH DỊCH VỤ -->
          <div class="grid grid-cols-3 gap-2.5 pt-1">
            <div class="p-2.5 rounded-xl bg-slate-50 border border-blue-100/60 text-center space-y-0.5">
              <div class="text-lg">☕</div>
              <div class="text-xs font-black text-slate-800">Thực Đơn Đa Dạng</div>
              <div class="text-[9px] font-semibold text-slate-400">Pha chế tươi ngon</div>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-blue-100/60 text-center space-y-0.5">
              <div class="text-lg">⚡</div>
              <div class="text-xs font-black text-slate-800">Phục Vụ Nhanh</div>
              <div class="text-[9px] font-semibold text-slate-400">Chu đáo & tận tâm</div>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-blue-100/60 text-center space-y-0.5">
              <div class="text-lg">💳</div>
              <div class="text-xs font-black text-slate-800">Thanh Toán Tiện Lợi</div>
              <div class="text-[9px] font-semibold text-slate-400">Quét mã QR tức thì</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <!-- 2. CHẾ ĐỘ ĐANG GỌI MÓN (ORDERING): TỐI ĐA 10 MÓN / BÊN = 20 MÓN -->
      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <div
        v-else-if="payload.mode === 'ORDERING'"
        class="h-full w-full flex flex-col p-2 sm:p-2.5 animate-fade-in overflow-hidden"
      >
        <!-- THANH TIÊU ĐỀ BÀN SIÊU MỎNG (30px) -->
        <div class="px-3 py-1 bg-blue-50/70 rounded-lg border border-blue-100/80 flex items-center justify-between gap-2 mb-1.5 shrink-0">
          <div class="flex items-center gap-2">
            <div class="px-2.5 py-0.5 bg-blue-600 text-white rounded-md text-xs font-black tracking-wide flex items-center gap-1 shadow-2xs shadow-blue-500/20">
              <span>📍</span>
              <span>{{ payload.tableName || 'MANG VỀ' }}</span>
            </div>
            <span class="text-xs font-bold text-slate-500">
              Khách: <strong class="text-slate-800 font-black">{{ payload.customerName || 'Khách lẻ' }}</strong>
            </span>
          </div>

          <div class="text-xs font-bold text-slate-500">
            Tổng: <strong class="text-blue-600 text-xs sm:text-sm font-black">{{ computedTotalQty }}</strong> món
          </div>
        </div>

        <!-- KHU VỰC DANH SÁCH MÓN ĂN: GRID 2 CỘT TỐI ĐA 10 MÓN MỖI CỘT -->
        <div class="flex-1 overflow-hidden min-h-0">
          
          <!-- TRƯỜNG HỢP GIỎ HÀNG TRỐNG -->
          <div
            v-if="payload.cartItems.length === 0"
            class="h-full flex flex-col items-center justify-center text-slate-400 text-xs font-bold py-4"
          >
            <div class="text-2xl mb-1">🛒</div>
            <span>Chưa có món nào được chọn...</span>
          </div>

          <!-- BẢNG MÓN ĂN: ĐƯỢC THIẾT KẾ 1 HÀNG NGANG (H-8 = 32px) CHỨA 10 MÓN / CỘT -->
          <div
            v-else
            :class="[
              'h-full overflow-hidden gap-1.5',
              payload.cartItems.length > 5 ? 'grid grid-cols-2 content-start' : 'flex flex-col justify-start'
            ]"
          >
            <div
              v-for="(item, index) in payload.cartItems"
              :key="item.productId || index"
              class="flex items-center gap-1.5 px-2 py-1 bg-slate-50/90 hover:bg-blue-50/40 border border-slate-100/90 rounded-md text-xs h-[33px] min-h-[33px] shrink-0"
            >
              <!-- STT NHỎ -->
              <span class="w-4 h-4 rounded bg-blue-100/80 text-blue-700 text-[10px] font-black flex items-center justify-center shrink-0">
                {{ index + 1 }}
              </span>

              <!-- TÊN MÓN & ĐVT (TRÊN 1 HÀNG) -->
              <div class="flex-1 min-w-0 flex items-center gap-1 overflow-hidden">
                <span class="font-extrabold text-xs text-slate-900 truncate" :title="item.productName">
                  {{ item.productName }}
                </span>
                <span v-if="item.unitName" class="px-1 py-0.2 rounded bg-blue-50 text-blue-600 font-bold text-[9px] shrink-0 border border-blue-100">
                  {{ item.unitName }}
                </span>
              </div>

              <!-- SỐ LƯỢNG -->
              <span class="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded text-[11px] font-black border border-blue-200 shrink-0">
                x{{ item.quantity }}
              </span>

              <!-- THÀNH TIỀN -->
              <span class="text-right font-black text-xs text-blue-600 shrink-0 min-w-[58px]">
                {{ formatCurrency(item.totalAmount) }}
              </span>
            </div>
          </div>

        </div>

        <!-- FOOTER TỔNG TIỀN NỔI BẬT TO RÕ DƯỚI ĐÁY -->
        <div class="mt-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/80 rounded-lg border border-blue-100 flex items-center justify-between gap-2 shrink-0">
          <div class="text-[11px] font-black text-slate-500 uppercase tracking-wider">
            TỔNG CỘNG ({{ computedTotalQty }} MÓN):
          </div>
          <div class="text-xl sm:text-2xl font-black text-blue-600 tracking-tight">
            {{ formatCurrency(computedTotalAmount) }}
          </div>
        </div>

      </div>

      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <!-- 3. CHẾ ĐỘ THANH TOÁN (CHECKOUT): HIỂN THỊ MÃ QR CHUYỂN KHOẢN -->
      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <div
        v-else-if="payload.mode === 'CHECKOUT'"
        class="h-full w-full grid grid-cols-12 gap-2.5 p-2 sm:p-2.5 animate-fade-in overflow-hidden"
      >
        <!-- CỘT TRÁI (7 CỘT): TÓM TẮT ĐƠN HÀNG GỌN GÀNG -->
        <div class="col-span-7 bg-white rounded-xl border border-blue-100 p-2.5 flex flex-col shadow-2xs overflow-hidden">
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-100 shrink-0">
            <div class="flex items-center gap-1.5">
              <span class="text-xs">📋</span>
              <h3 class="font-black text-xs text-slate-900 uppercase tracking-wide">
                Chi Tiết Đơn — {{ payload.tableName || 'BÀN' }}
              </h3>
            </div>
            <span class="text-[10px] font-bold text-slate-400">{{ payload.customerName || 'Khách lẻ' }}</span>
          </div>

          <!-- DANH SÁCH MÓN ĂN GỌN (MAX 10-15 MÓN) -->
          <div class="flex-1 overflow-hidden my-1 space-y-1">
            <div
              v-for="item in payload.cartItems.slice(0, 10)"
              :key="item.productId"
              class="py-0.5 px-1.5 bg-slate-50/70 rounded flex items-center justify-between gap-2 text-xs"
            >
              <div class="truncate">
                <span class="font-black text-slate-800 text-xs">{{ item.productName }}</span>
                <span class="text-blue-600 ml-1 font-black text-[10px]">x{{ item.quantity }}</span>
              </div>
              <span class="font-black text-blue-900 text-xs shrink-0">{{ formatCurrency(item.totalAmount) }}</span>
            </div>
            <div v-if="payload.cartItems.length > 10" class="text-center text-[10px] text-slate-400 font-bold">
              ...và {{ payload.cartItems.length - 10 }} món khác
            </div>
          </div>

          <!-- TỔNG KẾT THANH TOÁN -->
          <div class="pt-1.5 border-t border-slate-100 space-y-0.5 shrink-0">
            <div class="flex justify-between text-[11px] font-bold text-slate-500">
              <span>Tổng tiền:</span>
              <span class="font-black text-slate-700">{{ formatCurrency(computedTotalAmount) }}</span>
            </div>
            <div v-if="payload.checkoutInfo?.discountAmount" class="flex justify-between text-[11px] font-bold text-emerald-600">
              <span>Giảm giá:</span>
              <span class="font-black">-{{ formatCurrency(payload.checkoutInfo.discountAmount) }}</span>
            </div>
            <div class="flex justify-between items-center pt-1 border-t border-blue-100">
              <span class="text-[11px] font-black text-slate-700 uppercase">CẦN THANH TOÁN:</span>
              <span class="text-lg sm:text-xl font-black text-blue-600">
                {{ formatCurrency(payload.checkoutInfo?.finalAmount ?? computedTotalAmount) }}
              </span>
            </div>
          </div>
        </div>

        <!-- CỘT PHẢI (5 CỘT): MÃ QR CHUYỂN KHOẢN -->
        <div class="col-span-5 bg-gradient-to-b from-blue-600 to-indigo-700 text-white rounded-xl shadow-md p-2.5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          
          <div class="space-y-0.5 mb-1.5">
            <span class="px-2 py-0.2 rounded-full bg-white/20 text-white text-[9px] font-black uppercase tracking-widest backdrop-blur-xs border border-white/20">
              VIETQR / NGÂN HÀNG
            </span>
            <h4 class="text-xs font-black text-white mt-0.5">Quét Mã Thanh Toán</h4>
          </div>

          <!-- KHUNG HIỂN THỊ MÃ QR -->
          <div class="p-1.5 bg-white rounded-xl shadow-lg mb-1.5 max-w-[150px] w-full aspect-square flex items-center justify-center">
            <img
              v-if="payload.checkoutInfo?.qrBankingUrl"
              :src="payload.checkoutInfo.qrBankingUrl"
              alt="Mã QR Chuyển khoản"
              class="w-full h-full object-contain"
            />
            <div v-else class="text-slate-800 text-center p-1.5">
              <div class="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
              <p class="text-[9px] font-bold text-slate-600">Đang tạo mã...</p>
            </div>
          </div>

          <!-- THÔNG TIN TÀI KHOẢN -->
          <div class="space-y-0.2 text-xs text-white/90 w-full bg-black/15 backdrop-blur-sm p-1.5 rounded-md border border-white/10">
            <div v-if="payload.checkoutInfo?.bankName" class="font-bold text-blue-100 text-[10px]">
              {{ payload.checkoutInfo.bankName }}
            </div>
            <div v-if="payload.checkoutInfo?.accountNumber" class="font-mono text-xs font-black text-yellow-300 tracking-wider">
              {{ payload.checkoutInfo.accountNumber }}
            </div>
            <div v-if="payload.checkoutInfo?.accountName" class="font-bold uppercase text-white text-[9px]">
              {{ payload.checkoutInfo.accountName }}
            </div>
          </div>

        </div>

      </div>

    </main>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useCustomerDisplayBridge } from '../composables/useCustomerDisplayBridge';

const { currentPayload: payload, initClientListener } = useCustomerDisplayBridge();

// Tự động tính tổng tiền và tổng số lượng chính xác 100%
const computedTotalAmount = computed(() => {
  if (payload.value.cartTotalAmount && payload.value.cartTotalAmount > 0) {
    return payload.value.cartTotalAmount;
  }
  return (payload.value.cartItems || []).reduce((sum, item) => {
    const itemTotal = Number(item.totalAmount) || (Number(item.price || 0) * Number(item.quantity || 1));
    return sum + itemTotal;
  }, 0);
});

const computedTotalQty = computed(() => {
  if (payload.value.cartTotalQuantity && payload.value.cartTotalQuantity > 0) {
    return payload.value.cartTotalQuantity;
  }
  return (payload.value.cartItems || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0);
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

onMounted(() => {
  const cleanupListener = initClientListener();

  onUnmounted(() => {
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
  50% { transform: translateY(-5px); }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

.animate-bounce-slow {
  animation: bounceSlow 3s ease-in-out infinite;
}
</style>
