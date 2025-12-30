// services/notification-service.ts
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js'

type NotificationRow = Database['public']['Tables']['notifications']['Row']
type GuestNotificationRow = Database['public']['Tables']['guest_notifications']['Row']
type NotificationUpdate = Database['public']['Tables']['notifications']['Update']
type GuestNotificationUpdate = Database['public']['Tables']['guest_notifications']['Update']

export interface Notification {
    id: string
    title: string
    message: string
    is_read: boolean | null
    created_at: string
    order_id: string
    order?: {
        order_number: string | null
        status: string | null
    }
}

export const NotificationService = {
    // Para usuarios autenticados
    async getUserNotifications() {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user

        if (user) {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    order:orders!order_id(
                        order_number,
                        status
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            return { data: data as Notification[] | null, error }
        } else {
            return { data: [], error: null }
        }
    },

    // Para invitados
    async getGuestNotifications(email: string) {
        if (!email) return { data: [], error: null }

        const { data, error } = await supabase
            .from('guest_notifications')
            .select(`
                *,
                order:orders!order_id(
                    order_number,
                    status
                )
            `)
            .eq('email', email)
            .order('created_at', { ascending: false })

        return { data: data as Notification[] | null, error }
    },

    // Para usuarios registrados
    async markUserNotificationAsRead(notificationId: string) {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user

        if (!user) return { data: null, error: 'User not authenticated' }

        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true } satisfies NotificationUpdate)
            .eq('id', notificationId)
            .eq('user_id', user.id)
            .select()
            .maybeSingle()

        return { data, error }
    },

    // Para invitados
    async markGuestNotificationAsRead(notificationId: string, email: string) {
        const { data, error } = await supabase
            .from('guest_notifications')
            .update({ is_read: true } satisfies GuestNotificationUpdate)
            .eq('id', notificationId)
            .eq('email', email)
            .select()
            .maybeSingle()

        return { data, error }
    },

    // Función helper para obtener todas las notificaciones
    async getAllNotifications(email?: string) {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user

        if (user) {
            return this.getUserNotifications()
        } else if (email) {
            return this.getGuestNotifications(email)
        } else {
            return { data: [], error: null }
        }
    },

    // Contar notificaciones no leídas
    async getUnreadCount(email?: string) {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user

        if (user) {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false)

            return { count: count || 0, error }
        } else if (email) {
            const { count, error } = await supabase
                .from('guest_notifications')
                .select('*', { count: 'exact', head: true })
                .eq('email', email)
                .eq('is_read', false)

            return { count: count || 0, error }
        }

        return { count: 0, error: null }
    },

    // Suscribirse a cambios en tiempo real
    async subscribeToNotifications(
        callback: (notification: Notification) => void,
        email?: string
    ) {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user

        if (user) {
            return supabase
                .channel('user-notifications')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    async (payload: RealtimePostgresInsertPayload<NotificationRow>) => {
                        const { data: order } = await supabase
                            .from('orders')
                            .select('order_number, status')
                            .eq('id', payload.new.order_id)
                            .maybeSingle()

                        const notification: Notification = {
                            id: payload.new.id,
                            title: payload.new.title,
                            message: payload.new.message,
                            is_read: payload.new.is_read,
                            created_at: payload.new.created_at,
                            order_id: payload.new.order_id,
                            order: order || undefined
                        }

                        callback(notification)
                    }
                )
                .subscribe()
        } else if (email) {
            return supabase
                .channel('guest-notifications')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'guest_notifications',
                        filter: `email=eq.${email}`
                    },
                    async (payload: RealtimePostgresInsertPayload<GuestNotificationRow>) => {
                        const { data: order } = await supabase
                            .from('orders')
                            .select('order_number, status')
                            .eq('id', payload.new.order_id)
                            .maybeSingle()

                        const notification: Notification = {
                            id: payload.new.id,
                            title: payload.new.title,
                            message: payload.new.message,
                            is_read: payload.new.is_read,
                            created_at: payload.new.created_at,
                            order_id: payload.new.order_id,
                            order: order || undefined
                        }

                        callback(notification)
                    }
                )
                .subscribe()
        }

        return null
    },

    // Marcar todas las notificaciones como leídas
    async markAllAsRead(email?: string) {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user

        if (user) {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true } satisfies NotificationUpdate)
                .eq('user_id', user.id)
                .eq('is_read', false)

            return { success: !error, error }
        } else if (email) {
            const { error } = await supabase
                .from('guest_notifications')
                .update({ is_read: true } satisfies GuestNotificationUpdate)
                .eq('email', email)
                .eq('is_read', false)

            return { success: !error, error }
        }

        return { success: false, error: 'No user or email provided' }
    },

    // Eliminar notificación
    async deleteNotification(notificationId: string, email?: string) {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user

        if (user) {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId)
                .eq('user_id', user.id)

            return { success: !error, error }
        } else if (email) {
            const { error } = await supabase
                .from('guest_notifications')
                .delete()
                .eq('id', notificationId)
                .eq('email', email)

            return { success: !error, error }
        }

        return { success: false, error: 'No user or email provided' }
    },

    // Obtener notificaciones recientes (últimas 24 horas)
    async getRecentNotifications(email?: string) {
        const twentyFourHoursAgo = new Date()
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user

        if (user) {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    order:orders!order_id(
                        order_number,
                        status
                    )
                `)
                .eq('user_id', user.id)
                .gte('created_at', twentyFourHoursAgo.toISOString())
                .order('created_at', { ascending: false })

            return { data: data as Notification[] | null, error }
        } else if (email) {
            const { data, error } = await supabase
                .from('guest_notifications')
                .select(`
                    *,
                    order:orders!order_id(
                        order_number,
                        status
                    )
                `)
                .eq('email', email)
                .gte('created_at', twentyFourHoursAgo.toISOString())
                .order('created_at', { ascending: false })

            return { data: data as Notification[] | null, error }
        }

        return { data: [], error: null }
    }
}