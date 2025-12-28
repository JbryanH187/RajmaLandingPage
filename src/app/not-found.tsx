"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">

                {/* Animated 404 Text */}
                <div className="relative">
                    <h1 className="text-[150px] font-black text-gray-900 leading-none select-none animate-pulse">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl md:text-4xl font-bold text-white tracking-widest bg-red-600 px-4 py-1 rotate-[-5deg] shadow-lg shadow-red-900/50">
                            SUSHIN'T
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">
                        Página no encontrada
                    </h2>
                    <p className="text-gray-400">
                        Lo sentimos, está página no ha sido encontrada en nuestro dominio pero siempre puedes volver a nuestra página principal.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Button
                        variant="outline"
                        className="gap-2 border-gray-700 text-gray-300 hover:bg-white/10 hover:text-white"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft size={18} />
                        Regresar
                    </Button>

                    <Link href="/">
                        <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white gap-2 shadow-red-900/20 shadow-lg">
                            <Home size={18} />
                            Ir al Inicio
                        </Button>
                    </Link>
                </div>

                <div className="pt-12 text-xs text-gray-600 font-mono">
                    RAJMA SUSHI &copy; {new Date().getFullYear()}
                </div>
            </div>
        </div>
    )
}
