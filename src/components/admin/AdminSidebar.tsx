"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"

export function AdminSidebar() {
    const pathname = usePathname()
    const { signOut } = useAuth()

    const links = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/menu", label: "Gestión de Menú", icon: UtensilsCrossed },
        { href: "/admin/orders", label: "Pedidos", icon: ClipboardList },
        { href: "/admin/settings", label: "Configuración", icon: Settings },
    ]

    return (
        <div className="w-64 h-screen bg-black text-white flex flex-col border-r border-white/10 fixed left-0 top-0 z-50">
            {/* Header */}
            <div className="p-6">
                <h1 className="text-2xl font-serif font-bold tracking-wider text-white">
                    Rajma <span className="text-primary">Admin</span>
                </h1>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                                isActive
                                    ? "bg-primary text-white font-bold shadow-lg shadow-primary/20"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <link.icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    onClick={signOut}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    )
}
