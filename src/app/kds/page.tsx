"use client"

import { useState, useCallback, useEffect } from 'react'
import { Bell, ChefHat, Truck, CheckCircle, BrainCircuit, Sparkles, Flame, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
    OrderCard,
    KDSColumn,
    KDSHeader,
    AIPlaceholder,
    type KDSOrder
} from '@/components/kds'
import { orderStatusService } from '@/lib/services/order-status-service'
import { OrderWithElapsed } from '@/types/order-status'

// Transform DB order to KDS order format
function transformToKDSOrder(order: OrderWithElapsed): KDSOrder {
    const statusMap: Record<string, KDSOrder['status']> = {
        'pending': 'new',
        'confirmed': 'kitchen',
        'preparing': 'kitchen',
        'ready': 'delivery',
        'out_for_delivery': 'delivery',
        'delivering': 'delivery',
        'delivered': 'done',
        'completed': 'done',
        'cancelled': 'done'
    }

    return {
        id: order.id,
        order_number: order.order_number,
        customer: order.customer_name || 'Cliente',
        items: order.items_preview.map(item => ({
            name: item.name,
            qty: item.quantity,
            notes: undefined // Add notes if available in your data
        })),
        status: statusMap[order.status] || 'new',
        timestamp: order.created_at,
        type: order.order_type === 'delivery' ? 'delivery' : 'pickup',
        total: `$${order.total.toFixed(2)}`
    }
}

// Status flow for advancing orders
const STATUS_FLOW: Record<string, string> = {
    'pending': 'confirmed',
    'confirmed': 'preparing',
    'preparing': 'ready',
    'ready': 'out_for_delivery',
    'out_for_delivery': 'delivering',
    'delivering': 'delivered',
}

