'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full space-y-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">Algo salió mal</h1>
                    <p className="text-gray-500 text-sm">
                        No pudimos verificar tu inicio de sesión con Google.
                        Esto suele pasar si el enlace expiró o hubo un problema de red.
                    </p>
                </div>

                <div className="pt-4 space-y-3">
                    <Button asChild className="w-full bg-black text-white hover:bg-gray-800">
                        <Link href="/">Volver al Inicio</Link>
                    </Button>
                    <p className="text-xs text-gray-400">Error: Auth Code Exchange Failed</p>
                </div>
            </div>
        </div>
    )
}
