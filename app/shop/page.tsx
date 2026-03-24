import { Suspense } from 'react'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import ShopContent from '@/components/shop/ShopContent'
import type { Metadata } from 'next'
import { getBrands, getCategories, getProductCardsFromDb } from '@/lib/data/catalog-db'

export const metadata: Metadata = { title: 'Магазин' }

export default async function ShopPage() {
  const [products, categories, brands] = await Promise.all([
    getProductCardsFromDb(),
    getCategories(),
    getBrands(),
  ])

  return (
    <Suspense fallback={<div className="container-xl py-10"><ProductGridSkeleton count={8} /></div>}>
      <ShopContent products={products} categories={categories} brands={brands} />
    </Suspense>
  )
}
