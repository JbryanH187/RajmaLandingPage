import { useCallback, useEffect, useRef } from 'react'

export const useAbortableRequest = () => {
    const controllerRef = useRef<AbortController>()

    const request = useCallback(async <T>(
        requestFn: (signal: AbortSignal) => Promise<T>,
        options?: {
            timeout?: number;
            onSuccess?: (data: T) => void;
            onError?: (error: Error) => void;
        }
    ) => {
        // Cancel previous request
        if (controllerRef.current) {
            controllerRef.current.abort()
        }
        controllerRef.current = new AbortController()

        const { signal } = controllerRef.current
        const { timeout = 20000, onSuccess, onError } = options || {} // Default 20s timeout

        const timeoutId = setTimeout(() => {
            if (controllerRef.current) {
                controllerRef.current.abort()
                console.warn('Request timed out after', timeout, 'ms')
            }
        }, timeout)

        try {
            const result = await requestFn(signal)

            // Should not run if aborted, but double check signal status
            if (!signal.aborted) {
                onSuccess?.(result)
            }
            return result
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Request was cancelled')
                // Swallow abort errors generally, unless we want to handle them
            } else {
                if (!signal.aborted) {
                    onError?.(error as Error)
                }
            }
            // Return null or rethrow? 
            // For this hook pattern, usually returning null/undefined on error is safer if handled via callbacks
            return undefined
        } finally {
            clearTimeout(timeoutId)
        }
    }, [])

    // Cleanup function
    const abort = useCallback(() => {
        if (controllerRef.current) {
            controllerRef.current.abort()
        }
    }, [])

    // Auto cleanup on unmount
    useEffect(() => {
        return abort
    }, [abort])

    return { request, abort }
}
