"use client"

import { BarChart2, TrendingUp, DollarSign, ShoppingBag, Users, Clock, Construction } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { useTheme } from "@/lib/hooks/useTheme"

export default function ReportsPage() {
    const { isDark } = useTheme()

    // Theme-aware classes
    const textMain = isDark ? 'text-white' : 'text-gray-900'
    const textMuted = isDark ? 'text-zinc-400' : 'text-gray-500'
    const cardBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
    const statBg = isDark ? 'bg-zinc-800/50' : 'bg-gray-50'

    const placeholderStats = [
        { label: 'Ventas Totales', value: '$0.00', icon: DollarSign, color: 'text-green-500' },
        { label: 'Órdenes Hoy', value: '0', icon: ShoppingBag, color: 'text-blue-500' },
        { label: 'Clientes', value: '0', icon: Users, color: 'text-purple-500' },
        { label: 'Tiempo Promedio', value: '0 min', icon: Clock, color: 'text-orange-500' },
    ]

    return (
        <AdminShell>
            <div className="space-y-6">
                <div>
                    <h1 className={`text-3xl font-bold flex items-center gap-3 ${textMain}`}>
                        <BarChart2 className="text-red-500" />
                        Reportes
                    </h1>
                    <p className={textMuted}>Análisis y estadísticas del negocio</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {placeholderStats.map((stat) => (
                        <div key={stat.label} className={`rounded-xl border p-6 ${cardBg}`}>
                            <div className="flex items-center justify-between mb-4">
                                <span className={`text-sm font-medium ${textMuted}`}>{stat.label}</span>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <p className={`text-3xl font-bold ${textMain}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Coming Soon */}
                <div className={`rounded-xl border p-12 flex flex-col items-center justify-center text-center ${cardBg}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${statBg}`}>
                        <Construction className={`h-10 w-10 ${textMuted}`} />
                    </div>
                    <h2 className={`text-2xl font-bold mb-2 ${textMain}`}>Módulo en Construcción</h2>
                    <p className={`max-w-md ${textMuted}`}>
                        Los gráficos y reportes detallados estarán disponibles próximamente.
                        Podrás visualizar tendencias de ventas, productos más vendidos y más.
                    </p>
                    <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium">
                        <TrendingUp size={16} />
                        Próximamente con Analytics
                    </div>
                </div>
            </div>
        </AdminShell>
    )
}
