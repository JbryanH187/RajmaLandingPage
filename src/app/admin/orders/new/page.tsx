"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { orderStatusService } from '@/lib/services/order-status-service'
import { OrderWithElapsed, OrderStatus } from '@/types/order-status'
import { formatCurrency } from '@/lib/utils'
import {
    Clock, ShoppingBag, ArrowLeft, Loader2,
    Check, X, Phone, MapPin, RefreshCw, Truck, Package
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewOrdersPage() {
    const [orders, setOrders] = useState<OrderWithElapsed[]>([])
    const [statuses, setStatuses] = useState<OrderStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        try {
            const [ordersData, statusesData] = await Promise.all([
                orderStatusService.getOrdersByCategory('new'),
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
        const interval = setInterval(loadData, 30000)
        return () => clearInterval(interval)
    }, [loadData])

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setActionLoading(orderId)
        try {
            await orderStatusService.updateOrderStatus(orderId, newStatus)
            toast.success(`Orden actualizada a "${newStatus}"`)
            loadData()
        } catch (error: any) {
            console.error('Error updating order:', error)
            toast.error(error.message || 'Error al actualizar orden')
        } finally {
            setActionLoading(null)
        }
    }

    const getCurrentStatusInfo = (statusId: string) => {
        return statuses.find(s => s.id === statusId)
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
                        <ShoppingBag className="text-yellow-500" />
                        Nuevos Pedidos
                    </h1>
                    <p className="text-gray-500">{orders.length} pedidos pendientes</p>
                </div>
                <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                </Button>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No hay pedidos nuevos</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {orders.map(order => {
                        const statusInfo = getCurrentStatusInfo(order.status)
                        const isLoading = actionLoading === order.id

                        return (
                            <Card key={order.id} className="overflow-hidden">
                                <CardHeader className="bg-yellow-50 py-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">#{order.order_number}</CardTitle>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                <Clock className="h-4 w-4" />
                                                <span className={order.elapsed_minutes! > 15 ? 'text-red-500 font-bold' : ''}>
                                                    {orderStatusService.formatElapsedTime(order.elapsed_minutes || 0)}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge variant={order.order_type === 'delivery' ? 'default' : 'secondary'}>
                                            {order.order_type === 'delivery' ? <Truck className="h-3 w-3 mr-1" /> : <Package className="h-3 w-3 mr-1" />}
                                            {order.order_type === 'delivery' ? 'Envío' : 'Recoger'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    {/* Customer Info */}
                                    {order.customer_name && (
                                        <div className="space-y-1">
                                            <p className="font-medium">{order.customer_name}</p>
                                            {order.customer_phone && (
                                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {order.customer_phone}
                                                </p>
                                            )}
                                            {order.delivery_address && (
                                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" /> {order.delivery_address}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Items Preview */}
                                    <div className="bg-gray-50 rounded p-2">
                                        <p className="text-xs text-gray-500 mb-1">{order.items_count} productos</p>
                                        {order.items_preview.map((item, i) => (
                                            <p key={i} className="text-sm">
                                                {item.quantity}x {item.name}
                                            </p>
                                        ))}
                                    </div>

                                    {/* Total */}
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="text-gray-500">Total</span>
                                        <span className="text-xl font-bold">{formatCurrency(order.total)}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => handleStatusChange(order.id, 'confirmed')}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                            Confirmar
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                                            disabled={isLoading}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
