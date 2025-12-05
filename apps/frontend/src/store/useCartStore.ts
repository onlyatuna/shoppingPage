//useCartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
    productId: number;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (productId: number, quantity?: number) => void;
    removeItem: (productId: number) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],
            addItem: (productId, quantity = 1) =>
                set((state) => {
                    const existingItem = state.items.find((item) => item.productId === productId);
                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.productId === productId
                                    ? { ...item, quantity: item.quantity + quantity }
                                    : item
                            ),
                        };
                    }
                    return { items: [...state.items, { productId, quantity }] };
                }),
            removeItem: (productId) =>
                set((state) => ({
                    items: state.items.filter((item) => item.productId !== productId),
                })),
            clearCart: () => set({ items: [] }),
        }),
        {
            name: 'cart-storage',
        }
    )
);
