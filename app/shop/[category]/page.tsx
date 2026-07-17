import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import ShopContent from '@/components/shop/ShopContent'
import { getBrands, getCategories, getCategoryProductsWithSpecs } from '@/lib/data/catalog-db'
import { resolveShopCategoryIds } from '@/lib/shop/category-tree'
import { parseShopSearchParams } from '@/lib/shop/search-params'
import {
  computeFacets,
  getFacetConfigs,
  matchesFacets,
  parseFacetSelections,
} from '@/lib/shop/facets'
import { sortProducts } from '@/lib/product-sort'
import { clampPage, getTotalPages, SHOP_PRODUCTS_PAGE_SIZE } from '@/lib/pagination'
import type { ProductCard } from '@/types'
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
  const facetConfigs = getFacetConfigs(root.slug)
  const facetSelections = parseFacetSelections(sp, facetConfigs)

  const allProducts = await getCategoryProductsWithSpecs(categoryIds)

  const brandNamesInCategory = new Set(
    allProducts.map(p => p.brand?.name).filter((name): name is string => !!name)
  )
  const categoryBrands = brands.filter(b => brandNamesInCategory.has(b.name))

  // Base filters (brand / price / stock / search) applied in memory so facet
  // options can be derived from the same normalised spec data.
  const brandSet = new Set(parsed.brand)
  const q = parsed.q?.toLowerCase()
  const baseFiltered = allProducts.filter(p => {
    if (brandSet.size > 0 && !(p.brand && brandSet.has(p.brand.name))) return false
    if (parsed.minPrice !== undefined && p.price < parsed.minPrice) return false
    if (parsed.maxPrice !== undefined && p.price > parsed.maxPrice) return false
    if (parsed.inStock && p.stock <= 0) return false
    if (q && !p.name_ua.toLowerCase().includes(q)) return false
    return true
  })

  // Facet options reflect everything matching the base filters (not narrowed by
  // the facet selection itself, so users can keep multi-selecting).
  const facets = computeFacets(baseFiltered, facetConfigs)

  const filtered = baseFiltered.filter(p =>
    matchesFacets(p.specs, facetSelections, facetConfigs)
  )

  const sorted = sortProducts(filtered, parsed.sort)
  const total = sorted.length
  const pageSize = SHOP_PRODUCTS_PAGE_SIZE
  const totalPages = getTotalPages(total, pageSize)
  const page = clampPage(parsed.page, totalPages)
  const from = (page - 1) * pageSize
  const products: ProductCard[] = sorted.slice(from, from + pageSize).map(p => ({
    id: p.id,
    slug: p.slug,
    name_ua: p.name_ua,
    price: p.price,
    sale_price: p.sale_price,
    images: p.images,
    stock: p.stock,
    created_at: p.created_at,
    category: p.category,
    brand: p.brand,
  }))

  return (
    <ShopContent
      products={products}
      total={total}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
      categories={categories}
      brands={categoryBrands}
      mode="category"
      rootCategory={root}
      heading={root.name_ua}
      query={parsed.q}
      facets={facets}
      filters={{
        categories: parsed.category,
        brands: parsed.brand,
        minPrice: parsed.minPrice,
        maxPrice: parsed.maxPrice,
        inStock: parsed.inStock,
        specs: facetSelections,
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
