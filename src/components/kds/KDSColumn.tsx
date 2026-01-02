"use client"

import { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface KDSColumnProps {
    title: string
    icon: ReactNode
    count: number
    color: 'blue' | 'orange' | 'yellow' | 'green'
    children: ReactNode
    isDone?: boolean
    isDark?: boolean
}

const COLOR_CONFIG = {
    blue: { border: 'border-t-blue-500', text: 'text-blue-500' },
    orange: { border: 'border-t-orange-500', text: 'text-orange-500' },
    yellow: { border: 'border-t-yellow-500', text: 'text-yellow-600' },
    green: { border: 'border-t-green-500', text: 'text-green-600' }
}

export function KDSColumn({
    title,
    icon,
    count,
    children,
    color,
    isDone = false,
    isDark = true
}: KDSColumnProps) {
    const { border, text } = COLOR_CONFIG[color]

    // Theme-aware classes
    const columnBg = isDark ? 'bg-[#09090b]' : 'bg-gray-100'
    const headerBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
    const borderColor = isDark ? 'border-zinc-800/50' : 'border-gray-200'
    const countBg = isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-gray-200 text-gray-600'
    const emptyIcon = isDark ? 'text-zinc-700' : 'text-gray-300'
    const emptyText = isDark ? 'text-zinc-600' : 'text-gray-400'

    return (
        <div className={`
            flex flex-col h-full rounded-xl border 
            ${borderColor} ${columnBg}
            ${isDone ? 'opacity-75' : ''}
        `}>
            {/* Header */}
            <div className={`
                p-4 border-b rounded-t-xl border-t-[3px]
                ${headerBg} ${border}
            `}>
                <div className="flex items-center justify-between mb-1">
                    <div className={`flex items-center gap-2 font-bold uppercase tracking-wider text-sm ${text}`}>
                        {icon}
                        {title}
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${countBg}`}>
                        {count}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 custom-scroll">
                {children}

                {count === 0 && (
                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center">
                        <Inbox className={`h-12 w-12 mb-3 ${emptyIcon}`} />
                        <span className={`text-sm font-medium ${emptyText}`}>Sin órdenes</span>
                    </div>
                )}
            </div>
        </div>
    )
}
