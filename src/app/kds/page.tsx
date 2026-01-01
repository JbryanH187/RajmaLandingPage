import { ChefHat, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function KDSPage() {
    return (
        <div className="min-h-screen bg-neutral-900 text-white p-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div className="flex items-center gap-3">
                    <ChefHat className="text-orange-500" size={32} />
                    <h1 className="text-2xl font-bold">Kitchen Display System (KDS)</h1>
                </div>
            </div>

            <div className="grid place-items-center h-[60vh] border-2 border-dashed border-neutral-700 rounded-3xl bg-neutral-800/50">
                <div className="text-center space-y-4">
                    <ChefHat className="w-16 h-16 mx-auto text-neutral-600" />
                    <p className="text-neutral-400 text-lg">Sistema de Pantalla de Cocina en construcción</p>
                    <p className="text-sm text-neutral-500">Aquí aparecerán las órdenes en tiempo real para la cocina</p>
                </div>
            </div>
        </div>
    )
}
