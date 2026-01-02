// hooks/useOrderStatusGroups.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StatusCategory } from '@/types/orders'

interface OrderStatusGroupsResult {
    groups: Record<StatusCategory, string[]> | null
    isLoading: boolean
    error: Error | null
}

export function useOrderStatusGroups(): OrderStatusGroupsResult {
    const [groups, setGroups] = useState<Record<StatusCategory, string[]> | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        async function fetchStatusGroups() {
            try {
                const { data, error } = await supabase
                    .from('order_statuses')
                    .select('id, category')
                    .eq('is_active', true)
                    .order('sort_order')

                if (error) throw error

                // Group status IDs by category
                const grouped: Record<StatusCategory, string[]> = {
                    'new': [],
                    'active': [],
                    'delivery': [],
                    'completed': []
                }

                data?.forEach(status => {
                    if (status.category && grouped[status.category as StatusCategory]) {
                        grouped[status.category as StatusCategory].push(status.id)
                    }
                })

                setGroups(grouped)
            } catch (err) {
                console.error('Error fetching order status groups:', err)
                setError(err as Error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStatusGroups()
    }, [])

    return { groups, isLoading, error }
}
