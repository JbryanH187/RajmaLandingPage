
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Profile } from '@/types'

interface AuthStore {
    user: Profile | null
    isLoading: boolean
    isAuthModalOpen: boolean
    openAuthModal: () => void
    closeAuthModal: () => void
    setUser: (user: Profile | null) => void
    setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            isLoading: true,
            isAuthModalOpen: false,
            openAuthModal: () => set({ isAuthModalOpen: true }),
            closeAuthModal: () => set({ isAuthModalOpen: false }),
            setUser: (user) => set({ user, isLoading: false }),
            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user }), // Only persist the user object
            onRehydrateStorage: () => (state) => {
                state?.setLoading(false)
            },
        }
    )
)
