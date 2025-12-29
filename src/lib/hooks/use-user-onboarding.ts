
import { useAuthStore } from '@/lib/store/auth-store'
import { OnboardingStatus, Profile } from '@/types/auth'

export function useUserOnboarding(): OnboardingStatus {
    const { user } = useAuthStore()

    if (!user) {
        return { needsOnboarding: false, missingFields: [] }
    }

    const missingFields: Array<keyof Profile> = []

    if (!user.phone) {
        missingFields.push('phone')
    }

    if (!user.default_address) {
        missingFields.push('default_address')
    }

    return {
        needsOnboarding: missingFields.length > 0,
        missingFields
    }
}
