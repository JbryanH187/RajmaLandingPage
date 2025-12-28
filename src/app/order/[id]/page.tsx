"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ChefHat, Bike, CheckCircle2, Clock, MapPin, XCircle } from "lucide-react"
import { OrderService } from "@/lib/services/order-service"
import { formatCurrency } from "@/lib/utils"
// import { toast } from "sonner" // Optional, maybe for errors

export default function OrderTrackerPage() {
    const params = useParams()
    const orderId = params.id as string

    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Poll every 10 seconds
    useEffect(() => {
        let intervalId: NodeJS.Timeout

        const fetchOrder = async () => {
            if (!orderId) return

            const result = await OrderService.getPublicOrder(orderId)

            if (result && result.success) {
                setOrder(result.order)
                setLoading(false)
            } else {
                // If it fails on first load, set error.
                // If it fails on subsequent polls, keep showing old data but maybe log it?
                if (loading) {
                    setError("No pudimos encontrar tu orden. Verifica el enlace.")
                    setLoading(false)
                }
            }
        }

        fetchOrder()
        intervalId = setInterval(fetchOrder, 10000) // 10s polling

        return () => clearInterval(intervalId)
    }, [orderId, loading]) // Re-run if ID changes, keep polling.

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-black" />
                    <p className="text-gray-500 font-medium animate-pulse">Buscando tu orden...</p>
                </div>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Orden no encontrada</h1>
                <p className="text-gray-600 max-w-md">
                    El enlace parece estar roto o la orden no existe.
                    <br />Si crees que es un error, contacta al restaurante.
                </p>
            </div>
        )
    }

    // --- RENDER SUCCESS ---

    const statusConfig: any = {
        pending: { label: "Confirmando...", icon: Clock, color: "text-amber-500", bg: "bg-amber-500" },
        confirmed: { label: "Confirmado", icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500" },
        preparing: { label: "Cocinando", icon: ChefHat, color: "text-orange-500", bg: "bg-orange-500" },
        ready: { label: "Listo", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500" },
        delivering: { label: "En Camino", icon: Bike, color: "text-indigo-500", bg: "bg-indigo-500" },
        completed: { label: "Entregado", icon: CheckCircle2, color: "text-gray-500", bg: "bg-gray-500" },
        cancelled: { label: "Cancelado", icon: XCircle, color: "text-red-500", bg: "bg-red-500" }
    }

    const currentStatus = statusConfig[order.status] || statusConfig.pending

    // Status Progress Bar
    const progress = order.progress || 0

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header / Hero */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm/50">
                <div className="max-w-md mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Orden #{order.order_number}</p>
                        <h1 className="font-serif text-xl font-bold text-gray-900">Rajma Sushi</h1>
                    </div>
                    {/* Live Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">En Vivo</span>
                    </div>
                </div>
            </div>

            <main className="max-w-md mx-auto p-6 space-y-6">

                {/* 1. STATUS CARD */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[32px] p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] text-center overflow-hidden relative"
                >
                    {/* Background Ambient Glow */}
                    <div className={`absolute top-0 inset-x-0 h-32 opacity-10 bg-gradient-to-b from-${currentStatus.color.split('-')[1]}-500 to-transparent`} />

                    <div className={`w-24 h-24 mx-auto ${currentStatus.bg} bg-opacity-10 rounded-full flex items-center justify-center mb-6 relative z-10`}>
                        <currentStatus.icon className={`w-10 h-10 ${currentStatus.color}`} strokeWidth={1.5} />
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentStatus.label}</h2>

                    {order.estimated_time && (
                        <p className="text-gray-500 text-sm font-medium">
                            {order.status === 'delivering' ? 'Llegada estimada:' : 'Tiempo estimado:'} <br />
                            <span className="text-black font-bold text-lg">
                                {new Date(order.estimated_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </p>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-8 relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className={`absolute top-0 left-0 h-full ${currentStatus.bg}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                        <span>Recibido</span>
                        <span>Listo</span>
                    </div>
                </motion.div>


                {/* 2. ORDER DETAILS */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                >
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4 border-dashed">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Cliente</p>
                            <p className="font-bold text-gray-900">{order.guest_name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total</p>
                            <p className="font-mono font-bold text-gray-900">{formatCurrency(order.total)}</p>
                        </div>
                    </div>

                    {order.order_type === 'delivery' && (
                        <div className="mb-6 flex gap-3 items-start bg-gray-50 p-4 rounded-2xl">
                            <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Destino</p>
                                <p className="text-sm font-medium text-gray-700 leading-snug">
                                    {order.delivery_address || "Dirección oculta"}
                                </p>
                            </div>
                        </div>
                    )}

                    <ul className="space-y-4">
                        {order.items.map((item: any, idx: number) => (
                            <li key={idx} className="flex gap-4 text-sm">
                                <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 text-[10px] font-bold text-gray-600 shrink-0">
                                    {item.quantity}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900">{item.name}</p>
                                    {(item.variant || item.notes) && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {item.variant} {item.notes && `• ${item.notes}`}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Footer Info */}
                <div className="text-center text-xs text-gray-400 font-medium pb-8">
                    <p>Actualización automática cada 10s</p>
                    <p className="mt-1">ID: {order.id.slice(0, 8)}...</p>
                </div>

            </main>
        </div>
    )
}
