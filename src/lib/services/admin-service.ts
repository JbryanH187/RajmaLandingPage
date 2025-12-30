import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"

type Order = Database['public']['Tables']['orders']['Row']
type OrderStatus = Database['public']['Tables']['orders']['Row']['status']

// Extended Interface for Dashboard Stats
export interface DashboardStats {
    overview: {
        totalSalesToday: number
        totalOrdersToday: number
        openOrders: number
        ordersLastHour: number
        cancelledToday: number
        uniqueCustomers: number
    }
    performance: {
        avgPrepTime: number
        avgDeliveryTime: number
    }
    topSellingItems: TopSellingItem[]
    hourlySales: { hour: number; orders: number; sales: number }[]
    orderStatusBreakdown: Record<string, number>
    paymentMethodBreakdown: Record<string, number>
    lastUpdated: string
}

export interface TopSellingItem {
    id: string
    name: string
    quantity: number
    revenue: number
    orders: number
    image_url: string
}

// const supabase = createClientComponentClient<Database>()

export const AdminService = {
    // --- Order Management ---

    async getOrders(statusFilter?: OrderStatus | 'all', dateFilter?: string, signal?: AbortSignal) {
        let query = supabase
            .from('orders')
            .select(`
        *,
        order_items (
          *,
          products (name)
        ),
        profiles:user_id (full_name, phone, email)
      `)
            .order('created_at', { ascending: false }) // Newest first

        if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter)
        }

        if (dateFilter) {
            // Assuming dateFilter is YYYY-MM-DD
            const start = `${dateFilter}T00:00:00`
            const end = `${dateFilter}T23:59:59`
            query = query.gte('created_at', start).lte('created_at', end)
        }

        const { data, error } = await query.abortSignal(signal)
        if (error) throw error
        return data
    },

    async updateOrderStatus(orderId: string, status: OrderStatus) {
        const { error } = await (supabase
            .from('orders') as any)
            .update({ status })
            .eq('id', orderId)

        if (error) throw error
    },

    // --- Realtime ---

    subscribeToNewOrders(callback: (payload: any) => void) {
        return supabase
            .channel('admin-orders')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                (payload) => callback(payload.new)
            )
            .subscribe()
    },

    // --- Analytics ---

    async getDashboardStats(signal?: AbortSignal): Promise<DashboardStats> {
        const { data, error } = await supabase.rpc('get_dashboard_stats').abortSignal(signal)
        if (error) throw error
        return data as DashboardStats
    },
}
