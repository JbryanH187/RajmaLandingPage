"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Utensils, Users, ClipboardList, FileText, Settings, ChefHat } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"

export function AdminMobileNav() {
    const { modules } = usePermissions()
    const pathname = usePathname()

    const getIcon = (name: string) => {
        switch (name) {
            case 'products': return <Utensils size={20} />
            case 'orders': return <ClipboardList size={20} />
            case 'users': return <Users size={20} />
            case 'reports': return <FileText size={20} />
            case 'settings': return <Settings size={20} />
            case 'kds': return <ChefHat size={20} />
            default: return <LayoutDashboard size={20} />
        }
    }

    // Filter to limit bottom nav items to key modules if too many?
    // For now, take first 4-5 or all.
    const displayModules = modules.slice(0, 5)

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {displayModules.map(module => (
                    <Link
                        key={module.name}
                        href={module.route}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === module.route
                            ? 'text-red-600'
                            : 'text-gray-400 hover:text-red-600'
                            }`}
                    >
                        {getIcon(module.name)}
                        <span className="text-[10px] font-bold uppercase">{module.display_name}</span>
                    </Link>
                ))}
            </div>
        </nav>
    )
}
