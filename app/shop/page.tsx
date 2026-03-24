import { Suspense } from 'react'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import ShopContent from '@/components/shop/ShopContent'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Brand, Category, ProductCard } from '@/types'

export const metadata: Metadata = { title: 'Магазин' }

type ProductCardRow = {
  id: string
  slug: string
  name_ua: string
  price: number
  sale_price: number | null
  images: string[]
  stock: number
  category?: { name_ua: string; slug: string } | { name_ua: string; slug: string }[]
  brand?: { name: string } | { name: string }[]
}

function unwrapRelation<T>(value?: T | T[]): T | undefined {
  if (!value) return undefined
  return Array.isArray(value) ? value[0] : value
}

export default async function ShopPage() {
  const supabase = await createClient()
  const [productsResult, categoriesResult, brandsResult] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id,slug,name_ua,price,sale_price,images,stock,
        category:categories(name_ua,slug),
        brand:brands(name)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('id,slug,name_ua,parent_id,image_url,sort_order')
      .order('sort_order', { ascending: true }),
    supabase
      .from('brands')
      .select('id,name,logo_url')
      .order('name', { ascending: true }),
  ])

  const products: ProductCard[] = (productsResult.data as ProductCardRow[] | null)?.map((row) => {
    const category = unwrapRelation(row.category)
    const brand = unwrapRelation(row.brand)
    return {
      id: row.id,
      slug: row.slug,
      name_ua: row.name_ua,
      price: Number(row.price),
      sale_price: row.sale_price === null ? null : Number(row.sale_price),
      images: row.images ?? [],
      stock: row.stock,
      category: category ? { name_ua: category.name_ua, slug: category.slug } : undefined,
      brand: brand ? { name: brand.name } : undefined,
    }
  }) ?? []

  const categories = (categoriesResult.data as Category[] | null) ?? []
  const brands = (brandsResult.data as Brand[] | null) ?? []

  return (
    <Suspense fallback={<div className="container-xl py-10"><ProductGridSkeleton count={8} /></div>}>
      <ShopContent products={products} categories={categories} brands={brands} />
    </Suspense>
  )
}
