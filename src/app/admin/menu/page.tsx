"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Search, ChefHat, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { ProductForm } from "@/components/admin/ProductForm"
import { formatCurrency } from "@/lib/utils"
import { AdminShell } from "@/components/admin/AdminShell"
import { useTheme } from "@/lib/hooks/useTheme"

export default function MenuPage() {
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any | null>(null)
    const [productToDelete, setProductToDelete] = useState<string | null>(null)
    const { isDark } = useTheme()

    const fetchProducts = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                variants:product_variants(*)
            `)
            .order('name')

        if (error) {
            toast.error("Error al cargar productos")
            console.error(error)
        } else {
            setProducts(data || [])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const handleDelete = async () => {
        if (!productToDelete) return

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productToDelete)

        if (error) {
            toast.error("Error al eliminar")
        } else {
            toast.success("Producto eliminado")
            fetchProducts()
        }
        setProductToDelete(null)
    }

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category_id?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Theme-aware classes
    const cardBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'
    const headerBg = isDark ? 'bg-zinc-800/50' : 'bg-gray-50'
    const textHead = isDark ? 'text-zinc-400' : 'text-gray-500'
    const textMain = isDark ? 'text-white' : 'text-gray-900'
    const textMuted = isDark ? 'text-zinc-500' : 'text-gray-400'
    const rowHover = isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'
    const inputBg = isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500' : 'bg-white border-gray-200'

    return (
        <AdminShell onRefresh={fetchProducts} isRefreshing={isLoading}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-3xl font-bold flex items-center gap-3 ${textMain}`}>
                            <ChefHat className="text-red-500" />
                            Gestión de Menú
                        </h1>
                        <p className={textMuted}>{products.length} productos en el menú</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) setEditingProduct(null)
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
                                <Plus className="h-4 w-4" />
                                Nuevo Platillo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-zinc-900 border-zinc-800' : ''}`}>
                            <DialogHeader>
                                <DialogTitle className={textMain}>{editingProduct ? 'Editar Platillo' : 'Nuevo Platillo'}</DialogTitle>
                                <DialogDescription>
                                    {editingProduct ? 'Modifica los datos del platillo existente.' : 'Agrega un nuevo platillo a tu menú.'}
                                </DialogDescription>
                            </DialogHeader>
                            <ProductForm
                                initialData={editingProduct}
                                onSuccess={() => {
                                    setIsDialogOpen(false)
                                    fetchProducts()
                                    setEditingProduct(null)
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textMuted}`} />
                    <Input
                        placeholder="Buscar por nombre o categoría..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`pl-10 ${inputBg}`}
                    />
                </div>

                {/* Products Table */}
                <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
                    <table className="w-full text-left text-sm">
                        <thead className={`border-b ${headerBg} ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                            <tr>
                                <th className={`px-6 py-4 font-medium text-xs uppercase tracking-wider ${textHead}`}>Producto</th>
                                <th className={`px-6 py-4 font-medium text-xs uppercase tracking-wider ${textHead}`}>Categoría</th>
                                <th className={`px-6 py-4 font-medium text-xs uppercase tracking-wider ${textHead}`}>Precio</th>
                                <th className={`px-6 py-4 font-medium text-xs uppercase tracking-wider ${textHead}`}>Variantes</th>
                                <th className={`px-6 py-4 text-right font-medium text-xs uppercase tracking-wider ${textHead}`}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-gray-100'}`}>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className={`px-6 py-12 text-center ${textMuted}`}>
                                        Cargando menú...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className={`px-6 py-12 text-center ${textMuted}`}>
                                        No se encontraron productos.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className={`${rowHover} transition-colors group`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-lg overflow-hidden border ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200'}`}>
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
                                                    ) : (
                                                        <div className={`w-full h-full flex items-center justify-center text-xs ${textMuted}`}>IMG</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className={`font-semibold block ${textMain}`}>{product.name}</span>
                                                    {!product.is_available && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">
                                                            No Disponible
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 uppercase text-xs tracking-wide ${textMuted}`}>
                                            {product.category_id}
                                        </td>
                                        <td className={`px-6 py-4 font-mono font-medium ${textMain}`}>
                                            {formatCurrency(product.price)}
                                        </td>
                                        <td className={`px-6 py-4 text-xs ${textMuted}`}>
                                            {product.variants?.length > 0 ? (
                                                <span className={`px-2 py-1 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                                                    {product.variants.length} variantes
                                                </span>
                                            ) : (
                                                <span>-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`h-8 w-8 ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                                                    onClick={() => {
                                                        setEditingProduct(product)
                                                        setIsDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => setProductToDelete(product.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
                    <AlertDialogContent className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
                        <AlertDialogHeader>
                            <AlertDialogTitle className={textMain}>¿Eliminar producto?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. El producto será eliminado permanentemente del menú.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className={isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700' : ''}>
                                Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AdminShell>
    )
}
