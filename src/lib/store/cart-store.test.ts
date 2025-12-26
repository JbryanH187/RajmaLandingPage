import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from './cart-store'
import { act } from '@testing-library/react'

describe('Cart Store', () => {
    beforeEach(() => {
        act(() => {
            useCartStore.getState().clearCart()
        })
    })

    it('starts with empty cart', () => {
        expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('adds items to cart', () => {
        const product = {
            id: '1',
            name: 'Test Sushi',
            price: 100,
            category: 'entradas' as const,
            image: '',
            isAvailable: true
        }

        act(() => {
            useCartStore.getState().addItem(product, 2)
        })

        const items = useCartStore.getState().items
        expect(items).toHaveLength(1)
        expect(items[0].name).toBe('Test Sushi')
        expect(items[0].quantity).toBe(2)
    })

    it('calculates total correctly', () => {
        const product1 = { id: '1', name: 'A', price: 50, category: 'entradas' as const, image: '', isAvailable: true }
        const product2 = { id: '2', name: 'B', price: 100, category: 'rollos' as const, image: '', isAvailable: true }

        act(() => {
            useCartStore.getState().addItem(product1, 2) // 100
            useCartStore.getState().addItem(product2, 1) // 100
        })

        expect(useCartStore.getState().getCartTotal()).toBe(200)
    })

    it('removes items from cart', () => {
        const product = { id: '1', name: 'Test', price: 50, category: 'entradas' as const, image: '', isAvailable: true }

        act(() => {
            useCartStore.getState().addItem(product, 1)
        })

        const cartId = useCartStore.getState().items[0].cartId

        act(() => {
            useCartStore.getState().removeItem(cartId)
        })

        expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('clears entire cart', () => {
        const product = { id: '1', name: 'Test', price: 50, category: 'entradas' as const, image: '', isAvailable: true }

        act(() => {
            useCartStore.getState().addItem(product, 1)
            useCartStore.getState().clearCart()
        })

        expect(useCartStore.getState().items).toHaveLength(0)
    })
})
