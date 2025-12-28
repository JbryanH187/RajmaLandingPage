"use client"

import { motion, AnimatePresence } from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Share2, Download, X, Send, Copy, Check, Bike, Store } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useCartStore } from "@/lib/store/cart-store"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { OrderService } from "@/lib/services/order-service"
import { RestaurantService } from "@/lib/services/restaurant-service"
import { toast } from "sonner"

import { ActiveOrderModal } from "./ActiveOrderModal"

import { usePathname } from "next/navigation"

export function OrderTicket() {
    const pathname = usePathname()
    const { user } = useAuthStore()

    const {
        items,
        getCartTotal,
        isTicketOpen,
        closeTicket,
        clearCart,
        // Global state for persistence
        ticketStatus,
        setTicketStatus,
        setGuestOrder,
        guestOrder,
        orderType,
        setOrderType
    } = useCartStore()

    // Check conditional here after hooks
    // if (pathname?.startsWith('/admin')) return null // MOVED DOWN


    // Local state for inputs (will be synced to store on confirm)
    const [guestName, setGuestName] = useState('')
    const [guestAddress, setGuestAddress] = useState('')
    const [guestEmail, setGuestEmail] = useState('')
    const [guestPhone, setGuestPhone] = useState('')

    // Active Order Modal State
    const [isActiveOrderModalOpen, setIsActiveOrderModalOpen] = useState(false)

    // Reset/Restore inputs logic
    useEffect(() => {
        if (isTicketOpen) {
            // ONLY restore if we are in processing or receipt mode (viewing an active/past order)
            if (ticketStatus === 'processing' || ticketStatus === 'receipt') {
                if (!user && guestOrder) {
                    setGuestName(guestOrder.name)
                    setGuestAddress(guestOrder.address)
                    setGuestEmail(guestOrder.email || '')
                    setGuestPhone(guestOrder.phone || '')
                }
            } else {
                // In 'review' mode for a NEW order:
                // If user is logged in, auto-fill from their profile!
                if (user) {
                    if (user.default_address) setGuestAddress(user.default_address)
                    if (user.phone) setGuestPhone(user.phone)
                }
            }
        }
    }, [isTicketOpen, ticketStatus, user, guestOrder])

    const total = getCartTotal()

    // Logic for display items/total depending on status
    // If receipt & empty cart (e.g. refreshed), use stored guestOrder
    const displayItems = (items.length > 0 ? items : guestOrder?.items) || []
    const displayTotal = (items.length > 0 ? total : guestOrder?.total) || 0
    const displayOrderType = (ticketStatus === 'receipt' && guestOrder) ? guestOrder.orderType : orderType

    const date = new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    // ... inside OrderTicket component

    // Local loading state for the request
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Restaurant Status Check
    const [restaurantStatus, setRestaurantStatus] = useState<any>({ isOpen: true, message: null })

    // Status polling (Safe)
    useEffect(() => {
        const controller = new AbortController()
        let timeoutId: NodeJS.Timeout

        const checkStatus = async () => {
            if (controller.signal.aborted) return

            try {
                const status = await RestaurantService.getStatus()
                if (!controller.signal.aborted) {
                    setRestaurantStatus(status)
                }
            } catch (err) {
                console.error("Status check failed", err)
            } finally {
                if (!controller.signal.aborted) {
                    timeoutId = setTimeout(checkStatus, 60000)
                }
            }
        }

        checkStatus()

        return () => {
            controller.abort()
            clearTimeout(timeoutId)
        }
    }, [])

    const [deliveryInstructions, setDeliveryInstructions] = useState('')

    // ... existing confirm logic ...

    const handleConfirm = async () => {
        // Block if closed
        if (!restaurantStatus.isOpen) {
            toast.error("Restaurante Cerrado", {
                description: restaurantStatus.message || "Lo sentimos, estamos cerrados en este momento."
            })
            return
        }

        // 1. CHECK ACTIVE ORDER
        if (user) {
            // Check Database for Auth User
            const hasActive = await OrderService.hasActiveOrder(user.id)
            if (hasActive) {
                setIsActiveOrderModalOpen(true)
                return
            }
        } else {
            // Check Local Storage (Guest)
            // If we have a guestOrder stored AND it's recent (e.g. within 2 hours? or just exists and status is receipt/processing)
            // Actually, simply checking if `guestOrder` exists and ticketStatus is NOT review might be enough if we persisted correctly.
            // But let's check date? For now, if `guestOrder` exists, we assume active.
            // BUT: User might want to clear it?
            // Let's assume if it exists, they have one.
            if (guestOrder && ticketStatus !== 'review') {
                // Simple freshness check: if order is older than 24h, ignore it.
                const orderDate = new Date(guestOrder.date); // This might be a string format, careful
                // Let's just use existence for now.
                setIsActiveOrderModalOpen(true)
                return
            }
        }

        console.log("🚀 handleConfirm TRIGGERED")
        // ... validation ...
        if (!user && !guestName.trim()) return
        if (!user && !guestPhone.trim()) return
        if (!user && orderType === 'delivery' && !guestAddress.trim()) return

        setIsSubmitting(true)

        try {
            const isDemoUser = user?.id === 'demo-user'
            const effectiveUser = isDemoUser ? null : user

            const result = await OrderService.createOrder({
                userId: effectiveUser?.id,
                items: items,
                total: total,
                orderType: orderType,
                guestName: effectiveUser ? undefined : (guestName || user?.full_name || 'Usuario Demo'),
                guestEmail: effectiveUser ? undefined : (guestEmail || user?.email || 'demo@rajmasushi.com'),
                guestPhone: effectiveUser ? undefined : (guestPhone || user?.phone || '0000000000'),
                guestAddress: orderType === 'delivery' ? (guestAddress || (isDemoUser ? 'Dirección Demo 123' : undefined)) : undefined,
                deliveryInstructions: deliveryInstructions // Pass new field
            })

            // Save Guest Order to Store (Local Persistence)
            if (!effectiveUser) {
                setGuestOrder({
                    name: guestName || (isDemoUser ? 'Usuario Demo' : ''),
                    address: orderType === 'delivery' ? guestAddress : '',
                    items: items,
                    total: total,
                    date: date,
                    orderType: orderType,
                    email: guestEmail || (isDemoUser ? 'demo@rajmasushi.com' : ''),
                    phone: guestPhone || (isDemoUser ? '0000000000' : ''),
                    orderId: result.orderId,
                    orderNumber: result.orderNumber
                })
            }

            // SUCCESS: Now we trigger the "Fly Away" animation
            setTicketStatus('processing')

            // Simulate small delay for UX if needed, or just switch
            setTimeout(() => {
                setTicketStatus('receipt')
                // Show success toast
                toast.success("¡Orden creada con éxito!", {
                    description: "Tu pedido ha sido recibido y se está procesando.",
                    duration: 5000,
                })
            }, 800)

        } catch (error: any) {
            console.error("Order failed", error)

            // Do NOT change ticketStatus, just stop loading.
            setIsSubmitting(false)

            // Handle RLS Policy Error (42501) specifically to help the user
            if (error?.code === '42501') {
                toast.error("Error de Sistema (Base de Datos)", {
                    description: "No se tiene permiso para crear la orden. Es probable que falte ejecutar la migración SQL 'migration_guest_orders.sql' en Supabase.",
                    duration: 8000,
                })
            } else {
                toast.error("Error al crear la orden", {
                    description: "Hubo un problema al procesar tu pedido. Inténtalo de nuevo.",
                })
            }
        }
    }

    const handleClose = () => {
        closeTicket()
        // We do NOT clear cart automatically if it's a guest receipt?
        // Actually, logic was: Receipt -> Close -> Clear.
        // But if we want persistence, we keep 'guestOrder'.
        // We WILL clear the *Cart Items* from the working cart, but keep 'guestOrder' for history.

        if (ticketStatus === 'receipt') {
            clearCart()
            // Do NOT clear inputs yet, so if they reopen it might be there?
            // Actually, if we clear items, isTicketOpen checks items.length.
            // We changed the check to `if (!isTicketOpen ...)` but `items.length` check was there.
            // We need to allow opening ticket if `guestOrder` exists even if `items` is empty!
        }
    }

    // Animation variants
    const wrapperVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    }

    const ticketVariants = {
        enter: { y: 100, opacity: 0, rotate: -2 },
        center: { y: 0, opacity: 1, rotate: 0 },
        exit: {
            scaleY: [1, 0.1, 0.1],
            x: [0, 0, 400],
            opacity: [1, 1, 0],
            rotate: [0, 0, 10],
            transition: { duration: 0.8, times: [0, 0.4, 1] }
        },
        receiptEnter: { y: -100, opacity: 0, rotate: 0 },
    }

    // Allow rendering if open OR if we have a persisted guest order we want to view?
    // Actually `isTicketOpen` controls visibility.
    // If `items` is empty BUT we have `guestOrder` and status is receipt, we should show it.
    const showTicket = isTicketOpen && (items.length > 0 || (ticketStatus === 'receipt' && guestOrder))

    // ---------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------

    // Hook Rule Check: Must remain at the top level, but after all hooks?
    // Actually, React triggers re-renders. If hooks change order/count it breaks.
    // If we return null here, it's fine AS LONG AS all hooks above ran.

    // Ensure all useEffects/useStates are above this line.
    if (pathname?.startsWith('/admin')) return null

    if (!showTicket) return null

    // Helper for input disabled state

    return (
        <AnimatePresence>
            {showTicket && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    variants={wrapperVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={handleClose}
                >
                    <AnimatePresence mode="wait">
                        {ticketStatus === 'review' && (
                            <motion.div
                                key="review-ticket"
                                variants={ticketVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="w-full max-w-sm relative"
                                onClick={(e) => e.stopPropagation()}
                                style={{ transformOrigin: "center" }}
                            >
                                <TicketContent
                                    user={user}
                                    guestName={guestName}
                                    setGuestName={setGuestName}
                                    guestAddress={guestAddress}
                                    setGuestAddress={setGuestAddress}
                                    items={displayItems}
                                    total={displayTotal}
                                    date={date}
                                    onConfirm={handleConfirm}
                                    onClose={handleClose}
                                    isReceipt={false}
                                    orderType={orderType}
                                    setOrderType={setOrderType}
                                    guestEmail={guestEmail}
                                    setGuestEmail={setGuestEmail}
                                    guestPhone={guestPhone}
                                    setGuestPhone={setGuestPhone}
                                    isSubmitting={isSubmitting} // Pass loading state
                                    deliveryInstructions={deliveryInstructions}
                                    setDeliveryInstructions={setDeliveryInstructions}
                                    restaurantStatus={restaurantStatus}
                                />
                            </motion.div>
                        )}

                        {ticketStatus === 'receipt' && (
                            <motion.div
                                key="receipt-ticket"
                                variants={ticketVariants}
                                initial="receiptEnter"
                                animate="center"
                                transition={{ type: "spring", bounce: 0.2, damping: 20 }}
                                className="w-full max-w-sm relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <TicketContent
                                    user={user}
                                    guestName={guestName}
                                    guestAddress={guestAddress} // Pass address for display
                                    items={displayItems}
                                    total={displayTotal}
                                    date={date}
                                    onClose={handleClose}
                                    isReceipt={true}
                                    orderType={displayOrderType}
                                    guestOrder={guestOrder} // Pass guestOrder explicitly for QR code access
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <ActiveOrderModal
                        isOpen={isActiveOrderModalOpen}
                        onClose={() => setIsActiveOrderModalOpen(false)}
                        onViewOrder={() => {
                            setIsActiveOrderModalOpen(false)
                            setTicketStatus('receipt')
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function TicketContent({
    user,
    guestName,
    setGuestName,
    guestAddress,
    setGuestAddress,
    items,
    total,
    date,
    onConfirm,
    onClose,
    isReceipt,
    orderType,
    setOrderType,
    guestEmail,
    setGuestEmail,
    guestPhone,
    setGuestPhone,
    guestOrder, // Receive new prop

    isSubmitting = false, // Default to false
    deliveryInstructions,
    setDeliveryInstructions,
    restaurantStatus
}: any) {
    const [copied, setCopied] = useState(false)

    const displayName = user?.full_name || user?.email || guestName || "Invitado"
    const displayAvatar = user?.avatar_url
    const displayInitial = displayName.charAt(0)
    // Use stored address or user metadata if available
    const displayAddress = guestAddress

    const handleCopy = () => {
        const typeText = orderType === 'pickup' ? 'Pick Up (Recoger)' : 'Domicilio';
        const addressText = orderType === 'delivery' && displayAddress ? `\nDirección: ${displayAddress}` : '';
        const orderText = `*Orden Rajma Sushi*\nTipo: ${typeText}\nCliente: ${displayName}${addressText}\nTotal: ${formatCurrency(total)}\n\nItems:\n${items.map((i: any) => `- ${i.quantity}x ${i.name} ${i.selectedVariantId ? `(${i.variants?.find((v: any) => v.id === i.selectedVariantId)?.name})` : ''}`).join('\n')}`

        navigator.clipboard.writeText(orderText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <>
            {!isReceipt && (
                <button
                    onClick={onClose}
                    className="absolute -right-4 -top-4 z-20 p-2 bg-white text-black rounded-full shadow-xl hover:bg-gray-100 transition-transform hover:scale-105 border border-gray-100"
                >
                    <X className="h-5 w-5" />
                </button>
            )}

            <div className={`bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] text-center relative overflow-hidden transition-colors duration-500 ${isReceipt ? 'bg-zinc-50' : 'bg-white'} flex flex-col max-h-[85vh]`}>

                {isReceipt && (
                    <div className="absolute top-0 left-0 right-0 bg-green-500/10 py-1 z-20">
                        <p className="text-xs font-bold text-green-700 tracking-widest uppercase">Orden Confirmada</p>
                    </div>
                )}

                {isReceipt && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none z-0 transform -rotate-12 scale-150">
                        {orderType === 'pickup' ? <Store className="w-64 h-64 text-red-600" strokeWidth={1} /> : <Bike className="w-64 h-64 text-red-600" strokeWidth={1} />}
                    </div>
                )}

                {/* Jagged Edge Top */}
                <div
                    className="absolute top-0 left-0 right-0 h-4 bg-transparent z-10 shrink-0"
                    style={{
                        background: `
                            linear-gradient(135deg, transparent 50%, #fff 50%),
                            linear-gradient(225deg, transparent 50%, #fff 50%)
                        `,
                        backgroundSize: '20px 20px',
                        backgroundPosition: 'top center',
                        transform: 'rotate(180deg)',
                        marginTop: isReceipt ? '20px' : '0'
                    }}
                />

                {/* SCROLLABLE CONTENT AREA */}
                <div className={`p-8 pt-10 pb-0 space-y-5 ${isReceipt ? 'opacity-90' : ''} relative z-10 flex-1 overflow-y-auto min-h-0`}>
                    <div className="space-y-2 flex flex-col items-center shrink-0">
                        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-3xl mb-2 text-white font-serif shadow-lg">
                            {orderType === 'pickup' ? '🥡' : '🛵'}
                        </div>
                        <h2 className="font-serif text-2xl font-bold uppercase tracking-widest text-black">Rajma Sushi</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                            {isReceipt ? 'Comprobante' : 'Revisar Orden'} #Local-884
                        </p>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-100 my-4 shrink-0" />

                    {/* Closed Warning */}
                    {!restaurantStatus?.isOpen && !isReceipt && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-center shrink-0">
                            <p className="text-red-800 font-bold text-sm">⛔ Restaurante Cerrado</p>
                            <p className="text-red-600 text-xs mt-1">{restaurantStatus?.message}</p>
                        </div>
                    )}

                    {/* Order Type Toggle (Only in Review) */}
                    {!isReceipt && (
                        <div className="flex bg-gray-100 p-1 rounded-xl mb-4 shrink-0">
                            <button
                                onClick={() => setOrderType('delivery')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${orderType === 'delivery' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Bike className="w-4 h-4" /> Domicilio
                            </button>
                            <button
                                onClick={() => setOrderType('pickup')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${orderType === 'pickup' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Store className="w-4 h-4" /> Pasar a Recoger
                            </button>
                        </div>
                    )}

                    {/* Customer Info */}
                    <div className="flex flex-col gap-3 text-left bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm shrink-0">
                        <div className="flex items-center gap-4">
                            {displayAvatar ? (
                                <img src={displayAvatar} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex-shrink-0" />
                            ) : (
                                <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center text-lg text-black font-serif flex-shrink-0">
                                    {displayInitial}
                                </div>
                            )}
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Cliente</p>

                                {!user && !isReceipt ? (
                                    <Input
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="Tu nombre..."
                                        className="h-7 text-base font-bold p-0 border-0 border-b border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-black bg-transparent placeholder:text-gray-300 placeholder:font-normal"
                                        autoFocus
                                    />
                                ) : (
                                    <p className="font-bold text-base leading-tight truncate">{displayName}</p>
                                )}

                                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{date}</p>
                            </div>
                        </div>

                        {/* Guest Contact Info (Phone Only) */}
                        {!user && !isReceipt && (
                            <div className="w-full">
                                <Input
                                    value={guestPhone}
                                    onChange={(e) => setGuestPhone(e.target.value)}
                                    placeholder="Teléfono (Para confirmar orden)"
                                    type="tel"
                                    className="h-8 text-xs bg-white"
                                />
                            </div>
                        )}

                        {/* Address/Pickup Section */}
                        <div className="w-full">
                            {/* REVIEW MODE */}
                            {!isReceipt && (
                                <>
                                    {orderType === 'delivery' ? (
                                        <>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Dirección de Entrega</p>
                                            <Textarea
                                                value={guestAddress}
                                                onChange={(e) => setGuestAddress(e.target.value)}
                                                placeholder="Calle, número, colonia..."
                                                className="min-h-[60px] text-sm p-2 bg-white border-gray-200 resize-none focus-visible:ring-black mb-2"
                                            />
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Instrucciones de Entrega</p>
                                            <Input
                                                value={deliveryInstructions}
                                                onChange={(e) => setDeliveryInstructions(e.target.value)}
                                                placeholder="Ej: Casa azul, timbre 2..."
                                                className="h-8 text-xs bg-white border-gray-200"
                                            />
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-3 bg-white border border-dashed border-gray-200 rounded-xl text-center">
                                            <Store className="w-5 h-5 text-gray-400 mb-1" />
                                            <p className="text-xs font-bold text-gray-800">Recoger en Restaurante</p>
                                            <p className="text-[10px] text-gray-500">Blvd. Example #123, Col. Centro</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* RECEIPT MODE */}
                            {isReceipt && (
                                <div className="mt-1 pt-2 border-t border-gray-100">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                        {orderType === 'pickup' ? 'Método de Entrega' : 'Dirección'}
                                    </p>
                                    {orderType === 'pickup' ? (
                                        <p className="text-xs font-medium leading-normal text-gray-700">
                                            Pasar a Recoger (Pick Up)
                                        </p>
                                    ) : (
                                        <p className="text-xs font-medium leading-normal text-gray-700 line-clamp-2">
                                            {displayAddress || "Sin dirección registrada"}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ITEMS LIST (Scrolls within this container if needed, but simplified to scroll whole upper area) */}
                    <div className="space-y-2 text-left bg-white pb-4">
                        {items.map((item: any) => (
                            <div key={item.cartId} className="group flex justify-between items-start text-sm py-3 border-b border-gray-100 border-dashed last:border-0 hover:bg-gray-50/50 transition-colors">
                                <div className="flex gap-3 pr-4">
                                    {/* Quantity Badge */}
                                    <div className="w-6 h-6 flex items-center justify-center bg-gray-100 text-black text-xs font-bold rounded-md shrink-0 mt-0.5 shadow-sm border border-gray-200">
                                        {item.quantity}
                                    </div>

                                    {/* Item Details */}
                                    <div className="space-y-0.5 text-left">
                                        <p className="font-bold text-gray-900 leading-tight">
                                            {item.name}
                                        </p>
                                        {item.selectedVariantId && (
                                            <div className="flex items-center text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5" />
                                                {item.variants?.find((v: any) => v.id === item.selectedVariantId)?.name}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                <span className="font-mono font-medium text-gray-900 whitespace-nowrap pt-0.5 pl-4">
                                    {formatCurrency(item.price * item.quantity)}
                                </span>
                            </div>
                        ))}
                    </div>
                    {/* ... existing content ... */}
                </div>

                {/* PINNED FOOTER (Total + Action Buttons) */}
                <div className={`p-8 pt-4 pb-6 bg-white relative z-20 shrink-0 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.05)]`}>
                    <div className="border-t-2 border-black border-dashed mb-4" />

                    <div className="flex justify-between items-center text-xl font-bold mb-4">
                        <span>TOTAL</span>
                        <span>{formatCurrency(total)}</span>
                    </div>

                    {isReceipt ? (
                        <>
                            <div className="flex justify-center py-4 bg-gray-50 rounded-xl mb-4 relative overflow-hidden">
                                {(user || guestOrder?.orderId) ? (
                                    <QRCodeSVG
                                        value={`${typeof window !== 'undefined' ? window.location.origin : 'https://rajma-sushi.vercel.app'}/order/${user ? user.id : guestOrder?.orderId}`}
                                        size={100}
                                        opacity={0.8}
                                    />
                                ) : (
                                    <div className="text-xs text-muted-foreground text-center p-4 border border-dashed rounded-lg">
                                        Pedido de Invitado<br />(Guardado en dispositivo)
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="w-full border-gray-200 text-gray-700 hover:border-red-600 hover:text-red-600 hover:bg-red-50 transition-all"
                                    onClick={handleCopy}
                                >
                                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                    {copied ? 'Copiado' : 'Copiar'}
                                </Button>
                                <Button
                                    className="w-full bg-black hover:bg-black/80 text-white"
                                    onClick={onClose}
                                >
                                    <X className="mr-2 h-4 w-4" /> Cerrar
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <Button
                                className="w-full bg-black hover:bg-red-600 text-white h-12 text-lg font-bold shadow-lg shadow-black/20 hover:shadow-red-900/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={onConfirm}
                                disabled={isSubmitting || (!user && (!guestName?.trim() || !guestPhone?.trim() || (orderType === 'delivery' && !guestAddress?.trim())))}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Enviando...
                                    </div>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-5 w-5" /> Confirmar Orden
                                    </>
                                )}
                            </Button>
                            <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:bg-transparent" onClick={onClose} disabled={isSubmitting}>
                                Cancelar y seguir comprando
                            </Button>
                        </div>
                    )}
                </div>

                {/* Jagged Edge Bottom */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-4 bg-transparent z-10 shrink-0"
                    style={{
                        background: `
                            linear-gradient(135deg, transparent 50%, #fff 50%),
                            linear-gradient(225deg, transparent 50%, #fff 50%)
                        `,
                        backgroundSize: '20px 20px',
                        backgroundPosition: 'bottom center'
                    }}
                />

                {/* Active Order Modal Integration - Passed from Parent or Handled here? 
                   Actually, TicketContent receives props. Let's assume parent handles modal visibility logic/state 
                   or we inject it here. For simplicity, let's keep modal at parent (OrderTicket) and pass handler down?
                   Wait, OrderTicket (parent) holds the state.
               */}
            </div >
        </>
    )
}
