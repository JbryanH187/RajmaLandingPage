"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Utensils, Users, LogOut, ClipboardList, ChefHat, Settings, FileText } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"

export function AdminSidebar({ user }: { user: any }) {
    const { modules, loading } = usePermissions()
    const pathname = usePathname()

    // Map icon names to components
    const getIcon = (name: string) => {
        switch (name) {
            case 'dashboard': return <LayoutDashboard size={20} />
            case 'products': return <Utensils size={20} />
            case 'orders': return <ClipboardList size={20} />
            case 'users': return <Users size={20} />
            case 'reports': return <FileText size={20} />
            case 'settings': return <Settings size={20} />
            case 'kds': return <ChefHat size={20} />
            default: return <LayoutDashboard size={20} />
        }
    }

    // Default static links if modules fail or for basic fallback? 
    // Best to rely on modules if RBAC is active. Skeletons for loading.

    return (
        <aside className="hidden md:flex flex-col w-64 bg-black text-white p-6 justify-between h-full">
            <div>
                <div className="flex items-center gap-3 mb-12 px-2">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-xl shadow-red-900/50 shadow-lg">
                        R
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-none">RAJMA</h1>
                        <p className="text-xs text-gray-400 font-mono">ADMIN v1.0</p>
                    </div>
                </div>

                <nav className="space-y-4">
                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 bg-white/10 rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        modules.map(module => (
                            <Link
                                key={module.name}
                                href={module.route}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === module.route
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                                    : 'hover:bg-white/10 hover:text-red-400 text-gray-300'
                                    }`}
                            >
                                {getIcon(module.name)}
                                <span className="font-medium text-sm">{module.display_name}</span>
                            </Link>
                        ))
                    )}
                </nav>
            </div>

            <div className="border-t border-gray-800 pt-6">
                <div className="flex items-center gap-3 px-2 mb-4 opacity-50">
                    <div className="w-8 h-8 rounded-full bg-gray-700" />
                    <div className="text-sm">
                        <p className="font-bold">{user.email}</p>
                        <p className="text-xs text-gray-400">Usuario</p>
                    </div>
                </div>

                <form action="/auth/signout" method="post">
                    <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/5 rounded-xl w-full transition-colors text-sm font-bold">
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </form>
            </div>
        </aside>
    )
}
