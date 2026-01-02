"use client"

import { useState, ReactNode } from 'react'
import { AdminSidebar } from './AdminSidebarNew'
import { AdminHeader } from './AdminHeader'
import { useTheme } from '@/lib/hooks/useTheme'

interface AdminShellProps {
    children: ReactNode
    stats?: {
        active?: number
        kitchen?: number
        delivery?: number
    }
    onRefresh?: () => void
    isRefreshing?: boolean
}

export function AdminShell({ children, stats, onRefresh, isRefreshing }: AdminShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { isDark } = useTheme()

    const bgClass = isDark ? 'bg-black' : 'bg-gray-50'
    const textClass = isDark ? 'text-white' : 'text-gray-900'

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${bgClass} ${textClass}`}>
            <AdminSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <AdminHeader
                    onToggleSidebar={() => setSidebarOpen(true)}
                    stats={stats}
                    onRefresh={onRefresh}
                    isRefreshing={isRefreshing}
                />

                <main className="flex-1 overflow-auto p-6 custom-scroll">
                    {children}
                </main>
            </div>
        </div>
    )
}
