"use client"

import { useState, useEffect } from 'react'
import { Menu, Search, Sun, Moon, RefreshCw } from 'lucide-react'

interface KDSHeaderProps {
    stats: {
        active: number
        kitchen: number
        delivery: number
    }
    onRefresh?: () => void
    onToggleSidebar?: () => void
    isRefreshing?: boolean
}

export function KDSHeader({
    stats,
    onRefresh,
    onToggleSidebar,
    isRefreshing = false
}: KDSHeaderProps) {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isDark, setIsDark] = useState(true)

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <header className="h-16 border-b flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-30
            bg-[#09090b]/80 border-zinc-800">

            <div className="flex items-center gap-4">
                {/* Mobile menu toggle */}
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 rounded-md hover:bg-zinc-800"
                >
                    <Menu size={20} className="text-zinc-400" />
                </button>

                {/* Search */}
                <div className="hidden md:flex items-center px-3 py-1.5 rounded-full border bg-zinc-900 border-zinc-800">
                    <Search size={14} className="text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Buscar orden #..."
                        className="bg-transparent border-none outline-none text-sm ml-2 w-48 text-white placeholder:text-zinc-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Stats */}
                <div className="hidden xl:flex gap-8 mr-4">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Activas</span>
                        <span className="text-xl font-bold leading-none text-white">{stats.active}</span>
                    </div>
                    <div className="w-px h-8 bg-zinc-700"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Cocina</span>
                        <span className="text-xl font-bold leading-none text-orange-500">{stats.kitchen}</span>
                    </div>
                    <div className="w-px h-8 bg-zinc-700"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Reparto</span>
                        <span className="text-xl font-bold leading-none text-yellow-500">{stats.delivery}</span>
                    </div>
                </div>

                {/* Refresh button */}
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="p-2 rounded-full transition-all bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                        title="Actualizar"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                )}

                {/* Theme toggle */}
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-2 rounded-full transition-all bg-zinc-800 text-yellow-400 hover:bg-zinc-700"
                    title={isDark ? "Modo Claro" : "Modo Oscuro"}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Clock */}
                <div className="text-right hidden sm:block">
                    <div className="text-lg font-mono font-bold leading-tight text-white">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400">
                        {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>
        </header>
    )
}
