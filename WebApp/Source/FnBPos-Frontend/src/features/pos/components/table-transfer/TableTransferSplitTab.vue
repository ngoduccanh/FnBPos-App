<template>
  <div class="space-y-6">
    <!-- 1. CHỌN BÀN ĐÍCH ĐỂ TÁCH -->
    <div>
      <label class="font-black text-sm text-slate-800 uppercase tracking-wide mb-3 block">
        1. Chọn Bàn Đích Sẽ Nhận Món Tách:
      </label>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[190px] overflow-y-auto p-1 contain-content">
        <button
          v-for="tbl in selectableTables"
          :key="tbl.id"
          @click="$emit('update:selectedTargetTable', tbl)"
          class="p-3.5 rounded-2xl border text-left transition-colors duration-100 cursor-pointer flex items-center justify-between shadow-2xs"
          :class="[
            selectedTargetTable?.id === tbl.id
              ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/30 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'
          ]"
        >
          <span class="font-black text-sm text-slate-900 truncate">{{ tbl.name }}</span>
          <span
            class="px-2 py-0.5 rounded-lg text-[11px] font-black uppercase"
            :class="tbl.status === 'USING' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'"
          >
            {{ tbl.status === 'USING' ? 'Gộp' : 'Mới' }}
          </span>
        </button>
      </div>
    </div>

    <!-- 2. CHỌN SỐ LƯỢNG MÓN TÁCH -->
    <div>
      <label class="font-black text-sm text-slate-800 uppercase tracking-wide mb-3 block">
        2. Chọn Món & Số Lượng Cần Chuyển Sang Bàn Đích:
      </label>

      <div class="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs">
        <table class="w-full text-sm text-left">
          <thead class="bg-slate-100/90 text-slate-700 font-black border-b border-slate-200">
            <tr>
              <th class="py-3.5 px-5">Tên Món</th>
              <th class="py-3.5 px-4 text-center">Đang Có</th>
              <th class="py-3.5 px-4 text-center">Số Lượng Chuyển</th>
              <th class="py-3.5 px-5 text-right">Đơn Giá</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in cartItems"
              :key="item.product.productId"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <!-- TÊN MÓN -->
              <td class="py-3.5 px-5 font-black text-slate-900 text-sm">
                {{ item.product.productName }}
                <div class="text-xs text-slate-400 font-semibold mt-0.5">{{ item.product.retailUnitName || 'Món' }}</div>
              </td>

              <!-- SỐ LƯỢNG ĐANG CÓ -->
              <td class="py-3.5 px-4 text-center font-black text-base text-slate-700">
                {{ item.quantity }}
              </td>

              <!-- BỘ ĐẾM SỐ LƯỢNG CHUYỂN -->
              <td class="py-3.5 px-4">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="$emit('decrease-qty', item.product.productId)"
                    :disabled="getSplitQty(item.product.productId) <= 0"
                    class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-800 font-black text-lg flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    -
                  </button>
                  
                  <span class="w-10 text-center font-black text-base text-blue-600">
                    {{ getSplitQty(item.product.productId) }}
                  </span>

                  <button
                    @click="$emit('increase-qty', item.product.productId, item.quantity)"
                    :disabled="getSplitQty(item.product.productId) >= item.quantity"
                    class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-800 font-black text-lg flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    +
                  </button>

                  <button
                    @click="$emit('set-all-qty', item.product.productId, item.quantity)"
                    class="ml-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-black cursor-pointer transition-colors active:scale-95"
                    title="Chuyển hết món này"
                  >
                    Tất cả
                  </button>
                </div>
              </td>

              <!-- ĐƠN GIÁ -->
              <td class="py-3.5 px-5 text-right font-black text-slate-800 text-sm">
                {{ formatCurrency(item.product.retailOutPrice || 0) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TỔNG KẾT TÁCH MÓN -->
      <div v-if="totalSplitQty > 0" class="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-sm shadow-2xs">
        <span class="font-bold text-amber-900">
          Đã chọn chuyển: <strong class="text-base text-amber-950 font-black">{{ totalSplitQty }}</strong> món sang <strong class="text-base text-amber-950 font-black">{{ selectedTargetTable?.name || '...' }}</strong>
        </span>
        <span class="font-black text-amber-800 text-lg">
          {{ formatCurrency(totalSplitAmount) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PosTableItem } from '../../types/tables.types';
import type { CartItem } from '../../mappers/orderDetailMapper';

defineProps<{
  selectableTables: PosTableItem[];
  selectedTargetTable: PosTableItem | null;
  cartItems: CartItem[];
  getSplitQty: (productId: number) => number;
  totalSplitQty: number;
  totalSplitAmount: number;
  formatCurrency: (val?: number) => string;
}>();

defineEmits<{
  (e: 'update:selectedTargetTable', table: PosTableItem): void;
  (e: 'increase-qty', productId: number, maxQty: number): void;
  (e: 'decrease-qty', productId: number): void;
  (e: 'set-all-qty', productId: number, maxQty: number): void;
}>();
</script>
