"use client"

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface OrderTimerProps {
    timestamp: string
    isDone?: boolean
    lateThresholdMinutes?: number
    isDark?: boolean
}

export function OrderTimer({
    timestamp,
    isDone = false,
    lateThresholdMinutes = 15,
    isDark = true
}: OrderTimerProps) {
    const [elapsed, setElapsed] = useState('')
    const [minutes, setMinutes] = useState(0)

    useEffect(() => {
        const updateTimer = () => {
            const start = new Date(timestamp).getTime()
            const now = new Date().getTime()
            const diff = Math.floor((now - start) / 1000)
            const m = Math.floor(diff / 60)
            const s = diff % 60
            setMinutes(m)
            setElapsed(`${m}:${s < 10 ? '0' : ''}${s}`)
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [timestamp])

    const isLate = minutes > lateThresholdMinutes && !isDone

    const getTimerClasses = () => {
        const base = "flex items-center gap-1.5 font-mono text-sm font-bold px-2.5 py-1 rounded-md transition-colors"

        if (isDone) {
            return `${base} ${isDark ? 'text-zinc-500 bg-zinc-800/50' : 'text-gray-400 bg-gray-100'}`
        }

        if (isLate) {
            return `${base} text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 animate-pulse border border-red-200 dark:border-red-900`
        }

        return `${base} ${isDark ? 'text-zinc-300 bg-zinc-800' : 'text-gray-600 bg-gray-100 border border-gray-200'}`
    }

    return (
        <div className={getTimerClasses()}>
            <Clock size={14} />
            <span>{elapsed}</span>
        </div>
    )
}
