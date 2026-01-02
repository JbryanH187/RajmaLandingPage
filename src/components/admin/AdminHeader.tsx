"use client"

import { useState, useEffect } from 'react'
import { Menu, Search, Sun, Moon, RefreshCw, Bell } from 'lucide-react'
import { useTheme } from '@/lib/hooks/useTheme'

interface AdminHeaderProps {
    onToggleSidebar: () => void
    onRefresh?: () => void
    isRefreshing?: boolean
    stats?: {
        active?: number
        kitchen?: number
        delivery?: number
    }
}

export function AdminHeader({
    onToggleSidebar,
    onRefresh,
    isRefreshing = false,
    stats
}: AdminHeaderProps) {
    const [currentTime, setCurrentTime] = useState(new Date())
    const { isDark, toggleTheme } = useTheme()

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const bgClass = isDark ? 'bg-[#09090b]/80 border-zinc-800' : 'bg-white/80 border-gray-200'
    const textClass = isDark ? 'text-white' : 'text-gray-900'
    const mutedClass = isDark ? 'text-zinc-400' : 'text-gray-500'
    const inputBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-100 border-gray-200'

    return (
        <header className={`h-16 border-b flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-30 ${bgClass}`}>

            <div className="flex items-center gap-4">
                {/* Mobile menu toggle */}
                <button
                    onClick={onToggleSidebar}
                    className={`lg:hidden p-2 rounded-md ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                >
                    <Menu size={20} className={mutedClass} />
                </button>

                {/* Search */}
                <div className={`hidden md:flex items-center px-3 py-1.5 rounded-full border ${inputBg}`}>
                    <Search size={14} className={mutedClass} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className={`bg-transparent border-none outline-none text-sm ml-2 w-48 ${textClass} placeholder:${mutedClass}`}
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Stats (if provided) */}
                {stats && (
                    <div className="hidden xl:flex gap-8 mr-4">
                        {stats.active !== undefined && (
                            <>
                                <div className="flex flex-col items-center">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${mutedClass}`}>Activas</span>
                                    <span className={`text-xl font-bold leading-none ${textClass}`}>{stats.active}</span>
                                </div>
                                <div className={`w-px h-8 ${isDark ? 'bg-zinc-700' : 'bg-gray-300'}`}></div>
                            </>
                        )}
                        {stats.kitchen !== undefined && (
                            <>
                                <div className="flex flex-col items-center">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${mutedClass}`}>Cocina</span>
                                    <span className="text-xl font-bold leading-none text-orange-500">{stats.kitchen}</span>
                                </div>
                                <div className={`w-px h-8 ${isDark ? 'bg-zinc-700' : 'bg-gray-300'}`}></div>
                            </>
                        )}
                        {stats.delivery !== undefined && (
                            <div className="flex flex-col items-center">
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${mutedClass}`}>Reparto</span>
                                <span className="text-xl font-bold leading-none text-yellow-500">{stats.delivery}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Notifications */}
                <button
                    className={`relative p-2 rounded-full transition-all ${isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                >
                    <Bell size={18} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Refresh button */}
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className={`p-2 rounded-full transition-all ${isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        title="Actualizar"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                )}

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-full transition-all ${isDark
                            ? 'bg-zinc-800 text-yellow-400 hover:bg-zinc-700'
                            : 'bg-gray-100 text-zinc-600 hover:bg-gray-200'
                        }`}
                    title={isDark ? "Modo Claro" : "Modo Oscuro"}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Clock */}
                <div className="text-right hidden sm:block">
                    <div className={`text-lg font-mono font-bold leading-tight ${textClass}`}>
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={`text-[10px] uppercase tracking-widest font-semibold ${mutedClass}`}>
                        {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>
        </header>
    )
}
