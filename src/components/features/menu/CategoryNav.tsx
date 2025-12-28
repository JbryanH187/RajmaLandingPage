import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Category } from "@/types/product"

interface CategoryNavProps {
    categories: Category[]
    activeCategory: string
    onSelectCategory: (id: string) => void
}

export function CategoryNav({ categories, activeCategory, onSelectCategory }: CategoryNavProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [isAutoScrolling, setIsAutoScrolling] = useState(true)

    // Duplicate categories for seamless loop
    const items = [...categories, ...categories, ...categories, ...categories]

    // Auto-scroll logic
    useEffect(() => {
        const scrollContainer = scrollRef.current
        if (!scrollContainer) return

        let animationFrameId: number

        const loop = () => {
            if (isAutoScrolling && !isDragging && scrollContainer) {
                const speed = 0.5
                // Reset logic for seamless loop
                const singleSetWidth = scrollContainer.scrollWidth / 4

                if (scrollContainer.scrollLeft >= singleSetWidth * 2) {
                    // If too far right, jump back to middle
                    scrollContainer.scrollLeft = singleSetWidth
                } else if (scrollContainer.scrollLeft <= 0) {
                    // If too far left (reverse drag), jump forward
                    scrollContainer.scrollLeft = singleSetWidth
                } else {
                    scrollContainer.scrollLeft += speed
                }
            }
            animationFrameId = requestAnimationFrame(loop)
        }

        animationFrameId = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(animationFrameId)
    }, [isAutoScrolling, isDragging, categories])

    // Drag handlers
    const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true)
        setIsAutoScrolling(false)
        const pageX = 'touches' in e ? e.touches[0].pageX : (e as React.MouseEvent).pageX
        setStartX(pageX - (scrollRef.current?.offsetLeft || 0))
        setScrollLeft(scrollRef.current?.scrollLeft || 0)
    }

    const doDrag = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return
        e.preventDefault()
        const pageX = 'touches' in e ? e.touches[0].pageX : (e as React.MouseEvent).pageX
        const x = pageX - (scrollRef.current?.offsetLeft || 0)
        const walk = (x - startX) * 2 // Scroll-fast
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollLeft - walk
        }
    }

    const endDrag = () => {
        setIsDragging(false)
        setIsAutoScrolling(true)
    }

    return (
        <nav className="relative w-full py-8 group select-none">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            {/* Scrolling Track */}
            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-hidden pb-4 px-4 cursor-grab active:cursor-grabbing"
                onMouseDown={startDrag}
                onMouseLeave={endDrag}
                onMouseUp={endDrag}
                onMouseMove={doDrag}
                onTouchStart={startDrag}
                onTouchEnd={endDrag}
                onTouchMove={doDrag}
            >
                {items.map((category, index) => (
                    <button
                        key={`${category.id}-${index}`}
                        onClick={(e) => {
                            // prevent click if we were dragging
                            if (isDragging) e.preventDefault();
                            else {
                                onSelectCategory(category.id);
                                // Stop auto-scroll on selection if desired, or keep it running? User said "Movement never stops until user selects an option"
                                // Let's stop it to focus on choice
                                setIsAutoScrolling(false);
                            }
                        }}
                        className={cn(
                            "relative px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 transform hover:scale-105 active:scale-95 flex-shrink-0",
                            activeCategory === category.id
                                ? "bg-black text-white shadow-lg"
                                : "bg-gray-100/80 text-gray-500 hover:bg-gray-200 hover:text-black hover:shadow-md"
                        )}
                    >
                        {category.label}
                    </button>
                ))}
            </div>
        </nav>
    )
}
