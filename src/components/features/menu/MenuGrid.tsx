"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X } from "lucide-react"

import { Product } from "@/types"
import { CATEGORIES, PRODUCTS } from "@/lib/data"
import { Input } from "@/components/ui/input"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { CategoryNav } from "./CategoryNav"
import { ProductCard } from "./ProductCard"
import { ProductModal } from "./ProductModal"
import { cn } from "@/lib/utils"

export function MenuGrid() {
    const [activeCategory, setActiveCategory] = React.useState<string>(CATEGORIES[0].id)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
    const [isModalOpen, setIsModalOpen] = React.useState(false)

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product)
        setIsModalOpen(true)
    }

    // Filter Logic
    const filteredProducts = React.useMemo(() => {
        let filtered = PRODUCTS;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.tags?.some(t => t.includes(query))
            );
        } else {
            filtered = filtered.filter(p => p.category === activeCategory);
        }

        return filtered;
    }, [searchQuery, activeCategory]);

    const handleCategorySelect = (id: string) => {
        setActiveCategory(id);
        setSearchQuery("");
    };

    const activeLabel = CATEGORIES.find(c => c.id === activeCategory)?.label || "";

    return (
        <section className="py-24 bg-background min-h-screen" id="menu">
            <div className="container px-4 md:px-8">
                {/* Header with ScrollReveal */}
                <ScrollReveal width="100%" className="text-center mb-16">
                    <h2 className="text-5xl md:text-6xl font-serif text-foreground mb-6">
                        Menú
                    </h2>
                    <p className="text-muted-foreground text-lg md:text-xl font-light max-w-xl mx-auto leading-relaxed">
                        Seleccionamos los ingredientes más frescos para crear una experiencia única en cada bocado.
                    </p>
                </ScrollReveal>

                {/* Filter Bar */}
                <ScrollReveal width="100%" delay={0.1} className="max-w-xl mx-auto mb-16 space-y-8">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar rollos, ingredientes..."
                            className="pl-11 pr-10 h-14 rounded-full border-border/50 bg-secondary/30 focus:bg-background focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-base"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Categories */}
                    <CategoryNav
                        categories={CATEGORIES}
                        activeCategory={searchQuery ? "" : activeCategory}
                        onSelectCategory={handleCategorySelect}
                    />
                </ScrollReveal>

                {/* Status Line */}
                <div className="mb-10 flex items-end justify-between border-b border-border/40 pb-4">
                    <h3 className="text-2xl font-serif text-foreground">
                        {searchQuery ? `Resultados: "${searchQuery}"` : activeLabel}
                    </h3>
                    <span className="text-sm text-muted-foreground font-mono">
                        {filteredProducts.length} OPTIONS
                    </span>
                </div>

                {/* Standard Responsive Grid layout */}
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: index * 0.03 }}
                                    className="h-full"
                                >
                                    <ProductCard
                                        product={product}
                                        isFeatured={false}
                                        onAdd={() => handleProductSelect(product)}
                                        onClick={() => handleProductSelect(product)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-60">
                        <span className="text-6xl mb-6 grayscale">🍱</span>
                        <p className="text-xl font-serif text-foreground">No encontramos esa delicia.</p>
                        <p className="text-sm text-muted-foreground mt-2">Intenta buscar otro ingrediente.</p>
                    </div>
                )}

                <ProductModal
                    product={selectedProduct}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </div>
        </section>
    )
}
