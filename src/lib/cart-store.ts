import { create } from "zustand";
import { toast } from "sonner";

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number;
  image?: string;
  status: "active" | "inactive";
};

export type CartStore = {
  id: string;
  name: string;
  slug: string;
};

export type CartItem = {
  id: string;
  quantity: number;
  product: CartProduct;
  store: CartStore;
};

export type Cart = {
  id: string;
  items: CartItem[];
  total: string;
  itemCount: number;
};

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;

  // Actions
  setCart: (cart: Cart | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsOpen: (open: boolean) => void;

  // Cart operations
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;

  // Optimistic operations (client-first)
  optimisticAddItem: (
    product: CartProduct,
    store: CartStore,
    quantity: number
  ) => Promise<void>;
  optimisticUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  optimisticRemoveItem: (itemId: string) => Promise<void>;

  // Computed values
  getItemCount: () => number;
  getTotal: () => number;
}

const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  isOpen: false,

  setCart: (cart) => set({ cart }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsOpen: (isOpen) => set({ isOpen }),

  addItem: async (productId: string, quantity: number) => {
    const { fetchCart } = get();
    set({ isLoading: true });

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add item to cart");
      }

      // Refresh cart data
      await fetchCart();
      toast.success("Produk berhasil ditambahkan ke keranjang!");
    } catch (error) {
      console.error("Error adding item to cart:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menambahkan ke keranjang"
      );
    } finally {
      set({ isLoading: false });
    }
  },

  updateItemQuantity: async (itemId: string, quantity: number) => {
    const { fetchCart } = get();
    set({ isLoading: true });

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update item quantity");
      }

      // Refresh cart data
      await fetchCart();
    } catch (error) {
      console.error("Error updating item quantity:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal memperbarui jumlah item"
      );
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (itemId: string) => {
    const { fetchCart } = get();
    set({ isLoading: true });

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove item from cart");
      }

      // Refresh cart data
      await fetchCart();
      toast.success("Item berhasil dihapus dari keranjang");
    } catch (error) {
      console.error("Error removing item from cart:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus item"
      );
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    const { fetchCart } = get();
    set({ isLoading: true });

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to clear cart");
      }

      await fetchCart();
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal mengosongkan keranjang"
      );
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCart: async () => {
    set({ isLoading: true });

    try {
      const response = await fetch("/api/cart");

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, set empty cart
          set({ cart: null, isLoading: false });
          return;
        }
        throw new Error("Failed to fetch cart");
      }

      const data = await response.json();
      set({ cart: data.cart });
    } catch (error) {
      console.error("Error fetching cart:", error);
      set({ cart: null });
    } finally {
      set({ isLoading: false });
    }
  },

  // Optimistic operations (client-first)
  optimisticAddItem: async (
    product: CartProduct,
    store: CartStore,
    quantity: number
  ) => {
    const { cart } = get();

    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;

    // Optimistically update UI first
    const existingItemIndex =
      cart?.items.findIndex((item) => item.product.id === product.id) ?? -1;

    if (existingItemIndex >= 0 && cart) {
      // Update existing item
      const newItems = [...cart.items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + quantity,
      };

      const newTotal = newItems.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
        0
      );
      const newItemCount = newItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      set({
        cart: {
          ...cart,
          items: newItems,
          total: newTotal.toFixed(2),
          itemCount: newItemCount,
        },
      });
    } else {
      // Add new item
      const newItem: CartItem = {
        id: tempId,
        quantity,
        product,
        store,
      };

      const newItems = cart ? [...cart.items, newItem] : [newItem];
      const newTotal = newItems.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
        0
      );
      const newItemCount = newItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      set({
        cart: {
          id: cart?.id || tempId,
          items: newItems,
          total: newTotal.toFixed(2),
          itemCount: newItemCount,
        },
      });
    }

    // Then sync with server in background
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add item to cart");
      }

      // Refresh cart data from server to get real IDs
      await get().fetchCart();
      toast.success("Produk berhasil ditambahkan ke keranjang!");
    } catch (error) {
      console.error("Error adding item to cart:", error);
      // Revert optimistic update on error
      await get().fetchCart();
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menambahkan ke keranjang"
      );
    }
  },

  optimisticUpdateQuantity: async (itemId: string, quantity: number) => {
    const { cart } = get();

    if (!cart) return;

    const originalCart = { ...cart };

    // Optimistically update UI first
    const itemIndex = cart.items.findIndex((item) => item.id === itemId);
    if (itemIndex >= 0) {
      const newItems = [...cart.items];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        quantity,
      };

      const newTotal = newItems.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
        0
      );
      const newItemCount = newItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      set({
        cart: {
          ...cart,
          items: newItems,
          total: newTotal.toFixed(2),
          itemCount: newItemCount,
        },
      });
    }

    // Then sync with server in background
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update item quantity");
      }
    } catch (error) {
      console.error("Error updating item quantity:", error);
      // Revert optimistic update on error
      set({ cart: originalCart });
      toast.error(
        error instanceof Error ? error.message : "Gagal memperbarui jumlah item"
      );
    }
  },

  optimisticRemoveItem: async (itemId: string) => {
    const { cart } = get();

    if (!cart) return;

    const originalCart = { ...cart };

    // Optimistically update UI first
    const newItems = cart.items.filter((item) => item.id !== itemId);
    const newTotal = newItems.reduce(
      (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
      0
    );
    const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

    set({
      cart: {
        ...cart,
        items: newItems,
        total: newTotal.toFixed(2),
        itemCount: newItemCount,
      },
    });

    // Then sync with server in background
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove item from cart");
      }

      toast.success("Item berhasil dihapus dari keranjang");
    } catch (error) {
      console.error("Error removing item from cart:", error);
      // Revert optimistic update on error
      set({ cart: originalCart });
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus item"
      );
    }
  },

  getItemCount: () => {
    const { cart } = get();
    return cart?.itemCount || 0;
  },

  getTotal: () => {
    const { cart } = get();
    return parseFloat(cart?.total || "0");
  },
}));

export { useCartStore };
