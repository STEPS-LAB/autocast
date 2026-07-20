import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import ShopContent from '@/components/shop/ShopContent'
import {
  getBrands,
  getCategories,
  getCategoryFacetIndex,
  getProductCardsByIds,
} from '@/lib/data/catalog-db'
import { resolveShopCategoryIds } from '@/lib/shop/category-tree'
import { parseShopSearchParams } from '@/lib/shop/search-params'
import {
  computeFacets,
  getFacetConfigs,
  matchesFacets,
  parseFacetSelections,
} from '@/lib/shop/facets'
import {
  buildVehicleFacets,
  matchesVehicle,
  parseVehicle,
  parseVehicleSelections,
  rootSupportsVehicleFilters,
} from '@/lib/shop/vehicle'
import { sortProducts } from '@/lib/product-sort'
import { clampPage, getTotalPages, SHOP_PRODUCTS_PAGE_SIZE } from '@/lib/pagination'
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
  const vehicleEnabled = rootSupportsVehicleFilters(facetConfigs)
  const vehicleSelected = vehicleEnabled ? parseVehicleSelections(sp) : {}

  // Slim index (no images) for facets / filters / sort; full cards only for this page.
  const index = await getCategoryFacetIndex(categoryIds)

  const brandNamesInCategory = new Set(
    index.map(p => p.brand?.name).filter((name): name is string => !!name)
  )
  const categoryBrands = brands.filter(b => brandNamesInCategory.has(b.name))

  // Base filters (brand / price / stock / search) applied in memory so facet
  // options can be derived from the same normalised spec data.
  const brandSet = new Set(parsed.brand)
  const q = parsed.q?.toLowerCase()
  const baseFiltered = index.filter(p => {
    if (brandSet.size > 0 && !(p.brand && brandSet.has(p.brand.name))) return false
    if (parsed.minPrice !== undefined && p.price < parsed.minPrice) return false
    if (parsed.maxPrice !== undefined && p.price > parsed.maxPrice) return false
    if (parsed.inStock && p.stock <= 0) return false
    if (q && !p.name_ua.toLowerCase().includes(q)) return false
    return true
  })

  // Facet options reflect everything matching the base filters (not narrowed by
  // the facet selection itself, so users can keep multi-selecting).
  // When the vehicle cascade is active, hide the flat `carmake` facet — make
  // selection is handled by vmake → vmodel → vyear instead.
  const facets = computeFacets(baseFiltered, facetConfigs).filter(
    f => !(vehicleEnabled && f.key === 'carmake')
  )

  const vehicleFacets = vehicleEnabled
    ? buildVehicleFacets(baseFiltered, vehicleSelected)
    : { makes: [], models: [], years: [] }

  const filtered = baseFiltered.filter(p => {
    if (!matchesFacets(p.specs, facetSelections, facetConfigs)) return false
    if (
      vehicleEnabled &&
      !matchesVehicle(parseVehicle(p.name_ua, p.specs), vehicleSelected)
    ) {
      return false
    }
    return true
  })

  const sorted = sortProducts(filtered, parsed.sort)
  const total = sorted.length
  const pageSize = SHOP_PRODUCTS_PAGE_SIZE
  const totalPages = getTotalPages(total, pageSize)
  const page = clampPage(parsed.page, totalPages)
  const from = (page - 1) * pageSize
  const pageIds = sorted.slice(from, from + pageSize).map(p => p.id)
  const products = await getProductCardsByIds(pageIds)

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
      vehicleFacets={vehicleFacets}
      filters={{
        categories: parsed.category,
        brands: parsed.brand,
        minPrice: parsed.minPrice,
        maxPrice: parsed.maxPrice,
        inStock: parsed.inStock,
        specs: facetSelections,
        vehicle: vehicleSelected,
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
