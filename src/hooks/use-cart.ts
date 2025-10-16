import { useCartStore } from "@/lib/cart-store";

/**
 * Custom hook for cart operations
 * Provides easier access to cart state and actions
 */
export function useCart() {
  const store = useCartStore();

  return {
    // State
    cart: store.cart,
    isLoading: store.isLoading,
    isOpen: store.isOpen,

    // Computed values
    itemCount: store.getItemCount(),
    total: store.getTotal(),

    // Actions (with server sync)
    addItem: store.addItem,
    updateQuantity: store.updateItemQuantity,
    removeItem: store.removeItem,
    clearCart: store.clearCart,
    fetchCart: store.fetchCart,

    // Optimistic actions (client-first)
    optimisticAddItem: store.optimisticAddItem,
    optimisticUpdateQuantity: store.optimisticUpdateQuantity,
    optimisticRemoveItem: store.optimisticRemoveItem,

    // UI actions
    openCart: () => store.setIsOpen(true),
    closeCart: () => store.setIsOpen(false),
    toggleCart: () => store.setIsOpen(!store.isOpen),
  };
}
