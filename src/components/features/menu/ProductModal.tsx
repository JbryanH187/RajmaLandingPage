"use client"

import * as React from "react"
import Image from "next/image"
import { Minus, Plus, ShoppingBag, X } from "lucide-react"

import { Product } from "@/types"
import { useCartStore } from "@/lib/store/cart-store"
import { formatCurrency } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface ProductModalProps {
    product: Product | null
    isOpen: boolean
    onClose: () => void
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
    const [quantity, setQuantity] = React.useState(1)
    const [notes, setNotes] = React.useState("")
    const [selectedVariantId, setSelectedVariantId] = React.useState<string>("")

    const addItem = useCartStore((state) => state.addItem)

    // Reset state when product opens
    React.useEffect(() => {
        if (isOpen && product) {
            setQuantity(1)
            setNotes("")
            setSelectedVariantId(product.variants?.[0]?.id || "")
        }
    }, [isOpen, product])

    if (!product) return null

    // Calculate price based on variant
    const currentPrice = selectedVariantId
        ? product.variants?.find(v => v.id === selectedVariantId)?.price || product.price
        : product.price

    const totalPrice = currentPrice * quantity

    const handleAddToCart = () => {
        addItem(product, quantity, selectedVariantId || undefined, notes)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden gap-0 border-0 rounded-[24px] bg-card shadow-2xl">
                {/* Cover Image */}
                <div className="relative aspect-[16/10] w-full bg-secondary/10">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 450px) 100vw, 450px"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                            <span className="text-6xl">🍣</span>
                        </div>
                    )}
                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 rounded-full bg-black/40 text-white hover:bg-black/60 h-8 w-8"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    {/* Price badge */}
                    <div className="absolute bottom-3 left-3">
                        <Badge className="bg-white/90 backdrop-blur-sm text-primary font-bold text-base px-3 py-1 border-0">
                            {formatCurrency(currentPrice)}
                        </Badge>
                    </div>
                </div>

                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Header */}
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-2xl font-bold text-foreground">
                            {product.name}
                        </DialogTitle>
                        {product.description && (
                            <DialogDescription className="text-muted-foreground mt-2 leading-relaxed">
                                {product.description}
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    {/* Variants Selection */}
                    {product.variants && product.variants.length > 0 && (
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-foreground">Elige tu opción:</Label>
                            <RadioGroup value={selectedVariantId} onValueChange={setSelectedVariantId}>
                                {product.variants.map((v) => (
                                    <div
                                        key={v.id}
                                        className="flex items-center space-x-3 border border-border/50 rounded-xl p-3 cursor-pointer hover:bg-secondary/30 hover:border-primary/30 transition-all"
                                    >
                                        <RadioGroupItem value={v.id} id={v.id} />
                                        <Label htmlFor={v.id} className="flex-1 cursor-pointer font-medium flex justify-between">
                                            <span>{v.name}</span>
                                            <span className="text-primary font-bold">{formatCurrency(v.price)}</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    )}

                    {/* Notes Input */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-semibold text-foreground">
                            Notas de cocina (opcional):
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Sin cebolla, salsa aparte, etc..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none rounded-xl bg-secondary/20 border-transparent focus:border-primary min-h-[80px]"
                        />
                    </div>

                    {/* Quantity & Add Action */}
                    <div className="flex flex-col gap-4 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">Cantidad</span>
                            <div className="flex items-center gap-3 bg-secondary/30 rounded-full px-1 py-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-white"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-bold w-6 text-center text-lg">{quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-white"
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <Button
                            className="w-full rounded-xl h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-lg"
                            onClick={handleAddToCart}
                        >
                            <ShoppingBag className="mr-2 h-5 w-5" />
                            Agregar al carrito • {formatCurrency(totalPrice)}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
