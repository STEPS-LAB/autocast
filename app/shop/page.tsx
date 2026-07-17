import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import ShopContent from '@/components/shop/ShopContent'
import { getBrands, getCategories, getShopProductsPage } from '@/lib/data/catalog-db'
import { resolveShopCategoryIds } from '@/lib/shop/category-tree'
import { parseShopSearchParams } from '@/lib/shop/search-params'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { KEYWORD_CLUSTERS } from '@/lib/seo/site'
import ShopLoading from './loading'

export const metadata = buildPageMetadata({
  title: 'Інтернет-магазин автоелектроніки',
  description:
    'Магазин Autocast: автозвук, автосвітло, автоелектроніка, системи безпеки. Преміальні бренди, доставка по всій Україні.',
  path: '/shop',
  keywords: KEYWORD_CLUSTERS.nationalShop,
})

export const revalidate = 60

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function ShopHub({ searchParams }: Props) {
  const sp = await searchParams
  const parsed = parseShopSearchParams(sp)
  const [categories, brands] = await Promise.all([getCategories(), getBrands()])

  // Legacy ?category=rootSlug → dedicated page
  if (parsed.category.length === 1) {
    const only = categories.find(c => c.slug === parsed.category[0])
    if (only && !only.parent_id) {
      const rest = new URLSearchParams()
      if (parsed.q) rest.set('q', parsed.q)
      for (const b of parsed.brand) rest.append('brand', b)
      if (parsed.minPrice !== undefined) rest.set('minPrice', String(parsed.minPrice))
      if (parsed.maxPrice !== undefined) rest.set('maxPrice', String(parsed.maxPrice))
      if (parsed.inStock) rest.set('inStock', '1')
      if (parsed.sort) rest.set('sort', parsed.sort)
      const qs = rest.toString()
      redirect(qs ? `/shop/${only.slug}?${qs}` : `/shop/${only.slug}`)
    }
  }

  const categoryIds = resolveShopCategoryIds(categories, null, parsed.category)
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

  const heading = parsed.q ? `Результати: «${parsed.q}»` : 'Магазин'

  return (
    <ShopContent
      products={result.products}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      totalPages={result.totalPages}
      categories={categories}
      brands={brands}
      mode="hub"
      heading={heading}
      query={parsed.q}
      facets={[]}
      filters={{
        categories: parsed.category,
        brands: parsed.brand,
        minPrice: parsed.minPrice,
        maxPrice: parsed.maxPrice,
        inStock: parsed.inStock,
        specs: {},
      }}
    />
  )
}

export default function ShopPage(props: Props) {
  return (
    <Suspense fallback={<ShopLoading />}>
      <ShopHub {...props} />
    </Suspense>
  )
}
