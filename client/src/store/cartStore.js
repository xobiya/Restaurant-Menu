import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      
      addItem: (item) => {
        const { cartItems } = get();
        const existingItem = cartItems.find((i) => i.id === item.id);
        
        if (existingItem) {
          set({
            cartItems: cartItems.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ cartItems: [...cartItems, { ...item, quantity: 1 }] });
        }
      },

      removeItem: (id) => {
        const { cartItems } = get();
        set({
          cartItems: cartItems.filter((i) => i.id !== id),
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) return;
        set({
          cartItems: get().cartItems.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ cartItems: [] }),

      getCartTotal: () => {
        const { cartItems } = get();
        return cartItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getTotalItems: () => {
         const { cartItems } = get();
         return cartItems.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'restaurant-cart-storage', // unique name
    }
  )
);
