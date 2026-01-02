"use client"

import { Settings, Bell, Store, CreditCard, Palette, Shield, Construction } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { useTheme } from "@/lib/hooks/useTheme"

export default function SettingsPage() {
    const { isDark, toggleTheme } = useTheme()

    // Theme-aware classes
    const textMain = isDark ? 'text-white' : 'text-gray-900'
    const textMuted = isDark ? 'text-zinc-400' : 'text-gray-500'
    const cardBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
    const itemBg = isDark ? 'bg-zinc-800/50 hover:bg-zinc-800' : 'bg-gray-50 hover:bg-gray-100'

    const settingsCategories = [
        { label: 'Información del Negocio', icon: Store, description: 'Nombre, logo, horarios de operación' },
        { label: 'Notificaciones', icon: Bell, description: 'Alertas de pedidos y avisos' },
        { label: 'Métodos de Pago', icon: CreditCard, description: 'Configurar pagos aceptados' },
        { label: 'Apariencia', icon: Palette, description: 'Tema y personalización', action: toggleTheme, actionLabel: isDark ? 'Cambiar a Claro' : 'Cambiar a Oscuro' },
        { label: 'Seguridad', icon: Shield, description: 'Contraseña y autenticación' },
    ]

    return (
        <AdminShell>
            <div className="space-y-6">
                <div>
                    <h1 className={`text-3xl font-bold flex items-center gap-3 ${textMain}`}>
                        <Settings className="text-red-500" />
                        Configuración
                    </h1>
                    <p className={textMuted}>Ajustes generales del sistema</p>
                </div>

                {/* Settings List */}
                <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
                    {settingsCategories.map((item, idx) => (
                        <div
                            key={item.label}
                            className={`flex items-center justify-between p-5 transition-colors cursor-pointer ${itemBg} ${idx !== settingsCategories.length - 1 ? isDark ? 'border-b border-zinc-800' : 'border-b border-gray-100' : ''
                                }`}
                            onClick={item.action}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-zinc-700' : 'bg-gray-200'
                                    }`}>
                                    <item.icon className={`h-6 w-6 ${isDark ? 'text-zinc-300' : 'text-gray-600'}`} />
                                </div>
                                <div>
                                    <p className={`font-semibold ${textMain}`}>{item.label}</p>
                                    <p className={`text-sm ${textMuted}`}>{item.description}</p>
                                </div>
                            </div>
                            {item.actionLabel ? (
                                <span className={`text-sm font-medium px-3 py-1.5 rounded-lg ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {item.actionLabel}
                                </span>
                            ) : (
                                <span className={`text-xs font-medium px-2 py-1 rounded ${isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    Próximamente
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Coming Soon Note */}
                <div className={`rounded-xl border p-6 flex items-center gap-4 ${cardBg}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'
                        }`}>
                        <Construction className={textMuted} />
                    </div>
                    <div>
                        <p className={`font-semibold ${textMain}`}>Más opciones próximamente</p>
                        <p className={`text-sm ${textMuted}`}>
                            Estamos trabajando en más opciones de configuración para tu negocio.
                        </p>
                    </div>
                </div>
            </div>
        </AdminShell>
    )
}
