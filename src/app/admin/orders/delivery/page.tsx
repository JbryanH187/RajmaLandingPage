"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { orderStatusService } from '@/lib/services/order-status-service'
import { OrderWithElapsed, OrderStatus } from '@/types/order-status'
import { formatCurrency } from '@/lib/utils'
import {
    Clock, Truck, ArrowLeft, Loader2,
    Check, RefreshCw, MapPin, Phone, Package, Navigation
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function DeliveryPage() {
    const [orders, setOrders] = useState<OrderWithElapsed[]>([])
    const [statuses, setStatuses] = useState<OrderStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        try {
            const [ordersData, statusesData] = await Promise.all([
                orderStatusService.getOrdersByCategory('delivery'),
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
        const interval = setInterval(loadData, 20000)
        return () => clearInterval(interval)
    }, [loadData])

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setActionLoading(orderId)
        try {
            await orderStatusService.updateOrderStatus(orderId, newStatus)
            toast.success(newStatus === 'delivered' ? '¡Orden entregada!' : 'Orden actualizada')
            loadData()
        } catch (error: any) {
            console.error('Error updating order:', error)
            toast.error(error.message || 'Error al actualizar orden')
        } finally {
            setActionLoading(null)
        }
    }

    const getStatusInfo = (statusId: string) => statuses.find(s => s.id === statusId)

    // Group by status
    const groupedOrders = {
        out_for_delivery: orders.filter(o => o.status === 'out_for_delivery'),
        delivering: orders.filter(o => o.status === 'delivering'),
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
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
                        <Truck className="text-orange-500" />
                        Reparto
                    </h1>
                    <p className="text-gray-500">{orders.length} envíos activos</p>
                </div>
                <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                </Button>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Truck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No hay envíos activos</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ready to Deliver */}
                    <div>
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                            Listos para Salir ({groupedOrders.out_for_delivery.length})
                        </h2>
                        <div className="space-y-3">
                            {groupedOrders.out_for_delivery.map(order => {
                                const isLoading = actionLoading === order.id
                                return (
                                    <Card key={order.id}>
                                        <CardContent className="pt-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg font-bold">#{order.order_number}</span>
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    {orderStatusService.formatElapsedTime(order.elapsed_minutes || 0)}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {order.customer_name && (
                                                    <p className="font-medium">{order.customer_name}</p>
                                                )}
                                                {order.customer_phone && (
                                                    <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 text-sm text-blue-600">
                                                        <Phone className="h-4 w-4" /> {order.customer_phone}
                                                    </a>
                                                )}
                                                {order.delivery_address && (
                                                    <p className="flex items-start gap-2 text-sm text-gray-600">
                                                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                        {order.delivery_address}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center pt-2 border-t">
                                                <span className="font-bold">{formatCurrency(order.total)}</span>
                                                <Button
                                                    onClick={() => handleStatusChange(order.id, 'delivering')}
                                                    disabled={isLoading}
                                                    className="bg-amber-500 hover:bg-amber-600"
                                                >
                                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4 mr-1" />}
                                                    Salir a Entregar
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>

                    {/* Delivering */}
                    <div>
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                            En Camino ({groupedOrders.delivering.length})
                        </h2>
                        <div className="space-y-3">
                            {groupedOrders.delivering.map(order => {
                                const isLoading = actionLoading === order.id
                                return (
                                    <Card key={order.id} className="border-orange-200">
                                        <CardContent className="pt-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg font-bold">#{order.order_number}</span>
                                                <Badge className="bg-orange-500">En Camino</Badge>
                                            </div>

                                            <div className="space-y-2">
                                                {order.customer_name && (
                                                    <p className="font-medium">{order.customer_name}</p>
                                                )}
                                                {order.customer_phone && (
                                                    <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 text-sm text-blue-600">
                                                        <Phone className="h-4 w-4" /> {order.customer_phone}
                                                    </a>
                                                )}
                                                {order.delivery_address && (
                                                    <p className="flex items-start gap-2 text-sm text-gray-600">
                                                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                        {order.delivery_address}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center pt-2 border-t">
                                                <span className="font-bold">{formatCurrency(order.total)}</span>
                                                <Button
                                                    onClick={() => handleStatusChange(order.id, 'delivered')}
                                                    disabled={isLoading}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                                    Marcar Entregado
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
