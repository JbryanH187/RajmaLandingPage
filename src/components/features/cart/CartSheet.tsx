"use client"

import * as React from "react"
import Image from "next/image"
import { ShoppingCart, Trash2, Phone, ShoppingBag, Pencil, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useCartStore } from "@/lib/store/cart-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { formatCurrency, cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { GuestWarningModal } from "./GuestWarningModal"
import { Textarea } from "@/components/ui/textarea"
import { usePathname } from "next/navigation"

export function CartSheet() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)
    const [showGuestModal, setShowGuestModal] = React.useState(false)

    const { items, removeItem, updateQuantity, getCartTotal, getItemCount, openTicket, clearCart, updateNotes, guestOrder, setTicketStatus } = useCartStore()
    const { user, openAuthModal } = useAuthStore()
    const itemCount = getItemCount()
    const total = getCartTotal()

    // Local state for editing notes
    const [editingItemId, setEditingItemId] = React.useState<string | null>(null)
    const [tempNote, setTempNote] = React.useState("")

    const startEditing = (itemId: string, currentNote: string) => {
        setEditingItemId(itemId)
        setTempNote(currentNote || "")
    }

    const saveNote = (itemId: string) => {
        updateNotes(itemId, tempNote)
        setEditingItemId(null)
    }

    const cancelEdit = () => {
        setEditingItemId(null)
        setTempNote("")
    }

    if (pathname?.startsWith('/admin')) return null

    const handleCheckout = () => {
        setIsOpen(false) // Close Cart Sheet
        openTicket()     // Open Ticket
    }

    const handleConfirmGuest = () => {
        setShowGuestModal(false)
        setIsOpen(false) // Close Cart Sheet
        openTicket()     // Open Ticket directly
    }

    return (
        <>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <div className="hidden" />
                </SheetTrigger>
                <SheetContent className="flex flex-col w-full sm:max-w-md rounded-l-[24px] border-l-0 shadow-2xl">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                            <ShoppingBag className="h-6 w-6" />
                            Tu Pedido
                        </SheetTitle>
                        <SheetDescription>
                            Revisa tus platillos antes de realizar tu pedido.
                        </SheetDescription>
                    </SheetHeader>

                    <ScrollArea className="flex-1 -mx-6 px-6 my-4 pr-4">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-50">
                                <ShoppingBag className="h-16 w-16" />
                                <p>Tu carrito está vacío.<br />¡Agrega unos sushis deliciosos!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {items.map((item) => (
                                    <div key={item.cartId} className="flex gap-4 group">
                                        {/* Simple Image or Placeholder */}
                                        <div className="h-16 w-16 bg-secondary/20 rounded-xl flex-shrink-0 overflow-hidden relative">
                                            {item.image && (
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold line-clamp-1">{item.name}</h4>
                                                <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                                            </div>

                                            {item.selectedVariantId && (
                                                <p className="text-xs text-muted-foreground">
                                                    {item.variants?.find(v => v.id === item.selectedVariantId)?.name}
                                                </p>
                                            )}

                                            {/* Notes Section with Edit Logic */}
                                            {editingItemId === item.cartId ? (
                                                <div className="mt-2 space-y-2">
                                                    <Textarea
                                                        value={tempNote}
                                                        onChange={(e) => setTempNote(e.target.value)}
                                                        className="min-h-[60px] text-xs bg-white resize-none border-black/20 focus-visible:ring-black"
                                                        placeholder="Instrucciones especiales (sin cebolla, etc.)"
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-6 w-6 p-0 rounded-full hover:bg-neutral-100">
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                        <Button size="sm" onClick={() => saveNote(item.cartId)} className="h-6 w-6 p-0 rounded-full bg-black text-white hover:bg-black/90">
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative group/notes">
                                                    {item.notes ? (
                                                        <div
                                                            onClick={() => startEditing(item.cartId, item.notes || "")}
                                                            className="bg-secondary/30 p-1.5 rounded-lg text-xs italic text-muted-foreground mt-1 cursor-pointer hover:bg-secondary/50 transition-colors flex justify-between items-start"
                                                        >
                                                            <span>"{item.notes}"</span>
                                                            <Pencil className="h-3 w-3 opacity-50 text-black ml-2 shrink-0 mt-0.5" />
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => startEditing(item.cartId, "")}
                                                            className="text-xs text-black/70 hover:text-black mt-2 flex items-center gap-1 transition-colors font-medium"
                                                        >
                                                            <Pencil className="h-3 w-3" /> Agregar nota
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2 bg-secondary/30 rounded-full px-1.5 h-7">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => updateQuantity(item.cartId, item.quantity - 1)}>
                                                        -
                                                    </Button>
                                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => updateQuantity(item.cartId, item.quantity + 1)}>
                                                        +
                                                    </Button>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-black hover:bg-secondary/50" onClick={() => startEditing(item.cartId, item.notes || "")}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.cartId)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <SheetFooter className="block sm:flex-col sm:space-y-2 mt-auto">
                        <div className="space-y-4">
                            <Separator />
                            <div className="flex justify-between text-xl font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>

                            {user ? (
                                <Button
                                    className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
                                    disabled={items.length === 0}
                                    onClick={handleCheckout}
                                >
                                    Realizar Pedido
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <Button
                                        className="w-full h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90 text-white"
                                        disabled={items.length === 0}
                                        onClick={() => {
                                            setIsOpen(false)
                                            openAuthModal()
                                        }}
                                    >
                                        Iniciar Sesión para Pedir
                                    </Button>
                                    <button
                                        onClick={() => setShowGuestModal(true)}
                                        className="w-full text-sm text-muted-foreground hover:text-black underline underline-offset-4 transition-colors p-2"
                                    >
                                        Continuar como invitado
                                    </button>
                                </div>
                            )}
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
            <GuestWarningModal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
                onConfirmGuest={handleConfirmGuest}
                onLogin={() => {
                    setShowGuestModal(false)
                    openAuthModal()
                }}
            />
        </>
    )
}
