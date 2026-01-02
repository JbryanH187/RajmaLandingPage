// hooks/useOrdersRealtime.ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useOrderStatusGroups } from '@/hooks/useOrderStatusGroups'
import type { Order, StatusCategory } from '@/types/orders'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface UseOrdersRealtimeOptions {
    statusCategory?: StatusCategory
    statusIds?: string[]
    includeOrderItems?: boolean
    todayOnly?: boolean
}

export function useOrdersRealtime({
    statusCategory,
    statusIds,
    includeOrderItems = true,
    todayOnly = false
}: UseOrdersRealtimeOptions = {}) {
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const { groups } = useOrderStatusGroups()

    const targetStatuses = statusIds || (statusCategory && groups?.[statusCategory]) || null

    const fetchOrders = useCallback(async () => {
        if (!groups && !statusIds) return

        setIsLoading(true)
        setError(null)

        try {
            let query = supabase
                .from('orders')
                .select(`
                    *,
                    order_status:order_statuses!status(
                        id,
                        label,
                        label_en,
                        color,
                        icon,
                        category
                    )
                    ${includeOrderItems ? `,
                    order_items(
                        id,
                        quantity,
                        price,
                        notes,
                        product:products(
                            id,
                            name,
                            description,
                            price,
                            image_url
                        )
                    )` : ''}
                `)
                .order('created_at', { ascending: false })

            // Filter by statuses
            if (targetStatuses && targetStatuses.length > 0) {
                query = query.in('status', targetStatuses)
            }

            // Today only for completed
            if (todayOnly || statusCategory === 'completed') {
                const todayStart = new Date()
                todayStart.setHours(0, 0, 0, 0)
                query = query.gte('created_at', todayStart.toISOString())
            }

            const { data, error: queryError } = await query

            if (queryError) throw queryError

            // Enrich with computed fields
            const enrichedOrders = data?.map(order => ({
                ...order,
                elapsed_time: calculateElapsedTime(order),
                is_delayed: isOrderDelayed(order),
                display_name: order.guest_name || order.user?.full_name || 'Cliente',
                display_phone: order.guest_phone || order.contact_phone
            })) || []

            setOrders(enrichedOrders)
        } catch (err) {
            console.error('Error fetching orders:', err)
            setError(err as Error)
        } finally {
            setIsLoading(false)
        }
    }, [groups, targetStatuses, includeOrderItems, todayOnly, statusCategory])

    // Initial fetch
    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    // Realtime subscription
    useEffect(() => {
        if (!groups) return

        const channel = supabase
            .channel(`orders-${statusCategory || 'all'}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                async (payload) => {
                    console.log('[Orders Realtime] Change:', payload.eventType)

                    const belongsToView = !targetStatuses ||
                        (payload.new && targetStatuses.includes(payload.new.status))

                    if (payload.eventType === 'INSERT' && belongsToView) {
                        // Fetch complete order with relations
                        const { data: newOrder } = await supabase
                            .from('orders')
                            .select(`
                                *,
                                order_status:order_statuses!status(*),
                                order_items(*, product:products(*))
                            `)
                            .eq('id', payload.new.id)
                            .single()

                        if (newOrder) {
                            const enriched = {
                                ...newOrder,
                                elapsed_time: calculateElapsedTime(newOrder),
                                is_delayed: isOrderDelayed(newOrder),
                                display_name: newOrder.guest_name || 'Cliente',
                                display_phone: newOrder.guest_phone || newOrder.contact_phone
                            }
                            setOrders(prev => [enriched, ...prev])
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const oldBelonged = !targetStatuses ||
                            (payload.old && targetStatuses.includes(payload.old.status))

                        if (belongsToView) {
                            const { data: updatedOrder } = await supabase
                                .from('orders')
                                .select(`
                                    *,
                                    order_status:order_statuses!status(*),
                                    order_items(*, product:products(*))
                                `)
                                .eq('id', payload.new.id)
                                .single()

                            if (updatedOrder) {
                                const enriched = {
                                    ...updatedOrder,
                                    elapsed_time: calculateElapsedTime(updatedOrder),
                                    is_delayed: isOrderDelayed(updatedOrder),
                                    display_name: updatedOrder.guest_name || 'Cliente',
                                    display_phone: updatedOrder.guest_phone || updatedOrder.contact_phone
                                }

                                setOrders(prev => {
                                    const exists = prev.some(o => o.id === payload.new.id)
                                    if (exists) {
                                        return prev.map(o => o.id === payload.new.id ? enriched : o)
                                    }
                                    return [enriched, ...prev]
                                })
                            }
                        } else if (oldBelonged && !belongsToView) {
                            setOrders(prev => prev.filter(o => o.id !== payload.new.id))
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setOrders(prev => prev.filter(o => o.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [statusCategory, targetStatuses?.join(','), groups])

    return { orders, isLoading, error, refetch: fetchOrders }
}

// Helper functions
function calculateElapsedTime(order: any): string {
    let referenceTime: Date

    switch (order.order_status?.id || order.status) {
        case 'pending':
            referenceTime = new Date(order.created_at)
            break
        case 'confirmed':
            referenceTime = new Date(order.confirmed_at || order.created_at)
            break
        case 'preparing':
            referenceTime = new Date(order.preparing_at || order.confirmed_at || order.created_at)
            break
        case 'ready':
            referenceTime = new Date(order.ready_at || order.preparing_at || order.created_at)
            break
        default:
            referenceTime = new Date(order.created_at)
    }

    try {
        return formatDistanceToNow(referenceTime, { addSuffix: false, locale: es })
    } catch {
        return '0 min'
    }
}

function isOrderDelayed(order: any): boolean {
    const now = new Date()
    const created = new Date(order.created_at)
    const minutesSinceCreated = (now.getTime() - created.getTime()) / 1000 / 60

    const delayThresholds: Record<string, number> = {
        'pending': 5,
        'confirmed': 10,
        'preparing': 30,
        'ready': 15,
        'out_for_delivery': 45,
        'delivering': 60
    }

    const statusId = order.order_status?.id || order.status
    const threshold = delayThresholds[statusId] || 30

    return minutesSinceCreated > threshold
}
