"use client"

import { useAuthStore } from '@/lib/store/auth-store'
import { OrderHistoryList } from '@/components/features/history/OrderHistoryList'
import { ProfileSettings } from '@/components/features/profile/ProfileSettings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, UserCircle, ArrowLeft } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function ProfilePage() {
    const { user, isLoading, openAuthModal } = useAuthStore()
    const [activeTab, setActiveTab] = useState('history')

    if (isLoading) {
        return (
            <div className="container py-20 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="container py-20 max-w-md mx-auto space-y-8">
                {/* Back to Home Button */}
                <div>
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
                            <ArrowLeft className="w-4 h-4" />
                            Volver al Inicio
                        </Button>
                    </Link>
                </div>

                <Card className="text-center">
                    <CardHeader>
                        <UserCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <CardTitle>Inicia Sesión</CardTitle>
                        <CardDescription>
                            Necesitas una cuenta para ver tu historial de órdenes y gestionar tu perfil.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={openAuthModal} className="w-full">
                            Iniciar Sesión / Registrarse
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container py-10 max-w-4xl mx-auto space-y-8">
            {/* Back to Home Button */}
            <div>
                <Link href="/">
                    <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
                        <ArrowLeft className="w-4 h-4" />
                        Volver al Inicio
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4">
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                    <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-500">
                            {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-bold">{user.full_name || 'Bienvenido'}</h1>
                    <p className="text-muted-foreground">{user.email}</p>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex border-b mb-6">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-[2px] ${activeTab === 'history'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Historial de Órdenes
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-[2px] ${activeTab === 'settings'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Configuración
                    </button>
                </div>

                {activeTab === 'history' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Mis Pedidos</CardTitle>
                            <CardDescription>
                                Revisa el estado y detalle de tus pedidos recientes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <OrderHistoryList userId={user.id} email={user.email} />
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'settings' && (
                    <ProfileSettings />
                )}
            </div>
        </div>
    )
}
