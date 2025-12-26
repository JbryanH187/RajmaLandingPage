import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useCartStore } from '@/lib/store/cart-store'

// Integration tests for Cart functionality (store-level, not UI)
// The CartSheet component uses Radix UI Sheet which is complex to test in isolation
// These tests verify the cart business logic works correctly

describe('Cart Integration (Store)', () => {
    beforeEach(() => {
        act(() => {
            useCartStore.getState().clearCart()
        })
    })

    it('starts with an empty cart', () => {
        expect(useCartStore.getState().items).toHaveLength(0)
        expect(useCartStore.getState().getItemCount()).toBe(0)
        expect(useCartStore.getState().getCartTotal()).toBe(0)
    })

    it('can add items and track total correctly', () => {
        act(() => {
            useCartStore.getState().addItem({
                id: '1',
                name: 'Roll Especial',
                price: 150,
                category: 'especiales',
                image: '/test.jpg',
                isAvailable: true
            }, 2)
        })

        expect(useCartStore.getState().items).toHaveLength(1)
        expect(useCartStore.getState().getItemCount()).toBe(2)
        expect(useCartStore.getState().getCartTotal()).toBe(300)
    })

    it('can add multiple different items', () => {
        act(() => {
            useCartStore.getState().addItem({
                id: '1',
                name: 'Product A',
                price: 100,
                category: 'entradas',
                image: '',
                isAvailable: true
            }, 1)
            useCartStore.getState().addItem({
                id: '2',
                name: 'Product B',
                price: 200,
                category: 'rollos',
                image: '',
                isAvailable: true
            }, 1)
        })

        expect(useCartStore.getState().items).toHaveLength(2)
        expect(useCartStore.getState().getCartTotal()).toBe(300)
    })

    it('updates quantity on an existing item', () => {
        act(() => {
            useCartStore.getState().addItem({
                id: '1',
                name: 'Test',
                price: 50,
                category: 'entradas',
                image: '',
                isAvailable: true
            }, 1)
        })

        const cartId = useCartStore.getState().items[0].cartId

        act(() => {
            useCartStore.getState().updateQuantity(cartId, 10)
        })

        expect(useCartStore.getState().items[0].quantity).toBe(10)
        expect(useCartStore.getState().getCartTotal()).toBe(500)
    })
})
