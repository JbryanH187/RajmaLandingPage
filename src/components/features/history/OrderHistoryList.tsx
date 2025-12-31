import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HistoryService, OrderHistoryItem } from "@/lib/services/history-service"
import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"
// import { format } from "date-fns"
import { OrderDetailModal } from "./OrderDetailModal"
import { Package, Clock, ShoppingBag } from "lucide-react"

interface OrderHistoryListProps {
    userId?: string
    email?: string
}

import { useCartStore } from "@/lib/store/cart-store"
import { toast } from "sonner"
import { RefreshCw, Loader2, RotateCcw } from "lucide-react"
import { useAbortableRequest } from "@/lib/hooks/useAbortableRequest"

// ... imports

export function OrderHistoryList({ userId, email }: OrderHistoryListProps) {
    const [orders, setOrders] = useState<OrderHistoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [reorderingId, setReorderingId] = useState<string | null>(null)

    const { setItems } = useCartStore()

    // ... useEffect ...

    const handleReorder = async (orderId: string) => {
        try {
            setReorderingId(orderId)
            // Fetch full details to get variants and valid product IDs
            const fullOrder = await HistoryService.getOrderDetails(orderId)

            if (!fullOrder || !fullOrder.items) {
                throw new Error("No se pudieron cargar los detalles de la orden")
            }

            // Transform to CartItems
            const cartItems = fullOrder.items.map((item: any) => ({
                id: item.product_id,
                name: item.product_name,
                price: item.unit_price,
                // If variant exists, use it
                selectedVariantId: item.variant_id,
                quantity: item.quantity,
                // Re-construct cartId (best effort unique ID)
                cartId: `${item.product_id}-${item.variant_id || 'base'}-${Date.now()}-${Math.random()}`,
                subtotal: item.unit_price * item.quantity,
                image_url: item.product_image,
                category_id: item.category_id || 'unknown' // Optional depending on strictness
            }))

            setItems(cartItems)

            toast.success("¡Pedido cargado al carrito! 🛒", {
                description: "Revisa tu carrito para confirmar los productos."
            })

        } catch (error) {
            console.error("Reorder failed", error)
            toast.error("Error al repetir pedido", {
                description: "No se pudieron cargar los productos. Intenta de nuevo."
            })
        } finally {
            setReorderingId(null)
        }
    }

    const [error, setError] = useState<string | null>(null)

    const { request, abort } = useAbortableRequest()

    useEffect(() => {
        abort() // Cancel any previous pending requests when deps change

        async function loadOrders() {
            if (!userId && !email) {
                setLoading(false)
                return
            }

            setLoading(true)
            setError(null)

            // Special handling for Demo User
            const isDemo = userId === 'admin-demo' || userId === 'demo-user' || email === 'admin@rajma.com' || email === 'demo@rajma.com';

            const queryParams = isDemo ? {
                userId: undefined,
                email: 'demo@rajma.com'
            } : {
                userId,
                email
            }

            try {
                await request(
                    (signal) => HistoryService.getUserOrders(queryParams, signal),
                    {
                        timeout: 10000,
                        onSuccess: (data) => {
                            setOrders(data.orders)
                            setLoading(false)
                        },
                        onError: (err: any) => {
                            // Ignore abort errors
                            if (err.name === 'AbortError' || err.message === 'Request was cancelled' || err.message?.includes('aborted')) {
                                return
                            }

                            console.error("Failed to load orders", err)
                            setError("No se pudo cargar el historial. Intenta recargar.")
                            setLoading(false)
                        }
                    }
                )
            } catch (err: any) {
                // Silently ignore abort errors
                if (err.name !== 'AbortError' && !err.message?.includes('aborted') && err.message !== 'Request was cancelled') {
                    console.error("Unhandled error in loadOrders:", err)
                }
            }
        }

        loadOrders()

        return () => {
            // Cleanup handled by hook, but manual abort safe here too
            abort()
        }
    }, [userId, email, request, abort])



    const handleViewDetails = (id: string) => {
        setSelectedOrderId(id)
        setIsModalOpen(true)
    }

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p>Cargando historial...</p>
        </div>
    }

    if (error) {
        return (
            <div className="text-center py-12 bg-red-50 rounded-lg border border-red-100">
                <ShoppingBag className="mx-auto h-12 w-12 text-red-300 mb-4" />
                <h3 className="text-lg font-medium text-red-900">Ups, hubo un error</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()} className="border-red-200 text-red-900 hover:bg-red-100">
                    <RefreshCw className="mr-2 h-4 w-4" /> Recargar Página
                </Button>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No tienes órdenes aún</h3>
                <p className="text-muted-foreground">Tus pedidos recientes aparecerán aquí.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="bg-slate-50/50 pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    #{order.order_number}
                                    <Badge variant={order.status === 'completed' ? 'default' : 'outline'} className="capitalize">
                                        {order.status}
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(order.created_at).toLocaleDateString()}
                                    <span className="mx-1">•</span>
                                    <span className="capitalize">{order.order_type}</span>
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-lg">{formatCurrency(order.total)}</div>
                                <div className="text-xs text-muted-foreground">{order.items_count} items</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                            {/* Preview Images/Text */}
                            <div className="flex-1 w-full">
                                <div className="flex -space-x-2 overflow-hidden py-1">
                                    {order.items_preview?.slice(0, 4).map((item, i) => (
                                        item.image ? (
                                            <img
                                                key={i}
                                                src={item.image}
                                                alt={item.name}
                                                className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover"
                                            />
                                        ) : (
                                            <div key={i} className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-white bg-slate-100 text-xs font-bold text-slate-500">
                                                {item.name.charAt(0)}
                                            </div>
                                        )
                                    ))}
                                    {(order.items_preview?.length || 0) > 4 && (
                                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-white bg-slate-100 text-xs text-slate-500">
                                            +{order.items_preview.length - 4}
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                                    {order.items_preview?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </p>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                                <Button
                                    className="flex-1 sm:flex-none h-8 text-xs bg-black text-white hover:bg-red-600 border-none shadow-sm transition-colors"
                                    onClick={() => handleReorder(order.id)}
                                >
                                    {reorderingId === order.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <RotateCcw className="w-3 h-3 mr-1.5" />
                                    )}
                                    Repetir Pedido
                                </Button>
                                <Button
                                    onClick={() => handleViewDetails(order.id)}
                                    variant="outline"
                                    className="flex-1 sm:flex-none hover:bg-black hover:text-white transition-colors"
                                >
                                    Ver Detalles
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))
            }

            <OrderDetailModal
                orderId={selectedOrderId}
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </div >
    )
}
