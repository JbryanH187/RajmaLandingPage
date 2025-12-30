"use client"

import { useCartStore } from "@/lib/store/cart-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Receipt, ShoppingBag } from "lucide-react"
import { useEffect, useState } from "react"

import { useRealtimeOrder } from "@/lib/hooks/useRealtimeOrder"

export function ActiveOrderButton() {
    const { user } = useAuthStore()
    const { items, guestOrder, isTicketOpen, openTicket, ticketStatus, setTicketStatus, hasUnreadUpdate, setHasUnreadUpdate } = useCartStore()
    const [isVisible, setIsVisible] = useState(false)
    const pathname = usePathname()


    // Realtime Hook MOVED TO GLOBAL COMPONENT
    // useRealtimeOrder()

    useEffect(() => {
        // Show if:
        // 1. Ticket is NOT open
        // 2. AND (We have items in cart OR We have a guest/active order)
        const hasItems = items.length > 0
        // Relaxed check: logic changed to show if guestOrder exists, regardless of current 'receipt' status flag
        // This ensures if they refresh and status resets, button still appears if data is there.
        const hasActiveGuestOrder = !!guestOrder

        if (!isTicketOpen && (hasItems || hasActiveGuestOrder)) {
            setIsVisible(true)
        } else {
            setIsVisible(false)
        }
    }, [items.length, guestOrder, isTicketOpen])

    if (pathname?.startsWith('/admin')) return null

    const handleClick = () => {
        // PRIORITIZE ACTIVE GUEST ORDER
        // If we have a guest active order, ALWAYS show receipt/tracking, ignore drafts.
        if (guestOrder) {
            setHasUnreadUpdate(false) // Clear notification
            setTicketStatus('receipt')
            openTicket()
            return
        }

        // Normal flow
        if (items.length > 0) {
            if (ticketStatus !== 'review') setTicketStatus('review')
        } else {
            // Otherwise it's a receipt view (for history/empty state?)
            setTicketStatus('receipt')
        }
        openTicket()
    }

    const isReceiptMode = items.length === 0 && !!guestOrder

    return (
        <AnimatePresence>
            {/* 1. ACTIVE ORDER BUTTON (Only if guestOrder exists) */}
            {guestOrder && !isTicketOpen && (
                <motion.button
                    key="active-order-btn"
                    initial={{ scale: 0, opacity: 0, y: 0 }}
                    animate={{ scale: 1, opacity: 1, y: items.length > 0 ? -80 : 0 }} // Move up if cart button also exists
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClick} // Use handler to clear notification
                    className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border flex items-center justify-center group transition-colors bg-white text-black border-gray-200 ${hasUnreadUpdate ? 'animate-bounce border-yellow-400 shadow-yellow-200 ring-2 ring-yellow-400 ring-offset-2' : 'hover:bg-red-600 hover:text-white hover:border-red-600'}`}
                >
                    <div className={`absolute inset-0 rounded-full animate-pulse ${hasUnreadUpdate ? 'bg-yellow-400/30' : 'bg-green-500/10'}`} />
                    <Receipt className="w-6 h-6 relative z-10" />
                    {hasUnreadUpdate && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                        </span>
                    )}
                    <span className="absolute right-full mr-3 bg-black text-white text-xs font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {hasUnreadUpdate ? '¡Actualización de Orden!' : 'Ver Pedido Activo'}
                    </span>
                </motion.button>
            )}

            {/* 2. CART BUTTON (Only if items exist) */}
            {items.length > 0 && !isTicketOpen && (
                <motion.button
                    key="cart-btn"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        setTicketStatus('review')
                        openTicket()
                    }}
                    className="fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border flex items-center justify-center group transition-colors bg-primary text-white border-primary pulse-glow"
                >
                    <ShoppingBag className="w-6 h-6 relative z-10" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
                        {items.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                    <span className="absolute right-full mr-3 bg-black text-white text-xs font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Ver Carrito
                    </span>
                </motion.button>
            )}
        </AnimatePresence>
    )
}
