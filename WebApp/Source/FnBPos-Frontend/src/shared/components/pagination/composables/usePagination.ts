import { computed } from 'vue';
import type { PaginationProps, PaginationEmits } from '../types/pagination.types';

export function usePagination(props: PaginationProps, emit: PaginationEmits) {
  const pageIndex = computed(() => props.pageIndex ?? 0);
  const pageSize = computed(() => props.pageSize ?? 10);
  const pageSizeOptions = computed(() => props.pageSizeOptions ?? [10, 20, 50, 100]);
  const showSizeChanger = computed(() => props.showSizeChanger ?? true);
  const showTotal = computed(() => props.showTotal ?? true);
  const maxPageButtons = computed(() => props.maxPageButtons ?? 5);

  const currentPageIndex = computed(() => Math.max(0, pageIndex.value));
  const totalPages = computed(() => Math.ceil(props.totalItems / pageSize.value) || 0);

  const isFirstPage = computed(() => currentPageIndex.value <= 0);
  const isLastPage = computed(() => currentPageIndex.value >= totalPages.value - 1);

  const fromItem = computed(() => {
    if (props.totalItems === 0) return 0;
    return currentPageIndex.value * pageSize.value + 1;
  });

  const toItem = computed(() => {
    return Math.min((currentPageIndex.value + 1) * pageSize.value, props.totalItems);
  });

  const visiblePages = computed<(number | string)[]>(() => {
    const total = totalPages.value;
    const current = currentPageIndex.value + 1;
    const maxButtons = maxPageButtons.value;

    if (total <= maxButtons + 2) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(2, current - half);
    let end = Math.min(total - 1, current + half);

    if (current <= half + 2) {
      start = 2;
      end = maxButtons;
    } else if (current >= total - half - 1) {
      start = total - maxButtons + 1;
      end = total - 1;
    }

    pages.push(1);

    if (start > 2) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 1) {
      pages.push('...');
    }

    pages.push(total);

    return pages;
  });

  const goToPage = (newPageIndex: number) => {
    if (newPageIndex < 0 || newPageIndex >= totalPages.value || newPageIndex === currentPageIndex.value) {
      return;
    }
    emit('update:pageIndex', newPageIndex);
    emit('change', { pageIndex: newPageIndex, pageSize: pageSize.value });
  };

  const onPageSizeChange = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    if (newSize && newSize !== pageSize.value) {
      emit('update:pageSize', newSize);
      emit('update:pageIndex', 0);
      emit('change', { pageIndex: 0, pageSize: newSize });
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return {
    currentPageIndex,
    totalPages,
    isFirstPage,
    isLastPage,
    fromItem,
    toItem,
    visiblePages,
    pageSizeOptions,
    showSizeChanger,
    showTotal,
    goToPage,
    onPageSizeChange,
    formatNumber
  };
}
