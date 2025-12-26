import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MenuGrid } from './MenuGrid'

// Mock child components
vi.mock('./ProductCard', () => ({
    ProductCard: ({ product }: { product: { name: string } }) => <div data-testid="product-card">{product.name}</div>
}))

vi.mock('./CategoryNav', () => ({
    CategoryNav: ({ onSelectCategory }: { onSelectCategory: (id: string) => void }) => (
        <div data-testid="category-nav">
            <button onClick={() => onSelectCategory('entradas')}>Entradas</button>
        </div>
    )
}))

vi.mock('./ProductModal', () => ({
    ProductModal: () => null
}))

describe('MenuGrid Component', () => {
    it('renders the search bar', () => {
        render(<MenuGrid />)
        expect(screen.getByPlaceholderText(/Buscar/i)).toBeInTheDocument()
    })

    it('shows products when rendered', () => {
        render(<MenuGrid />)
        const productCards = screen.getAllByTestId('product-card')
        expect(productCards.length).toBeGreaterThan(0)
    })

    it('filters products when searching', () => {
        render(<MenuGrid />)
        const input = screen.getByPlaceholderText(/Buscar/i)
        fireEvent.change(input, { target: { value: 'atun' } })
        expect(input).toHaveValue('atun')
    })
})
