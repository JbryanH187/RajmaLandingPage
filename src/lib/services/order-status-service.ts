import { supabase } from '@/lib/supabase'
import { OrderWithElapsed } from '@/types/order-status'

// Status mapping by category
const CATEGORY_STATUSES: Record<string, string[]> = {
    'new': ['pending'],
    'active': ['confirmed', 'preparing', 'ready'],
    'delivery': ['out_for_delivery', 'delivering'],
    'completed': ['delivered', 'completed', 'cancelled']
}

class OrderStatusService {
    // Get orders by category with elapsed time
    async getOrdersByCategory(category: string): Promise<OrderWithElapsed[]> {
        const statusNames = CATEGORY_STATUSES[category] || []

        if (statusNames.length === 0) return []

        const { data, error } = await supabase
            .from('orders')
            .select(`
                id,
                order_number,
                created_at,
                status,
                order_type,
                total,
                customer_name,
                customer_phone,
                delivery_address,
                order_items (
                    quantity,
                    notes,
                    products (name, image_url)
                )
            `)
            .in('status', statusNames)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching orders:', error)
            throw error
        }

        // Transform and add elapsed time
        return (data || []).map(order => ({
            id: order.id,
            order_number: order.order_number,
            created_at: order.created_at,
            status: order.status,
            order_type: order.order_type,
            total: order.total,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            delivery_address: order.delivery_address,
            items_count: order.order_items?.length || 0,
            items_preview: (order.order_items || []).slice(0, 5).map((item: any) => ({
                name: item.products?.name || 'Unknown',
                quantity: item.quantity,
                notes: item.notes,
                image: item.products?.image_url
            })),
            elapsed_minutes: this.calculateElapsedMinutes(order.created_at)
        }))
    }

    // Get orders for Kanban dashboard (all categories)
    async getOrdersForDashboard(): Promise<Record<string, OrderWithElapsed[]>> {
        const categories = ['new', 'active', 'delivery', 'completed']
        const result: Record<string, OrderWithElapsed[]> = {}

        for (const category of categories) {
            try {
                const orders = await this.getOrdersByCategory(category)
                // Limit completed to 10, keep all others
                result[category] = category === 'completed' ? orders.slice(0, 10) : orders
            } catch (error) {
                console.error(`Error fetching ${category} orders:`, error)
                result[category] = []
            }
        }

        return result
    }

    // Update order status (simplified - no validation for now)
    async updateOrderStatus(orderId: string, newStatus: string): Promise<void> {
        const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString()
        }

        // Set delivered_at if completing
        if (['delivered', 'completed'].includes(newStatus)) {
            updateData.delivered_at = new Date().toISOString()
        }

        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId)

        if (error) {
            console.error('Error updating order:', error)
            throw error
        }
    }

    // Helper: Calculate elapsed minutes
    private calculateElapsedMinutes(createdAt: string): number {
        const created = new Date(createdAt)
        const now = new Date()
        return Math.floor((now.getTime() - created.getTime()) / 60000)
    }

    // Helper: Format elapsed time for display
    formatElapsedTime(minutes: number): string {
        if (minutes < 60) return `${minutes} min`
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
    }
}

export const orderStatusService = new OrderStatusService()
