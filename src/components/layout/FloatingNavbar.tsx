"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { cn } from "@/lib/utils"
import { ShoppingBag } from "lucide-react"

export function FloatingNavbar() {
    const { scrollY } = useScroll()
    const [hidden, setHidden] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0
        if (latest > previous && latest > 150) {
            setHidden(true)
        } else {
            setHidden(false)
        }
        setScrolled(latest > 50)
    })

    if (!mounted) return null

    return (
        <motion.header
            variants={{
                visible: { y: 0, opacity: 1 },
                hidden: { y: -100, opacity: 0 }
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none"
        >
            <div
                className={cn(
                    "pointer-events-auto flex items-center justify-between gap-8 px-6 py-3 rounded-full transition-all duration-500",
                    scrolled
                        ? "bg-white/70 backdrop-blur-2xl shadow-lg border border-white/20"
                        : "bg-transparent border border-transparent"
                )}
            >
                {/* Logo */}
                <Link
                    href="/"
                    className={cn(
                        "font-serif text-xl font-bold tracking-tight transition-colors",
                        scrolled ? "text-foreground" : "text-white"
                    )}
                >
                    Rajma
                </Link>

                {/* Nav Links (Desktop) */}
                <nav className="hidden md:flex items-center gap-6">
                    {["Menú", "Nosotros", "Ubicación"].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className={cn(
                                "text-sm font-medium transition-colors hover:opacity-100",
                                scrolled ? "text-foreground/70 hover:text-foreground" : "text-white/80 hover:text-white"
                            )}
                        >
                            {item}
                        </a>
                    ))}
                </nav>

                {/* Right Action (Cart or CTA) */}
                <div className="flex items-center gap-2">
                    <button
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            scrolled ? "hover:bg-black/5 text-foreground" : "hover:bg-white/10 text-white"
                        )}
                    >
                        <ShoppingBag className="h-5 w-5" />
                    </button>
                    <a
                        href="#menu"
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                            scrolled
                                ? "bg-foreground text-background hover:bg-foreground/90"
                                : "bg-white text-black hover:bg-white/90"
                        )}
                    >
                        Ordenar
                    </a>
                </div>
            </div>
        </motion.header>
    )
}
