import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { ChefHat } from "lucide-react"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminMobileNav } from "@/components/admin/AdminMobileNav"

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
            <AdminSidebar user={session.user} />

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
            <AdminMobileNav />
        </div>
    )
}
