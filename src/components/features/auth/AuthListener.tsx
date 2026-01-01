"use client"

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { supabase } from '@/lib/supabase'

export function AuthListener() {
    const { user, setUser, setLoading, isHydrated } = useAuthStore()

    // Refs to prevent duplicate fetches
    const fetchingRef = useRef(false)
    const lastFetchedUserId = useRef<string | null>(null)

    useEffect(() => {
        if (!supabase || !isHydrated) return

        let mounted = true

        const fetchProfile = async (sessionUser: any) => {
            // Prevent duplicate fetches for same user
            if (fetchingRef.current) {
                console.log('[AuthListener] Fetch already in progress, skipping')
                return
            }

            if (lastFetchedUserId.current === sessionUser.id) {
                console.log('[AuthListener] Profile already fetched for:', sessionUser.id)
                setLoading(false)
                return
            }

            fetchingRef.current = true

            try {
                console.log('[AuthListener] Fetching profile for:', sessionUser.id)

                const { data: authInfo, error } = await (supabase as any)
                    .rpc('get_user_auth_info', { p_user_id: sessionUser.id })

                if (error) {
                    console.error('[AuthListener] RPC Error:', error)
                    lastFetchedUserId.current = null // Allow retry
                    return
                }

                const profile = authInfo?.user

                console.log('[AuthListener] Profile data:', {
                    has_phone: !!profile?.phone,
                    has_address: !!profile?.default_address
                })

                if (!mounted) return

                setUser({
                    id: sessionUser.id,
                    email: sessionUser.email!,
                    role: profile?.role?.name || 'customer',
                    created_at: profile?.created_at || sessionUser.created_at,
                    avatar_url: profile?.avatar_url || sessionUser.user_metadata?.avatar_url,
                    full_name: profile?.full_name || sessionUser.user_metadata?.full_name,
                    phone: profile?.phone || null,
                    default_address: profile?.default_address || null
                })

                lastFetchedUserId.current = sessionUser.id

            } catch (err) {
                console.error('[AuthListener] Unexpected error:', err)
                lastFetchedUserId.current = null // Allow retry
            } finally {
                fetchingRef.current = false
                if (mounted) setLoading(false)
            }
        }

        // Using ONLY onAuthStateChange - getSession can hang with @supabase/ssr
        // The INITIAL_SESSION event fires automatically on subscription with the current session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return

                console.log("[AuthListener] Auth event:", event)

                if (event === 'INITIAL_SESSION') {
                    // This is the initial load - process whatever session exists (or null)
                    if (session?.user) {
                        await fetchProfile(session.user)
                    } else {
                        setUser(null)
                        setLoading(false)
                    }
                } else if (event === 'SIGNED_IN') {
                    if (session?.user) {
                        await fetchProfile(session.user)
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                    lastFetchedUserId.current = null
                    setLoading(false)
                } else if (event === 'TOKEN_REFRESHED') {
                    // Optionally refresh profile on token refresh
                    console.log('[AuthListener] Token refreshed')
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [isHydrated])

    return null
}
