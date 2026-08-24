<template>
  <div
    @click="$emit('select', table)"
    class="group relative rounded-3xl p-5 transition-colors duration-100 cursor-pointer border flex flex-col justify-between select-none h-[195px] overflow-hidden"
    :class="[
      // Bàn đang chọn Active
      isSelected ? 'ring-4 ring-blue-600/30 border-blue-600 shadow-md z-10' : '',

      // Style theo Trạng thái Bàn KiotViet Standard
      table.status === 'USING'
        ? 'bg-blue-600 border-blue-600 text-white shadow-sm hover:bg-blue-700'
        : table.status === 'RESERVED'
        ? 'bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-400'
        : 'bg-white border-slate-200/90 text-slate-800 hover:border-blue-400'
    ]"
  >
    <!-- TOP HEADER: TÊN BÀN, ICON BÀN & BADGE TRẠNG THÁI -->
    <div>
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <!-- ICON BÀN VECTOR TRẮNG MINIMALIST -->
          <div
            class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-colors duration-100 shrink-0"
            :class="[
              table.status === 'USING'
                ? 'bg-white/20 text-white'
                : table.status === 'RESERVED'
                ? 'bg-amber-200/80 text-amber-900'
                : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
            ]"
          >
            <!-- SVG ICON BÀN ĂN 4 GHẾ -->
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 10h18M5 10v8M19 10v8M8 10V6a1 1 0 011-1h6a1 1 0 011 1v4" />
            </svg>
          </div>

          <div>
            <h3 class="font-black text-lg tracking-tight leading-snug">
              {{ table.name }}
            </h3>
            <p
              v-if="table.status !== 'USING' && table.groupName"
              class="text-xs font-semibold opacity-70 mt-0.5"
            >
              {{ table.groupName }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <!-- NÚT XEM/IN MÃ QR BÀN -->
          <button
            @click.stop="$emit('open-qr', table)"
            class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-100 cursor-pointer"
            :class="[
              table.status === 'USING'
                ? 'bg-white/20 hover:bg-white/35 text-white'
                : 'bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600'
            ]"
            title="Xem / In mã QR bàn"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </button>

          <!-- BADGE TRẠNG THÁI BO CONG (PILL BADGE) -->
          <span
            class="px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
            :class="[
              table.status === 'USING'
                ? 'bg-white/25 text-white'
                : table.status === 'RESERVED'
                ? 'bg-amber-200 text-amber-900'
                : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
            ]"
          >
            {{ table.status === 'USING' ? 'Có khách' : table.status === 'RESERVED' ? 'Đặt trước' : 'TRỐNG' }}
          </span>
        </div>
      </div>

      <!-- 📋 THÔNG TIN KHÁCH HÀNG & TỔNG SỐ MÓN NẰM BÊN DƯỚI TOÀN BỘ ICON BÀN (FULL WIDTH) -->
      <div v-if="table.status === 'USING'" class="mt-3 pt-2.5 border-t border-white/15 space-y-1 text-xs">
        <!-- ICON KHÁCH HÀNG VECTOR TRẮNG MINIMALIST -->
        <div class="flex items-center gap-2 font-bold text-white/95">
          <svg class="w-3.5 h-3.5 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="truncate">{{ table.customerName || 'Khách lẻ' }}</span>
        </div>

        <!-- ICON SỐ MÓN VECTOR TRẮNG MINIMALIST -->
        <div class="flex items-center gap-2 font-semibold text-white/85">
          <svg class="w-3.5 h-3.5 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>{{ table.prodCount || 0 }} món</span>
        </div>
      </div>
    </div>

    <!-- BOTTOM FOOTER CỦA BÀN: GIỜ VÀO & TỔNG TIỀN -->
    <div 
      class="mt-3 pt-2.5 border-t flex items-center justify-between"
      :class="table.status === 'USING' ? 'border-white/20' : 'border-slate-100'"
    >
      <div class="text-sm font-bold opacity-95 flex items-center gap-1.5">
        <span v-if="table.status === 'USING'" class="flex items-center gap-1.5">
          <!-- ICON DỒNG HỒ GIỜ VÀO VECTOR TRẮNG MINIMALIST -->
          <svg class="w-3.5 h-3.5 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ table.timeStarted || 'Vừa vào' }}</span>
        </span>
        <span v-else class="text-slate-400">Sẵn sàng</span>
      </div>

      <div v-if="table.totalAmount && table.status === 'USING'" class="text-right font-black text-lg text-white">
        {{ new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(table.totalAmount) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PosTableItem } from '../types/tables.types';

defineProps<{
  table: PosTableItem;
  isSelected?: boolean;
}>();

defineEmits<{
  (e: 'select', table: PosTableItem): void;
  (e: 'open-qr', table: PosTableItem): void;
}>();
</script>
