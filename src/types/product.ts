import type { Database } from './supabase'

// Tipos base de la DB
type DBProduct = Database['public']['Tables']['products']['Row']
type DBCategory = Database['public']['Tables']['categories']['Row']
type DBVariant = Database['public']['Tables']['product_variants']['Row']

// -----------------------------------------------------------
// UI TYPES (Mapped from DB)
// -----------------------------------------------------------

export interface Category {
    id: string
    label: string
    // Add other UI needed fields that come from DB
}

export interface ProductVariant {
    id: string
    name: string
    price: number
}

export interface Product {
    id: string
    name: string
    description?: string
    price: number // Mapped from base_price
    category: string // Mapped from category_id
    image?: string // Mapped from image_url
    tags?: string[]
    isAvailable: boolean // Mapped from is_available
    variants?: ProductVariant[]
}

export interface CartItem extends Product {
    cartId: string // Unique ID for the cart entry (to allow duplicates of same product)
    quantity: number
    selectedVariantId?: string
    notes?: string
    subtotal: number
}
