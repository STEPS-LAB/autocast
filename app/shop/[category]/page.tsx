import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { CATEGORIES } from '@/lib/data/seed'

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const cat = CATEGORIES.find(c => c.slug === category)
  return {
    title: cat ? `${cat.name_ua} | Магазин` : 'Категорія',
  }
}

export async function generateStaticParams() {
  return CATEGORIES.map(cat => ({ category: cat.slug }))
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  redirect(`/shop?category=${category}`)
}
