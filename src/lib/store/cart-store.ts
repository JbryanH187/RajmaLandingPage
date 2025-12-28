import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

interface GuestOrder {
    name: string;
    address: string;
    items: CartItem[];
    total: number;
    date: string;
    orderType: 'delivery' | 'pickup';
    email?: string;
    phone?: string;
    orderId?: string;       // For tracking
    orderNumber?: string;   // For display
}


interface CartState {
    items: CartItem[];
    addItem: (product: Product, quantity: number, variantId?: string, notes?: string) => void;
    removeItem: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    setItems: (items: CartItem[]) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    getItemCount: () => number;
    isTicketOpen: boolean;
    openTicket: () => void;
    closeTicket: () => void;

    // Guest & Persistent State
    guestOrder: GuestOrder | null;
    setGuestOrder: (order: GuestOrder | null) => void;
    ticketStatus: 'review' | 'processing' | 'receipt';
    setTicketStatus: (status: 'review' | 'processing' | 'receipt') => void;
    orderType: 'delivery' | 'pickup';
    setOrderType: (type: 'delivery' | 'pickup') => void;
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
                                ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.price }
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
                    subtotal: price * quantity,
                    notes,
                };

                return {
                    items: [...state.items, newItem],
                    ticketStatus: 'review' // Start fresh for new items
                };
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
                        ? { ...item, quantity: Math.max(1, quantity), subtotal: Math.max(1, quantity) * item.price }
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
        },
        isTicketOpen: false,
        openTicket: () => set(() => ({ isTicketOpen: true })),
        closeTicket: () => set(() => ({ isTicketOpen: false })),

        // Batch update for re-ordering
        setItems: (newItems: CartItem[]) => set(() => ({
            items: newItems,
            ticketStatus: 'review',
            isTicketOpen: true
        })),

        // Guest & Persistent State Implementation
        guestOrder: null as GuestOrder | null,
        setGuestOrder: (order: GuestOrder | null) => set(() => ({ guestOrder: order })),
        ticketStatus: 'review' as 'review' | 'processing' | 'receipt',
        setTicketStatus: (status: 'review' | 'processing' | 'receipt') => set(() => ({ ticketStatus: status })),

        // Order Type (Pickup vs Delivery)
        orderType: 'delivery' as 'delivery' | 'pickup',
        setOrderType: (type: 'delivery' | 'pickup') => set(() => ({ orderType: type })),
    });

    // Only use persist in browser environment
    if (isBrowser) {
        return create<CartState>()(
            persist(storeLogic, {
                name: 'rajma-cart-storage',
                skipHydration: false, // Fix page reload bug
                partialize: (state) => ({
                    items: state.items,
                    guestOrder: state.guestOrder, // Persist guest order
                    ticketStatus: state.ticketStatus, // Persist status to return to 'receipt'
                    orderType: state.orderType
                }),
            })
        );
    }

    // For server/test environment, use simple store without persistence
    return create<CartState>()(storeLogic);
};

export const useCartStore = createStore();
