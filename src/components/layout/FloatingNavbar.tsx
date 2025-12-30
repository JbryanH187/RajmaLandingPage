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
                        scrolled ? "text-foreground" : "text-black"
                    )}
                >
                    Rajma
                </Link>

                {/* Nav Links (Desktop) */}
                <nav className="hidden md:flex items-center gap-6">
                    {["Menú", "Nosotros", "Ubicación"].map((item) => {
                        const scrollToId = item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        return (
                            <a
                                key={item}
                                href={`#${scrollToId}`}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:opacity-100",
                                    scrolled ? "text-foreground/70 hover:text-foreground" : "text-black/70 hover:text-black"
                                )}
                                onClick={(e) => {
                                    e.preventDefault()
                                    const element = document.getElementById(scrollToId)
                                    element?.scrollIntoView({ behavior: "smooth" })
                                }}
                            >
                                {item}
                            </a>
                        )
                    })}
                </nav>

                {/* Right Action (Cart or CTA) */}
                <div className="flex items-center gap-3">


                    <AuthButton scrolled={scrolled} />
                </div>
            </div>
        </motion.header >
    )
}

import { User } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useAuth } from "@/lib/hooks/use-auth"

function AuthButton({ scrolled }: { scrolled: boolean }) {
    const { user, openAuthModal } = useAuthStore()
    const { signOut } = useAuth()

    return (
        <>
            <style jsx global>{`
                @property --shimmer-angle {
                    syntax: '<angle>';
                    initial-value: 0deg;
                    inherits: false;
                }
                @keyframes shimmer-spin {
                    to {
                        --shimmer-angle: 360deg;
                    }
                }
                .animate-shimmer {
                    animation: shimmer-spin 3s linear infinite;
                }
            `}</style>

            {user ? (
                <div className="flex items-center gap-2">
                    {(user.role === 'admin' || user.role === 'super_admin') && (
                        <Link
                            href="/admin"
                            className="group relative inline-flex items-center justify-center p-[1px] rounded-full overflow-hidden mr-2"
                        >
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: 'conic-gradient(from var(--shimmer-angle), transparent 25%, #ef4444, transparent 50%)',
                                    animation: 'shimmer-spin 3s linear infinite'
                                }}
                            />
                            <span className={cn(
                                "relative z-10 inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold transition-colors w-full h-full",
                                scrolled
                                    ? "bg-primary text-white group-hover:bg-primary/90"
                                    : "bg-black text-white group-hover:bg-zinc-900"
                            )}>
                                Dashboard
                            </span>
                        </Link>
                    )}
                    <Link href="/profile" className="hover:opacity-80 transition-opacity">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name || "User"} className="w-8 h-8 rounded-full border border-border" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-medium text-xs">
                                {user.email?.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </Link>
                </div>
            ) : (
                <button
                    onClick={openAuthModal}
                    className="group relative inline-flex items-center justify-center p-[1.5px] rounded-full overflow-hidden"
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'conic-gradient(from var(--shimmer-angle), transparent 25%, #ef4444, transparent 50%)',
                            animation: 'shimmer-spin 3s linear infinite'
                        }}
                    />
                    <span
                        className={cn(
                            "relative z-10 inline-flex items-center gap-2 px-6 py-1.5 rounded-full text-xs font-semibold transition-all w-full h-full",
                            scrolled
                                ? "bg-foreground text-background group-hover:bg-foreground/90"
                                : "bg-black text-white group-hover:bg-zinc-900"
                        )}
                    >
                        <User className="w-3 h-3" />
                        <span>Login</span>
                    </span>
                </button>
            )}
        </>
    )
}

