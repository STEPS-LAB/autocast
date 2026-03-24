import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCategories } from '@/lib/data/catalog-db'

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const categories = await getCategories()
  const cat = categories.find(c => c.slug === category)
  return {
    title: cat ? `${cat.name_ua} | Магазин` : 'Категорія',
  }
}

export const dynamic = 'force-dynamic'

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  redirect(`/shop?category=${category}`)
}
