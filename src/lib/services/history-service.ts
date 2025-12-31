import { supabase } from '@/lib/supabase'

export interface OrderHistoryItem {
    id: string
    order_number: string
    created_at: string
    order_type: 'delivery' | 'pickup'
    status: string
    total: number
    items_count: number
    items_preview: {
        name: string
        quantity: number
        image: string | null
    }[]
}

export interface UserStats {
    total_orders: number
    total_spent: number
    favorite_products: {
        name: string
        image_url: string | null
        times_ordered: number
        total_spent: number
    }[]
    preferred_order_type: 'delivery' | 'pickup' | null
    last_order_date: string | null
}

export const HistoryService = {
    /**
     * Get paginated order history for a user
     */
    async getUserOrders(params: {
        userId?: string,
        email?: string,
        page?: number,
        limit?: number
    }, signal?: AbortSignal) {
        const page = params.page || 1
        const limit = params.limit || 10
        const offset = (page - 1) * limit

        try {
            let data: any
            let error: any

            // Validate UUID format to prevent "invalid input syntax for type uuid" errors
            const isUuid = (id?: string) => id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
            const safeUserId = isUuid(params.userId) ? params.userId : null

            // If we have an email but no valid userId (e.g. Demo or Guest), use the email-specific function
            if (!safeUserId && params.email) {
                const response = await (supabase as any).rpc('get_orders_by_email', {
                    p_email: params.email,
                    p_limit: limit,
                    p_offset: offset
                }).abortSignal(signal)
                data = response.data
                error = response.error
            } else {
                const response = await (supabase as any).rpc('get_user_orders', {
                    p_user_id: safeUserId,
                    p_email: params.email || null,
                    p_limit: limit,
                    p_offset: offset
                }).abortSignal(signal)
                data = response.data
                error = response.error
            }

            if (error) throw error

            // Parse the JSON result from RPC
            const result = data as any

            return {
                orders: (result.orders || []) as OrderHistoryItem[],
                total: result.total_orders || 0,
                page,
                totalPages: Math.ceil((result.total_orders || 0) / limit)
            }

        } catch (error: any) {
            if (error.name !== 'AbortError' && !error.message?.includes('AbortError')) {
                console.error('Error fetching user orders:', error)
            }
            throw error
        }
    },

    /**
     * Get user statistics
     */
    async getUserStats(userId?: string, email?: string, signal?: AbortSignal) {
        try {
            const { data, error } = await (supabase as any).rpc('get_user_stats', {
                p_user_id: userId || null,
                p_email: email || null
            }).abortSignal(signal)

            if (error) throw error

            return data as UserStats

        } catch (error: any) {
            if (error.name !== 'AbortError' && !error.message?.includes('AbortError')) {
                console.error('Error fetching user stats:', error)
            }
            throw error
        }
    },

    /**
     * Get full details for a single order
     */
    async getOrderDetails(orderId: string, signal?: AbortSignal) {
        try {
            const { data, error } = await (supabase
                .from('order_full_details') as any)
                .select('*')
                .eq('id', orderId)
                .single()
                .abortSignal(signal)

            if (error) throw error

            return data

        } catch (error: any) {
            if (error.name !== 'AbortError' && !error.message?.includes('AbortError')) {
                console.error('Error fetching order details:', error)
            }
            throw error
        }
    }
}
