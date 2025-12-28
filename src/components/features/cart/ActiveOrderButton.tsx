"use client"

import { useCartStore } from "@/lib/store/cart-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Receipt, ShoppingBag } from "lucide-react"
import { useEffect, useState } from "react"

export function ActiveOrderButton() {
    const { user } = useAuthStore()
    const { items, guestOrder, isTicketOpen, openTicket, ticketStatus, setTicketStatus } = useCartStore()
    const [isVisible, setIsVisible] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        // Show if:
        // 1. Ticket is NOT open
        // 2. AND (We have items in cart OR We have a guest/active order receipt)
        const hasItems = items.length > 0
        const hasReceipt = !!guestOrder && ticketStatus === 'receipt'

        if (!isTicketOpen && (hasItems || hasReceipt)) {
            setIsVisible(true)
        } else {
            setIsVisible(false)
        }
    }, [items.length, guestOrder, isTicketOpen, ticketStatus])

    if (pathname?.startsWith('/admin')) return null

    const handleClick = () => {
        // If we have items, we probably want to review them
        if (items.length > 0) {
            if (ticketStatus !== 'review') setTicketStatus('review')
        } else {
            // Otherwise it's a receipt view
            setTicketStatus('receipt')
        }
        openTicket()
    }

    const isReceiptMode = items.length === 0 && !!guestOrder

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClick}
                    className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border flex items-center justify-center group transition-colors ${isReceiptMode ? 'bg-white text-black border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600' : 'bg-primary text-white border-primary pulse-glow'
                        }`}
                >
                    {isReceiptMode ? (
                        <>
                            <div className="absolute inset-0 bg-green-500/10 rounded-full animate-pulse" />
                            <Receipt className="w-6 h-6 relative z-10" />
                        </>
                    ) : (
                        <>
                            <ShoppingBag className="w-6 h-6 relative z-10" />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
                                {items.reduce((acc, item) => acc + item.quantity, 0)}
                            </span>
                        </>
                    )}

                    <span className="absolute right-full mr-3 bg-black text-white text-xs font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {isReceiptMode ? 'Ver Pedido Activo' : 'Ver Carrito'}
                    </span>
                </motion.button>
            )}
        </AnimatePresence>
    )
}
