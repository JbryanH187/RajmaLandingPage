import { supabase } from '@/lib/supabase'

export interface ProfileUpdate {
    phone?: string
    default_address?: string
    full_name?: string
    avatar_url?: string
}

class ProfileService {
    private async getAccessToken(): Promise<string | null> {
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token || null
    }

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
        const accessToken = await this.getAccessToken()

        if (!accessToken) {
            throw new Error('No authenticated session')
        }

        const response = await fetch('/api/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
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

