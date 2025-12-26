import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Hero } from './Hero'

describe('Hero Component', () => {
    beforeEach(() => {
        // Vitest uses different timer mocking
    })

    it('renders Rajma Sushi title', () => {
        render(<Hero />)
        expect(screen.getByText('Rajma Sushi')).toBeInTheDocument()
    })

    it('displays operating hours info', () => {
        render(<Hero />)
        expect(screen.getByText(/Lun-Vie 3pm - 11pm/i)).toBeInTheDocument()
    })

    it('displays location info', () => {
        render(<Hero />)
        expect(screen.getByText(/Las Cúpias/i)).toBeInTheDocument()
    })
})
