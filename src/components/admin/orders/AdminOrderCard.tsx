"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
// import { Order } from "@/types/schema" // Use inferred type or any for now to avoid build blocks
import { Clock, MapPin, Phone, User, Printer, XCircle, CheckCircle, ChefHat, Truck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

// Temporary type definition until we have a shared one
interface AdminOrderCardProps {
    order: any
    onStatusChange: (orderId: string, newStatus: string) => void
    onViewDetails: (order: any) => void
}

export function AdminOrderCard({ order, onStatusChange, onViewDetails }: AdminOrderCardProps) {
    const isDelivery = order.order_type === 'delivery'

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'confirmed': return 'bg-blue-100 text-blue-800'
            case 'preparing': return 'bg-orange-100 text-orange-800'
            case 'ready': return 'bg-green-100 text-green-800'
            case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800'
            case 'delivered': return 'bg-gray-100 text-gray-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-600'
        }
    }

    const getNextAction = (status: string) => {
        switch (status) {
            case 'pending':
                return { label: 'Aceptar', action: 'confirmed', icon: CheckCircle, color: 'bg-blue-600 hover:bg-blue-700' }
            case 'confirmed':
                return { label: 'Cocinar', action: 'preparing', icon: ChefHat, color: 'bg-orange-600 hover:bg-orange-700' }
            case 'preparing':
                return { label: 'Listo', action: 'ready', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' }
            case 'ready':
                return isDelivery
                    ? { label: 'Enviar', action: 'out_for_delivery', icon: Truck, color: 'bg-indigo-600 hover:bg-indigo-700' }
                    : { label: 'Entregar', action: 'delivered', icon: CheckCircle, color: 'bg-gray-800 hover:bg-gray-900' }
            case 'out_for_delivery':
                return { label: 'Completar', action: 'delivered', icon: CheckCircle, color: 'bg-gray-800 hover:bg-gray-900' }
            default:
                return null
        }
    }

    const nextAction = getNextAction(order.status)
    const isGuest = !order.user_id

    return (
        <Card className="w-full shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-red-500">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">#{order.order_number || order.id.slice(0, 6)}</span>
                            <Badge variant="secondary" className={getStatusColor(order.status)}>
                                {order.status.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock size={12} />
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: es })}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
                        <div className="text-xs text-muted-foreground capitalize">{order.payment_method || 'Efectivo'}</div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-2">
                {/* Customer Info */}
                <div className="bg-gray-50 p-2 rounded-md mb-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <User size={14} className="text-gray-500" />
                        <span className="font-medium truncate">
                            {order.profiles?.full_name || order.guest_name || 'Cliente'}
                        </span>
                        {isGuest && <Badge variant="outline" className="text-[10px] h-4 px-1">Invitado</Badge>}
                    </div>
                    {isDelivery && (
                        <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-gray-500 mt-0.5 shrink-0" />
                            <span className="text-xs text-gray-600 line-clamp-2">
                                {order.delivery_address}
                            </span>
                        </div>
                    )}
                </div>

                {/* Items Preview */}
                <div className="space-y-1 mb-3">
                    {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="gap-2 flex">
                                <span className="font-bold text-gray-600">{item.quantity}x</span>
                                <span className="line-clamp-1">{item.products?.name || 'Producto'}</span>
                            </span>
                            {/* <span className="text-gray-500">{formatCurrency(item.subtotal)}</span> */}
                        </div>
                    ))}
                    {order.order_items?.length > 3 && (
                        <div className="text-xs text-muted-foreground italic pl-6">
                            + {order.order_items.length - 3} más...
                        </div>
                    )}
                </div>

                {order.notes && (
                    <div className="bg-yellow-50 text-yellow-800 p-2 rounded text-xs border border-yellow-200 mb-2">
                        <span className="font-bold">Nota:</span> {order.notes}
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-4 pt-0 gap-2">
                {nextAction && (
                    <Button
                        className={`flex-1 ${nextAction.color} text-white`}
                        onClick={() => onStatusChange(order.id, nextAction.action)}
                    >
                        <nextAction.icon size={16} className="mr-2" />
                        {nextAction.label}
                    </Button>
                )}

                <Button variant="outline" size="icon" onClick={() => onViewDetails(order)}>
                    <Printer size={16} />
                </Button>
            </CardFooter>
        </Card>
    )
}
