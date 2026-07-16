import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import ShopContent from '@/components/shop/ShopContent'
import { getBrands, getCategories, getShopProductsPage } from '@/lib/data/catalog-db'
import { resolveShopCategoryIds } from '@/lib/shop/category-tree'
import { parseShopSearchParams } from '@/lib/shop/search-params'
import {
  categoryDescriptionFallback,
  categoryNameFallback,
} from '@/lib/seo/fallbacks'
import { buildPageMetadata, truncateDescription } from '@/lib/seo/metadata'
import { KEYWORD_CLUSTERS } from '@/lib/seo/site'
import ShopLoading from '../loading'

export const revalidate = 60

type Props = {
  params: Promise<{ category: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const categories = await getCategories({ dbOnly: true }).catch(() => [])
  const cat = categories.find(c => c.slug === category && !c.parent_id)
  const name = cat?.name_ua ?? categoryNameFallback(category)

  return buildPageMetadata({
    title: `${name} — купити в Україні`,
    description: truncateDescription(
      cat?.name_ua
        ? `Каталог ${cat.name_ua.toLowerCase()} в інтернет-магазині Autocast. Преміальні бренди, доставка по Україні.`
        : categoryDescriptionFallback(name)
    ),
    path: `/shop/${category}`,
    keywords: [
      name,
      `${name} купити`,
      'Autocast',
      'автоелектроніка',
      ...KEYWORD_CLUSTERS.nationalShop.slice(0, 3),
    ],
  })
}

async function CategoryShop({ params, searchParams }: Props) {
  const [{ category: slug }, sp] = await Promise.all([params, searchParams])
  const parsed = parseShopSearchParams(sp)
  const [categories, brands] = await Promise.all([getCategories(), getBrands()])

  const root = categories.find(c => c.slug === slug && !c.parent_id)
  if (!root) notFound()

  const categoryIds = resolveShopCategoryIds(categories, root.slug, parsed.category)
  const result = await getShopProductsPage({
    categoryIds,
    brandNames: parsed.brand,
    minPrice: parsed.minPrice,
    maxPrice: parsed.maxPrice,
    inStock: parsed.inStock,
    q: parsed.q,
    sort: parsed.sort,
    page: parsed.page,
  })

  return (
    <ShopContent
      products={result.products}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      totalPages={result.totalPages}
      categories={categories}
      brands={brands}
      mode="category"
      rootCategory={root}
      heading={root.name_ua}
      query={parsed.q}
      filters={{
        categories: parsed.category,
        brands: parsed.brand,
        minPrice: parsed.minPrice,
        maxPrice: parsed.maxPrice,
        inStock: parsed.inStock,
      }}
    />
  )
}

export default function CategoryShopPage(props: Props) {
  return (
    <Suspense fallback={<ShopLoading />}>
      <CategoryShop {...props} />
    </Suspense>
  )
}
