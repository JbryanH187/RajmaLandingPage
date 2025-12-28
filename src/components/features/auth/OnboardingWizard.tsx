
"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUserOnboarding } from "@/lib/hooks/use-user-onboarding"
import { useAuthStore } from "@/lib/store/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { profileService } from "@/lib/services/profile-service"

export function OnboardingWizard() {
    const { needsOnboarding, missingFields } = useUserOnboarding()
    const { user, setUser } = useAuthStore()
    const [step, setStep] = React.useState(0)
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState({
        phone: "",
        default_address: ""
    })

    // Don't show if no user or no onboarding needed
    if (!user || !needsOnboarding) return null

    // Determine current field to ask based on missing fields and step
    const currentField = missingFields[step]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // If we have more steps (missing fields), go next
        if (step < missingFields.length - 1) {
            setStep(prev => prev + 1)
            return
        }

        // Otherwise submit
        try {
            await profileService.updateMyProfile({
                phone: formData.phone,
                default_address: formData.default_address
            })

            // Update local state
            setUser({
                ...user,
                ...formData
            })
        } catch (error) {
            console.error(error)
            // You might want to show a toast here
        }
        setLoading(false)
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
                                        <label className="text-sm font-medium text-foreground">Tu número de WhatsApp</label>
                                        <Input
                                            type="tel"
                                            placeholder="667 123 4567"
                                            className="h-14 rounded-xl bg-gray-50 border-gray-200 text-lg"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            required
                                        />
                                    </>
                                )}
                                {currentField === 'default_address' && (
                                    <>
                                        <label className="text-sm font-medium text-foreground">Tu Dirección de Entrega</label>
                                        <Input
                                            placeholder="Calle, Número y Colonia"
                                            className="h-14 rounded-xl bg-gray-50 border-gray-200 text-lg"
                                            value={formData.default_address}
                                            onChange={(e) => setFormData(prev => ({ ...prev, default_address: e.target.value }))}
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
                            {step < missingFields.length - 1 ? 'Siguiente' : 'Completar Registro'}
                        </Button>
                    </form>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 w-full">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${((step + 1) / (missingFields.length || 1)) * 100}%` }}
                    />
                </div>
            </motion.div>
        </div>
    )
}
