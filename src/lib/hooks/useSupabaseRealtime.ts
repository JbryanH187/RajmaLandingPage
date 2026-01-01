import { useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/utils/logger'

interface UseSupabaseRealtimeOptions {
    channel: string
    event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE'
    table?: string
    filter?: string
    onInsert?: (payload: any) => void
    onUpdate?: (payload: any) => void
    onDelete?: (payload: any) => void
    enabled?: boolean
}

export function useSupabaseRealtime({
    channel,
    event = '*',
    table,
    filter,
    onInsert,
    onUpdate,
    onDelete,
    enabled = true
}: UseSupabaseRealtimeOptions) {
    const channelRef = useRef<RealtimeChannel | null>(null)
    const subscribedRef = useRef(false)

    useEffect(() => {
        if (!enabled || !supabase) return

        // Cleanup previous channel
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
            subscribedRef.current = false
        }

        // Create new channel
        channelRef.current = supabase
            .channel(channel)
            .on(
                'postgres_changes',
                {
                    event,
                    schema: 'public',
                    table: table || '*',
                    filter
                },
                (payload) => {
                    logger.debug('[Realtime] Event received', {
                        type: payload.eventType,
                        table: payload.table
                    })

                    switch (payload.eventType) {
                        case 'INSERT':
                            onInsert?.(payload)
                            break
                        case 'UPDATE':
                            onUpdate?.(payload)
                            break
                        case 'DELETE':
                            onDelete?.(payload)
                            break
                    }
                }
            )
            .subscribe((status) => {
                logger.debug('[Realtime] Subscription status', { channel, status })
                subscribedRef.current = status === 'SUBSCRIBED'
            })

        return () => {
            if (channelRef.current) {
                logger.debug('[Realtime] Unsubscribing from channel', { channel })
                supabase.removeChannel(channelRef.current)
                subscribedRef.current = false
            }
        }
    }, [channel, event, table, filter, enabled])

    return {
        isSubscribed: subscribedRef.current
    }
}
