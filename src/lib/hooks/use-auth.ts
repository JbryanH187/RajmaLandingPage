
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { supabase } from '@/lib/supabase'

export function useAuth() {
    const { setUser, setLoading } = useAuthStore()

    useEffect(() => {
        if (!supabase) return;

        const fetchProfile = async (sessionUser: any) => {
            if (!supabase) return;
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .single()

            setUser({
                id: sessionUser.id,
                email: sessionUser.email!,
                role: profile?.role || 'customer',
                created_at: sessionUser.created_at,
                avatar_url: profile?.avatar_url || sessionUser.user_metadata?.avatar_url,
                full_name: profile?.full_name || sessionUser.user_metadata?.full_name,
                phone: profile?.phone,
                default_address: profile?.default_address
            })
            setLoading(false)
        }

        // Check active session
        const initSession = async () => {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                await fetchProfile(session.user)
            } else {
                setUser(null)
                setLoading(false)
            }
        }

        initSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                // Ensure checking profile on auth change too
                await fetchProfile(session.user)
            } else {
                setUser(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const signInWithGoogle = async () => {
        if (!supabase) return;
        await supabase.auth.signInWithOAuth({ provider: 'google' })
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

    return { signInWithGoogle, signOut, signInAsAdminDemo }
}
