import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCategories } from '@/lib/data/catalog-db'
import {
  categoryDescriptionFallback,
  categoryNameFallback,
} from '@/lib/seo/fallbacks'
import { buildPageMetadata, truncateDescription } from '@/lib/seo/metadata'
import { KEYWORD_CLUSTERS } from '@/lib/seo/site'

interface Props {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const categories = await getCategories({ dbOnly: true }).catch(() => [])
  const cat = categories.find(c => c.slug === category)
  const name = cat?.name_ua ?? categoryNameFallback(category)

  return buildPageMetadata({
    title: `${name} — купити в Україні`,
    description: truncateDescription(
      cat?.name_ua
        ? `Каталог ${cat.name_ua.toLowerCase()} в інтернет-магазині Autocast. Преміальні бренди, доставка по Україні.`
        : categoryDescriptionFallback(name)
    ),
    path: cat?.slug ? `/shop?category=${cat.slug}` : '/shop',
    image: cat?.image_url,
    keywords: [name, `${name} купити`, 'Autocast', 'автоелектроніка', ...KEYWORD_CLUSTERS.nationalShop.slice(0, 3)],
  })
}

export const dynamic = 'force-dynamic'

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  redirect(`/shop?category=${category}`)
}
