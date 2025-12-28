"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Loader2, AlertCircle } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function AuthModal() {
    const router = useRouter()
    const { isAuthModalOpen, closeAuthModal } = useAuthStore()
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsAdminDemo } = useAuth()
    const [view, setView] = React.useState<'signin' | 'signup'>('signin')

    // Form State
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [fullName, setFullName] = React.useState('')
    const [isLoading, setIsLoading] = React.useState(false)

    // Reset form when view changes or modal closes
    React.useEffect(() => {
        if (!isAuthModalOpen) {
            setEmail('')
            setPassword('')
            setFullName('')
            setIsLoading(false)
        }
    }, [isAuthModalOpen, view])

    if (!isAuthModalOpen) return null

    const handleSubmit = async () => {
        // Validation
        if (!email.trim() || !password.trim()) {
            toast.error("Campos requeridos", { description: "Por favor ingresa tu email y contraseña." })
            return
        }
        if (view === 'signup' && !fullName.trim()) {
            toast.error("Nombre requerido", { description: "Por favor ingresa tu nombre completo." })
            return
        }

        setIsLoading(true)
        try {
            if (view === 'signin') {
                await signInWithEmail(email, password)
                toast.success("¡Bienvenido!", { description: "Has iniciado sesión correctamente." })
                closeAuthModal()
            } else {
                await signUpWithEmail(email, password, fullName)
                toast.success("Cuenta creada", { description: "Verifica tu correo para confirmar tu cuenta antes de iniciar sesión.", duration: 6000 })
                setView('signin') // Switch to sign in after signup
            }
        } catch (error: any) {
            console.error(error)
            let msg = "Ocurrió un error al procesar tu solicitud."
            if (error.message.includes("Invalid login credentials")) msg = "Credenciales incorrectas."
            if (error.message.includes("User already registered")) msg = "Este correo ya está registrado."

            toast.error("Error", { description: msg })
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle()
        } catch (error) {
            toast.error("Error con Google", { description: "No se pudo iniciar sesión con Google." })
        }
    }

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
                            <div className="w-12 h-12 rounded-2xl bg-black/5 mx-auto flex items-center justify-center shadow-lg shadow-black/5 text-2xl">
                                🍣
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
                                className="w-full h-12 rounded-xl border-gray-200 text-gray-700 hover:border-black hover:text-black font-medium relative group overflow-hidden transition-all"
                                onClick={handleGoogleLogin}
                            >
                                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continuar con Google
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
                            {view === 'signup' && (
                                <input
                                    type="text"
                                    placeholder="Nombre Completo"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:border-black"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                />
                            )}
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:border-black"
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            />
                            <input
                                type="password"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:border-black"
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            />

                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl bg-black text-white font-medium hover:bg-black/90 transition-all shadow-lg active:scale-[0.98]"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {view === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                            </Button>
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                            {view === 'signin' ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                            <button
                                onClick={() => setView(view === 'signin' ? 'signup' : 'signin')}
                                className="font-semibold text-black hover:underline"
                            >
                                {view === 'signin' ? "Regístrate" : "Inicia Sesión"}
                            </button>
                        </p>

                        {/* DEMO MODE FOR USER TESTING - Keep redundant if desired, or remove to clean up */}
                        <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    useAuthStore.getState().setUser({
                                        id: 'demo-user',
                                        email: 'demo@rajma.com',
                                        role: 'customer',
                                        full_name: 'Invitado Demo',
                                        avatar_url: 'https://ui.shadcn.com/avatars/04.png',
                                        phone: '6671234567',
                                        default_address: 'Calle Demo 123, Culiacán',
                                        created_at: new Date().toISOString()
                                    })
                                    closeAuthModal()
                                }}
                                className="py-2 text-[10px] font-mono text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <span>👤</span> Demo
                            </button>
                            <button
                                onClick={() => {
                                    signInAsAdminDemo()
                                    closeAuthModal()
                                    router.push("/admin")
                                }}
                                className="py-2 text-[10px] font-mono text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                <span>🔑</span> Admin
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
