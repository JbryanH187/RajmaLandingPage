
"use client"

import { motion } from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Share2, Download, X } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useCartStore } from "@/lib/store/cart-store"

export function OrderTicket() {
    const { user } = useAuthStore()
    const { items, getCartTotal, isTicketOpen, closeTicket, clearCart } = useCartStore()
    const total = getCartTotal()
    const date = new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    const handleClose = () => {
        closeTicket()
        clearCart()
    }

    if (!isTicketOpen || !user || items.length === 0) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose} // Close on backdrop click
        >
            <motion.div
                initial={{ y: 50, opacity: 0, rotate: -2 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className="w-full max-w-sm relative"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking ticket
            >
                {/* Close Button - Better positioning */}
                <button
                    onClick={handleClose}
                    className="absolute -right-4 -top-4 z-20 p-2 bg-white text-black rounded-full shadow-xl hover:bg-gray-100 transition-transform hover:scale-105 border border-gray-100"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Ticket Container */}
                <div className="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] text-center relative overflow-hidden">

                    {/* Serrated Top */}
                    <div
                        className="absolute top-0 left-0 right-0 h-4 bg-background z-10"
                        style={{
                            background: `
                                linear-gradient(135deg, transparent 50%, #fff 50%),
                                linear-gradient(225deg, transparent 50%, #fff 50%)
                            `,
                            backgroundSize: '20px 20px',
                            backgroundPosition: 'top center',
                            transform: 'rotate(180deg)'
                        }}
                    />

                    {/* Content */}
                    <div className="p-8 pt-10 pb-6 space-y-5">
                        {/* Header - Brand Icon Only */}
                        <div className="space-y-2 flex flex-col items-center">
                            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-3xl mb-2 text-white font-serif shadow-lg">
                                🍣
                            </div>
                            <h2 className="font-serif text-2xl font-bold uppercase tracking-widest text-black">Rajma Sushi</h2>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Orden #Local-{Math.floor(Math.random() * 1000)}</p>
                        </div>

                        <div className="border-t-2 border-dashed border-gray-100 my-4" />

                        {/* Customer Info - Avatar Left of Name */}
                        <div className="flex items-center gap-4 text-left bg-gray-50 p-4 rounded-lg border border-gray-100">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                            ) : (
                                <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center text-lg text-black font-serif">
                                    {user.full_name?.charAt(0) || "R"}
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Cliente</p>
                                <p className="font-bold text-base leading-tight">{user.full_name || user.email}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{date}</p>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 text-left bg-white">
                            {items.map((item) => (
                                <div key={item.cartId} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                                    <div className="pr-4">
                                        <span className="font-bold text-black">{item.quantity}x</span> {item.name}
                                        {item.selectedVariantId && <span className="text-xs text-muted-foreground block pl-5">{item.variants?.find(v => v.id === item.selectedVariantId)?.name}</span>}
                                    </div>
                                    <span className="font-mono text-gray-500 whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t-2 border-black border-dashed my-4" />

                        {/* Total */}
                        <div className="flex justify-between items-center text-xl font-bold">
                            <span>TOTAL</span>
                            <span>{formatCurrency(total)}</span>
                        </div>

                        {/* QR Code */}
                        <div className="flex justify-center py-4 bg-gray-50 rounded-xl mt-4">
                            <QRCodeSVG value={`https://rajma-sushi.vercel.app/order/${user.id}`} size={120} opacity={0.8} />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
                                <Download className="mr-2 h-4 w-4" /> Guardar
                            </Button>
                            <Button
                                className="w-full bg-black hover:bg-black/80 text-white"
                                onClick={handleClose}
                            >
                                <Share2 className="mr-2 h-4 w-4" /> Cerrar
                            </Button>
                        </div>
                    </div>

                    {/* Serrated Bottom */}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-4 bg-transparent z-10"
                        style={{
                            background: `
                                linear-gradient(135deg, transparent 50%, #fff 50%),
                                linear-gradient(225deg, transparent 50%, #fff 50%)
                            `,
                            backgroundSize: '20px 20px',
                            backgroundPosition: 'bottom center'
                        }}
                    />
                </div>
            </motion.div>
        </div>
    )
}
