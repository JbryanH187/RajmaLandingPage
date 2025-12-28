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

interface GuestWarningModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirmGuest: () => void
    onLogin: () => void
}

export function GuestWarningModal({ isOpen, onClose, onConfirmGuest, onLogin }: GuestWarningModalProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-[95%] w-full sm:max-w-lg md:max-w-xl rounded-3xl p-8 gap-6 shadow-2xl">
                <AlertDialogHeader className="space-y-4">
                    <AlertDialogTitle className="text-3xl font-black text-center tracking-tight">
                        ¿Continuar sin cuenta?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-lg text-muted-foreground">
                        Puedes hacer tu pedido como invitado, pero ten en cuenta:
                    </AlertDialogDescription>
                    <div className="bg-secondary/30 p-6 rounded-2xl text-base space-y-3 text-muted-foreground mx-auto w-full">
                        <p className="flex items-center gap-3">
                            <span className="text-xl">🚫</span> No podrás guardar tu dirección.
                        </p>
                        <p className="flex items-center gap-3">
                            <span className="text-xl">🚫</span> No tendrás historial de pedidos.
                        </p>
                        <p className="flex items-center gap-3">
                            <span className="text-xl">✅</span> Tu pedido se generará al instante.
                        </p>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col gap-3 sm:gap-3 mt-2">
                    <Button
                        onClick={() => {
                            onClose()
                            onLogin()
                        }}
                        className="w-full bg-black text-white hover:bg-black/80 font-bold h-14 text-lg rounded-xl shadow-lg shadow-black/10 transition-all hover:scale-[1.02]"
                    >
                        Crear Cuenta / Iniciar Sesión
                    </Button>
                    <AlertDialogAction
                        onClick={onConfirmGuest}
                        className="w-full bg-transparent text-gray-500 hover:text-black hover:bg-gray-100 font-medium h-12 text-base rounded-xl border-0 shadow-none mt-2 transition-colors"
                    >
                        Continuar como Invitado
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
