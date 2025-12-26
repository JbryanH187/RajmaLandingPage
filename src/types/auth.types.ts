
export type UserRole = 'customer' | 'admin' | 'super_admin';

export interface Profile {
    id: string;
    email: string;
    role: UserRole;
    phone?: string;
    default_address?: string;
    avatar_url?: string;
    full_name?: string;
    created_at?: string;
}

export interface AuthState {
    user: Profile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export interface OnboardingStatus {
    needsOnboarding: boolean;
    missingFields: string[];
}