export default function KDSPage() {
    const [orders, setOrders] = useState<KDSOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [aiModalOpen, setAiModalOpen] = useState(false)
    const [aiModalTitle, setAiModalTitle] = useState('')
    const [isSidebarOpen, setSidebarOpen] = useState(false)

    // Load orders from Supabase
    const loadOrders = useCallback(async () => {
        try {
            const dashboardOrders = await orderStatusService.getOrdersForDashboard()

            // Flatten all categories into KDS format
            const allOrders: KDSOrder[] = []

            Object.values(dashboardOrders).forEach(categoryOrders => {
                categoryOrders.forEach(order => {
                    allOrders.push(transformToKDSOrder(order))
                })
            })

            setOrders(allOrders)
        } catch (error) {
            console.error('Error loading KDS orders:', error)
            toast.error('Error al cargar órdenes')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        loadOrders()

        // Auto-refresh every 15 seconds for kitchen
        const interval = setInterval(loadOrders, 15000)
        return () => clearInterval(interval)
    }, [loadOrders])

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadOrders()
    }

    // Advance order to next status
    const handleAdvance = async (orderId: string, currentKDSStatus: string) => {
        // Find original DB status
        const order = orders.find(o => o.id === orderId)
        if (!order) return

        // Map KDS status back to potential DB statuses and find next
        const dbStatusMap: Record<string, string[]> = {
            'new': ['pending'],
            'kitchen': ['confirmed', 'preparing', 'ready'],
            'delivery': ['out_for_delivery', 'delivering']
        }

        try {
            // Get current order from DB to know exact status
            const dashboardOrders = await orderStatusService.getOrdersForDashboard()
            let dbStatus = 'pending'

            for (const category of Object.values(dashboardOrders)) {
                const found = category.find(o => o.id === orderId)
                if (found) {
                    dbStatus = found.status
                    break
                }
            }

            const nextStatus = STATUS_FLOW[dbStatus]
            if (nextStatus) {
                await orderStatusService.updateOrderStatus(orderId, nextStatus)
                toast.success(`Orden avanzada a "${nextStatus}"`)
                loadOrders()
            }
        } catch (error: any) {
            console.error('Error advancing order:', error)
            toast.error(error.message || 'Error al actualizar orden')
        }
    }

    // Reject/cancel order
    const handleReject = async (orderId: string) => {
        if (!confirm('¿Cancelar esta orden?')) return

        try {
            await orderStatusService.updateOrderStatus(orderId, 'cancelled')
            toast.success('Orden cancelada')
            loadOrders()
        } catch (error: any) {
            toast.error(error.message || 'Error al cancelar orden')
        }
    }

    // AI message (placeholder)
    const handleAIMessage = (order: KDSOrder) => {
        setAiModalTitle(`💬 Mensaje a ${order.customer.split(' ')[0]}`)
        setAiModalOpen(true)
    }

    // AI Chef Brief (placeholder)
    const handleAIChefBrief = () => {
        setAiModalTitle("👨‍🍳 Chef's Briefing")
        setAiModalOpen(true)
    }

    // Calculate stats
    const stats = {
        active: orders.filter(o => o.status !== 'done').length,
        kitchen: orders.filter(o => o.status === 'kitchen').length,
        delivery: orders.filter(o => o.status === 'delivery').length
    }

    // Group orders by status
    const ordersByStatus = {
        new: orders.filter(o => o.status === 'new'),
        kitchen: orders.filter(o => o.status === 'kitchen'),
        delivery: orders.filter(o => o.status === 'delivery'),
        done: orders.filter(o => o.status === 'done').slice(0, 10) // Limit history
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full bg-black items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
                    <p className="text-zinc-400 text-sm">Cargando KDS...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-black">

            {/* AI Modal */}
            <AIPlaceholder
                isOpen={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                title={aiModalTitle}
            />

            {/* Sidebar */}
            <div className={`
                fixed top-0 left-0 bottom-0 w-64 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                bg-[#09090b] border-r border-zinc-800 flex flex-col
            `}>
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                            <Flame size={20} fill="white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">
                            Rajma<span className="text-red-600">KDS</span>
                        </span>
                    </div>
                </div>

                {/* AI Chef Brief Button */}
                <div className="p-4 pb-0">
                    <button
                        onClick={handleAIChefBrief}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg
                            group relative overflow-hidden text-white"
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                        }}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <BrainCircuit size={20} className="relative z-10" />
                        <span className="relative z-10">Chef's Brief AI</span>
                        <Sparkles size={16} className="absolute top-2 right-2 text-white/50 animate-pulse" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="p-4 space-y-1">
                    <Link
                        href="/admin/orders"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                            text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                        Volver al Admin
                    </Link>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 text-center">
                    <p className="text-xs text-zinc-600">Sistema de Pantalla de Cocina</p>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <KDSHeader
                    stats={stats}
                    onRefresh={handleRefresh}
                    isRefreshing={refreshing}
                    onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                />

                <main className="flex-1 p-6 overflow-x-auto overflow-y-hidden custom-scroll">
                    <div className="grid grid-cols-4 gap-6 h-full min-w-[1200px]">

                        <KDSColumn
                            title="Nuevas"
                            icon={<Bell size={18} />}
                            count={ordersByStatus.new.length}
                            color="blue"
                        >
                            {ordersByStatus.new.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onAdvance={handleAdvance}
                                    onReject={handleReject}
                                    onAIMessage={handleAIMessage}
                                />
                            ))}
                        </KDSColumn>

                        <KDSColumn
                            title="En Cocina"
                            icon={<ChefHat size={18} />}
                            count={ordersByStatus.kitchen.length}
                            color="orange"
                        >
                            {ordersByStatus.kitchen.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onAdvance={handleAdvance}
                                    onAIMessage={handleAIMessage}
                                />
                            ))}
                        </KDSColumn>

                        <KDSColumn
                            title="En Reparto"
                            icon={<Truck size={18} />}
                            count={ordersByStatus.delivery.length}
                            color="yellow"
                        >
                            {ordersByStatus.delivery.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onAdvance={handleAdvance}
                                    onAIMessage={handleAIMessage}
                                />
                            ))}
                        </KDSColumn>

                        <KDSColumn
                            title="Historial"
                            icon={<CheckCircle size={18} />}
                            count={ordersByStatus.done.length}
                            color="green"
                            isDone
                        >
                            {ordersByStatus.done.map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </KDSColumn>

                    </div>
                </main>
            </div>
        </div>
    )
}
