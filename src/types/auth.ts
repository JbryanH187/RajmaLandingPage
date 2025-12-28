import type { Database } from './supabase'
import type { User } from '@supabase/supabase-js'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserRole = Profile['role']

export interface AuthState {
    user: User | null
    profile: Profile | null
    isLoading: boolean
    isAuthenticated: boolean
}

export interface OnboardingStatus {
    needsOnboarding: boolean
    missingFields: Array<keyof Profile>
}