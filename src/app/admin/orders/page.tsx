"use client"

import { useEffect, useState } from "react"
import { AdminService } from "@/lib/services/admin-service"
import { AdminOrderCard } from "@/components/admin/orders/AdminOrderCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, RefreshCw } from "lucide-react"

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("active")

    const fetchOrders = async () => {
        try {
            setLoading(true)
            // Fetch 'all' and filter client-side for now to have smooth transitions, 
            // or fetch by status if optimized.
            const data = await AdminService.getOrders('all')
            setOrders(data || [])
        } catch (error) {
            console.error("Error fetching orders:", error)
            toast.error("Error al cargar pedidos")
        } finally {
            setLoading(false)
        }
    }

    // Initial Fetch & Realtime Subscription
    useEffect(() => {
        fetchOrders()

        const subscription = AdminService.subscribeToNewOrders((newOrder) => {
            toast.info(`Nuevo pedido: #${newOrder.order_number || 'ID'}`)
            // Optimistic update or refetch
            fetchOrders()
        })

        // Polling fallback every 30s
        const interval = setInterval(fetchOrders, 30000)

        return () => {
            subscription.unsubscribe()
            clearInterval(interval)
        }
    }, [])

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            // Optimistic Update
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))

            await AdminService.updateOrderStatus(orderId, newStatus as any)
            toast.success("Estado actualizado")
        } catch (error) {
            console.error("Update failed", error)
            toast.error("Error al actualizar estado")
            fetchOrders() // Revert
        }
    }

    const handleViewDetails = (order: any) => {
        // Todo: Open Modal
        console.log("View details", order)
    }

    // Group Orders
    const newOrders = orders.filter(o => o.status === 'pending')
    const activeOrders = orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status))
    const deliveryOrders = orders.filter(o => ['out_for_delivery', 'delivering'].includes(o.status))
    const completedOrders = orders.filter(o => ['delivered', 'completed', 'cancelled'].includes(o.status))

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
                    <p className="text-muted-foreground">Kitchen Display System (KDS)</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Actualizar"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                </button>
            </div>

            <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="new" className="relative">
                        Nuevos
                        {newOrders.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                                {newOrders.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="active">En Cocina</TabsTrigger>
                    <TabsTrigger value="delivery">Reparto</TabsTrigger>
                    <TabsTrigger value="completed">Historial</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="new" className="space-y-4">
                        {newOrders.map(order => (
                            <AdminOrderCard
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                        {newOrders.length === 0 && <EmptyState message="No hay pedidos nuevos" />}
                    </TabsContent>

                    <TabsContent value="active" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeOrders.map(order => (
                            <AdminOrderCard
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                        {activeOrders.length === 0 && <EmptyState message="La cocina está libre" />}
                    </TabsContent>

                    <TabsContent value="delivery" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {deliveryOrders.map(order => (
                            <AdminOrderCard
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                        {deliveryOrders.length === 0 && <EmptyState message="No hay pedidos en ruta" />}
                    </TabsContent>

                    <TabsContent value="completed" className="space-y-4">
                        {completedOrders.slice(0, 20).map(order => (
                            <AdminOrderCard
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <RefreshCw size={24} className="opacity-20" />
            </div>
            <p>{message}</p>
        </div>
    )
}
