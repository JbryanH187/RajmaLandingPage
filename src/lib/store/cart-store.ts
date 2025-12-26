import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

interface CartState {
    items: CartItem[];
    addItem: (product: Product, quantity: number, variantId?: string, notes?: string) => void;
    removeItem: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    getItemCount: () => number;
}

// Create store with conditional persistence (only in browser)
const createStore = () => {
    const storeLogic = (set: (fn: (state: CartState) => Partial<CartState>) => void, get: () => CartState) => ({
        items: [] as CartItem[],
        addItem: (product: Product, quantity: number, variantId?: string, notes?: string) => {
            set((state: CartState) => {
                const price = variantId
                    ? product.variants?.find(v => v.id === variantId)?.price || product.price
                    : product.price;

                const uniqueKey = `${product.id}-${variantId || 'base'}-${notes || ''}`;
                const existingItem = state.items.find((item) => item.cartId === uniqueKey);

                if (existingItem) {
                    return {
                        items: state.items.map((item) =>
                            item.cartId === uniqueKey
                                ? { ...item, quantity: item.quantity + quantity }
                                : item
                        ),
                    };
                }

                const newItem: CartItem = {
                    ...product,
                    cartId: uniqueKey,
                    quantity,
                    selectedVariantId: variantId,
                    price: price,
                    notes,
                };

                return { items: [...state.items, newItem] };
            });
        },
        removeItem: (cartId: string) => {
            set((state: CartState) => ({
                items: state.items.filter((item) => item.cartId !== cartId),
            }));
        },
        updateQuantity: (cartId: string, quantity: number) => {
            set((state: CartState) => ({
                items: state.items.map((item) =>
                    item.cartId === cartId
                        ? { ...item, quantity: Math.max(1, quantity) }
                        : item
                ),
            }));
        },
        clearCart: () => set((state: CartState) => ({ items: [] })),
        getCartTotal: () => {
            return get().items.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0);
        },
        getItemCount: () => {
            return get().items.reduce((count: number, item: CartItem) => count + item.quantity, 0);
        }
    });

    // Only use persist in browser environment
    if (isBrowser) {
        return create<CartState>()(
            persist(storeLogic, {
                name: 'rajma-cart-storage',
                skipHydration: true,
            })
        );
    }

    // For server/test environment, use simple store without persistence
    return create<CartState>()(storeLogic);
};

export const useCartStore = createStore();
