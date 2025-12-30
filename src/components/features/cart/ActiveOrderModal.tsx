"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Utensils, Clock, ChevronRight, X } from "lucide-react"

interface ActiveOrderModalProps {
    isOpen: boolean
    onClose: () => void
    onViewOrder: () => void
}

export function ActiveOrderModal({ isOpen, onClose, onViewOrder }: ActiveOrderModalProps) {
    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-900/95 backdrop-blur-xl"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Image/Icon Area */}
                    <div className="bg-orange-50 p-8 flex justify-center items-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/pattern.png')] bg-repeat opacity-[0.05]" />

                        <div className="relative z-10 w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center">
                            <span className="text-5xl">👨‍🍳</span>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-4 border-white">
                                <Clock className="w-4 h-4 text-white" strokeWidth={3} />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 text-center space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-serif text-2xl font-bold text-gray-900">
                                ¡Un momento, foodie! 🍣
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                Ya estamos preparando tu orden anterior con mucho cariño. Para asegurar la mejor experiencia y frescura, terminemos esa primero.
                            </p>
                            <p className="text-xs text-muted-foreground font-medium pt-2">
                                ¿Deseas ver el estado de tu pedido actual?
                            </p>
                        </div>

                        <div className="pt-4 space-y-3">
                            <Button
                                className="w-full h-12 bg-black text-white hover:bg-red-600 text-base font-bold rounded-xl shadow-lg shadow-black/10 group transition-colors"
                                onClick={onViewOrder}
                            >
                                <Utensils className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                                Ver mi Orden Activa
                                <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full text-gray-400 hover:bg-red-50 hover:text-red-600 font-medium text-xs transition-colors"
                                onClick={onClose}
                            >
                                Entendido, esperaré
                            </Button>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
