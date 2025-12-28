import { useEffect, useState } from 'react'
import { profileService } from '@/lib/services/profile-service'
import { useAuth } from './use-auth'
import { Profile } from '@/types'

export function useProfile() {
    const { user, loading: authLoading } = useAuth() // Assuming useAuth returns { user, loading } - verifying this next
    const [profile, setProfile] = useState<any>(null) // Using any or Profile type
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        // If auth is still loading, do nothing yet
        if (authLoading) return

        if (user) {
            fetchProfile()
        } else {
            setLoading(false)
            setProfile(null)
        }
    }, [user, authLoading])

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const data = await profileService.getCurrentUserProfile()
            setProfile(data)
        } catch (err) {
            console.error(err)
            setError(err as Error)
        } finally {
            setLoading(false)
        }
    }

    const updateProfile = async (updates: any) => {
        try {
            setError(null)
            const updatedProfile = await profileService.updateMyProfile(updates)
            setProfile(updatedProfile)
            return { success: true, data: updatedProfile }
        } catch (err) {
            console.error(err)
            setError(err as Error)
            return { success: false, error: err }
        }
    }

    return {
        profile,
        loading: loading || authLoading, // Combined loading state
        error,
        updateProfile,
        refetch: fetchProfile,
        isAuthenticated: !!user
    }
}
