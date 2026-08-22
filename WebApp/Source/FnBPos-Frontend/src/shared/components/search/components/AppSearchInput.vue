<template>
  <div class="fnb-search-box">
    <div
      class="fnb-search-input-wrapper"
      :class="{ 'fnb-search-input-wrapper-focus': isFocused }"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="fnb-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      <input
        ref="inputRef"
        v-model="searchText"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        class="fnb-search-input"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <button
        v-if="clearable && searchText"
        type="button"
        @click="handleClear"
        class="fnb-search-clear-btn"
        title="Xóa tìm kiếm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchInputProps, SearchInputEmits } from '../types/searchInput.types';
import { useSearchInput } from '../composables/useSearchInput';
import '../styles/searchInput.css';

const props = withDefaults(defineProps<SearchInputProps>(), {
  modelValue: '',
  placeholder: 'Tìm kiếm...',
  delay: 1000,
  disabled: false,
  clearable: true,
  autoFocus: false
});

const emit = defineEmits<SearchInputEmits>();

const { inputRef, isFocused, searchText, handleClear } = useSearchInput(props, emit);

void inputRef;
</script>
