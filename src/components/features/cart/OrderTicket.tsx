"use client"

import { motion, AnimatePresence } from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Share2, Download, X, Send, Copy, Check, Bike, Store, Pencil, Trash2 } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useCartStore } from "@/lib/store/cart-store"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { OrderService } from "@/lib/services/order-service"
import { RestaurantService } from "@/lib/services/restaurant-service"
import { toast } from "sonner"

import { ActiveOrderModal } from "./ActiveOrderModal"
import { GuestWarningModal } from "./GuestWarningModal" // New Import
// import { useRealtimeOrder } from "@/lib/hooks/useRealtimeOrder" // REMOVED: Unused

import { usePathname } from "next/navigation"

export function OrderTicket() {
    const pathname = usePathname()
    const { user, openAuthModal } = useAuthStore() // Destructure openAuthModal for modal

    // ENABLE REALTIME UPDATES DIRECTLY IN TICKET
    // This ensures that even if the active order button is hidden/unmounted, 
    // the ticket itself keeps the connection alive.
    // REMOVED IN FAVOR OF GLOBAL TRACKER
    // useRealtimeOrder()

    // ... existing ...


    const {
        items,
        getCartTotal,
        isTicketOpen,
        openTicket,   // Added missing destructure
        closeTicket,
        clearCart,
        // Global state for persistence
        ticketStatus,
        setTicketStatus,
        setGuestOrder,
        guestOrder,
        orderType,
        setOrderType,
        updateNotes, // NEW
        removeItem,   // NEW
        setHasUnreadUpdate
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
    const [showGuestModal, setShowGuestModal] = useState(false) // Guest Warning Modal State

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
    // FIX: If we are in 'receipt' mode, we MUST show the guestOrder (historical) items, ignoring the current cart!
    // Priority: Receipt Mode -> guestOrder; Review/Processing -> items

    // If ticketStatus is receipt, try guestOrder items first. If null (shouldn't be), fall back to items if user wants to see what they tried to add? No, receipt means receipt.
    const isReceiptMode = ticketStatus === 'receipt'

    const displayItems = isReceiptMode
        ? (guestOrder?.items || [])
        : (items.length > 0 ? items : (guestOrder?.items || []))

    const displayTotal = isReceiptMode
        ? (guestOrder?.total || 0)
        : (items.length > 0 ? total : (guestOrder?.total || 0))

    const displayOrderType = (isReceiptMode && guestOrder) ? guestOrder.orderType : orderType

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
                const status = await RestaurantService.getStatus(controller.signal)
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

    // --- HYDRATION FIX FOR LOGGED-IN USERS ---
    // If we are in 'receipt' mode, and user is logged in, but we have no 'guestOrder' (local state),
    // we must fetch it from the DB to show the receipt!
    useEffect(() => {
        const controller = new AbortController()

        const hydrateReceipt = async () => {
            if (ticketStatus === 'receipt' && user && !guestOrder) {
                console.log("Hydrating active order receipt for user...")
                setIsSubmitting(true)
                try {
                    const activeOrder = await OrderService.getActiveOrderDetails(user.id, controller.signal) as any
                    if (!controller.signal.aborted && activeOrder) {
                        // Transform to GuestOrder format
                        setGuestOrder({
                            orderId: activeOrder.id,
                            orderNumber: activeOrder.order_number,
                            status: activeOrder.status, // Hydrate Status
                            name: activeOrder.guest_name || user.full_name || 'Usuario',
                            email: activeOrder.guest_email || user.email || '',
                            phone: activeOrder.guest_phone || user.phone || '',
                            address: activeOrder.delivery_address || '',
                            orderType: activeOrder.order_type as 'delivery' | 'pickup',
                            total: Number(activeOrder.total),
                            date: new Date(activeOrder.created_at).toLocaleDateString(),
                            isGuest: false,
                            items: activeOrder.order_items.map((item: any) => ({
                                cartId: item.id, // Use DB id as cartId
                                id: item.product_id,
                                name: item.products?.name || 'Producto',
                                price: Number(item.unit_price),
                                quantity: item.quantity,
                                notes: item.notes,
                                selectedVariantId: item.variant_id,
                                variants: item.product_variants ? [item.product_variants] : [] // Mock structure if needed
                            }))
                        })
                    } else if (activeOrder === null) {
                        console.warn("No active order found for hydration")
                    }
                } catch (err: any) {
                    if (err.name !== 'AbortError') {
                        console.error("Failed to hydrate receipt", err)
                    }
                } finally {
                    if (!controller.signal.aborted) {
                        setIsSubmitting(false)
                    }
                }
            } else {
                // Nothing to hydrate or requirements not met, ensure loading is off if we turned it on?
                // But we only turn it on INSIDE the if block.
            }
        }

        if (isTicketOpen && ticketStatus === 'receipt') {
            hydrateReceipt()
        } else {
            // Safety fallback: if we are NOT hydrating (e.g. switching modes), ensure loading is off?
            // No, because submitting might be happening.
        }

        return () => {
            controller.abort()
        }
    }, [ticketStatus, user, guestOrder, isTicketOpen, setGuestOrder])

    const [deliveryInstructions, setDeliveryInstructions] = useState('')

    // ... existing confirm logic ...

    const onConfirmMock = () => {
        if (!user) {
            setShowGuestModal(true)
        } else {
            handleConfirm()
        }
    }

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
            // Check Local Storage (Guest)
            // STRICT BLOCK: If guestOrder exists, they cannot place a new one.
            if (guestOrder) {
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
            // Even for logged-in users, we set this so the "Receipt View" has data to show immediately!
            setGuestOrder({
                name: guestName || user?.full_name || (isDemoUser ? 'Usuario Demo' : 'Usuario'),
                address: orderType === 'delivery' ? (guestAddress || user?.default_address || '') : '',
                items: items,
                total: total,
                date: date,
                orderType: orderType,
                email: guestEmail || user?.email || (isDemoUser ? 'demo@rajmasushi.com' : ''),
                phone: guestPhone || user?.phone || (isDemoUser ? '0000000000' : ''),
                orderId: result.orderId || undefined,
                orderNumber: result.orderNumber || undefined,
                status: 'pending', // Default status for new orders
                isGuest: !user // Flag to distinguish if needed
            })

            // Clear the working cart items so ActiveOrderButton knows we are in 'receipt' mode
            clearCart()

            // SUCCESS: Now we trigger the "Fly Away" animation
            setTicketStatus('processing')

            // Simulate small delay for UX if needed, or just switch
            setTimeout(() => {
                setTicketStatus('receipt')
                setIsSubmitting(false)
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
                toast.error("Error al procesar la orden", {
                    description: "No se pudo completar el pedido. Por favor intenta nuevamente o contacta al restaurante.",
                    duration: 5000,
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

        // Logic: If the order is 'delivered' (or cancelled), and the user closes the ticket,
        // we assume they are done with this active session. We clear the guestOrder
        // so the floating button disappears.
        if (guestOrder?.status === 'delivered' || guestOrder?.status === 'cancelled') {
            setGuestOrder(null)
            setHasUnreadUpdate(false)
            clearCart() // Ensure cart is empty too
        } else if (ticketStatus === 'receipt') {
            // Normal receipt close (not delivered yet), just clear current working items
            clearCart()
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
                                    onConfirm={onConfirmMock}
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
                                    updateNotes={updateNotes} // NEW
                                    removeItem={removeItem}   // NEW
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
                                    setGuestName={setGuestName}
                                    setGuestAddress={setGuestAddress}
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
                            openTicket() // Fix: Actually open the ticket!
                        }}
                    />
                    <GuestWarningModal
                        isOpen={showGuestModal}
                        onClose={() => setShowGuestModal(false)}
                        onConfirmGuest={() => {
                            setShowGuestModal(false)
                            handleConfirm()
                        }}
                        onLogin={() => {
                            setShowGuestModal(false)
                            openAuthModal()
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

interface TicketContentProps {
    user: any
    guestName: string
    setGuestName: (val: string) => void
    guestAddress: string
    setGuestAddress: (val: string) => void
    items: any[]
    total: number
    date: string
    onConfirm?: () => void
    onClose: () => void
    isReceipt: boolean
    orderType: 'delivery' | 'pickup'
    setOrderType?: (type: 'delivery' | 'pickup') => void
    guestEmail?: string
    setGuestEmail?: (val: string) => void
    guestPhone?: string
    setGuestPhone?: (val: string) => void
    guestOrder?: any
    isSubmitting?: boolean
    deliveryInstructions?: string
    setDeliveryInstructions?: (val: string) => void
    restaurantStatus?: { isOpen: boolean; message: string | null }
    updateNotes?: (id: string, note: string) => void
    removeItem?: (id: string) => void
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
    restaurantStatus,
    updateNotes, // NEW
    removeItem   // NEW
}: TicketContentProps) {
    const [copied, setCopied] = useState(false)

    // Local state for editing notes inside the ticket
    const [editingItemId, setEditingItemId] = useState<string | null>(null)
    const [tempNote, setTempNote] = useState("")

    const startEditing = (itemId: string, currentNote: string) => {
        setEditingItemId(itemId)
        setTempNote(currentNote || "")
    }

    const saveNote = (itemId: string) => {
        updateNotes?.(itemId, tempNote)
        setEditingItemId(null)
    }

    const cancelEdit = () => {
        setEditingItemId(null)
        setTempNote("")
    }

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

    // Status Helper
    const getStatusInfo = (status?: string) => {
        if (!status) return null

        switch (status) { // Normalize status check just in case
            case 'pending':
                return { label: 'Validando Orden', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' }
            case 'confirmed':
                return { label: 'Confirmada', color: 'bg-blue-50 text-blue-700 border-blue-200' }
            case 'preparing':
                return { label: 'Preparando', color: 'bg-orange-50 text-orange-700 border-orange-200' }
            case 'out_for_delivery':
                return { label: 'En Camino', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
            case 'ready_for_pickup': // Just in case
                return { label: 'Listo para Recoger', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
            case 'delivered':
                return { label: 'Entregado', color: 'bg-green-50 text-green-700 border-green-200' }
            case 'cancelled':
                return { label: 'Cancelada', color: 'bg-red-50 text-red-700 border-red-200' }
            default:
                return { label: 'Procesando...', color: 'bg-gray-50 text-gray-600 border-gray-200' }
        }
    }

    const itemStatus = getStatusInfo(guestOrder?.status || (isReceipt ? 'pending' : undefined))

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

                        {/* STATUS BADGE - ONLY IN RECEIPT MODE */}
                        {isReceipt && itemStatus && (
                            <div className={`mt-2 px-6 py-2 rounded-full text-xs font-bold border ${itemStatus.color} shadow-sm animate-in fade-in zoom-in duration-500 tracking-wider`}>
                                {itemStatus.label}
                            </div>
                        )}
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
                                onClick={() => setOrderType && setOrderType('delivery')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${orderType === 'delivery' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Bike className="w-4 h-4" /> Domicilio
                            </button>
                            <button
                                onClick={() => setOrderType && setOrderType('pickup')}
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
                                    onChange={(e) => setGuestPhone && setGuestPhone(e.target.value)}
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
                                                onChange={(e) => setDeliveryInstructions && setDeliveryInstructions(e.target.value)}
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
                    <div className="space-y-3 text-left pb-4 px-2">
                        {items.map((item: any) => (
                            <div key={item.cartId} className="group flex justify-between items-start text-sm p-4 bg-gray-50/50 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors relative shadow-sm">
                                <div className="flex gap-4 pr-4 flex-1 items-center">
                                    {/* Quantity Badge */}
                                    <div className="w-8 h-8 flex items-center justify-center bg-white text-black text-sm font-bold rounded-full shrink-0 shadow-sm border border-gray-100">
                                        {item.quantity}
                                    </div>

                                    {/* Item Details */}
                                    <div className="space-y-0.5 text-left flex-1">
                                        <p className="font-bold text-gray-900 leading-tight text-base">
                                            {item.name}
                                        </p>
                                        {item.selectedVariantId && (
                                            <div className="flex items-center text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5" />
                                                {item.variants?.find((v: any) => v.id === item.selectedVariantId)?.name}
                                            </div>
                                        )}

                                        {/* NOTES EDITING UI (Review Mode Only) */}
                                        {!isReceipt && (
                                            <div className="mt-1">
                                                {editingItemId === item.cartId ? (
                                                    <div className="space-y-2 mt-1">
                                                        <Textarea
                                                            value={tempNote}
                                                            onChange={(e) => setTempNote(e.target.value)}
                                                            className="min-h-[50px] text-xs bg-white resize-none border-gray-300 focus-visible:ring-black"
                                                            placeholder="Notas..."
                                                            autoFocus
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); cancelEdit(); }} className="h-6 w-6 p-0 rounded-full hover:bg-neutral-100">
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                            <Button size="sm" onClick={(e) => { e.stopPropagation(); saveNote(item.cartId); }} className="h-6 w-6 p-0 rounded-full bg-black text-white hover:bg-black/90">
                                                                <Check className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="group/notes cursor-pointer"
                                                        onClick={(e) => { e.stopPropagation(); startEditing(item.cartId, item.notes || ""); }}
                                                    >
                                                        {item.notes ? (
                                                            <div className="flex items-start gap-1 text-xs italic text-gray-500 bg-gray-50 p-1 rounded hover:bg-gray-100 transition-colors">
                                                                <span>"{item.notes}"</span>
                                                                <Pencil className="h-3 w-3 opacity-50 text-black shrink-0 mt-0.5" />
                                                            </div>
                                                        ) : (
                                                            <button
                                                                className="text-[10px] text-black/60 hover:text-black mt-1 flex items-center gap-1 transition-colors font-medium opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Pencil className="h-3 w-3" /> Agregar nota
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {isReceipt && item.notes && (
                                            <div className="text-xs italic text-gray-400 mt-0.5">"{item.notes}"</div>
                                        )}
                                    </div>
                                </div>

                                {/* Price & Delete */}
                                <div className="flex flex-col items-end gap-1">
                                    <span className="font-mono font-medium text-gray-900 whitespace-nowrap pt-0.5 pl-4">
                                        {formatCurrency(item.price * item.quantity)}
                                    </span>

                                    {!isReceipt && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeItem && removeItem(item.cartId); }}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar platillo"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
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
