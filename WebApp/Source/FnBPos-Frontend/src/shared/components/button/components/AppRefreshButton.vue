<template>
  <button
    @click="handleClick"
    :disabled="disabled || isRefreshing || cooldownTimer > 0"
    class="h-10 px-3.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs active:scale-95 select-none"
    :class="{ 'opacity-50 !cursor-not-allowed': networkIsOffline }"
    :title="buttonTitle"
  >
    <!-- ICON XOAY KHI LOADING HOẶC ICON LÀM MỚI BÌNH THƯỜNG -->
    <svg
      class="w-4 h-4"
      :class="{ 'animate-spin text-blue-600': isRefreshing }"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>

    <!-- NỘI DUNG NÚT & ĐẾM NGƯợC COOLDOWN CHỐNG SPAM -->
    <span v-if="showLabel" class="hidden sm:inline">
      {{ labelText }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { networkIsOffline } from '@/services/useNetworkStatus';
import { useToast } from '@/shared/components/toast/composables/useToast';

const props = withDefaults(
  defineProps<{
    isRefreshing?: boolean;
    disabled?: boolean;
    cooldownSeconds?: number;
    showLabel?: boolean;
    label?: string;
  }>(),
  {
    isRefreshing: false,
    disabled: false,
    cooldownSeconds: 10,
    showLabel: true,
    label: 'Làm mới'
  }
);

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const cooldownTimer = ref<number>(0);
let intervalId: any = null;

const toast = useToast();

const labelText = computed(() => {
  if (networkIsOffline.value) return props.label;
  if (cooldownTimer.value > 0) return `${props.label} (${cooldownTimer.value}s)`;
  return props.label;
});

const buttonTitle = computed(() => {
  if (networkIsOffline.value)   return 'Không thể làm mới khi đang ngoại tuyến';
  if (cooldownTimer.value > 0)  return `Vui lòng đợi ${cooldownTimer.value} giây để làm mới tiếp`;
  return 'Làm mới dữ liệu từ máy chủ';
});

const startCooldown = () => {
  if (props.cooldownSeconds <= 0) return;
  cooldownTimer.value = props.cooldownSeconds;
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    if (cooldownTimer.value > 1) {
      cooldownTimer.value--;
    } else {
      cooldownTimer.value = 0;
      clearInterval(intervalId);
      intervalId = null;
    }
  }, 1000);
};

const handleClick = () => {
  // ── Đang offline → hiện toast cảnh báo, KHÔNG emit ─────────────────────
  if (networkIsOffline.value) {
    toast.showWarning('Không thể làm mới dữ liệu khi đang ngoại tuyến.', 'Ngoại tuyến');
    return;
  }

  // ── Online bình thường ─────────────────────────────────────────
  if (props.isRefreshing || props.disabled || cooldownTimer.value > 0) return;
  emit('click');
  startCooldown();
};

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>
