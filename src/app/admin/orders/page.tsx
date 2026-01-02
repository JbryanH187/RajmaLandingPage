"use client"

import { useState } from 'react'
import { Bell, ChefHat, Truck, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
    OrderCard,
    KDSColumn,
    AIPlaceholder
} from '@/components/kds'
import { AdminShell } from '@/components/admin/AdminShell'
import { useTheme } from '@/lib/hooks/useTheme'
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/types/orders'

// Status flow for advancing orders
const STATUS_FLOW: Record<string, string> = {
    'pending': 'confirmed',
    'confirmed': 'preparing',
    'preparing': 'ready',
    'ready': 'out_for_delivery',
    'out_for_delivery': 'delivering',
    'delivering': 'delivered',
}

export default function OrdersPage() {
    const [aiModalOpen, setAiModalOpen] = useState(false)
    const [aiModalTitle, setAiModalTitle] = useState('')
    const { isDark } = useTheme()

    // Fetch orders by category using the new hook
    const { orders: newOrders, isLoading: loadingNew, refetch: refetchNew } = useOrdersRealtime({
        statusCategory: 'new'
    })
    const { orders: activeOrders, isLoading: loadingActive, refetch: refetchActive } = useOrdersRealtime({
        statusCategory: 'active'
    })
    const { orders: deliveryOrders, isLoading: loadingDelivery, refetch: refetchDelivery } = useOrdersRealtime({
        statusCategory: 'delivery'
    })
    const { orders: completedOrders, isLoading: loadingCompleted, refetch: refetchCompleted } = useOrdersRealtime({
        statusCategory: 'completed',
        todayOnly: true
    })

    const isLoading = loadingNew || loadingActive || loadingDelivery || loadingCompleted

    const handleRefresh = async () => {
        await Promise.all([refetchNew(), refetchActive(), refetchDelivery(), refetchCompleted()])
    }

    // Advance order to next status
    const handleAdvance = async (orderId: string, currentStatus: string) => {
        const nextStatus = STATUS_FLOW[currentStatus]
        if (!nextStatus) {
            toast.error('No se puede avanzar este estado')
            return
        }

        try {
            const updateData: any = {
                status: nextStatus,
                updated_at: new Date().toISOString()
            }

            // Set appropriate timestamp
            const timestampFields: Record<string, string> = {
                'confirmed': 'confirmed_at',
                'preparing': 'preparing_at',
                'ready': 'ready_at',
                'out_for_delivery': 'delivering_at',
                'delivering': 'delivering_at',
                'delivered': 'completed_at',
            }

            if (timestampFields[nextStatus]) {
                updateData[timestampFields[nextStatus]] = new Date().toISOString()
            }

            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId)

            if (error) throw error
            toast.success(`Orden avanzada`)
        } catch (error: any) {
            console.error('Error advancing order:', error)
            toast.error(error.message || 'Error al actualizar orden')
        }
    }

    // Reject/cancel order
    const handleReject = async (orderId: string) => {
        if (!confirm('¿Cancelar esta orden?')) return

        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString()
                })
                .eq('id', orderId)

            if (error) throw error
            toast.success('Orden cancelada')
        } catch (error: any) {
            toast.error(error.message || 'Error al cancelar orden')
        }
    }

    // AI message (placeholder)
    const handleAIMessage = (order: Order) => {
        setAiModalTitle(`💬 Mensaje a ${order.display_name || order.guest_name || 'Cliente'}`)
        setAiModalOpen(true)
    }

    // Calculate stats
    const stats = {
        active: newOrders.length + activeOrders.length + deliveryOrders.length,
        kitchen: activeOrders.length,
        delivery: deliveryOrders.length
    }

    const textMuted = isDark ? 'text-zinc-400' : 'text-gray-500'

    if (isLoading && newOrders.length === 0 && activeOrders.length === 0) {
        return (
            <AdminShell>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
                        <p className={textMuted}>Cargando órdenes...</p>
                    </div>
                </div>
            </AdminShell>
        )
    }

    return (
        <AdminShell stats={stats} onRefresh={handleRefresh} isRefreshing={isLoading}>
            {/* AI Modal */}
            <AIPlaceholder
                isOpen={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                title={aiModalTitle}
            />

            {/* KDS Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)] min-h-[500px]">

                <KDSColumn
                    title="Nuevas"
                    icon={<Bell size={18} />}
                    count={newOrders.length}
                    color="blue"
                    isDark={isDark}
                >
                    {newOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onAdvance={handleAdvance}
                            onReject={handleReject}
                            onAIMessage={handleAIMessage}
                            isDark={isDark}
                        />
                    ))}
                </KDSColumn>

                <KDSColumn
                    title="En Cocina"
                    icon={<ChefHat size={18} />}
                    count={activeOrders.length}
                    color="orange"
                    isDark={isDark}
                >
                    {activeOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onAdvance={handleAdvance}
                            onAIMessage={handleAIMessage}
                            isDark={isDark}
                        />
                    ))}
                </KDSColumn>

                <KDSColumn
                    title="En Reparto"
                    icon={<Truck size={18} />}
                    count={deliveryOrders.length}
                    color="yellow"
                    isDark={isDark}
                >
                    {deliveryOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onAdvance={handleAdvance}
                            onAIMessage={handleAIMessage}
                            isDark={isDark}
                        />
                    ))}
                </KDSColumn>

                <KDSColumn
                    title="Historial"
                    icon={<CheckCircle size={18} />}
                    count={completedOrders.length}
                    color="green"
                    isDone
                    isDark={isDark}
                >
                    {completedOrders.slice(0, 10).map(order => (
                        <OrderCard key={order.id} order={order} isDark={isDark} />
                    ))}
                </KDSColumn>

            </div>
        </AdminShell>
    )
}
