import { ref, computed, type Ref } from 'vue';
import type { PosProductItem } from '../types/products.types';

/**
 * 🛠️ Utility loại bỏ dấu Tiếng Việt (Remove Vietnamese Accents)
 */
export const removeVietnameseAccents = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};


export function useFilterProducts(productsRef: Ref<PosProductItem[]>) {
  const selectedGroupId = ref<number>(0);
  const productSearchQuery = ref<string>('');


  const filteredProducts = computed(() => {
    let list = productsRef.value;


    if (selectedGroupId.value !== 0) {
      list = list.filter(p => p.groupId === selectedGroupId.value);
    }

    if (productSearchQuery.value && productSearchQuery.value.trim()) {
      const rawQuery = productSearchQuery.value.trim();
      const queryNormalized = removeVietnameseAccents(rawQuery);
      
      const keywords = rawQuery.toLowerCase().split(/\s+/).filter(Boolean);
      const keywordsNormalized = queryNormalized.split(/\s+/).filter(Boolean);

      list = list.filter(p => {
        const name = (p.productName || '').toLowerCase();
        const nameNormalized = removeVietnameseAccents(p.productName || '');
        const code = (p.productCode || '').toLowerCase();
        const barcode = (p.barcode || '').toLowerCase();

        if (code.includes(rawQuery.toLowerCase()) || barcode.includes(rawQuery.toLowerCase())) {
          return true;
        }
        
        const matchWithAccents = keywords.every(kw => name.includes(kw));
        const matchWithoutAccents = keywordsNormalized.every(kw => nameNormalized.includes(kw));

        return matchWithAccents || matchWithoutAccents;
      });
    }

    return list;
  });


  const displayLimit = ref<number>(24);

  const visibleProducts = computed(() => {
    return filteredProducts.value.slice(0, displayLimit.value);
  });

  const hasMoreProducts = computed(() => {
    return displayLimit.value < filteredProducts.value.length;
  });

  const loadMoreProducts = () => {
    if (hasMoreProducts.value) {
      displayLimit.value += 24;
    }
  };

  const filterByGroup = (groupId: number) => {
    selectedGroupId.value = groupId;
    displayLimit.value = 24;
  };

  const clearSearch = () => {
    productSearchQuery.value = '';
    displayLimit.value = 24;
  };

  return {
    selectedGroupId,
    productSearchQuery,
    displayLimit,
    filteredProducts,
    visibleProducts,
    hasMoreProducts,
    loadMoreProducts,
    filterByGroup,
    clearSearch
  };
}
