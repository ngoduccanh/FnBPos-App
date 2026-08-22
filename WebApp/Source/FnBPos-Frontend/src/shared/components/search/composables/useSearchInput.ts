import { ref, watch, onMounted } from 'vue';
import type { SearchInputProps, SearchInputEmits } from '../types/searchInput.types';
import { useDebouncedSearch } from '@/shared/composables/useDebouncedSearch';

/**
 * ⚡ HOOK QUẢN LÝ TẤT CẢ LOGIC CỦA SEARCH INPUT COMPONENT
 */
export function useSearchInput(props: SearchInputProps, emit: SearchInputEmits) {
  const inputRef = ref<HTMLInputElement | null>(null);
  const isFocused = ref(false);

  // ⚡ SỬ DỤNG HOOK DEBOUNCE CHÍNH XÁC THEO PROPS DELAY
  const { searchText, clearSearch } = useDebouncedSearch({
    delay: props.delay,
    onSearch: (val) => {
      emit('search', val);
    }
  });

  // Đồng bộ v-model từ bên ngoài vào (khi parent thay đổi modelValue)
  watch(() => props.modelValue, (newVal) => {
    if (newVal !== searchText.value) {
      searchText.value = newVal;
    }
  });

  // Đồng bộ v-model ra bên ngoài khi searchText đếm ngược xong
  watch(searchText, (newVal) => {
    emit('update:modelValue', newVal);
  });

  const handleClear = () => {
    clearSearch();
    emit('update:modelValue', '');
    emit('clear');
    emit('search', '');
    if (inputRef.value) {
      inputRef.value.focus();
    }
  };

  onMounted(() => {
    if (props.autoFocus && inputRef.value) {
      inputRef.value.focus();
    }
  });

  return {
    inputRef,
    isFocused,
    searchText,
    handleClear
  };
}
