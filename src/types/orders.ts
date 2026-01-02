// types/orders.ts
export interface Order {
    id: string
    user_id?: string
    order_number: string
    created_at: string
    status: string
    order_type: 'delivery' | 'pickup'

    // Totals
    subtotal: number
    total: number
    tax_amount?: number
    delivery_fee?: number
    discount_amount?: number
    tip_amount?: number

    // Customer info
    guest_name?: string
    guest_email?: string
    guest_phone?: string
    contact_phone?: string

    // Delivery info
    delivery_address?: string
    delivery_instructions?: string

    // Notes and payments
    notes?: string
    payment_method?: string
    payment_status?: string

    // Timestamps
    estimated_time?: string
    confirmed_at?: string
    preparing_at?: string
    ready_at?: string
    delivering_at?: string
    completed_at?: string
    cancelled_at?: string

    // Device
    device_fingerprint?: string
    device_info?: any

    // Relations
    order_items?: OrderItem[]
    user?: any
    profile?: any
    order_status?: OrderStatus

    // Computed (added by hook)
    elapsed_time?: string
    is_delayed?: boolean
    display_name?: string
    display_phone?: string
}

export interface OrderItem {
    id: string
    order_id: string
    product_id: string
    quantity: number
    price: number
    notes?: string
    product?: {
        id: string
        name: string
        description?: string
        price: number
        image_url?: string
    }
}

export interface OrderStatus {
    id: string
    label: string
    label_en?: string
    color: string
    icon?: string
    category: 'new' | 'active' | 'delivery' | 'completed'
    sort_order?: number
    next_statuses?: string[]
    is_active?: boolean
}

export type StatusCategory = 'new' | 'active' | 'delivery' | 'completed'
