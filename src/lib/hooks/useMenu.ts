// hooks/useMenu.ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category, Product, ProductVariant } from '@/types/product'

export function useMenu() {
    const [categories, setCategories] = useState<Category[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchMenu = useCallback(async () => {
        setLoading(true)
        setError(null)

        const controller = new AbortController()
        const signal = controller.signal

        try {
            if (!supabase) throw new Error('Supabase not configured')

            // Fetch Data
            const [categoriesResponse, productsResponse] = await Promise.all([
                (supabase.from('categories') as any).select('*').order('sort_order').abortSignal(signal),
                (supabase.from('products') as any)
                    .select(`*, product_variants (*)`)
                    .eq('is_available', true)
                    .order('sort_order', { ascending: true })
                    .abortSignal(signal)
            ])

            if (categoriesResponse.error) throw categoriesResponse.error
            if (productsResponse.error) throw productsResponse.error

            // Transform Categories
            const transformedCategories: Category[] = (categoriesResponse.data || []).map((cat: any) => ({
                id: cat.id,
                label: cat.label
            }))

            // Transform Products
            const transformedProducts: Product[] = (productsResponse.data || []).map((product: any) => ({
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
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Menu fetch aborted')
                return
            }
            console.error('Error fetching menu:', err)
            setError(err as Error)
        } finally {
            if (!signal.aborted) {
                setLoading(false)
            }
        }

        return () => controller.abort()
    }, [])

    useEffect(() => {
        const cleanup = fetchMenu()
        return () => {
            cleanup.then(abort => abort && abort())
        }
    }, [fetchMenu])



    return { categories, products, loading, error, refresh: fetchMenu }
}