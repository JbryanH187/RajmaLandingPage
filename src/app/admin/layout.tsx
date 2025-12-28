import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import Link from "next/link"
import { LayoutDashboard, Utensils, Users, LogOut, ClipboardList, ChefHat } from "lucide-react"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Double check, though middleware should handle it.
    if (!session) {
        redirect("/?login=true")
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-black text-white p-6 justify-between">
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
                        <NavLink href="/admin/orders" icon={<ClipboardList />} label="Pedidos (KDS)" />
                        <NavLink href="/admin/menu" icon={<Utensils />} label="Menú" />
                        <NavLink href="/admin/staff" icon={<Users />} label="Personal" disabled />
                        <NavLink href="/admin/stats" icon={<LayoutDashboard />} label="Reportes" disabled />
                    </nav>
                </div>

                <div className="border-t border-gray-800 pt-6">
                    <div className="flex items-center gap-3 px-2 mb-4 opacity-50">
                        <div className="w-8 h-8 rounded-full bg-gray-700" />
                        <div className="text-sm">
                            <p className="font-bold">{session.user.email}</p>
                            <p className="text-xs text-gray-400">Administrador</p>
                        </div>
                    </div>
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative pb-24 md:pb-0">
                {/* Mobile Header (Only visible on mobile) */}
                <div className="md:hidden bg-black text-white p-4 sticky top-0 z-50 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold">R</div>
                        <span className="font-bold tracking-wide">PANEL</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                        <ChefHat size={16} className="text-white" />
                    </div>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
                <div className="flex justify-around items-center h-16">
                    <MobileNavLink href="/admin/orders" icon={<ClipboardList size={20} />} label="Pedidos" />
                    <MobileNavLink href="/admin/menu" icon={<Utensils size={20} />} label="Menú" />
                    <MobileNavLink href="/admin/profile" icon={<Users size={20} />} label="Perfil" />
                </div>
            </nav>
        </div>
    )
}

function NavLink({ href, icon, label, disabled }: any) {
    return (
        <Link
            href={disabled ? '#' : href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10 hover:text-red-400'}`}
        >
            <span className={!disabled ? "text-gray-300" : ""}>{icon}</span>
            <span className="font-medium text-sm">{label}</span>
        </Link>
    )
}

function MobileNavLink({ href, icon, label }: any) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-red-600 active:text-red-600 space-y-1">
            {icon}
            <span className="text-[10px] font-bold uppercase">{label}</span>
        </Link>
    )
}

function LogoutButton() {
    return (
        <form action="/auth/signout" method="post">
            {/* Using server action for now, but client component wrapping for clean separation if needed later */}
            <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/5 rounded-xl w-full transition-colors text-sm font-bold">
                <LogOut size={18} />
                Cerrar Sesión
            </button>
        </form>
    )
}
