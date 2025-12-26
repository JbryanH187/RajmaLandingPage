"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"

import { Product } from "@/types"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ProductCardProps {
    product: Product
    isFeatured?: boolean
    onAdd?: () => void
    onClick?: () => void
}

export function ProductCard({ product, isFeatured = false, onAdd, onClick }: ProductCardProps) {
    return (
        <motion.article
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
                "group cursor-pointer relative flex flex-col bg-white dark:bg-card rounded-[24px] border border-border/50 shadow-sm hover:shadow-card-hover transition-all duration-300 overflow-hidden",
                isFeatured ? "aspect-[4/3] md:aspect-auto ring-1 ring-border" : "aspect-[3/4] hover:ring-1 hover:ring-border"
            )}
            onClick={onClick}
        >
            {/* Image Container */}
            <div className={cn(
                "relative w-full overflow-hidden bg-secondary/30",
                isFeatured ? "flex-1 min-h-[60%]" : "flex-1 min-h-[65%]"
            )}>
                {product.image ? (
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        sizes={isFeatured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl opacity-20">🍤</span>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Actions */}
                <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Button
                        size="icon"
                        className="h-12 w-12 rounded-full bg-white text-black hover:bg-white hover:scale-110 shadow-xl border-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd?.();
                        }}
                    >
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Content info */}
            <div className="p-5 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-4">
                    <h3 className={cn(
                        "font-serif text-foreground group-hover:text-primary transition-colors leading-tight",
                        isFeatured ? "text-2xl font-bold" : "text-lg font-medium"
                    )}>
                        {product.name}
                    </h3>
                    <span className="font-mono text-base font-medium text-foreground/80 bg-secondary/50 px-2 py-1 rounded-md">
                        {formatCurrency(product.price)}
                    </span>
                </div>

                {(product.description || isFeatured) && (
                    <p className={cn(
                        "text-muted-foreground line-clamp-2",
                        isFeatured ? "text-base" : "text-sm"
                    )}>
                        {product.description}
                    </p>
                )}

                {/* Tags */}
                <div className="flex gap-2 mt-auto pt-2">
                    {product.tags?.map(tag => (
                        <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-primary/80 border border-primary/20 px-2 py-1 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </motion.article>
    )
}
