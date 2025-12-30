import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'

export function useRealtimeOrder() {
    const { guestOrder, setGuestOrder, setHasUnreadUpdate } = useCartStore()

    // Use ref to avoid closure staleness in intervals/subscriptions
    const orderRef = useRef(guestOrder)

    useEffect(() => {
        orderRef.current = guestOrder
    }, [guestOrder])

    useEffect(() => {
        if (!guestOrder?.orderId) return

        const orderId = guestOrder.orderId
        console.log(`🔌 Subscribing to order updates: ${orderId}`)

        const handleUpdate = (newStatus: string) => {
            const currentStatus = orderRef.current?.status
            console.log(`🔄 Status Update Check: ${currentStatus} -> ${newStatus}`)

            if (newStatus && newStatus !== currentStatus) {
                console.log("✅ Applying New Status:", newStatus)

                // Update store
                if (orderRef.current) {
                    setGuestOrder({
                        ...orderRef.current,
                        status: newStatus
                    })
                }

                // Notify
                if (['out_for_delivery', 'delivered'].includes(newStatus)) {
                    setHasUnreadUpdate(true)
                    toast.info(`Estatus Actualizado: ${newStatus === 'delivered' ? 'Entregado' : 'En Camino'}`)
                }
            }
        }

        // 1. Realtime Subscription
        const channel = supabase
            .channel(`order_updates_${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`
                },
                (payload) => {
                    console.log("🔔 Realtime Payload:", payload)
                    handleUpdate(payload.new.status)
                }
            )
            .subscribe((status) => {
                console.log("🔌 Realtime Connection Status:", status)
            })

        // 2. Polling Fallback (Every 10 seconds)
        const pollInterval = setInterval(async () => {
            try {
                // Use RPC to bypass RLS for public/guest orders
                const { data: rpcData, error } = await supabase.rpc('get_public_order_v1', {
                    p_order_id: orderId
                })

                if (error) throw error

                // Cast and validate
                const data = rpcData as { success: boolean; order?: { status: string } } | null

                if (data && data.success && data.order?.status) {
                    handleUpdate(data.order.status)
                }
            } catch (err) {
                console.error("Polling error", err)
            }
        }, 10000)

        return () => {
            console.log("🔌 Unsubscribing...")
            supabase.removeChannel(channel)
            clearInterval(pollInterval)
        }
    }, [guestOrder?.orderId, setGuestOrder, setHasUnreadUpdate])
}
