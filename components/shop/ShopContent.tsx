'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ProductGrid from '@/components/shop/ProductGrid'
import ProductFilters from '@/components/shop/ProductFilters'
import ActiveFilters from '@/components/shop/ActiveFilters'
import CategoryTiles from '@/components/shop/CategoryTiles'
import SortSelect from '@/components/shop/SortSelect'
import PageTransition from '@/components/layout/PageTransition'
import Pagination from '@/components/ui/Pagination'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pageRangeLabel } from '@/lib/pagination'
import { countActiveFacetSelections, type Facet } from '@/lib/shop/facets'
import {
  countActiveVehicleSelections,
  type VehicleFacets,
  type VehicleSelections,
} from '@/lib/shop/vehicle'
import type { Brand, Category, ProductCard } from '@/types'

interface ShopContentProps {
  products: ProductCard[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  categories: Category[]
  brands: Brand[]
  mode: 'hub' | 'category'
  rootCategory?: Category | null
  /** All live roots backing this page (alias-group merge). */
  rootCategories?: Category[]
  heading: string
  /** Current filter selection from URL (already parsed on server). */
  filters: {
    categories: string[]
    brands: string[]
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    specs?: Record<string, string[]>
    vehicle?: VehicleSelections
  }
  /** Spec-based facets available for the current category (empty on the hub). */
  facets?: Facet[]
  /** Cascading make → model → year facets (empty when unsupported). */
  vehicleFacets?: VehicleFacets
  query?: string
  /** Category ids that have at least one product (plus ancestors). */
  occupiedCategoryIds?: string[]
}

export default function ShopContent({
  products,
  total,
  page,
  pageSize,
  totalPages,
  categories,
  brands,
  mode,
  rootCategory = null,
  rootCategories,
  heading,
  filters,
  facets = [],
  vehicleFacets = { makes: [], models: [], years: [], cascade: {} },
  query,
  occupiedCategoryIds,
}: ShopContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [optimisticVehicle, setOptimisticVehicle] = useState<VehicleSelections | null>(
    null
  )

  const serverVehicle = filters.vehicle ?? {}
  useEffect(() => {
    setOptimisticVehicle(null)
  }, [serverVehicle.make, serverVehicle.model, serverVehicle.year])

  const displayFilters = useMemo(
    () => ({
      ...filters,
      vehicle: optimisticVehicle ?? filters.vehicle,
    }),
    [filters, optimisticVehicle]
  )

  const filterRoots = rootCategories?.length
    ? rootCategories
    : rootCategory
      ? [rootCategory]
      : []

  // Filters only exist on a selected-category page, never on the /shop hub.
  const showFilters = mode === 'category'
  const specCount = countActiveFacetSelections(displayFilters.specs ?? {})
  const vehicleCount = countActiveVehicleSelections(displayFilters.vehicle ?? {})

  const hasFilters =
    displayFilters.categories.length > 0 ||
    displayFilters.brands.length > 0 ||
    displayFilters.minPrice !== undefined ||
    displayFilters.maxPrice !== undefined ||
    !!displayFilters.inStock ||
    specCount > 0 ||
    vehicleCount > 0

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (nextPage <= 1) params.delete('page')
    else params.set('page', String(nextPage))
    const next = params.toString()
    startTransition(() => {
      router.replace(next ? `${pathname}?${next}` : pathname)
    })
  }

  const emptyCatalog = total === 0 && !query && !hasFilters

  return (
    <PageTransition>
      <div className="container-xl py-10">
        <div className="mb-8">
          {mode === 'category' && (
            <nav aria-label="Хлібні крихти" className="mb-2 text-xs text-text-muted">
              <Link href="/" className="hover:text-accent transition-colors">
                Головна
              </Link>
              <span className="mx-1.5 text-border-light">›</span>
              <Link href="/shop" className="hover:text-accent transition-colors">
                Магазин
              </Link>
              {rootCategory && (
                <>
                  <span className="mx-1.5 text-border-light">›</span>
                  <span className="text-text-secondary">{rootCategory.name_ua}</span>
                </>
              )}
            </nav>
          )}
          <h1 className="text-headline text-text-primary mb-1">{heading}</h1>
          <p className="text-sm text-text-muted">
            {total === 0
              ? 'Товари відсутні'
              : `${total} товар${total === 1 ? '' : total < 5 ? 'и' : 'ів'}`}
            {total > pageSize && (
              <span>
                {' '}
                · {pageRangeLabel(page, pageSize, total)}
              </span>
            )}
          </p>
        </div>

        {mode === 'hub' && categories.length > 0 && (
          <CategoryTiles
            categories={categories}
            variant="hub"
            occupiedCategoryIds={occupiedCategoryIds}
          />
        )}

        {mode === 'category' && categories.length > 0 && (
          <CategoryTiles
            categories={categories}
            variant="compact"
            activeSlug={rootCategory?.slug}
            occupiedCategoryIds={occupiedCategoryIds}
          />
        )}

        <div className="flex gap-8">
          {showFilters && (
            <div className="hidden lg:block w-56 shrink-0 self-start sticky top-24 max-h-[calc(100vh-6.5rem)]">
              <ProductFilters
                filters={displayFilters}
                facets={facets}
                vehicleFacets={vehicleFacets}
                categories={categories}
                brands={brands}
                mode={mode}
                rootCategory={rootCategory}
                rootCategories={filterRoots}
                occupiedCategoryIds={occupiedCategoryIds}
                scrollable
                onVehicleOptimistic={setOptimisticVehicle}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-6">
              {showFilters && (
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 h-9 px-3 bg-bg-surface border border-border rounded text-sm text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  Фільтри
                  {hasFilters && (
                    <span className="min-w-4 h-4 px-1 rounded-full bg-accent text-text-primary text-[10px] flex items-center justify-center">
                      {displayFilters.categories.length +
                        displayFilters.brands.length +
                        (displayFilters.minPrice !== undefined ||
                        displayFilters.maxPrice !== undefined
                          ? 1
                          : 0) +
                        (displayFilters.inStock ? 1 : 0) +
                        specCount +
                        vehicleCount}
                    </span>
                  )}
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-text-muted hidden sm:block">Сортувати:</span>
                <SortSelect />
              </div>
            </div>

            {showFilters && (
              <ActiveFilters
                filters={displayFilters}
                facets={facets}
                categories={categories}
                onVehicleOptimistic={setOptimisticVehicle}
              />
            )}

            {emptyCatalog ? (
              <div className="rounded-md border border-border bg-bg-surface p-8 text-center">
                <p className="text-sm text-text-muted">Товари відсутні</p>
              </div>
            ) : (
              <>
                <ProductGrid products={products} />
                {totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalItems={total}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 lg:hidden"
              onClick={() => setFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className={cn(
                'fixed left-0 inset-y-0 z-50 w-72 bg-bg-surface border-r border-border',
                'p-5 overflow-y-auto lg:hidden'
              )}
            >
              <ProductFilters
                filters={displayFilters}
                facets={facets}
                vehicleFacets={vehicleFacets}
                categories={categories}
                brands={brands}
                mode={mode}
                rootCategory={rootCategory}
                rootCategories={filterRoots}
                occupiedCategoryIds={occupiedCategoryIds}
                onClose={() => setFiltersOpen(false)}
                onVehicleOptimistic={setOptimisticVehicle}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
