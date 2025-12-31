"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Interfaces
interface Role {
    id: string
    name: string
    description: string
}

interface UserInfo {
    user_id: string
    email: string
    full_name: string
    role: Role
}

interface Permission {
    resource: string
    action: string
    granted: boolean
}

interface Module {
    name: string
    display_name: string
    route: string
    icon: string
    // can_access included implicitly if returned by get_user_modules
}

interface PermissionContextType {
    userInfo: UserInfo | null
    permissions: Permission[]
    modules: Module[]
    hasPermission: (resource: string, action: string) => boolean
    canAccessModule: (moduleName: string) => boolean
    isRole: (roleName: string) => boolean
    loading: boolean
    refreshPermissions: () => Promise<void>
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

export function PermissionProvider({ children }: { children: ReactNode }) {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [modules, setModules] = useState<Module[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)

    const fetchUserData = async () => {
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.user) {
                setUserInfo(null)
                setPermissions([])
                setModules([])
                setUserId(null)
                return
            }

            const uid = session.user.id
            setUserId(uid)

            // Unified RPC Call
            console.log('[usePermissions] Fetching auth info for user:', uid)
            const { data, error } = await (supabase as any)
                .rpc('get_user_auth_info', { p_user_id: uid })

            console.log('[usePermissions] RPC Response:', { data, error })

            if (error) {
                console.error('[usePermissions] RPC Error:', error)
                throw error
            }

            if (data) {
                setUserInfo(data.user)
                setPermissions(data.permissions || [])
                setModules(data.modules || [])
            } else {
                // Fallback or empty state if no data returned
                setUserInfo(null)
                setPermissions([])
                setModules([])
            }

        } catch (error) {
            console.error("Error loading auth info:", error)
            // toast.error("Error cargando permisos")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUserData()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user.id !== userId) {
                fetchUserData()
            }
        })

        return () => subscription.unsubscribe()
    }, [userId])

    // --- Helper Functions ---

    const hasPermission = (resource: string, action: string) => {
        // Super Admin Bypass for frontend convenience? 
        // User requested strict check form:
        const permission = permissions.find(
            p => p.resource === resource && p.action === action
        )
        return permission?.granted === true
    }

    const canAccessModule = (moduleName: string) => {
        // get_user_modules returns only accessible modules
        return modules.some(m => m.name === moduleName)
    }

    const isRole = (roleName: string) => {
        return userInfo?.role.name === roleName
    }

    const refreshPermissions = async () => {
        await fetchUserData()
    }

    return (
        <PermissionContext.Provider value={{
            userInfo,
            permissions,
            modules,
            hasPermission,
            canAccessModule,
            isRole,
            loading,
            refreshPermissions
        }}>
            {children}
        </PermissionContext.Provider>
    )
}

export function usePermissions() {
    const context = useContext(PermissionContext)
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionProvider')
    }
    return context
}
