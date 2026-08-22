import { ref, computed } from 'vue';
import type { PosProductItem } from '../types/products.types';
import type { CartItem } from '../mappers/orderDetailMapper';

/**
 * 🛒 usePosCart — Composable quản lý toàn bộ trạng thái & tính toán giỏ hàng POS
 */
export function usePosCart() {
  const cartItems = ref<CartItem[]>([]);

  // ── COMPUTED TỔNG HỢP ──────────────────────────────────────────────────────
  const cartTotalAmount = computed(() => {
    return cartItems.value.reduce(
      (sum, item) => sum + (Number(item.product.retailOutPrice || 0) * item.quantity),
      0
    );
  });

  const cartTotalQuantity = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0);
  });

  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formattedCartTotal = computed(() => {
    return formatMoney(cartTotalAmount.value);
  });

  // ── THAO TÁC SẢN PHẨM TRONG GIỎ ───────────────────────────────────────────
  const getCartQuantity = (productId: number): number => {
    const found = cartItems.value.find(item => item.product.productId === productId);
    return found ? found.quantity : 0;
  };

  const addToCart = (product: PosProductItem) => {
    const existingIndex = cartItems.value.findIndex(
      item => item.product.productId === product.productId
    );
    if (existingIndex > -1) {
      cartItems.value[existingIndex].quantity += 1;
    } else {
      cartItems.value.push({ product, quantity: 1 });
    }
  };

  const decreaseCartByProduct = (product: PosProductItem) => {
    const existingIndex = cartItems.value.findIndex(
      item => item.product.productId === product.productId
    );
    if (existingIndex > -1) {
      if (cartItems.value[existingIndex].quantity > 1) {
        cartItems.value[existingIndex].quantity -= 1;
      } else {
        cartItems.value.splice(existingIndex, 1);
      }
    }
  };

  const increaseQty = (index: number) => {
    if (index >= 0 && index < cartItems.value.length) {
      cartItems.value[index].quantity += 1;
    }
  };

  const decreaseQty = (index: number) => {
    if (index >= 0 && index < cartItems.value.length) {
      if (cartItems.value[index].quantity > 1) {
        cartItems.value[index].quantity -= 1;
      } else {
        cartItems.value.splice(index, 1);
      }
    }
  };

  const removeCartItem = (index: number) => {
    if (index >= 0 && index < cartItems.value.length) {
      cartItems.value.splice(index, 1);
    }
  };

  const clearCart = () => {
    cartItems.value = [];
  };

  const setCartItems = (items: CartItem[]) => {
    cartItems.value = Array.isArray(items) ? [...items] : [];
  };

  return {
    cartItems,
    cartTotalAmount,
    cartTotalQuantity,
    formattedCartTotal,
    formatMoney,
    getCartQuantity,
    addToCart,
    decreaseCartByProduct,
    increaseQty,
    decreaseQty,
    removeCartItem,
    clearCart,
    setCartItems
  };
}
