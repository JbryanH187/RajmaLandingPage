import { Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LiveOrdersPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-black">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <Clock className="text-blue-600" size={32} />
                        <h1 className="text-2xl font-bold text-black">Órdenes en Vivo (Live)</h1>
                    </div>
                </div>

                <div className="grid place-items-center h-[60vh] border-2 border-dashed border-gray-300 rounded-3xl bg-white shadow-sm">
                    <div className="text-center space-y-4">
                        <Clock className="w-16 h-16 mx-auto text-gray-400" />
                        <p className="text-gray-500 text-lg">Monitor de Órdenes en construcción</p>
                        <p className="text-sm text-gray-400">Panel para seguimiento de órdenes en tiempo real</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
