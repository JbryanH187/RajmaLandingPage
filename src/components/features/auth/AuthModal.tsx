
"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"
import { cn } from "@/lib/utils"

import { useRouter } from "next/navigation"

export function AuthModal() {
    const router = useRouter()
    const { isAuthModalOpen, closeAuthModal } = useAuthStore() // Restore this line!
    const { signInWithGoogle, signInAsAdminDemo } = useAuth()
    const [view, setView] = React.useState<'signin' | 'signup'>('signin')

    if (!isAuthModalOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeAuthModal}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl bg-white border border-white/20"
                >
                    {/* Header */}
                    <div className="h-32 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center relative">
                        <button
                            onClick={closeAuthModal}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/50 hover:bg-white/80 transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-primary mx-auto flex items-center justify-center shadow-lg shadow-primary/30">
                                <span className="text-2xl">🍣</span>
                            </div>
                            <h2 className="text-xl font-serif font-medium text-foreground">
                                {view === 'signin' ? 'Bienvenido a Rajma' : 'Únete a la Familia'}
                            </h2>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-4">
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl border-gray-200 text-gray-700 hover:border-primary hover:text-primary hover:bg-primary/5 font-medium relative group overflow-hidden transition-all"
                                onClick={signInWithGoogle}
                            >
                                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continuar con Google
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl border-gray-200 text-gray-700 hover:border-primary hover:text-primary hover:bg-primary/5 font-medium transition-all"
                            // Add Facebook logic here
                            >
                                <svg className="h-5 w-5 mr-3 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.603-2.797 3.16v1.137h5.096l-.013 3.667h-5.083v7.98H9.101Z" />
                                </svg>
                                Continuar con Facebook
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground">O con email</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:border-primary"
                            />
                            <Button className="w-full h-12 rounded-xl bg-foreground text-background font-medium hover:bg-primary hover:text-white transition-all shadow-lg active:scale-[0.98]">
                                {view === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                            </Button>
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                            {view === 'signin' ? "¿No tienes cuenta? " : "Ya tienes cuenta? "}
                            <button
                                onClick={() => setView(view === 'signin' ? 'signup' : 'signin')}
                                className="font-semibold text-primary hover:underline"
                            >
                                {view === 'signin' ? "Regístrate" : "Inicia Sesión"}
                            </button>
                        </p>

                        {/* DEMO MODE FOR USER TESTING */}
                        <div className="pt-2 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    useAuthStore.getState().setUser({
                                        id: 'demo-user',
                                        email: 'demo@rajma.com',
                                        role: 'customer',
                                        full_name: 'Invitado Demo',
                                        avatar_url: 'https://ui.shadcn.com/avatars/04.png',
                                        phone: '6671234567',
                                        default_address: 'Calle Demo 123, Culiacán'
                                    })
                                    closeAuthModal()
                                }}
                                className="w-full py-2 text-xs font-mono text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span>👤</span> Demo Cliente
                            </button>
                            <button
                                onClick={() => {
                                    signInAsAdminDemo()
                                    closeAuthModal()
                                    router.push("/admin")
                                }}
                                className="w-full py-2 text-xs font-mono text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 mt-1"
                            >
                                <span>🔑</span> Demo Admin
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
