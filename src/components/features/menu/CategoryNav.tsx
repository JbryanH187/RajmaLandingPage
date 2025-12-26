"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Category } from "@/types"

interface CategoryNavProps {
    categories: Category[]
    activeCategory: string
    onSelectCategory: (id: string) => void
}

export function CategoryNav({ categories, activeCategory, onSelectCategory }: CategoryNavProps) {
    return (
        <nav className="flex justify-center py-8">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => onSelectCategory(category.id)}
                        className={cn(
                            "relative px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                            activeCategory === category.id
                                ? "bg-foreground text-background"
                                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        {category.label}
                    </button>
                ))}
            </div>
        </nav>
    )
}
