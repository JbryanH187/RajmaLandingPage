"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useProfile } from "@/lib/hooks/use-profile"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, LogOut, Code, MapPin, Phone, User as UserIcon, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function ProfileSettings() {
    const { user, setUser } = useAuthStore()
    const { signOut } = useAuth()
    const { updateProfile, loading: updating } = useProfile()
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    // Form state initialized with user data
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        default_address: user?.default_address || ''
    })

    const hasChanges =
        formData.full_name !== (user?.full_name || '') ||
        formData.phone !== (user?.phone || '') ||
        formData.default_address !== (user?.default_address || '')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await updateProfile({
                full_name: formData.full_name,
                phone: formData.phone,
                default_address: formData.default_address
            })

            // CRITICAL: Manually update store to disable button immediately
            setUser({
                ...user!,
                full_name: formData.full_name,
                phone: formData.phone,
                default_address: formData.default_address
            })

            toast.success("¡Perfil Actualizado! 🎉", {
                description: "Tus datos están listos para tu próximo pedido.",
                duration: 4000,
            })
        } catch (error) {
            toast.error("Error al actualizar", {
                description: "No se pudieron guardar los cambios. Intenta de nuevo."
            })
        }
    }

    const handleLogout = async () => {
        try {
            await signOut()
            toast.success("¡Hasta pronto!", { description: "Esperamos verte pronto por aquí 👋" })
        } catch (error) {
            toast.error("Error al salir", { description: "Intenta de nuevo." })
        }
    }

    return (
        <>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Información Personal</CardTitle>
                        <CardDescription>
                            Actualiza tus datos de contacto y envío.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email (Read Only) */}
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Correo Electrónico</Label>
                                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border border-transparent">
                                    <span className="text-sm font-medium opacity-70">{user?.email}</span>
                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground ml-auto">
                                        No editable
                                    </span>
                                </div>
                            </div>

                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Nombre Completo</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="full_name"
                                        placeholder="Tu nombre"
                                        className="pl-9"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        placeholder="667..."
                                        className="pl-9"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    />
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Usado para contactarte sobre tus pedidos.
                                </p>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <Label htmlFor="address">Dirección Predeterminada</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Textarea
                                        id="address"
                                        placeholder="Calle, Número, Colonia, Referencias..."
                                        className="pl-9 min-h-[80px] resize-none"
                                        value={formData.default_address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, default_address: e.target.value }))}
                                    />
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Se llenará automáticamente al hacer un pedido.
                                </p>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    disabled={!hasChanges || updating}
                                    className="min-w-[140px]"
                                >
                                    {updating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        "Guardar Cambios"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Danger Zone / Logout */}
                <Card className="border-red-100 bg-red-50/10">
                    <CardHeader>
                        <CardTitle className="text-red-600">Sesión</CardTitle>
                        <CardDescription>
                            Gestiona el acceso a tu cuenta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="destructive"
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full sm:w-auto"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar Sesión
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutConfirm(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-6 text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-red-50 rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner">
                                🥺
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-serif font-bold text-gray-900">
                                    ¿Nos veremos de nuevo?
                                </h3>
                                <p className="text-muted-foreground">
                                    Tu historial y favoritos te estarán esperando para cuando el hambre ataque.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="h-12 rounded-xl border-2 hover:bg-gray-50 font-medium"
                                >
                                    ¡Sí, me quedo! 🍣
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleLogout}
                                    className="h-12 rounded-xl font-medium shadow-md shadow-red-200"
                                >
                                    Bye por ahora 👋
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
