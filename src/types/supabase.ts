export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    role: 'customer' | 'admin' | 'super_admin'
                    full_name: string | null
                    avatar_url: string | null
                    phone: string | null
                    default_address: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    email: string
                    role?: 'customer' | 'admin' | 'super_admin'
                    full_name?: string | null
                    avatar_url?: string | null
                    phone?: string | null
                    default_address?: string | null
                    created_at?: string
                }
                Update: {
                    email?: string
                    role?: 'customer' | 'admin' | 'super_admin'
                    full_name?: string | null
                    avatar_url?: string | null
                    phone?: string | null
                    default_address?: string | null
                }
            }
            categories: {
                Row: {
                    id: string
                    name: string
                    label: string
                    description: string | null
                    slug: string
                    sort_order: number
                    is_active: boolean
                    image_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    label: string
                    description?: string | null
                    slug: string
                    sort_order?: number
                    is_active?: boolean
                    image_url?: string | null
                }
                Update: {
                    name?: string
                    label?: string
                    description?: string | null
                    slug?: string
                    sort_order?: number
                    is_active?: boolean
                    image_url?: string | null
                }
            }
            products: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    price: number
                    category_id: string
                    image_url: string | null
                    tags: string[] | null
                    allergens: string[] | null
                    is_available: boolean
                    sort_order: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    price: number
                    category_id: string
                    image_url?: string | null
                    tags?: string[] | null
                    allergens?: string[] | null
                    is_available?: boolean
                    sort_order?: number
                }
                Update: {
                    name?: string
                    description?: string | null
                    price?: number
                    category_id?: string
                    image_url?: string | null
                    tags?: string[] | null
                    allergens?: string[] | null
                    is_available?: boolean
                    sort_order?: number
                }
            }
            product_variants: {
                Row: {
                    id: string
                    product_id: string
                    name: string
                    price: number
                    sort_order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    name: string
                    price: number
                    sort_order?: number
                }
                Update: {
                    product_id?: string
                    name?: string
                    price?: number
                    sort_order?: number
                }
            }
            orders: {
                Row: {
                    id: string
                    user_id: string | null
                    items: Json // Keeping for legacy/compatibility if needed
                    total: number
                    subtotal: number
                    status: string
                    order_type: 'delivery' | 'pickup'
                    guest_name: string | null
                    guest_email: string | null
                    guest_phone: string | null
                    delivery_address: string | null
                    contact_phone: string | null
                    notes: string | null
                    order_number: string | null
                    created_at: string
                    payment_method: string
                    payment_status: string
                    tax_amount: number | null
                    delivery_fee: number | null
                    tip_amount: number | null
                    discount_amount: number | null
                    estimated_time: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    items?: Json
                    total?: number
                    subtotal?: number
                    status?: string
                    order_type?: 'delivery' | 'pickup'
                    guest_name?: string | null
                    guest_email?: string | null
                    guest_phone?: string | null
                    delivery_address?: string | null
                    contact_phone?: string | null
                    notes?: string | null
                    order_number?: string | null
                    created_at?: string
                    payment_method?: string
                    payment_status?: string
                    tax_amount?: number | null
                    delivery_fee?: number | null
                    tip_amount?: number | null
                    discount_amount?: number | null
                    estimated_time?: string | null
                }
                Update: {
                    status?: string
                    total?: number
                    payment_status?: string
                    tax_amount?: number | null
                    delivery_fee?: number | null
                    estimated_time?: string | null
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string
                    variant_id: string | null
                    quantity: number
                    unit_price: number
                    subtotal: number
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id: string
                    variant_id?: string | null
                    quantity: number
                    unit_price: number
                    subtotal: number
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    quantity?: number
                    subtotal?: number
                    notes?: string | null
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    order_id: string
                    title: string
                    message: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    order_id: string
                    title: string
                    message: string
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    user_id?: string
                    order_id?: string
                    title?: string
                    message?: string
                    is_read?: boolean
                    created_at?: string
                }
            }
            guest_notifications: {
                Row: {
                    id: string
                    email: string
                    order_id: string
                    title: string
                    message: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    order_id: string
                    title: string
                    message: string
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    email?: string
                    order_id?: string
                    title?: string
                    message?: string
                    is_read?: boolean
                    created_at?: string
                }
            }
        }
        Views: {
            user_order_history: {
                Row: {
                    id: string
                    order_number: string | null
                    created_at: string | null
                    order_type: string | null
                    delivery_address: string | null
                    status: string | null
                    payment_method: string | null
                    payment_status: string | null
                    total: number | null
                    estimated_time: string | null
                    items_count: number | null
                    total_items: number | null
                    products_summary: string | null
                }
            }
            order_full_details: {
                Row: {
                    id: string
                    user_id: string | null
                    order_number: string | null
                    created_at: string | null
                    status: string | null
                    order_type: string | null
                    total: number | null
                    subtotal: number | null
                    tax_amount: number | null
                    delivery_fee: number | null
                    tip_amount: number | null
                    discount_amount: number | null
                    guest_name: string | null
                    guest_email: string | null
                    guest_phone: string | null
                    delivery_address: string | null
                    notes: string | null
                    payment_method: string | null
                    payment_status: string | null
                    items: Json[] | null
                }
            }
        }
        Functions: {
            create_order_safe: {
                Args: {
                    order_data: Json
                }
                Returns: Json
            },
            debug_auth_context: {
                Args: Record<string, never>
                Returns: Json
            },
            create_complete_order: {
                Args: {
                    p_order_data: Json
                    p_items: Json
                }
                Returns: Json
            },
            get_user_orders: {
                Args: {
                    p_user_id?: string | null
                    p_email?: string | null
                    p_limit?: number
                    p_offset?: number
                }
                Returns: Json
            },
            get_user_stats: {
                Args: {
                    p_user_id?: string | null
                    p_email?: string | null
                }
                Returns: Json
            },
            get_orders_by_email: {
                Args: {
                    p_email: string
                    p_limit?: number
                    p_offset?: number
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}