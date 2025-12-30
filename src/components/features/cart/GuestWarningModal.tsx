"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { MapPin, History, Bike } from "lucide-react"

interface GuestWarningModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirmGuest: () => void
    onLogin: () => void
}

export function GuestWarningModal({ isOpen, onClose, onConfirmGuest, onLogin }: GuestWarningModalProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="z-[100] max-w-[95%] w-full sm:max-w-md rounded-3xl p-0 gap-0 shadow-2xl overflow-hidden border-0 bg-white">

                {/* Header Image / Graphic */}
                <div className="bg-zinc-50 p-8 pb-6 border-b border-zinc-100 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 mb-4 rotate-3 transform transition-transform hover:rotate-6">
                        <span className="text-3xl">👀</span>
                    </div>
                    <AlertDialogTitle className="text-2xl font-black text-black tracking-tight leading-tight">
                        ¿Aún no eres miembro de Rajma?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-zinc-500 max-w-xs mx-auto mt-2 font-medium">
                        Crea una cuenta y mejora tu experiencia en Rajma Sushi.
                    </AlertDialogDescription>
                </div>

                {/* Benefits List (Clean & Minimal) */}
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-100">
                                <History className="w-5 h-5 text-zinc-700" />
                            </div>
                            <div>
                                <h4 className="font-bold text-black text-sm">Historial de Pedidos</h4>
                                <p className="text-xs text-zinc-500 leading-snug">¿Te gustó lo de siempre? Repítelo en un click.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-100">
                                <MapPin className="w-5 h-5 text-zinc-700" />
                            </div>
                            <div>
                                <h4 className="font-bold text-black text-sm">Direcciones Guardadas</h4>
                                <p className="text-xs text-zinc-500 leading-snug">Olvídate de escribir tu ubicación cada vez.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-100">
                                <Bike className="w-5 h-5 text-zinc-700" />
                            </div>
                            <div>
                                <h4 className="font-bold text-black text-sm">Seguimiento de tu orden</h4>
                                <p className="text-xs text-zinc-500 leading-snug">Sigue tu orden desde la cocina hasta tu domicilio.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <Button
                            onClick={() => {
                                onClose()
                                onLogin()
                            }}
                            className="w-full bg-black text-white hover:bg-neutral-800 font-bold h-12 rounded-xl text-sm shadow-md transition-all active:scale-[0.98]"
                        >
                            Crear Cuenta / Iniciar Sesión
                        </Button>

                        <AlertDialogAction
                            onClick={onConfirmGuest}
                            className="w-full bg-white text-zinc-400 hover:text-black hover:bg-zinc-50 font-medium h-12 rounded-xl border border-transparent hover:border-zinc-200 shadow-none transition-all text-sm"
                        >
                            Continuar como Invitado
                        </AlertDialogAction>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}
