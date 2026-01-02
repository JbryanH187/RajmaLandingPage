"use client"

import { Truck, ShoppingBag, MapPin } from 'lucide-react'

type OrderType = 'delivery' | 'pickup' | 'dine-in'

interface StatusBadgeProps {
    type: OrderType
    isDark?: boolean
}

const config = {
    'delivery': {
        icon: Truck,
        label: 'Reparto'
    },
    'pickup': {
        icon: ShoppingBag,
        label: 'Recoger'
    },
    'dine-in': {
        icon: MapPin,
        label: 'Mesa'
    }
}

export function StatusBadge({ type, isDark = true }: StatusBadgeProps) {
    const { icon: Icon, label } = config[type] || config['pickup']

    const badgeClass = isDark
        ? 'text-zinc-400 border-zinc-700 bg-zinc-800/50'
        : 'text-gray-500 border-gray-200 bg-white shadow-sm'

    return (
        <span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold 
            border px-2 py-0.5 rounded-full ${badgeClass}`}>
            <Icon size={12} />
            {label}
        </span>
    )
}
