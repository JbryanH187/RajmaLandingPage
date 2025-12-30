import { supabase } from '@/lib/supabase'
import { CartItem } from '@/types'
import { toast } from "sonner"

export interface CreateOrderParams {
    userId?: string
    items: CartItem[]
    total: number
    orderType: 'delivery' | 'pickup'
    guestName?: string
    guestEmail?: string
    guestAddress?: string
    guestPhone?: string
    notes?: string
    deliveryInstructions?: string
    deviceFingerprint?: string
    deviceInfo?: any
}

export const OrderService = {
    async createOrder(order: CreateOrderParams, signal?: AbortSignal) {
        try {
            // Prepare data for RPC (snake_case expected by SQL function)
            const orderData = {
                user_id: order.userId || null,
                guest_name: order.guestName,
                guest_email: order.guestEmail,
                guest_phone: order.guestPhone,
                order_type: order.orderType,
                delivery_address: order.guestAddress,
                delivery_instructions: order.deliveryInstructions,
                notes: order.notes,
                total: order.total,
                // Default values for fields handled by RPC defaults/coalesce if missing
                subtotal: order.total, // Assuming total is all inclusive for now, or calculate if needed
                delivery_fee: 0,
                tax_amount: 0,
                tip_amount: 0,
                payment_method: 'cash' // Default or passed param if available
            }

            const itemsData = order.items.map(item => ({
                product_id: item.id,
                variant_id: item.selectedVariantId || null,
                quantity: item.quantity,
                unit_price: item.price,
                subtotal: item.quantity * item.price,
                notes: item.notes
            }))

            // Call the RPC function (Atomic Transaction)
            let query = supabase.rpc('create_complete_order', {
                p_order_data: orderData,
                p_items: itemsData
            })

            if (signal) {
                query = query.abortSignal(signal)
            }

            const { data, error } = await query

            if (error) {
                console.error("Supabase RPC Order Error:", error)
                throw error
            }

            // Start Fix: Cast data to expected return type
            const result = data as { success: boolean; error?: string; order_id: string; order_number: string } | null

            if (!result || !result.success) {
                throw new Error(result?.error || "Error creating order via RPC")
            }

            return {
                orderId: result.order_id,
                orderNumber: result.order_number
            }
            // End Fix

        } catch (error) {
            console.error("Create Order Error:", error)
            throw error
        }
    },

    async hasActiveOrder(userId: string, signal?: AbortSignal) {
        try {
            let query = supabase
                .from('orders')
                .select('id, status, created_at')
                .eq('user_id', userId)
                .in('status', ['pending', 'confirmed', 'preparing', 'out_for_delivery'])
                .order('created_at', { ascending: false })
                .limit(1)

            if (signal) {
                query = query.abortSignal(signal)
            }

            const { data, error } = await query.maybeSingle()

            if (error) {
                console.error("Error checking active order:", error)
                return false
            }

            return !!data
        } catch (error) {
            console.error("Failed to check active order", error)
            return false
        }
    },

    async getActiveOrderDetails(userId: string, signal?: AbortSignal) {
        try {
            let query = supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        products (name, image_url),
                        product_variants (name)
                    )
                `)
                .eq('user_id', userId)
                .in('status', ['pending', 'confirmed', 'preparing', 'out_for_delivery'])
                .order('created_at', { ascending: false })
                .limit(1)

            if (signal) {
                query = query.abortSignal(signal)
            }

            const { data, error } = await query.maybeSingle()

            if (error) {
                console.error("Failed to fetch active order details:", error)
                return null
            }

            return data
        } catch (error) {
            console.error("Failed to fetch active order details", error)
            return null
        }
    },

    // Método adicional para obtener orden por ID 
    async getOrderById(orderId: string, signal?: AbortSignal) {
        try {
            let query = supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)

            if (signal) {
                query = query.abortSignal(signal)
            }

            const { data, error } = await query.maybeSingle()

            if (error) {
                console.error("Error fetching order:", error)
                return null
            }

            return data
        } catch (error) {
            console.error("Failed to fetch order", error)
            return null
        }
    },

    // Si tienes un método para obtener el status de una orden
    async getOrderStatus(orderId: string, signal?: AbortSignal) {
        try {
            let query = supabase.rpc('get_public_order_v1', {
                p_order_id: orderId
            })

            if (signal) {
                query = query.abortSignal(signal)
            }

            const { data: rpcData, error } = await query

            if (error) {
                console.error("Error fetching order status:", error)
                return null
            }

            const data = rpcData as { success: boolean; order?: { status: string } } | null
            return data?.order?.status || null
        } catch (error) {
            console.error("Failed to fetch order status", error)
            return null
        }
    },

    // Public Order Tracking
    async getPublicOrder(orderId: string, signal?: AbortSignal) {
        try {
            let query = (supabase as any)
                .rpc('get_public_order_v1', { p_order_id: orderId })

            if (signal) {
                query = query.abortSignal(signal)
            }

            const { data, error } = await query

            if (error) throw error
            return data
        } catch (error) {
            console.error("Failed to fetch public order:", error)
            return { success: false, error: 'Network or server error' }
        }
    },

    // Retrieve active guest order by device fingerprint
    async getActiveGuestOrder(deviceFingerprint: string, signal?: AbortSignal) {
        try {
            const { data, error } = await (supabase as any)
            return null
        } catch (error) {
            console.error("Failed to check active guest order:", error)
            return null
        }
    },

    // Método helper para buscar órdenes de invitados por email
    async getGuestOrdersByEmail(email: string, signal?: AbortSignal) {
        try {
            let query = supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        products (name, image_url),
                        product_variants (name)
                    )
                `)
                .eq('guest_email', email)
                .order('created_at', { ascending: false })

            if (signal) {
                query = query.abortSignal(signal)
            }

            const { data, error } = await query

            if (error) throw error
            return data || []
        } catch (error) {
            console.error("Failed to fetch guest orders:", error)
            return []
        }
    }
}