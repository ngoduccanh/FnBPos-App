import { ref, watch } from 'vue';

export interface UseDebouncedSearchOptions {
  /** Thời gian đếm ngược chờ gõ xong (Mặc định: 500ms) */
  delay?: number;
  /** Callback thực thi gọi API khi người dùng ngưng gõ */
  onSearch: (searchText: string) => void;
}

/**
 * ⚡ CUSTOM HOOK TÌM KIẾM CHỐNG SPAM API (DEBOUNCE 500MS) DÙNG CHUNG TOÀN HỆ THỐNG
 */
export function useDebouncedSearch(options: UseDebouncedSearchOptions) {
  const searchText = ref('');
  let timer: ReturnType<typeof setTimeout> | null = null;

  // Lắng nghe thay đổi từ khóa gõ vào input
  watch(searchText, (newVal) => {
    if (timer) {
      clearTimeout(timer);
    }

    const delayMs = options.delay ?? 500;
    timer = setTimeout(() => {
      options.onSearch(newVal);
    }, delayMs);
  });

  const clearSearch = () => {
    searchText.value = '';
  };

  return {
    searchText,
    clearSearch
  };
}
