"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function HeaderSimple() {
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-center transition-all duration-500",
                isScrolled
                    ? "bg-background/90 backdrop-blur-xl border-b border-border/50"
                    : "bg-transparent"
            )}
        >
            <div className="container px-6 flex items-center justify-center">
                <Link
                    href="/"
                    className={cn(
                        "text-xl font-semibold tracking-tight transition-colors duration-300",
                        isScrolled ? "text-foreground" : "text-white"
                    )}
                >
                    Rajma
                </Link>
            </div>
        </header>
    )
}
