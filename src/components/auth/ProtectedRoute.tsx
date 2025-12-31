"use client"

import { usePermissions } from "@/hooks/usePermissions"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
    children: React.ReactNode
    module?: string
    resource?: string
    action?: string
    fallbackPath?: string
}

export function ProtectedRoute({
    children,
    module,
    resource,
    action,
    fallbackPath = "/"
}: ProtectedRouteProps) {
    const router = useRouter()
    const { hasPermission, canAccessModule, loading } = usePermissions()

    useEffect(() => {
        if (!loading) {
            let authorized = true

            // Check Module Access
            if (module && !canAccessModule(module)) {
                authorized = false
            }

            // Check Resource Permission
            if (resource && action && !hasPermission(resource, action)) {
                authorized = false
            }

            if (!authorized) {
                // Prevent infinite loop if fallback is current page (unlikely if used correctly)
                router.push(fallbackPath)
            }
        }
    }, [loading, module, resource, action, hasPermission, canAccessModule, router, fallbackPath])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    // Only render children if authorized (or while loading state is handled above)
    // We double check here to prevent flash of unauthorized content
    const isAuthorized =
        (!module || canAccessModule(module)) &&
        (!resource || !action || hasPermission(resource, action))

    if (!isAuthorized) {
        return null // Or a custom Unauthorized component inline
    }

    return <>{children}</>
}
