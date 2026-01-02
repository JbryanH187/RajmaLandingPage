"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { orderStatusService } from '@/lib/services/order-status-service'
import { OrderWithElapsed, OrderStatus } from '@/types/order-status'
import { formatCurrency } from '@/lib/utils'
import {
    Clock, ChefHat, ArrowLeft, Loader2,
    Check, RefreshCw, Truck, Package, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function KitchenPage() {
    const [orders, setOrders] = useState<OrderWithElapsed[]>([])
    const [statuses, setStatuses] = useState<OrderStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        try {
            const [ordersData, statusesData] = await Promise.all([
                orderStatusService.getOrdersByCategory('active'),
                orderStatusService.getStatuses()
            ])
            setOrders(ordersData)
            setStatuses(statusesData)
        } catch (error) {
            console.error('Error loading orders:', error)
            toast.error('Error al cargar órdenes')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
        const interval = setInterval(loadData, 15000) // More frequent for kitchen
        return () => clearInterval(interval)
    }, [loadData])

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setActionLoading(orderId)
        try {
            await orderStatusService.updateOrderStatus(orderId, newStatus)
            toast.success(`Orden lista para entrega`)
            loadData()
        } catch (error: any) {
            console.error('Error updating order:', error)
            toast.error(error.message || 'Error al actualizar orden')
        } finally {
            setActionLoading(null)
        }
    }

    const getStatusInfo = (statusId: string) => statuses.find(s => s.id === statusId)

    // Group by status for kitchen workflow
    const groupedOrders = {
        confirmed: orders.filter(o => o.status === 'confirmed'),
        preparing: orders.filter(o => o.status === 'preparing'),
        ready: orders.filter(o => o.status === 'ready'),
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    const OrderCard = ({ order }: { order: OrderWithElapsed }) => {
        const statusInfo = getStatusInfo(order.status)
        const isLoading = actionLoading === order.id
        const isUrgent = order.elapsed_minutes! > 20

        const getNextStatus = () => {
            switch (order.status) {
                case 'confirmed': return 'preparing'
                case 'preparing': return 'ready'
                case 'ready': return order.order_type === 'delivery' ? 'out_for_delivery' : 'delivered'
                default: return null
            }
        }

        const getActionLabel = () => {
            switch (order.status) {
                case 'confirmed': return 'Empezar'
                case 'preparing': return 'Marcar Lista'
                case 'ready': return order.order_type === 'delivery' ? 'A Reparto' : 'Entregar'
                default: return 'Avanzar'
            }
        }

        return (
            <Card className={`${isUrgent ? 'border-red-500 border-2' : ''}`}>
                <CardContent className="pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">#{order.order_number}</span>
                        <div className="flex items-center gap-2">
                            {isUrgent && <AlertCircle className="h-5 w-5 text-red-500" />}
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                                <Clock className="h-3 w-3" />
                                {orderStatusService.formatElapsedTime(order.elapsed_minutes || 0)}
                            </div>
                        </div>
                    </div>

                    <Badge
                        style={{ backgroundColor: statusInfo?.color, color: 'white' }}
                    >
                        {statusInfo?.label || order.status}
                    </Badge>

                    {/* Items */}
                    <div className="bg-gray-50 rounded p-3 space-y-1">
                        {order.items_preview.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span>{item.name}</span>
                                <span className="font-bold">x{item.quantity}</span>
                            </div>
                        ))}
                        {order.items_count > 3 && (
                            <p className="text-xs text-gray-500">+{order.items_count - 3} más...</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <Badge variant={order.order_type === 'delivery' ? 'default' : 'secondary'}>
                            {order.order_type === 'delivery' ? <Truck className="h-3 w-3 mr-1" /> : <Package className="h-3 w-3 mr-1" />}
                            {order.order_type === 'delivery' ? 'Envío' : 'Recoger'}
                        </Badge>

                        <Button
                            size="sm"
                            onClick={() => handleStatusChange(order.id, getNextStatus()!)}
                            disabled={isLoading || !getNextStatus()}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                            {getActionLabel()}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/orders">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <ChefHat className="text-purple-500" />
                        Cocina
                    </h1>
                    <p className="text-gray-500">{orders.length} órdenes activas</p>
                </div>
                <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                </Button>
            </div>

            {/* Kitchen Workflow Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Confirmed */}
                <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        Por Preparar ({groupedOrders.confirmed.length})
                    </h2>
                    <div className="space-y-3">
                        {groupedOrders.confirmed.map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                </div>

                {/* Preparing */}
                <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                        En Preparación ({groupedOrders.preparing.length})
                    </h2>
                    <div className="space-y-3">
                        {groupedOrders.preparing.map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                </div>

                {/* Ready */}
                <div>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        Listas ({groupedOrders.ready.length})
                    </h2>
                    <div className="space-y-3">
                        {groupedOrders.ready.map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
