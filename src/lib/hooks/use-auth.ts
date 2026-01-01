
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { supabase } from '@/lib/supabase'

export function useAuth() {
    // We added isHydrated to store
    const { user, isLoading, setUser, setLoading, isHydrated } = useAuthStore()

    // Side effects are now handled by <AuthListener /> in layout.tsx
    // This hook is now purely for accessing state and actions.

    const signInWithGoogle = async () => {
        if (!supabase) return;
        console.log('[useAuth] Initiating Google Sign In')
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
        if (error) console.error('[useAuth] Google Sign In Error:', error)
        if (data) console.log('[useAuth] Google Sign In Data:', data)
    }

    const signOut = async () => {
        if (!supabase) return;
        await supabase.auth.signOut()
    }

    const signInAsAdminDemo = () => {
        setUser({
            id: 'admin-demo',
            email: 'admin@rajma.com',
            role: 'admin',
            full_name: 'Admin Demo',
            avatar_url: 'https://ui.shadcn.com/avatars/02.png',
            phone: '6670000000',
            default_address: 'Rajma HQ',
            created_at: new Date().toISOString()
        })
        setLoading(false)
    }

    const signInWithEmail = async (email: string, password: string) => {
        if (!supabase) return;
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error
    }

    const signUpWithEmail = async (email: string, password: string, fullName: string) => {
        if (!supabase) return;
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        })
        if (error) throw error
    }

    return {
        user,
        loading: isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        signInAsAdminDemo
    }
}
