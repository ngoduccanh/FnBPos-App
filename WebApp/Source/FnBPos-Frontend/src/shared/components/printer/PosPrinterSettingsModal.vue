<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none"
        @click.self="closeModal"
      >
      <div
        class="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        <!-- 🟢 HEADER MODAL -->
        <div class="px-6 py-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-xs">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold tracking-tight text-white">Cài Đặt Máy In</h3>
              <p class="text-xs text-blue-100/90 font-medium">Thiết lập kết nối QZ Tray, WebUSB & WiFi/LAN</p>
            </div>
          </div>

          <button
            @click="closeModal"
            class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- 🟢 TAB CHỌN: MÁY IN HÓA ĐƠN vs MÁY IN BẾP -->
        <div class="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-200/80 flex gap-2 shrink-0">
          <button
            @click="activeTab = 'bill'"
            class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border"
            :class="[
              activeTab === 'bill'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            ]"
          >
            <svg class="w-4 h-4" :class="activeTab === 'bill' ? 'text-white' : 'text-slate-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Máy in Hóa Đơn (Thu Ngân)</span>
          </button>

          <button
            @click="activeTab = 'kitchen'"
            class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border"
            :class="[
              activeTab === 'kitchen'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            ]"
          >
            <svg class="w-4 h-4" :class="activeTab === 'kitchen' ? 'text-white' : 'text-slate-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Máy in Bếp / Pha Chế</span>
          </button>
        </div>

        <!-- 🟢 NỘI DUNG CÀI ĐẶT THEO TAB -->
        <div class="p-6 overflow-y-auto space-y-5 flex-1 custom-blue-scrollbar text-slate-800">
          
          <!-- 1. CHỌN PHƯƠNG THỨC KẾT NỐI -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Phương thức kết nối
            </label>
            <div class="grid grid-cols-3 gap-2.5">
              <!-- QZ TRAY -->
              <div
                @click="currentConfig.driver = 'qz-tray'"
                class="p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1.5"
                :class="[
                  currentConfig.driver === 'qz-tray'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                ]"
              >
                <div class="w-8 h-8 rounded-xl flex items-center justify-center" :class="currentConfig.driver === 'qz-tray' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span class="text-xs">QZ Tray</span>
                <span class="text-[10px] text-slate-400 font-normal">PC / Win POS</span>
              </div>

              <!-- WEB USB -->
              <div
                @click="currentConfig.driver = 'web-usb'"
                class="p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1.5"
                :class="[
                  currentConfig.driver === 'web-usb'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                ]"
              >
                <div class="w-8 h-8 rounded-xl flex items-center justify-center" :class="currentConfig.driver === 'web-usb' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span class="text-xs">Cáp USB</span>
                <span class="text-[10px] text-slate-400 font-normal">Android / Chrome</span>
              </div>

              <!-- WIFI / LAN -->
              <div
                @click="currentConfig.driver = 'wifi-lan'"
                class="p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-1.5"
                :class="[
                  currentConfig.driver === 'wifi-lan'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                ]"
              >
                <div class="w-8 h-8 rounded-xl flex items-center justify-center" :class="currentConfig.driver === 'wifi-lan' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                </div>
                <span class="text-xs">WiFi / LAN</span>
                <span class="text-[10px] text-slate-400 font-normal">Cổng mạng IP</span>
              </div>
            </div>
          </div>

          <!-- 2. CHI TIẾT THEO PHƯƠNG THỨC KẾT NỐI -->
          
          <!-- ── A. GIAO DIỆN QZ TRAY (DANH SÁCH THEO TỪNG NHÀ CON) ── -->
          <div v-if="currentConfig.driver === 'qz-tray'" class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3.5">
            <div class="flex items-center justify-between pb-1 border-b border-slate-200/60">
              <label class="text-xs font-bold text-slate-700">Danh sách máy in từ QZ Tray</label>
              <button
                @click="loadQzPrinters"
                :disabled="isLoadingPrinters"
                class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoadingPrinters }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Tìm lại máy in</span>
              </button>
            </div>

            <!-- DANH SÁCH TỪNG CỬA HÀNG CON VỚI DROPDOWN MÁY IN RIÊNG -->
            <div v-if="childStores.length > 0" class="space-y-3 pt-1">
              <div
                v-for="store in childStores"
                :key="store.id"
                class="space-y-1.5"
              >
                <label class="block text-xs font-bold text-slate-700 uppercase">
                  {{ store.value }}
                </label>
                <select
                  :value="getStorePrinter(store.id)"
                  @change="setStorePrinter(store.id, ($event.target as HTMLSelectElement).value)"
                  class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="" disabled>-- Chọn máy in --</option>
                  <option v-for="printer in qzPrinters" :key="printer" :value="printer">
                    {{ printer }}
                  </option>
                </select>
              </div>
            </div>

            <!-- NẾU CHƯA CÓ DANH SÁCH NHÀ CON: DROPDOWN CHUNG -->
            <div v-else-if="qzPrinters.length > 0" class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-700 uppercase">
                Máy in mặc định
              </label>
              <select
                v-model="currentConfig.name"
                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="" disabled>-- Chọn máy in --</option>
                <option v-for="printer in qzPrinters" :key="printer" :value="printer">
                  {{ printer }}
                </option>
              </select>
            </div>

            <div v-else class="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
              Không tìm thấy máy in QZ Tray. Vui lòng mở ứng dụng QZ Tray trên máy tính và bấm <strong>Tìm lại máy in</strong>.
            </div>
          </div>

          <!-- ── B. GIAO DIỆN WEB USB ── -->
          <div v-if="currentConfig.driver === 'web-usb'" class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-bold text-slate-800">Kết nối máy in qua cáp USB</p>
                <p class="text-[11px] text-slate-500">Cắm cáp USB máy in vào máy POS/Android</p>
              </div>
              <button
                @click="pairUsbPrinter"
                class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Ghép nối USB</span>
              </button>
            </div>
            <div v-if="usbDeviceName" class="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-bold flex items-center gap-2">
              <span>Đã kết nối: {{ usbDeviceName }}</span>
            </div>
          </div>

          <!-- ── C. GIAO DIỆN WIFI / LAN IP ── -->
          <div v-if="currentConfig.driver === 'wifi-lan'" class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-2">
                <label class="block text-xs font-bold text-slate-700 mb-1">Địa chỉ IP máy in</label>
                <input
                  v-model="currentConfig.ip"
                  type="text"
                  placeholder="192.168.1.200"
                  class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Cổng Port</label>
                <input
                  v-model.number="currentConfig.port"
                  type="number"
                  placeholder="9100"
                  class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <!-- 3. CÀI ĐẶT KHỔ GIẤY & TÍNH NĂNG NÂNG CAO -->
          <div class="space-y-3 pt-1 border-t border-slate-100">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tùy chọn khổ giấy & tính năng
            </label>

            <div class="flex items-center gap-4">
              <!-- KHỔ GIẤY K80 / K58 -->
              <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="radio"
                  v-model="currentConfig.paperSize"
                  value="K80"
                  class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Khổ K80 (80mm - Phổ biến)</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="radio"
                  v-model="currentConfig.paperSize"
                  value="K58"
                  class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Khổ K58 (58mm - Nhỏ)</span>
              </label>
            </div>

            <div class="flex items-center gap-6 pt-1">
              <!-- TỰ ĐỘNG CẮT GIẤY -->
              <label class="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  v-model="currentConfig.autoCut"
                  class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Tự động cắt giấy (Auto Cut)</span>
              </label>

              <!-- MỞ KÉT TIỀN (Chỉ hiển thị cho Máy in hóa đơn) -->
              <label
                v-if="activeTab === 'bill'"
                class="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700"
              >
                <input
                  type="checkbox"
                  v-model="currentConfig.openCashDrawer"
                  class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Tự mở két tiền (Cash Drawer)</span>
              </label>
            </div>
          </div>

        </div>

        <!-- 🟢 FOOTER MODAL: IN THỬ & LƯU -->
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <!-- NÚT IN THỬ -->
          <button
            @click="handleTestPrint"
            :disabled="isTestingPrint"
            class="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <svg class="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>{{ isTestingPrint ? 'Đang in thử...' : 'In thử kiểm tra' }}</span>
          </button>

          <div class="flex items-center gap-2">
            <button
              @click="closeModal"
              class="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              @click="handleSave"
              class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/25 cursor-pointer"
            >
              Lưu cài đặt
            </button>
          </div>
        </div>

      </div>
    </div>
  </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { PrinterStorageService } from '@/services/printer/printerStorageService';
