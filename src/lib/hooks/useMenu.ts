// hooks/useMenu.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category, Product, ProductVariant } from '@/types/product' // imported ProductVariant

export function useMenu() {
    const [categories, setCategories] = useState<Category[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        async function fetchMenu() {
            try {
                // Obtener categorías
                const { data: categoriesData, error: catError } = await (supabase
                    .from('categories') as any)
                    .select('*')
                    .order('sort_order')

                if (catError) throw catError

                // Obtener productos con variantes
                const { data: productsData, error: prodError } = await (supabase
                    .from('products') as any)
                    .select(`
            *,
            product_variants (*)
          `)
                    .eq('is_available', true)
                    .order('sort_order', { ascending: true })

                if (prodError) throw prodError

                // Transformar datos al formato esperado
                const transformedCategories: Category[] = (categoriesData || []).map((cat: any) => ({
                    id: cat.id,
                    label: cat.label
                }))

                // We need to typecase productsData because Supabase types with joins can be tricky to infer automatically
                const rawProducts = productsData as any[]

                const transformedProducts: Product[] = (rawProducts || []).map((product: any) => ({
                    id: product.id,
                    name: product.name,
                    description: product.description || undefined,
                    price: Number(product.price),
                    category: product.category_id,
                    image: product.image_url || undefined,
                    tags: product.tags || undefined,
                    isAvailable: product.is_available,
                    variants: (product.product_variants || [])
                        .map((v: any) => ({
                            id: v.id,
                            name: v.name,
                            price: Number(v.price)
                        }))
                        .sort((a: ProductVariant, b: ProductVariant) => a.price - b.price)
                }))

                setCategories(transformedCategories)
                setProducts(transformedProducts)
            } catch (err) {
                setError(err as Error)
                console.error('Error fetching menu:', err)
            } finally {
                setLoading(false)
            }
        }

        if (supabase) {
            fetchMenu()
        } else {
            setLoading(false)
            setError(new Error('Supabase not configured'))
        }
    }, [])

    return { categories, products, loading, error }
}