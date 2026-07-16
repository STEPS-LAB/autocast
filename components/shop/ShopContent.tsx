'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ProductGrid from '@/components/shop/ProductGrid'
import ProductFilters from '@/components/shop/ProductFilters'
import SortSelect from '@/components/shop/SortSelect'
import PageTransition from '@/components/layout/PageTransition'
import Pagination from '@/components/ui/Pagination'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDiscountedProductCards } from '@/lib/hooks/useDiscountedProducts'
import { pageRangeLabel } from '@/lib/pagination'
import { getRootCategories } from '@/lib/shop/category-tree'
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
  heading: string
  /** Current filter selection from URL (already parsed on server). */
  filters: {
    categories: string[]
    brands: string[]
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
  }
  query?: string
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
  heading,
  filters,
  query,
}: ShopContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const displayProducts = useDiscountedProductCards(products)
  const rootCategories = useMemo(() => getRootCategories(categories), [categories])

  const hasFilters =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    !!filters.inStock

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (nextPage <= 1) params.delete('page')
    else params.set('page', String(nextPage))
    const next = params.toString()
    router.push(next ? `${pathname}?${next}` : pathname)
  }

  const emptyCatalog = total === 0 && !query && !hasFilters

  return (
    <PageTransition>
      <div className="container-xl py-10">
        <div className="mb-8">
          {mode === 'category' && (
            <Link
              href="/shop"
              className="inline-block text-xs text-text-muted hover:text-accent mb-2 transition-colors"
            >
              ← Усі товари
            </Link>
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

        <div className="flex gap-8">
          <div className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <ProductFilters
                filters={filters}
                categories={categories}
                brands={brands}
                mode={mode}
                rootCategory={rootCategory}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-6">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 h-9 px-3 bg-bg-surface border border-border rounded text-sm text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
              >
                <SlidersHorizontal size={14} />
                Фільтри
                {hasFilters && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-accent text-text-primary text-[10px] flex items-center justify-center">
                    {filters.categories.length +
                      filters.brands.length +
                      (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
                      (filters.inStock ? 1 : 0)}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-text-muted hidden sm:block">Сортувати:</span>
                <SortSelect />
              </div>
            </div>

            {mode === 'hub' && rootCategories.length > 0 && (
              <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {rootCategories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/shop/${cat.slug}`}
                    className={cn(
                      'rounded-md border border-border bg-bg-surface',
                      'px-4 py-3.5 text-sm font-medium text-text-primary truncate',
                      'hover:border-accent/40 hover:bg-bg-elevated transition-colors'
                    )}
                  >
                    {cat.name_ua}
                  </Link>
                ))}
              </div>
            )}

            {emptyCatalog ? (
              <div className="rounded-md border border-border bg-bg-surface p-8 text-center">
                <p className="text-sm text-text-muted">Товари відсутні</p>
              </div>
            ) : (
              <>
                <ProductGrid products={displayProducts} />
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
        {filtersOpen && (
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
                filters={filters}
                categories={categories}
                brands={brands}
                mode={mode}
                rootCategory={rootCategory}
                onClose={() => setFiltersOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
