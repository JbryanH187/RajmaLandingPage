import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { HistoryService } from "@/lib/services/history-service"
import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Store, Bike, Copy, Check, X } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
// import { format } from "date-fns" // Assuming date-fns is available or use native

interface OrderDetailModalProps {
    orderId: string | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function OrderDetailModal({ orderId, isOpen, onOpenChange }: OrderDetailModalProps) {
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (isOpen && orderId) {
            loadDetails(orderId)
        } else {
            setOrder(null)
        }
    }, [isOpen, orderId])

    const loadDetails = async (id: string) => {
        setLoading(true)
        try {
            const data = await HistoryService.getOrderDetails(id)
            setOrder(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        if (!order) return
        const typeText = order.order_type === 'pickup' ? 'Pick Up (Recoger)' : 'Domicilio';
        const addressText = order.order_type === 'delivery' && order.delivery_address ? `\nDirección: ${order.delivery_address}` : '';
        const orderText = `*Orden Rajma Sushi*\nTipo: ${typeText}\nCliente: ${order.guest_name || 'Usuario'}${addressText}\nTotal: ${formatCurrency(order.total)}\n\nItems:\n${order.items?.map((i: any) => `- ${i.quantity}x ${i.product_name} ${i.variant_name ? `(${i.variant_name})` : ''}`).join('\n')}`

        navigator.clipboard.writeText(orderText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!order && loading) return null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-sm w-full">
                {/* TICKET MOCKUP */}
                <div className="bg-zinc-50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] text-center relative overflow-y-auto overflow-x-hidden transition-colors duration-500 rounded-none w-full max-h-[85vh] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">

                    {/* Header Badge REMOVED */}

                    {/* Background Icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none z-0 transform -rotate-12 scale-150">
                        {order?.order_type === 'pickup' ? <Store className="w-64 h-64 text-red-600" strokeWidth={1} /> : <Bike className="w-64 h-64 text-red-600" strokeWidth={1} />}
                    </div>

                    {/* Top ZigZag */}
                    <div
                        className="absolute top-0 left-0 right-0 h-4 bg-transparent z-10"
                        style={{
                            background: `
                                linear-gradient(135deg, transparent 50%, #fafafa 50%),
                                linear-gradient(225deg, transparent 50%, #fafafa 50%)
                            `,
                            backgroundSize: '20px 20px',
                            backgroundPosition: 'top center',
                            transform: 'rotate(180deg)',
                            marginTop: '20px'
                        }}
                    />

                    <div className="p-6 pt-8 pb-12 space-y-4 relative z-10 opacity-90">

                        {loading ? (
                            <div className="py-20 animate-pulse text-muted-foreground">Cargando ticket...</div>
                        ) : order ? (
                            <>
                                {/* Brand Header */}
                                <div className="space-y-2 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-3xl mb-2 text-white font-serif shadow-lg">
                                        {order.order_type === 'pickup' ? '🥡' : '🛵'}
                                    </div>
                                    <DialogTitle className="font-serif text-2xl font-bold uppercase tracking-widest text-black text-center">Rajma Sushi</DialogTitle>
                                    <DialogDescription className="sr-only">Comprobante de orden</DialogDescription>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                                        Comprobante #{order.order_number}
                                    </p>

                                    {/* STATUS BADGE - Color Coded */}
                                    <div className="mt-2">
                                        {(() => {
                                            const s = (order.status || '').toLowerCase();
                                            let colorClass = "bg-gray-100 text-gray-800 border-gray-200"; // Default
                                            let icon = null;

                                            // Logic: Green (Success), Yellow (Caution/Pending), Red (Critical/Error)
                                            if (['completed', 'delivered', 'paid'].includes(s)) {
                                                colorClass = "bg-green-100 text-green-700 border-green-200";
                                            } else if (['pending', 'processing', 'cooking', 'confirmed', 'created'].includes(s)) {
                                                colorClass = "bg-amber-50 text-amber-700 border-amber-200";
                                            } else if (['cancelled', 'failed', 'rejected'].includes(s)) {
                                                colorClass = "bg-red-50 text-red-700 border-red-200";
                                            } else if (['info'].includes(s)) {
                                                colorClass = "bg-blue-50 text-blue-700 border-blue-200";
                                            }

                                            return (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${colorClass}`}>
                                                    {s === 'completed' ? 'Completada' : s === 'pending' ? 'En Proceso' : s === 'cancelled' ? 'Cancelada' : s}
                                                </span>
                                            )
                                        })()}
                                    </div>
                                </div>

                                <div className="border-t-2 border-dashed border-gray-200 my-4" />

                                {/* Customer Info Box */}
                                <div className="flex flex-col gap-3 text-left bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center text-lg text-black font-serif flex-shrink-0">
                                            {(order.guest_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Cliente</p>
                                            <p className="font-bold text-base leading-tight truncate">{order.guest_name || 'Usuario Registrado'}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                                                {new Date(order.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-1 pt-2 border-t border-gray-100">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                                            {order.order_type === 'pickup' ? 'Método de Entrega' : 'Dirección'}
                                        </p>
                                        {order.order_type === 'pickup' ? (
                                            <p className="text-xs font-medium leading-normal text-gray-700">
                                                Pasar a Recoger (Pick Up)
                                            </p>
                                        ) : (
                                            <p className="text-xs font-medium leading-normal text-gray-700 line-clamp-2">
                                                {order.delivery_address || "Sin dirección registrada"}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="space-y-2 text-left bg-zinc-50">
                                    {order.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-200 last:border-0 border-dashed">
                                            <div className="pr-4">
                                                <span className="font-bold text-black">{item.quantity}x</span> {item.product_name}
                                                {item.variant_name && <span className="text-xs text-muted-foreground block pl-5">{item.variant_name}</span>}
                                                {item.notes && <span className="text-[10px] text-amber-600 block pl-5 italic">Note: {item.notes}</span>}
                                            </div>
                                            <span className="font-mono text-gray-500 whitespace-nowrap">{formatCurrency(item.subtotal)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t-2 border-black border-dashed my-4" />

                                {/* Total */}
                                <div className="space-y-1">
                                    {order.delivery_fee > 0 && (
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Envío</span>
                                            <span>{formatCurrency(order.delivery_fee)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-xl font-bold">
                                        <span>TOTAL</span>
                                        <span>{formatCurrency(order.total)}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground text-right capitalize">
                                        {order.payment_method}
                                    </div>
                                </div>

                                {/* QR & Actions */}
                                <div className="flex justify-center py-4 bg-white rounded-xl mt-4 relative overflow-hidden">
                                    <QRCodeSVG value={`https://rajma-sushi.vercel.app/order/${order.id}`} size={100} opacity={0.8} />
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <Button
                                        variant="outline"
                                        className="w-full border-gray-200 text-gray-700 hover:border-red-600 hover:text-red-600 hover:bg-red-50 transition-all"
                                        onClick={handleCopy}
                                    >
                                        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                        {copied ? 'Copiado' : 'Copiar'}
                                    </Button>
                                    <Button
                                        className="w-full bg-black hover:bg-black/80 text-white"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        <X className="mr-2 h-4 w-4" /> Cerrar
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-red-500 py-10">Error cargando información</div>
                        )}

                    </div>

                    {/* Bottom ZigZag */}
                    <div
                        className="relative w-full h-4 bg-transparent z-10"
                        style={{
                            background: `
                                linear-gradient(135deg, transparent 50%, #fafafa 50%),
                                linear-gradient(225deg, transparent 50%, #fafafa 50%)
                            `,
                            backgroundSize: '20px 20px',
                            backgroundPosition: 'bottom center'
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
