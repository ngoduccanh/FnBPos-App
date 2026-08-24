<template>
  <div class="inline-flex items-center gap-2" :class="[alignmentClass]">
    <svg
      :class="[sizeClasses, colorClasses, 'animate-spin shrink-0']"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <span v-if="text" :class="[textSizeClass, textColorClass, 'font-semibold tracking-tight']">
      {{ text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SpinnerSize, SpinnerColor } from '../types/loading.types';

const props = withDefaults(
  defineProps<{
    size?: SpinnerSize;
    color?: SpinnerColor;
    text?: string;
    center?: boolean;
  }>(),
  {
    size: 'md',
    color: 'blue',
    text: '',
    center: false
  }
);

const alignmentClass = computed(() => (props.center ? 'justify-center w-full py-4' : ''));

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-3.5 h-3.5';
    case 'sm':
      return 'w-4 h-4';
    case 'lg':
      return 'w-8 h-8';
    case 'xl':
      return 'w-12 h-12';
    case 'md':
    default:
      return 'w-5 h-5';
  }
});

const colorClasses = computed(() => {
  switch (props.color) {
    case 'white':
      return 'text-white';
    case 'primary':
    case 'blue':
      return 'text-blue-600';
    case 'amber':
      return 'text-amber-500';
    case 'slate':
    default:
      return 'text-slate-500';
  }
});

const textSizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'text-[11px]';
    case 'sm':
      return 'text-xs';
    case 'lg':
      return 'text-base';
    case 'xl':
      return 'text-lg';
    case 'md':
    default:
      return 'text-sm';
  }
});

const textColorClass = computed(() => {
  switch (props.color) {
    case 'white':
      return 'text-white';
    case 'primary':
    case 'blue':
      return 'text-blue-700';
    case 'amber':
      return 'text-amber-700';
    case 'slate':
    default:
      return 'text-slate-600';
  }
});
</script>
