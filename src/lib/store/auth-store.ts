
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Profile } from '@/types'

interface AuthStore {
    user: Profile | null
    isLoading: boolean
    isAuthModalOpen: boolean
    // Hydration tracking
    isHydrated?: boolean
    setHydrated: (val: boolean) => void

    // Onboarding UX
    hasDismissedOnboarding: boolean
    dismissOnboarding: () => void

    openAuthModal: () => void
    closeAuthModal: () => void
    setUser: (user: Profile | null) => void
    setLoading: (isLoading: boolean) => void
    logout: () => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            isLoading: true,
            // New flag to track if persisted state has been loaded
            isHydrated: false,
            // Track dismissal
            hasDismissedOnboarding: false,
            dismissOnboarding: () => set({ hasDismissedOnboarding: true }),

            isAuthModalOpen: false,
            openAuthModal: () => set({ isAuthModalOpen: true }),
            closeAuthModal: () => set({ isAuthModalOpen: false }),
            setUser: (user) => set({ user, isLoading: false }),
            setLoading: (isLoading) => set({ isLoading }),
            setHydrated: (val: boolean) => set({ isHydrated: val }),
            // Logout resets everything including dismissal
            logout: () => set({
                user: null,
                isLoading: false,
                hasDismissedOnboarding: false
            }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                hasDismissedOnboarding: state.hasDismissedOnboarding // Persist this preference
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true)
                // We don't set loading false here immediately, 
                // we let useAuth handle that after it verifies the user.
            },
        }
    )
)
