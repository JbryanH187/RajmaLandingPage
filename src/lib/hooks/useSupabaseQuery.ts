import { useEffect, useRef, useState, useCallback } from 'react'
import { PostgrestError } from '@supabase/supabase-js'

interface UseSupabaseQueryOptions<T> {
    queryFn: (signal: AbortSignal) => Promise<{ data: T | null; error: PostgrestError | null }>
    queryKey: string[]
    enabled?: boolean
    refetchInterval?: number
    onSuccess?: (data: T) => void
    onError?: (error: PostgrestError) => void
    staleTime?: number // Time before considering data stale (default: 5 min)
}

interface QueryState<T> {
    data: T | null
    error: PostgrestError | null
    isLoading: boolean
    isError: boolean
    isSuccess: boolean
    isFetching: boolean
    isStale: boolean
}

export function useSupabaseQuery<T>({
    queryFn,
    queryKey,
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
    staleTime = 5 * 60 * 1000 // 5 minutes default
}: UseSupabaseQueryOptions<T>): QueryState<T> & { refetch: () => Promise<void> } {
    const [state, setState] = useState<QueryState<T>>({
        data: null,
        error: null,
        isLoading: enabled,
        isError: false,
        isSuccess: false,
        isFetching: enabled,
        isStale: false
    })

    const abortControllerRef = useRef<AbortController | null>(null)
    const lastFetchTime = useRef<number>(0)
    const queryKeyString = JSON.stringify(queryKey)

    const checkIfStale = useCallback(() => {
        const now = Date.now()
        const isStale = now - lastFetchTime.current > staleTime
        setState(prev => ({ ...prev, isStale }))
        return isStale
    }, [staleTime])

    const executeFetch = useCallback(async () => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Create new AbortController
        abortControllerRef.current = new AbortController()

        setState(prev => ({ ...prev, isFetching: true, isLoading: !prev.data }))

        try {
            const startTime = performance.now()
            const { data, error } = await queryFn(abortControllerRef.current.signal)
            const duration = performance.now() - startTime

            // Performance warning in development
            if (process.env.NODE_ENV === 'development' && duration > 1000) {
                console.warn(`[useSupabaseQuery] Slow query detected:`, {
                    queryKey,
                    duration: `${duration.toFixed(2)}ms`
                })
            }

            if (error) throw error

            setState({
                data,
                error: null,
                isLoading: false,
                isError: false,
                isSuccess: true,
                isFetching: false,
                isStale: false
            })

            lastFetchTime.current = Date.now()
            onSuccess?.(data!)

        } catch (err: any) {
            if (err.name !== 'AbortError') {
                const supabaseError = err as PostgrestError
                setState({
                    data: null,
                    error: supabaseError,
                    isLoading: false,
                    isError: true,
                    isSuccess: false,
                    isFetching: false,
                    isStale: false
                })
                onError?.(supabaseError)
            }
        }
    }, [queryFn, onSuccess, onError])

    // Manual refetch
    const refetch = useCallback(async () => {
        await executeFetch()
    }, [executeFetch])

    // Main effect
    useEffect(() => {
        if (!enabled) return

        // Only fetch if stale or first time
        if (!state.data || checkIfStale()) {
            executeFetch()
        }

        // Setup refetch interval if defined
        let intervalId: NodeJS.Timeout
        if (refetchInterval) {
            intervalId = setInterval(() => {
                if (checkIfStale()) {
                    executeFetch()
                }
            }, refetchInterval)
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            if (intervalId) {
                clearInterval(intervalId)
            }
        }
    }, [enabled, queryKeyString])

    return { ...state, refetch }
}
