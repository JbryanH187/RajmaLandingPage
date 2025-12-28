import { supabase } from '@/lib/supabase'

export interface ProfileUpdate {
    phone?: string
    default_address?: string
    full_name?: string
    avatar_url?: string
}

class ProfileService {
    async getCurrentUserProfile() {
        if (!supabase) throw new Error('Supabase not configured')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No authenticated user')

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) throw error
        return data
    }

    async updateMyProfile(updates: ProfileUpdate) {
        const response = await fetch('/api/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        })

        const result = await response.json()

        if (!response.ok) {
            console.error('Error updating profile:', result.error)
            throw new Error(result.error || 'Failed to update profile')
        }

        return result.data
    }
}

export const profileService = new ProfileService()
