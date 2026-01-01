"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUserOnboarding } from "@/lib/hooks/use-user-onboarding"
import { useAuthStore } from "@/lib/store/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { profileService } from "@/lib/services/profile-service"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

export function OnboardingWizard() {
    const { needsOnboarding, missingFields } = useUserOnboarding()
    const { user, setUser } = useAuthStore()
    const pathname = usePathname()

    const [step, setStep] = React.useState(0)
    const [loading, setLoading] = React.useState(false)
    const [phone, setPhone] = React.useState("")
    const [address, setAddress] = React.useState("")

    // Don't show if no user or no onboarding needed
    if (!user || !needsOnboarding) return null

    // Don't block Profile page
    if (pathname?.startsWith('/profile')) return null

    // Current field based on step
    const currentField = missingFields[step]
    const isLastStep = step >= missingFields.length - 1

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Get current value based on which field we're on
        const currentValue = currentField === 'phone' ? phone.trim() : address.trim()

        if (!currentValue) {
            toast.error(currentField === 'phone'
                ? "Por favor ingresa tu número de teléfono"
                : "Por favor ingresa tu dirección")
            return
        }

        setLoading(true)

        try {
            // Build update for current field only
            const updates: { phone?: string; default_address?: string } = {}
            if (currentField === 'phone') updates.phone = currentValue
            if (currentField === 'default_address') updates.default_address = currentValue

            console.log('[OnboardingWizard] Saving field:', currentField, '=', currentValue)

            // Save to database
            await profileService.updateMyProfile(updates)

            console.log('[OnboardingWizard] Saved! Updating store...')

            // Update local store
            setUser({
                ...user,
                ...(currentField === 'phone' && { phone: currentValue }),
                ...(currentField === 'default_address' && { default_address: currentValue })
            })

            // If not last step, advance to next
            if (!isLastStep) {
                setStep(prev => prev + 1)
                toast.success("¡Guardado! Siguiente paso...")
            } else {
                toast.success("¡Datos guardados correctamente!")
                // Modal will auto-close because needsOnboarding becomes false
            }

        } catch (error: any) {
            console.error('[OnboardingWizard] Error:', error)
            toast.error(error?.message || "No se pudo guardar. Intenta de nuevo.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
                <div className="p-8">
                    <div className="text-center mb-8">
                        <span className="text-4xl mb-4 block">👋</span>
                        <h2 className="text-2xl font-serif font-bold text-foreground">
                            Casi terminamos
                        </h2>
                        <p className="text-muted-foreground mt-2">
                            Para entregarte el mejor sushi, necesitamos unos datos extra.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentField}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-4"
                            >
                                {currentField === 'phone' && (
                                    <>
                                        <label className="text-sm font-medium text-foreground">
                                            Tu número de WhatsApp
                                        </label>
                                        <Input
                                            type="tel"
                                            placeholder="667 123 4567"
                                            className="h-14 rounded-xl bg-gray-50 border-gray-200 text-lg"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                        />
                                    </>
                                )}
                                {currentField === 'default_address' && (
                                    <>
                                        <label className="text-sm font-medium text-foreground">
                                            Tu Dirección de Entrega
                                        </label>
                                        <Input
                                            placeholder="Calle, Número y Colonia"
                                            className="h-14 rounded-xl bg-gray-50 border-gray-200 text-lg"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            required
                                        />
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-full text-lg shadow-lg shadow-primary/20"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLastStep ? 'Finalizar' : 'Siguiente'}
                        </Button>
                    </form>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 w-full">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${((step + 1) / missingFields.length) * 100}%` }}
                    />
                </div>
            </motion.div>
        </div>
    )
}
