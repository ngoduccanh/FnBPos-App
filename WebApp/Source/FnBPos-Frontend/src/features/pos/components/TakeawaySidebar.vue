<template>
  <div>
    <!-- BACKDROP OVERLAY TRÊN MOBILE -->
    <div
      v-if="isOpen"
      @click="$emit('close')"
      class="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity duration-300"
    ></div>

    <!-- ASIDE PANEL: SLIDE FROM LEFT ON MOBILE / FIXED SIDEBAR ON DESKTOP -->
    <aside
      class="fixed lg:relative inset-y-0 left-0 z-50 w-72 lg:w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 overflow-hidden select-none transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none"
      :class="[
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- HEADER: ĐƠN MANG VỀ & SỐ LƯỢNG -->
      <div class="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white">
        <h2 class="text-xs font-bold uppercase tracking-wider text-cyan-600 flex items-center gap-2">
          <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>ĐƠN MANG VỀ</span>
        </h2>
        
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-cyan-500 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
            {{ takeawayOrders.length }}
          </span>
          <!-- NÚT ĐÓNG TRÊN MOBILE -->
          <button
            @click="$emit('close')"
            class="lg:hidden w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer ml-1"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- NÚT TẠO ĐƠN MỚI (KHUNG VIỀN NET ĐỨT CYAN MẠNH MẼ) -->
      <div class="p-3">
        <button
          @click="handleCreateTakeaway"
          class="w-full py-3.5 border-2 border-dashed border-cyan-400 hover:border-cyan-500 bg-cyan-50/50 hover:bg-cyan-50 text-cyan-600 font-bold text-xs rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
        >
          <span class="text-lg font-bold leading-none">+</span>
          <span class="tracking-wide">TẠO ĐƠN MỚI</span>
        </button>
      </div>

      <!-- DANH SÁCH ĐƠN MANG VỀ HOẶC TRẠNG THÁI TRỐNG -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        <template v-if="takeawayOrders.length > 0">
          <div
            v-for="order in takeawayOrders"
            :key="order.id"
            @click="$emit('select-order', order)"
            class="p-3 bg-white border border-slate-200 hover:border-cyan-500 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <div class="flex justify-between items-center text-xs font-bold">
              <span class="text-slate-800">Đơn Mang Về #{{ order.code || order.id }}</span>
              <span class="text-cyan-600 font-semibold">{{ order.totalAmount }}đ</span>
            </div>
          </div>
        </template>

        <!-- EMPTY STATE TRẠNG THÁI TRỐNG HỘP CARTON GIỐNG MẪU -->
        <div v-else class="h-full flex flex-col items-center justify-center text-slate-400 py-16 space-y-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-slate-300 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span class="text-xs font-medium text-slate-400">Chưa có đơn nào</span>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { PosTableItem } from '../types/tables.types';

defineProps<{
  isOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: 'create-takeaway', takeawayTable: PosTableItem): void;
  (e: 'select-order', order: any): void;
  (e: 'close'): void;
}>();

const takeawayOrders = ref<any[]>([]);

const handleCreateTakeaway = () => {
  // Tạo đối tượng Bàn Mang Về với ID = 0 theo đúng yêu cầu
  const takeawayTable: PosTableItem = {
    id: 0,
    name: 'Mang về',
    code: 'MV',
    groupId: 0,
    isOccupied: false,
    isTakeaway: true
  };

  emit('create-takeaway', takeawayTable);
};
</script>
