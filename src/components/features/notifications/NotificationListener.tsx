"use client"
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store/auth-store'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'

export function NotificationListener() {
    const { user } = useAuthStore()

    // Get guest email from store state (persisted)
    const guestEmail = useCartStore(state => state.guestEmail)

    // Determine the identifier to listen for to avoid unnecessary subscriptions
    const userId = user?.id

    useEffect(() => {
        // Cleanup function variable
        let channel: any = null

        const setupSubscription = async () => {
            // 1. AUTHENTICATED USER
            if (userId) {
                console.log("🔔 [Auth] Listening for notifications:", userId)

                channel = supabase
                    .channel(`notifications:user:${userId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'notifications',
                            filter: `user_id=eq.${userId}`,
                        },
                        (payload) => handleNotification(payload.new)
                    )
                    .subscribe()

            }
            // 2. GUEST USER (Only if not logged in and has email)
            else if (guestEmail) {
                console.log("🔔 [Guest] Listening for notifications:", guestEmail)

                channel = supabase
                    .channel(`notifications:guest:${guestEmail}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'guest_notifications',
                            filter: `email=eq.${guestEmail}`,
                        },
                        (payload) => handleNotification(payload.new)
                    )
                    .subscribe()
            }
        }

        setupSubscription()

        // Cleanup on unmount or dependency change
        return () => {
            if (channel) {
                console.log("🔕 Unsubscribing notifications")
                supabase.removeChannel(channel)
            }
        }
    }, [userId, guestEmail])

    const handleNotification = (notification: any) => {
        console.log('🔔 Notification Received:', notification)

        // Show Toast Notification
        toast(notification.title || 'Actualización', {
            description: notification.message,
            icon: <Bell className="h-4 w-4 text-blue-500" />,
            duration: 8000,
            action: {
                label: 'Ver',
                onClick: () => console.log('View notification', notification)
            }
        })

        // Play notification sound
        try {
            // Using a generic sound or just failing silently if not found
            // const audio = new Audio('/sounds/notification.mp3')
            // audio.volume = 0.5
            // audio.play().catch(() => {})
        } catch (e) { }
    }

    return null
}
