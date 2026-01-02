// Types for Order Status Management

export interface OrderStatus {
    id: string
    label: string
    label_en: string
    color: string
    icon: string
    sort_order: number
    is_active: boolean
    next_statuses: string[]
    category: 'new' | 'active' | 'delivery' | 'completed'
}

export interface OrderStats {
    total_orders: number
    pending_orders: number
    preparing_orders: number
    ready_orders: number
    delivering_orders: number
    completed_orders: number
    cancelled_orders: number
    total_revenue: number
    average_completion_time: string | null // Interval as string
}

export interface OrderCountByCategory {
    category: string
    count: number
    statuses: string[]
}

export interface OrderWithElapsed {
    id: string
    order_number: string
    created_at: string
    status: string
    order_type: 'delivery' | 'pickup'
    total: number
    customer_name?: string
    customer_phone?: string
    delivery_address?: string
    items_count: number
    items_preview: {
        name: string
        quantity: number
        image?: string | null
    }[]
    // Computed
    elapsed_minutes?: number
}

// Category to View ID mapping
export const CATEGORY_VIEW_MAP = {
    new: 'new',
    active: 'kitchen',
    delivery: 'delivery',
    completed: 'history'
} as const

// Status icons (Lucide)
export const STATUS_ICONS: Record<string, string> = {
    'clock': 'Clock',
    'check-circle': 'CheckCircle',
    'chef-hat': 'ChefHat',
    'package': 'Package',
    'truck': 'Truck',
    'map-pin': 'MapPin',
    'check-double': 'CheckCheck',
    'circle-check': 'CircleCheck',
    'x-circle': 'XCircle'
}
