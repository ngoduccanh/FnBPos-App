<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      @click.self="close"
    >
      <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-scale-up">
        
        <!-- HEADER MODAL -->
        <div class="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h3 class="font-extrabold text-base leading-tight">Mã QR Gọi Món</h3>
              <p class="text-xs text-blue-100 font-medium">{{ tableName || `Bàn ID #${targetId}` }}</p>
            </div>
          </div>

          <button
            @click="close"
            class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- BODY: HIỂN THỊ ẢNH QR CODE -->
        <div class="p-6 flex flex-col items-center justify-center bg-slate-50/50">
          <!-- LOADING -->
          <div v-if="isLoading" class="py-12 flex flex-col items-center gap-3 text-slate-400">
            <div class="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-semibold text-slate-600">Đang tạo mã QR bàn...</p>
          </div>

          <!-- QR IMAGE CONTAINER -->
          <div
            v-else-if="qrImageUrl"
            class="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center"
          >
            <img
              :src="qrImageUrl"
              :alt="`QR Code ${tableName}`"
              class="w-56 h-56 object-contain select-none"
            />
            <div class="mt-3 text-center">
              <span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black uppercase tracking-wider">
                {{ tableName || 'BÀN' }}
              </span>
            </div>
          </div>

          <!-- LỖI HOẶC KHÔNG CÓ DỮ LIỆU -->
          <div v-else class="py-10 text-center text-slate-400 text-xs font-medium">
            <p>Không thể tạo mã QR cho bàn này.</p>
            <button
              @click="loadQr"
              class="mt-3 px-3 py-1.5 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 text-xs cursor-pointer"
            >
              Thử lại
            </button>
          </div>

          <!-- HƯỚNG DẪN -->
          <p class="text-center text-[11px] text-slate-500 mt-4 leading-relaxed max-w-[240px]">
            Khách hàng dùng camera điện thoại quét mã này để gọi món trực tiếp vào bàn.
          </p>
        </div>

        <!-- FOOTER: NÚT IN VÀ NÚT TẢI VỀ -->
        <div class="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            @click="downloadQr"
            :disabled="!qrImageUrl || isLoading"
            class="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Tải ảnh</span>
          </button>

          <button
            @click="printQr"
            :disabled="!qrImageUrl || isLoading"
            class="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>In mã QR</span>
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useTableQrCode } from '../hooks/useTableQrCode';

const props = defineProps<{
  isOpen: boolean;
  targetId: number;
  tableName?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { qrImageUrl, isLoading, fetchTableQrCode, clearQrCode } = useTableQrCode();

const loadQr = () => {
  if (props.targetId) {
    fetchTableQrCode(props.targetId);
  }
};

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.targetId) {
      loadQr();
    } else {
      clearQrCode();
    }
  }
);

const close = () => {
  emit('close');
};

/**
 * 📥 Tải file ảnh mã QR PNG về máy
 */
const downloadQr = () => {
  if (!qrImageUrl.value) return;
  const link = document.createElement('a');
  link.href = qrImageUrl.value;
  link.download = `QR_${props.tableName ? props.tableName.replace(/\s+/g, '_') : `Ban_${props.targetId}`}.png`;
  link.click();
};

/**
 * 🖨️ In mã QR bàn ra máy in
 */
const printQr = () => {
  if (!qrImageUrl.value) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Mã QR - ${props.tableName || 'Bàn'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
          .container { text-align: center; border: 2px dashed #333; padding: 20px; border-radius: 16px; width: 280px; }
          h2 { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
          img { width: 220px; height: 220px; object-fit: contain; margin: 0 auto; }
          p { font-size: 12px; color: #555; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${props.tableName || 'QUÉT MÃ GỌI MÓN'}</h2>
          <img src="${qrImageUrl.value}" />
          <p>Quét mã để xem thực đơn và gọi món tại bàn</p>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
};
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

.animate-scale-up {
  animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
