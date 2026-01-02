"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { orderStatusService } from '@/lib/services/order-status-service'
import { OrderStatus } from '@/types/order-status'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
    Clock, History, ArrowLeft, Loader2,
    Search, Truck, Package, CheckCircle, XCircle,
    Calendar, ChevronLeft, ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface HistoryOrder {
    id: string
    order_number: string
    created_at: string
    delivered_at?: string
    status: string
    order_type: string
    total: number
    customer_name?: string
    items_count: number
}

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<HistoryOrder[]>([])
    const [statuses, setStatuses] = useState<OrderStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const pageSize = 20

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const statusesData = await orderStatusService.getStatuses()
            setStatuses(statusesData)

            let query = supabase
                .from('orders')
                .select(`
                    id, order_number, created_at, delivered_at, status, 
                    order_type, total, customer_name,
                    order_items (id)
                `)
                .in('status', ['delivered', 'completed', 'cancelled'])
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1)

            if (search) {
                query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%`)
            }

            const { data, error } = await query

            if (error) throw error

            const formatted = (data || []).map(o => ({
                ...o,
                items_count: o.order_items?.length || 0
            }))

            setOrders(formatted)
            setHasMore(data?.length === pageSize)
        } catch (error) {
            console.error('Error loading history:', error)
        } finally {
            setLoading(false)
        }
    }, [page, search])

    useEffect(() => {
        loadData()
    }, [loadData])

    const getStatusInfo = (statusId: string) => statuses.find(s => s.id === statusId)

    const getStatusIcon = (status: string) => {
        if (status === 'cancelled') return <XCircle className="h-4 w-4" />
        return <CheckCircle className="h-4 w-4" />
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
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
                        <History className="text-gray-500" />
                        Historial de Órdenes
                    </h1>
                    <p className="text-gray-500">Órdenes completadas y canceladas</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Buscar por # orden o cliente..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(0)
                    }}
                    className="pl-10"
                />
            </div>

            {/* Orders Table */}
            {loading ? (
                <div className="flex items-center justify-center h-[40vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <History className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No se encontraron órdenes</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="bg-white rounded-lg border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Orden</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Cliente</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tipo</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orders.map(order => {
                                    const statusInfo = getStatusInfo(order.status)
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <span className="font-medium">#{order.order_number}</span>
                                                <p className="text-xs text-gray-400">{order.items_count} productos</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(order.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {order.customer_name || <span className="text-gray-400">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="text-xs">
                                                    {order.order_type === 'delivery' ? (
                                                        <><Truck className="h-3 w-3 mr-1" /> Envío</>
                                                    ) : (
                                                        <><Package className="h-3 w-3 mr-1" /> Recoger</>
                                                    )}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    style={{
                                                        backgroundColor: statusInfo?.color || '#gray',
                                                        color: 'white'
                                                    }}
                                                    className="flex items-center gap-1 w-fit"
                                                >
                                                    {getStatusIcon(order.status)}
                                                    {statusInfo?.label || order.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {formatCurrency(order.total)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                            Página {page + 1}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={!hasMore}
                            >
                                Siguiente
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
