"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Flame, ShoppingBag, ChefHat, LayoutGrid, Users,
    BarChart2, Settings, LogOut, Menu, X, BrainCircuit, Sparkles
} from 'lucide-react'
import { useTheme } from '@/lib/hooks/useTheme'

interface NavItem {
    href: string
    label: string
    icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
    { href: '/admin/orders', label: 'Órdenes', icon: ShoppingBag },
    { href: '/admin/menu', label: 'Menú', icon: ChefHat },
    { href: '/admin/users', label: 'Usuarios', icon: Users },
    { href: '/admin/reports', label: 'Reportes', icon: BarChart2 },
    { href: '/admin/settings', label: 'Configuración', icon: Settings },
]

interface AdminSidebarProps {
    isOpen: boolean
    onClose: () => void
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname()
    const { isDark } = useTheme()

    const bgClass = isDark ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-gray-200'
    const textClass = isDark ? 'text-white' : 'text-gray-900'
    const mutedClass = isDark ? 'text-zinc-400' : 'text-gray-500'
    const hoverClass = isDark ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-gray-100 hover:text-gray-900'
    const activeClass = isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={`
                fixed top-0 left-0 bottom-0 w-64 z-50 
                transform transition-transform duration-300 ease-in-out 
                lg:translate-x-0 lg:static
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                ${bgClass} border-r flex flex-col
            `}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-inherit shrink-0">
                    <Link href="/admin" className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                            <Flame size={20} fill="white" />
                        </div>
                        <span className={`text-xl font-bold tracking-tight ${textClass}`}>
                            Rajma<span className="text-red-600">Admin</span>
                        </span>
                    </Link>
                    <button onClick={onClose} className="lg:hidden p-1">
                        <X size={20} className={mutedClass} />
                    </button>
                </div>

                {/* AI Button (Under Construction) */}
                <div className="p-4 pb-0">
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg
                            group relative overflow-hidden text-white"
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                        }}
                        onClick={() => alert('🚧 IA próximamente')}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <BrainCircuit size={20} className="relative z-10" />
                        <span className="relative z-10">Asistente IA</span>
                        <Sparkles size={16} className="absolute top-2 right-2 text-white/50 animate-pulse" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                    ${isActive ? activeClass : `${mutedClass} ${hoverClass}`}
                                `}
                                onClick={onClose}
                            >
                                <Icon size={20} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* KDS Link */}
                <div className="p-4 border-t border-inherit">
                    <Link
                        href="/kds"
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                            ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                    >
                        <LayoutGrid size={20} />
                        Pantalla de Cocina
                    </Link>
                </div>

                {/* Logout */}
                <div className="p-4 pt-0 border-inherit">
                    <button
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                            ${isDark ? 'text-zinc-500 hover:text-red-400' : 'text-gray-500 hover:text-red-600'}`}
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </>
    )
}
