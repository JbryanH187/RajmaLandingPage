import { useCallback, useRef, useEffect } from 'react'

export function useAbortableRequest() {
    const abortControllerRef = useRef<AbortController | null>(null)
    const isMountedRef = useRef(true)

    useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
            // Cancelar solo si hay una petición activa
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    const request = useCallback(async <T,>(
        requestFn: (signal: AbortSignal) => Promise<T>
    ): Promise<T> => {
        // Cancelar petición anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Crear nuevo AbortController
        abortControllerRef.current = new AbortController()

        try {
            const result = await requestFn(abortControllerRef.current.signal)

            // Solo retornar si el componente sigue montado
            if (isMountedRef.current) {
                return result
            }

            throw new Error('Component unmounted')
        } catch (error) {
            // Ignorar errores de abort si el componente se desmontó
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Request aborted - this is normal in development mode')
                throw new Error('Request was cancelled')
            }
            throw error
        } finally {
            // Limpiar referencia si la petición terminó
            if (abortControllerRef.current?.signal.aborted) {
                abortControllerRef.current = null
            }
        }
    }, [])

    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
    }, [])

    return { request, abort }
}
