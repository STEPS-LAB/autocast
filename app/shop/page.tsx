import ShopContent from '@/components/shop/ShopContent'
import type { Metadata } from 'next'
import { getProductCardsFromDb, getCategories, getBrands } from '@/lib/data/catalog-db'

export const metadata: Metadata = { title: 'Магазин' }

export const revalidate = 60

export default async function ShopPage() {
  const [products, categories, brands] = await Promise.all([
    getProductCardsFromDb(),
    getCategories(),
    getBrands(),
  ])

  return <ShopContent products={products} categories={categories} brands={brands} />
}
