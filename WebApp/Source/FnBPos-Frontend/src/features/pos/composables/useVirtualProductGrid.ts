import { ref, computed, onMounted, onUnmounted, watch, type Ref } from 'vue';
import type { PosProductItem } from '../types/products.types';

/**
 * ⚡ COMPOSABLE VIRTUAL GRID RENDER CHO MÁY POS & THIẾT BỊ ANDROID YẾU
 * Cơ chế: Chỉ render tối đa ~20-24 sản phẩm trong khung nhìn (Viewport Windowing)
 * Dùng Top/Bottom Spacers để giữ thanh cuộn tự nhiên 100% mà DOM không bao giờ bị quá tải.
 */
export function useVirtualProductGrid(
  containerRef: Ref<HTMLElement | null>,
  itemsRef: Ref<PosProductItem[]>,
  estimatedRowHeight: number = 220
) {
  const scrollTop = ref<number>(0);
  const containerHeight = ref<number>(600);
  const containerWidth = ref<number>(800);

  // 1. Tính toán số cột động dựa trên chiều rộng container
  const columnCount = computed(() => {
    const width = containerWidth.value;
    if (width < 640) return 2;         // Mobile (< 640px): 2 cột
    if (width < 1024) return 3;        // Tablet / Màn hình nhỏ: 3 cột
    return 4;                          // POS Desktop / Tablet lớn (>= 1024px): 4 cột
  });

  // 2. Tính toán tổng số hàng
  const totalRows = computed(() => {
    const count = itemsRef.value.length;
    const cols = columnCount.value;
    return Math.ceil(count / cols);
  });

  // 3. Tính toán hàng bắt đầu và kết thúc trong khung nhìn (+ buffer 2 hàng trên/dưới)
  const BUFFER_ROWS = 2;

  const startRow = computed(() => {
    const rawStart = Math.floor(scrollTop.value / estimatedRowHeight);
    return Math.max(0, rawStart - BUFFER_ROWS);
  });

  const visibleRowCount = computed(() => {
    const rowsInView = Math.ceil(containerHeight.value / estimatedRowHeight);
    return rowsInView + (BUFFER_ROWS * 2);
  });

  const endRow = computed(() => {
    return Math.min(totalRows.value, startRow.value + visibleRowCount.value);
  });

  // 4. Chiều cao Spacer trên và dưới
  const topSpacerHeight = computed(() => {
    return startRow.value * estimatedRowHeight;
  });

  const bottomSpacerHeight = computed(() => {
    const remainingRows = Math.max(0, totalRows.value - endRow.value);
    return remainingRows * estimatedRowHeight;
  });

  // 5. Cắt mảng sản phẩm ảo (Virtual Slice - Tối đa ~20-24 phần tử trong DOM)
  const virtualProducts = computed(() => {
    const cols = columnCount.value;
    const startIndex = startRow.value * cols;
    const endIndex = Math.min(itemsRef.value.length, endRow.value * cols);
    return itemsRef.value.slice(startIndex, endIndex);
  });

  // 6. Xử lý sự kiện Scroll tối ưu với requestAnimationFrame
  let isTicking = false;

  const onScroll = (e: Event) => {
    if (isTicking) return;
    isTicking = true;

    requestAnimationFrame(() => {
      const target = e.target as HTMLElement;
      if (target) {
        scrollTop.value = target.scrollTop;
      }
      isTicking = false;
    });
  };

  // 7. Cập nhật kích thước container
  const updateContainerSize = () => {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight || 600;
      containerWidth.value = containerRef.value.clientWidth || 800;
      scrollTop.value = containerRef.value.scrollTop || 0;
    }
  };

  let resizeObserver: ResizeObserver | null = null;

  onMounted(() => {
    updateContainerSize();
    if (containerRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateContainerSize();
      });
      resizeObserver.observe(containerRef.value);
    }
  });

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  });

  // Khi danh sách sản phẩm thay đổi (lọc, tìm kiếm), cuộn về đầu nếu cần
  watch(
    () => itemsRef.value.length,
    () => {
      updateContainerSize();
    }
  );

  return {
    virtualProducts,
    topSpacerHeight,
    bottomSpacerHeight,
    columnCount,
    onScroll
  };
}
