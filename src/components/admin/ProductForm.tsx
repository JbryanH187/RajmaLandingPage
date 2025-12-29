"use client"

import { useState } from "react"
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { CATEGORIES } from "@/lib/data" // We can use the static list for the dropdown options

// Schema validation
const productSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "El precio no puede ser negativo"),
    category_id: z.string().min(1, "Selecciona una categoría"),
    is_available: z.boolean().default(true),
    tags: z.string().optional(), // Comma separated string for input, array for DB
    variants: z.array(z.object({
        name: z.string().min(1, "Nombre de variante requerido"),
        price: z.coerce.number().min(0, "Precio requerido")
    }))
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
    initialData?: any // To be typed properly with DB types later
    onSuccess?: () => void
}

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null)

    // const supabase = createClientComponentClient()

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            price: initialData?.price || 0,
            category_id: initialData?.category_id || "",
            is_available: initialData?.is_available ?? true,
            tags: initialData?.tags?.join(", ") || "",
            variants: initialData?.variants || []
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "variants"
    })

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
        setIsLoading(true)
        if (!supabase) {
            toast.error("Error: Supabase no está configurado")
            setIsLoading(false)
            return
        }
        try {
            // 1. Insert/Update Product Data
            const productData = {
                name: data.name,
                description: data.description,
                price: data.price,
                category_id: data.category_id,
                is_available: data.is_available,
                tags: data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
                updated_at: new Date().toISOString(),
            }

            let productId = initialData?.id

            if (initialData) {
                // UPDATE
                const { error } = await (supabase
                    .from('products') as any)
                    .update(productData)
                    .eq('id', initialData.id)

                if (error) throw error
            } else {
                // INSERT
                const { data: newPro, error } = await (supabase
                    .from('products') as any)
                    .insert([productData])
                    .select()
                    .single()

                if (error) throw error
                productId = newPro.id
            }

            // 2. Handle Image Upload
            if (imageFile && productId) {
                const fileExt = imageFile.name.split('.').pop()
                const filePath = `products/${productId}/main.${fileExt}` // Following your schema structure

                const { error: uploadError } = await supabase.storage
                    .from('menu-images')
                    .upload(filePath, imageFile, { upsert: true })

                if (uploadError) throw uploadError

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('menu-images')
                    .getPublicUrl(filePath)

                // Update product with image url
                await (supabase
                    .from('products') as any)
                    .update({ image_url: publicUrl })
                    .eq('id', productId)
            }

            // 3. Handle Variants
            // Strategy: Delete all existing variants for this product and re-insert (simpler than syncing)
            if (productId && data.variants) {
                // Delete old
                if (initialData) {
                    await supabase.from('product_variants').delete().eq('product_id', productId)
                }

                // Insert new
                if (data.variants.length > 0) {
                    const variantsToInsert = data.variants.map(v => ({
                        product_id: productId,
                        name: v.name,
                        price: v.price
                    }))

                    const { error: variantsError } = await (supabase
                        .from('product_variants') as any)
                        .insert(variantsToInsert)

                    if (variantsError) throw variantsError
                }
            }

            toast.success(initialData ? "Producto actualizado" : "Producto creado")
            if (onSuccess) onSuccess()

        } catch (error: any) {
            console.error(error)
            toast.error("Error al guardar: " + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Basic Info */}
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Platillo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Tostada Veneno" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ingredientes, detalles..."
                                            className="resize-none h-24"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Base ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.50" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="category_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Etiquetas (Separadas por coma)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="popular, spicy, nuevo" {...field} />
                                    </FormControl>
                                    <FormDescription>Usadas para filtrar y mostrar badges.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="is_available"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Disponible</FormLabel>
                                        <FormDescription>
                                            El producto será visible para los clientes.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Right Column: Image & Variants */}
                    <div className="space-y-6">
                        {/* Image Upload */}
                        <div className="space-y-4">
                            <FormLabel>Imagen del Producto</FormLabel>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden group">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {imagePreview ? (
                                    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white font-medium flex items-center gap-2">
                                                <Upload className="w-4 h-4" /> Cambiar Imagen
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                            <ImageIcon className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">Sube una imagen</p>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP hasta 5MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Variants */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <FormLabel>Variantes (Opcional)</FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ name: "", price: 0 })}
                                    className="h-8 text-xs"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Agregar Variante
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-3 items-end p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1 space-y-2">
                                            <FormLabel className="text-xs">Nombre</FormLabel>
                                            <Input
                                                {...form.register(`variants.${index}.name`)}
                                                placeholder="Ej. Orden (3 pzas)"
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="w-24 space-y-2">
                                            <FormLabel className="text-xs">Precio</FormLabel>
                                            <Input
                                                type="number"
                                                {...form.register(`variants.${index}.price`)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {fields.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-4 italic">
                                        Sin variantes (se usará el precio base)
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-8 border-t border-gray-100">
                    <Button type="submit" disabled={isLoading} className="min-w-[150px]">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Guardar Cambios" : "Crear Platillo"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
