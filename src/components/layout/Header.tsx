"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePermissions } from "@/hooks/usePermissions"
import { LayoutDashboard } from "lucide-react"

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
            <div className="container px-6 flex items-center justify-between">
                <Link
                    href="/"
                    className={cn(
                        "text-xl font-semibold tracking-tight transition-colors duration-300",
                        isScrolled ? "text-foreground" : "text-white"
                    )}
                >
                    Rajma
                </Link>

                <DashboardLink isScrolled={isScrolled} />
            </div>
        </header>
    )
}

function DashboardLink({ isScrolled }: { isScrolled: boolean }) {
    const { canAccessModule, loading } = usePermissions()

    // Don't show anything while loading to avoid flickering
    if (loading) return null

    if (canAccessModule('dashboard')) {
        return (
            <Link
                href="/admin"
                className={cn(
                    "flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-colors",
                    isScrolled
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                )}
            >
                <LayoutDashboard size={16} />
                Dashboard
            </Link>
        )
    }

    return null
}