import { PosPrinterService } from '@/services/printer/posPrinterService';
import { WebUsbDriver } from '@/services/printer/drivers/webUsbDriver';
import { useToast } from '@/shared/components/toast/composables/useToast';
import { useChildStores } from '@/features/pos/hooks/useChildStores';
import type { PosPrinterSettings, PrinterDeviceConfig } from '@/services/printer/types/printer.types';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const toast = useToast();
const activeTab = ref<'bill' | 'kitchen'>('bill');
const settings = ref<PosPrinterSettings>(PrinterStorageService.getSettings());

const { childStores, isLoading: isLoadingChildStores, fetchChildStores } = useChildStores();

const qzPrinters = ref<string[]>([]);
const isLoadingPrinters = ref(false);
const isTestingPrint = ref(false);
const usbDeviceName = ref<string>('');

const currentConfig = computed<PrinterDeviceConfig>({
  get() {
    return activeTab.value === 'bill' ? settings.value.billPrinter : settings.value.kitchenPrinter;
  },
  set(val) {
    if (activeTab.value === 'bill') {
      settings.value.billPrinter = val;
    } else {
      settings.value.kitchenPrinter = val;
    }
  }
});

const getStorePrinter = (storeId: number): string => {
  if (!currentConfig.value.storePrinterMap) {
    currentConfig.value.storePrinterMap = {};
  }
  return currentConfig.value.storePrinterMap[storeId] || currentConfig.value.name || (qzPrinters.value[0] || '');
};

