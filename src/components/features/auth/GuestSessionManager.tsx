"use client"

import { useEffect } from 'react'
import { useDeviceFingerprint } from '@/lib/hooks/useDeviceFingerprint'
import { OrderService } from '@/lib/services/order-service'
import { useCartStore } from '@/lib/store/cart-store'
import { useAuthStore } from "@/lib/store/auth-store"
import { toast } from 'sonner'

export function GuestSessionManager() {
    const { fingerprint, deviceInfo } = useDeviceFingerprint()
    const { setGuestOrder, items, guestOrder } = useCartStore()
    const { user } = useAuthStore()

    useEffect(() => {
        // Only run if:
        // 1. We have a fingerprint
        // 2. User is NOT logged in (guests only)
        // 3. We don't already have a guest order loaded (avoid loop)
        // 4. We don't have active cart items (optional: override if they left?)
        //    Actually, if they have local items, maybe we shouldn't overwrite? 
        //    BUT, if they have an active order on the server, that takes precedence.

        const checkActiveOrder = async () => {
            if (!fingerprint || user || guestOrder) return

            console.log("🔍 Checking for active guest order via fingerprint...", fingerprint)
            const activeOrder = await OrderService.getActiveGuestOrder(fingerprint)

            if (activeOrder) {
                console.log("✅ Match found! Restoring active order:", activeOrder)

                // Restore headers/contact info to cache so ticket renders correctly
                // Note: The activeOrder object from RPC needs to match GuestOrder interface or be mapped
                // The RPC returns full order object.

                // Map RPC result to GuestOrder interface
                setGuestOrder({
                    name: activeOrder.guest_name || 'Invitado',
                    address: activeOrder.delivery_address || '', // Might be null if pickup
                    email: activeOrder.guest_email || '',
                    phone: activeOrder.guest_phone || '',
                    items: activeOrder.items || [], // The RPC returns items json
                    total: activeOrder.total,
                    date: new Date(activeOrder.created_at).toLocaleDateString('es-MX'),
                    orderType: activeOrder.order_type || 'delivery',
                    orderId: activeOrder.id,
                    orderNumber: activeOrder.order_number
                })

                toast.info("¡Bienvenido de vuelta!", {
                    description: `Hemos detectado tu orden activa #${activeOrder.order_number}.`,
                    duration: 5000,
                })
            }
        }

        checkActiveOrder()

    }, [fingerprint, user, guestOrder, setGuestOrder])

    return null
}
