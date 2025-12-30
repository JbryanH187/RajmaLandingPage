"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Search } from "lucide-react"
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

export default function MenuPage() {
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any | null>(null)
    const [productToDelete, setProductToDelete] = useState<string | null>(null)

    // const supabase = createClientComponentClient() // Removed in favor of direct import

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
        product.category_id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-serif">Gestión de Menú</h1>
                    <p className="text-muted-foreground">Administra tus platillos ({products.length} total)</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) setEditingProduct(null)
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                            <Plus className="h-4 w-4" />
                            Nuevo Platillo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? 'Editar Platillo' : 'Nuevo Platillo'}</DialogTitle>
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
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Buscar por nombre o categoría..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 max-w-md bg-white"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-xs">
                        <tr>
                            <th className="px-6 py-4 font-medium">Producto</th>
                            <th className="px-6 py-4 font-medium">Categoría</th>
                            <th className="px-6 py-4 font-medium">Precio</th>
                            <th className="px-6 py-4 font-medium">Variantes</th>
                            <th className="px-6 py-4 text-right font-medium">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    Cargando menú...
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    No se encontraron productos.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden relative border border-gray-200">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">IMG</div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-900 block">{product.name}</span>
                                                {!product.is_available && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">
                                                        No Disponible
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 uppercase text-xs tracking-wide">
                                        {product.category_id}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-medium text-gray-700">
                                        {formatCurrency(product.price)}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {product.variants?.length > 0 ? (
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                                {product.variants.length} variantes
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-900 hover:bg-red-50"
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
                                                className="h-8 w-8 text-red-500 hover:text-red-900 hover:bg-red-50"
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El producto será eliminado permanentemente del menú.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
    )
}
