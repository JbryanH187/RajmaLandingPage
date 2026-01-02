"use client"

import { useState, useEffect } from 'react'
import {
    Flame, Truck, CheckCircle, MoreVertical, AlertCircle,
    MessageSquare, Sparkles, Loader2
} from 'lucide-react'
import { OrderTimer } from './OrderTimer'
import { StatusBadge } from './StatusBadge'
import type { Order } from '@/types/orders'

interface OrderCardProps {
    order: Order
    onAdvance?: (orderId: string, currentStatus: string) => void
    onReject?: (orderId: string) => void
    onAIMessage?: (order: Order) => void
    isDark?: boolean
}

const STATUS_COLORS: Record<string, string> = {
    'pending': 'bg-blue-500',
    'confirmed': 'bg-orange-500',
    'preparing': 'bg-orange-500',
    'ready': 'bg-yellow-500',
    'out_for_delivery': 'bg-yellow-500',
    'delivering': 'bg-yellow-500',
    'delivered': 'bg-green-500',
    'completed': 'bg-green-500',
    'cancelled': 'bg-gray-500'
}

const ACTION_CONFIG: Record<string, { text: string; icon: any }> = {
    'pending': { text: 'Confirmar', icon: Flame },
    'confirmed': { text: 'Preparando', icon: Flame },
    'preparing': { text: 'Lista', icon: CheckCircle },
    'ready': { text: 'Despachar', icon: Truck },
    'out_for_delivery': { text: 'Entregada', icon: CheckCircle },
    'delivering': { text: 'Entregada', icon: CheckCircle }
}

export function OrderCard({ order, onAdvance, onReject, onAIMessage, isDark = true }: OrderCardProps) {
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => setMounted(true), [])

    const statusId = order.order_status?.id || order.status
    const action = ACTION_CONFIG[statusId]
    const hasNotes = order.order_items?.some(item => item.notes)
    const isCompleted = ['delivered', 'completed', 'cancelled'].includes(statusId)

    const handleAdvance = async () => {
        if (!onAdvance) return
        setLoading(true)
        try {
            await onAdvance(order.id, statusId)
        } finally {
            setLoading(false)
        }
    }

    // Theme-aware classes
    const cardBg = isDark
        ? 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
        : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
    const titleText = isDark ? 'text-white' : 'text-gray-900'
    const mutedText = isDark ? 'text-zinc-400' : 'text-gray-500'
    const itemText = isDark ? 'text-zinc-300' : 'text-gray-700'
    const borderColor = isDark ? 'border-zinc-800' : 'border-gray-100'
    const noteBg = isDark ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50 border-red-200'
    const noteText = isDark ? 'text-red-200' : 'text-red-700'
    const cancelBtnClass = isDark
        ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'
    const aiBtnClass = isDark
        ? 'bg-zinc-900 border-zinc-700 text-purple-400 hover:bg-purple-900/30 hover:border-purple-500'
        : 'bg-white border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300'
    const completedBg = isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-gray-50 border-gray-100'

    return (
        <div
            className={`
                group relative w-full mb-4 rounded-xl border transition-all duration-300 ease-out overflow-hidden
                ${cardBg} ${isDark ? 'text-zinc-100' : 'text-gray-900'}
                ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                ${order.is_delayed ? 'ring-2 ring-red-500/50' : ''}
            `}
        >
            {/* Status color bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${STATUS_COLORS[statusId] || 'bg-gray-500'}`} />

            {/* Header */}
            <div className="p-4 pb-3 flex justify-between items-start pl-5">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <h3 className={`text-lg font-bold tracking-tight ${titleText}`}>
                            #{order.order_number}
                        </h3>
                        <StatusBadge type={order.order_type} isDark={isDark} />
                        {order.is_delayed && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-red-500 text-white rounded">
                                Retrasado
                            </span>
                        )}
                    </div>
                    <p className={`text-sm font-medium ${mutedText}`}>
                        {order.display_name || order.guest_name || 'Cliente'}
                    </p>
                </div>
                <OrderTimer
                    timestamp={order.created_at}
                    isDone={isCompleted}
                    isDark={isDark}
                />
            </div>

            {/* Items */}
            <div className={`px-4 py-3 border-t pl-5 space-y-2.5 ${borderColor} ${!isDark ? 'bg-gray-50/50' : ''}`}>
                {order.order_items?.slice(0, 5).map((item) => (
                    <div
                        key={item.id}
                        className="flex justify-between items-start text-sm group-hover:translate-x-1 transition-transform duration-300"
                    >
                        <div className="flex gap-2.5 items-start">
                            <span className="font-bold text-red-600 min-w-[20px]">{item.quantity}x</span>
                            <span className={itemText}>{item.product?.name || 'Producto'}</span>
                        </div>
                    </div>
                ))}

                {/* Notes warning */}
                {hasNotes && (
                    <div className={`mt-3 p-2.5 rounded-lg border flex gap-2 items-start ${noteBg}`}>
                        <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <p className={`text-xs italic font-medium ${noteText}`}>
                            {order.order_items?.filter(i => i.notes).map(i => `${i.product?.name}: ${i.notes}`).join(', ')}
                        </p>
                    </div>
                )}

                {/* Order notes */}
                {order.notes && (
                    <div className={`mt-2 p-2.5 rounded-lg border flex gap-2 items-start ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-100 border-gray-200'}`}>
                        <AlertCircle size={14} className={`mt-0.5 shrink-0 ${mutedText}`} />
                        <p className={`text-xs italic font-medium ${mutedText}`}>
                            {order.notes}
                        </p>
                    </div>
                )}
            </div>

            {/* Actions */}
            {!isCompleted && action && (
                <div className="p-3 pl-5 grid grid-cols-6 gap-2">
                    {/* Cancel button (only for pending) */}
                    {statusId === 'pending' && onReject && (
                        <button
                            onClick={() => onReject(order.id)}
                            className={`col-span-1 flex items-center justify-center rounded-lg transition-colors ${cancelBtnClass}`}
                            title="Cancelar Orden"
                        >
                            <MoreVertical size={18} />
                        </button>
                    )}

                    {/* AI Message button */}
                    <button
                        onClick={() => onAIMessage?.(order)}
                        className={`col-span-1 flex items-center justify-center rounded-lg transition-all border ${aiBtnClass}`}
                        title="✨ Generar Mensaje IA (Próximamente)"
                    >
                        <MessageSquare size={18} />
                        <Sparkles size={10} className="-ml-1 -mt-2" />
                    </button>

                    {/* Main action button */}
                    <button
                        onClick={handleAdvance}
                        disabled={loading}
                        className={`
                            ${statusId === 'pending' ? 'col-span-4' : 'col-span-5'}
                            flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm uppercase tracking-wide
                            text-white shadow-lg active:scale-[0.98] transition-all
                            bg-red-600 hover:bg-red-700 disabled:opacity-50
                        `}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <>
                                {action.text}
                                <action.icon size={16} />
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Completed state */}
            {isCompleted && (
                <div className={`p-2 flex justify-center border-t ${completedBg}`}>
                    <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${statusId === 'cancelled' ? 'text-red-500' : 'text-green-600'
                        }`}>
                        <CheckCircle size={14} />
                        {statusId === 'cancelled' ? 'Cancelado' : 'Completado'}
                    </span>
                </div>
            )}
        </div>
    )
}

// Re-export Order type for convenience
export type { Order }
