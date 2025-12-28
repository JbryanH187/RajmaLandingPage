import { supabase } from '@/lib/supabase'
import { CartItem } from '@/types'
import { toast } from "sonner"

export interface CreateOrderParams {
    userId?: string
    items: CartItem[]
    total: number
    orderType: 'delivery' | 'pickup'
    guestName?: string
    guestEmail?: string   // New field
    guestAddress?: string
    guestPhone?: string
    notes?: string
    deliveryInstructions?: string // New field
}

// Enhanced Order Service with relational tables
export const OrderService = {
    async createOrder(order: CreateOrderParams) {
        try {
            // DEBUG: Check Auth Context
            const { data: authDebug } = await supabase.rpc('debug_auth_context')
            console.log('Auth context:', authDebug)

            // 1. Prepare Order Data
            const orderType = order.orderType;
            const orderData = {
                guest_name: order.guestName || null,
                guest_email: order.guestEmail || null,
                guest_phone: order.guestPhone || null,
                order_type: orderType,
                delivery_address: orderType === 'delivery' ? order.guestAddress : null,
                delivery_instructions: order.deliveryInstructions || null, // Map new field
                subtotal: 0, // Calculated by trigger/RPC usually, but passing 0 for now
                tax_amount: 0,
                delivery_fee: 0,
                // If tip is added later, map it here
                tip_amount: 0,
                total: order.total, // Pass the total from frontend 
                payment_method: 'cash', // Default or from params
                notes: order.notes || ''
            };

            // Add user_id ONLY if valid
            // Add user_id ONLY if valid
            // Check for valid UUID (simple check) or just passed value
            const validUserId = (order.userId && order.userId !== 'demo-user') ? order.userId : null;
            if (validUserId) {
                (orderData as any).user_id = validUserId;
            }

            // 2. Prepare Items Data
            const itemsData = order.items.map(item => ({
                product_id: item.id,
                variant_id: item.selectedVariantId || null,
                quantity: item.quantity,
                unit_price: item.price,
                subtotal: item.price * item.quantity,
                notes: item.notes || null
            }));

            console.log("🚀 Sending create_complete_order:", { orderData, itemsData });

            // 3. Call Atomic RPC
            const { data: result, error: rpcError } = await supabase
                .rpc('create_complete_order', {
                    p_order_data: orderData,
                    p_items: itemsData
                });

            if (rpcError) throw rpcError;

            console.log('Order creation result:', result);

            if (!result || !result.success) {
                throw new Error(result?.error || 'Error creando orden completa');
            }

            const { order_id: orderId, order_number: orderNumber } = result;

            return {
                success: true,
                orderId,
                orderNumber,
                data: result
            };

        } catch (error: any) {
            console.error('Order creation failed:', error);
            throw error;
        }
    },
    async hasActiveOrder(userId: string) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('id, status, created_at')
                .eq('user_id', userId)
                .in('status', ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error("Error checking active order:", error)
                return false
            }

            return !!data
        } catch (error) {
            console.error("Failed to check active order", error)
            return false
        }
    },

    // Public Order Tracking
    async getPublicOrder(orderId: string) {
        try {
            const { data, error } = await supabase
                .rpc('get_public_order_v1', { p_order_id: orderId })

            if (error) throw error
            return data
        } catch (error) {
            console.error("Failed to fetch public order:", error)
            return { success: false, error: 'Network or server error' }
        }
    }
}
