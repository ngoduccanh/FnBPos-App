<template>
  <!-- 💳 BOTTOM FOOTER AREA: XUẤT HÓA ĐƠN, ĐẶT MÓN, TẠM TÍNH & THANH TOÁN (F1) -->
  <div class="p-4 bg-white border-t border-slate-200 space-y-3 shrink-0">
    
    <!-- ROW 1: XUẤT HÓA ĐƠN TOGGLE & GHI CHÚ ĐƠN HÀNG -->
    <div class="flex items-center gap-3">
      <label class="flex items-center gap-2 cursor-pointer shrink-0">
        <input
          :checked="isExportInvoice"
          @change="$emit('update:isExportInvoice', ($event.target as HTMLInputElement).checked)"
          type="checkbox"
          class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
        />
        <span class="text-xs font-extrabold text-blue-600 uppercase">XUẤT HÓA ĐƠN</span>
      </label>

      <input
        :value="orderNote"
        @input="$emit('update:orderNote', ($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="Ghi chú đơn hàng..."
        class="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all"
      />
    </div>

    <!-- ROW 2: NÚT ĐẶT MÓN & TẠM TÍNH -->
    <div class="flex items-center justify-between pt-1">
      <button
        @click="$emit('save-order')"
        :disabled="isSavingOrder"
        class="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 active:scale-95 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
      >
        <span v-if="isSavingOrder" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <svg v-else class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ isSavingOrder ? 'ĐANG LƯU...' : 'ĐẶT MÓN' }}</span>
      </button>

      <div class="text-right">
        <span class="text-xs font-bold text-slate-500 uppercase">TẠM TÍNH ({{ cartTotalQuantity }} món): </span>
        <span class="text-xl font-black text-amber-600 ml-1">{{ formattedCartTotal }}</span>
      </div>
    </div>

    <!-- ROW 3: NÚT THANH TOÁN (F1) -->
    <div>
      <button
        @click="$emit('checkout')"
        class="w-full py-3.5 bg-blue-500 hover:bg-blue-600 active:scale-[0.99] text-white font-black text-base rounded-2xl transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
      >
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        <span>THANH TOÁN (F1)</span>
      </button>
    </div>

    <!-- ROW 4: BOTTOM ICON ACTIONS (MÃ QR, IN CHẾ BIẾN, HỦY ĐƠN) -->
    <div class="grid grid-cols-3 gap-2 pt-1">
      <!-- NÚT 1: MÃ QR -->
      <button
        @click="$emit('show-qr')"
        class="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
      >
        <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <span>Mã QR</span>
      </button>

      <!-- NÚT 2: IN CHẾ BIẾN -->
      <button
        @click="$emit('print-kitchen')"
        class="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
      >
        <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        <span>In chế biến</span>
      </button>

      <!-- NÚT 3: HỦY ĐƠN -->
      <button
        @click="$emit('cancel-order')"
        :disabled="isCancelling"
        class="py-2.5 bg-slate-100 hover:bg-red-50 disabled:opacity-50 text-red-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
      >
        <span v-if="isCancelling" class="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
        <svg v-else class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>{{ isCancelling ? 'Đang hủy...' : 'Hủy đơn' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isExportInvoice: boolean;
  orderNote: string;
  isSavingOrder: boolean;
  isCancelling?: boolean;
  cartTotalQuantity: number;
  formattedCartTotal: string;
}>();

defineEmits<{
  (e: 'update:isExportInvoice', val: boolean): void;
  (e: 'update:orderNote', val: string): void;
  (e: 'save-order'): void;
  (e: 'checkout'): void;
  (e: 'show-qr'): void;
  (e: 'print-bill'): void;
  (e: 'print-kitchen'): void;
  (e: 'cancel-order'): void;
  (e: 'clear-cart'): void;
}>();
</script>