const setStorePrinter = (storeId: number, printerName: string) => {
  if (!currentConfig.value.storePrinterMap) {
    currentConfig.value.storePrinterMap = {};
  }
  currentConfig.value.storePrinterMap[storeId] = printerName;
  // Cập nhật cả default name nếu cần
  if (!currentConfig.value.name) {
    currentConfig.value.name = printerName;
  }
};

const loadQzPrinters = async () => {
  isLoadingPrinters.value = true;
  try {
    const list = await PosPrinterService.getQzPrinters();
    qzPrinters.value = list;
    if (list.length > 0) {
      if (!currentConfig.value.name || !list.includes(currentConfig.value.name)) {
        currentConfig.value.name = list[0];
      }
    }
  } finally {
    isLoadingPrinters.value = false;
  }
};

const pairUsbPrinter = async () => {
  try {
    const name = await WebUsbDriver.requestPrinter();
    if (name) {
      usbDeviceName.value = name;
      currentConfig.value.name = name;
      toast.showSuccess(`Đã ghép nối USB: ${name}`, 'Máy in USB');
    }
  } catch (err: any) {
    toast.showError(err?.message || 'Không thể ghép nối máy in USB', 'Lỗi USB');
  }
};

const handleTestPrint = async () => {
  isTestingPrint.value = true;
  try {
    if (activeTab.value === 'bill') {
      await PosPrinterService.printBill(
        {
          type: 'receipt',
          title: 'HÓA ĐƠN THỬ NGHIỆM',
          storeName: 'BEEPOS247 TEST',
          storePhone: '0988.xxx.xxx',
          tableName: 'BÀN TEST',
          customerName: 'Khách hàng thử nghiệm',
          totalQuantity: 2,
          totalAmount: 50000,
          finalAmount: 50000,
          items: [
            { stt: 1, name: 'Cà phê muối', price: 25000, unit: 'Ly', quantity: 1, amount: 25000 },
            { stt: 2, name: 'Trà đào cam sả', price: 25000, unit: 'Ly', quantity: 1, amount: 25000 }
          ]
        },
        currentConfig.value
      );
    } else {
      await PosPrinterService.printKitchen(
        {
          type: 'order',
          title: 'ĐƠN BẾP THỬ NGHIỆM',
          tag: '[IN THỬ]',
          tableName: 'BÀN TEST',
          serverName: 'Admin',
          items: [
            { name: 'Cà phê muối', unit: 'Ly', quantity: 1, note: 'Ít đá, ít đường' },
            { name: 'Trà đào cam sả', unit: 'Ly', quantity: 1 }
          ]
        },
        currentConfig.value
      );
    }
    toast.showSuccess('Đã gửi lệnh in thử nghiệm!', 'Thành công');
  } catch (err: any) {
    toast.showError(err?.message || 'In thử thất bại. Vui lòng kiểm tra lại cấu hình!', 'Lỗi in ấn');
  } finally {
    isTestingPrint.value = false;
  }
};

const handleSave = () => {
  PrinterStorageService.saveSettings(settings.value);
  toast.showSuccess('Đã lưu cấu hình máy in thành công!', 'Cài đặt');
  emit('close');
};

const closeModal = () => {
  emit('close');
};

onMounted(() => {
  loadQzPrinters();
  fetchChildStores();
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
