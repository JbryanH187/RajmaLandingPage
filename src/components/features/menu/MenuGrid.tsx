"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Loader2 } from "lucide-react"

import { Product } from "@/types/product"
import { useMenu } from "@/lib/hooks/useMenu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { CategoryNav } from "./CategoryNav"
import { ProductCard } from "./ProductCard"
import { ProductModal } from "./ProductModal"
import { cn } from "@/lib/utils"

export function MenuGrid() {
    const { categories, products, loading, error } = useMenu()

    // Initialize activeCategory when categories are loaded
    const [activeCategory, setActiveCategory] = React.useState<string>("")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
    const [isModalOpen, setIsModalOpen] = React.useState(false)

    // Set default category when data loads
    React.useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0].id)
        }
    }, [categories, activeCategory])

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product)
        setIsModalOpen(true)
    }

    // Filter Logic
    const filteredProducts = React.useMemo(() => {
        if (!products.length) return [];

        let filtered = products;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.tags?.some(t => t.includes(query))
            );
        } else {
            // Only filter by category if we have an active category and no search query
            if (activeCategory) {
                filtered = filtered.filter(p => p.category === activeCategory);
            }
        }

        return filtered;
    }, [searchQuery, activeCategory, products]);

    const handleCategorySelect = (id: string) => {
        setActiveCategory(id);
        setSearchQuery("");
    };

    const activeLabel = categories.find(c => c.id === activeCategory)?.label || "";

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <span className="text-6xl mb-6 grayscale">🧑‍🍳</span>
                <h3 className="text-2xl font-serif text-foreground mb-2">
                    Estamos mejorando nuestro menú
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                    El menú no está disponible en este momento, estamos trabajando para brindarte el mejor servicio. Por favor vuelve en unos minutos.
                </p>
            </div>
        )
    }

    // Skeleton Loading State
    if (loading) {
        return (
            <section className="py-24 bg-background min-h-screen">
                <div className="container px-4 md:px-8">
                    {/* Header Skeleton */}
                    <div className="flex flex-col items-center mb-16 space-y-4">
                        <Skeleton className="h-16 w-48 rounded-lg" />
                        <Skeleton className="h-6 w-96 max-w-full rounded-md" />
                    </div>

                    {/* Filter & Search Skeleton */}
                    <div className="max-w-xl mx-auto mb-16 space-y-8">
                        <Skeleton className="h-14 w-full rounded-full" />
                        <div className="flex justify-center gap-2 overflow-hidden">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-48 w-full rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )
    }

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
                        categories={categories}
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
