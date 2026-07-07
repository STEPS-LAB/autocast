import ShopContent from '@/components/shop/ShopContent'
import { getProductCardsFromDb, getCategories, getBrands } from '@/lib/data/catalog-db'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { KEYWORD_CLUSTERS } from '@/lib/seo/site'

export const metadata = buildPageMetadata({
  title: 'Інтернет-магазин автоелектроніки',
  description:
    'Магазин Autocast: автозвук, автосвітло, автоелектроніка, системи безпеки. Преміальні бренди, доставка по всій Україні.',
  path: '/shop',
  keywords: KEYWORD_CLUSTERS.nationalShop,
})

export const revalidate = 60

export default async function ShopPage() {
  const [products, categories, brands] = await Promise.all([
    getProductCardsFromDb(),
    getCategories(),
    getBrands(),
  ])

  return <ShopContent products={products} categories={categories} brands={brands} />
}
