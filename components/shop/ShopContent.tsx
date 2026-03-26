'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ProductGrid from '@/components/shop/ProductGrid'
import ProductFilters from '@/components/shop/ProductFilters'
import SortSelect from '@/components/shop/SortSelect'
import PageTransition from '@/components/layout/PageTransition'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDiscountedProductCards } from '@/lib/hooks/useDiscountedProducts'
import type { Brand, Category, ProductCard } from '@/types'
import Link from 'next/link'
import Button from '@/components/ui/Button'

interface ShopContentProps {
  products: ProductCard[]
  categories: Category[]
  brands: Brand[]
}

export default function ShopContent({ products, categories, brands }: ShopContentProps) {
  const strictDb = process.env['NEXT_PUBLIC_CATALOG_STRICT_DB'] === 'true'
  const searchParams = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const query = searchParams.get('q') ?? ''
  const categoriesSelected = useMemo(() => {
    const raw = searchParams.getAll('category').map(s => s.trim()).filter(Boolean)
    return Array.from(new Set(raw))
  }, [searchParams])
  const brandsSelected = useMemo(() => {
    const raw = searchParams.getAll('brand').map(s => s.trim()).filter(Boolean)
    return Array.from(new Set(raw))
  }, [searchParams])
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
  const inStock = searchParams.get('inStock') === '1'
  const sortRaw = searchParams.get('sort')
  const sort = !sortRaw || sortRaw === 'default' ? 'sale' : sortRaw
  const make = searchParams.get('make') ?? ''

  const filters = { categories: categoriesSelected, brands: brandsSelected, minPrice, maxPrice, inStock }

  const allProducts = useDiscountedProductCards(products)

  const categoryDescendants = useMemo(() => {
    const idBySlug = new Map(categories.map(c => [c.slug, c.id]))
    const slugById = new Map(categories.map(c => [c.id, c.slug]))
    const childrenById = new Map<string, string[]>()
    for (const c of categories) {
      if (!c.parent_id) continue
      const list = childrenById.get(c.parent_id) ?? []
      list.push(c.id)
      childrenById.set(c.parent_id, list)
    }

    function collectSlugs(rootSlug: string): Set<string> {
      const rootId = idBySlug.get(rootSlug)
      const out = new Set<string>()
      if (!rootId) return out
      out.add(rootSlug)
      const stack = [...(childrenById.get(rootId) ?? [])]
      while (stack.length > 0) {
        const id = stack.pop()
        if (!id) break
        const slug = slugById.get(id)
        if (slug) out.add(slug)
        const kids = childrenById.get(id) ?? []
        for (const k of kids) stack.push(k)
      }
      return out
    }

    return { collectSlugs }
  }, [categories])

  const filtered = useMemo(() => {
    let products = allProducts

    if (query) {
      const q = query.toLowerCase()
      products = products.filter(p => p.name_ua.toLowerCase().includes(q))
    }
    if (categoriesSelected.length > 0) {
      const allowedSets = categoriesSelected.map(slug => categoryDescendants.collectSlugs(slug))
      products = products.filter(p => {
        const slug = p.category?.slug
        if (!slug) return false
        return allowedSets.some(set => set.has(slug))
      })
    }
    if (brandsSelected.length > 0) {
      const allowed = new Set(brandsSelected)
      products = products.filter(p => {
        const name = p.brand?.name
        return !!name && allowed.has(name)
      })
    }
    if (minPrice !== undefined) {
      products = products.filter(p => (p.sale_price ?? p.price) >= minPrice)
    }
    if (maxPrice !== undefined) {
      products = products.filter(p => (p.sale_price ?? p.price) <= maxPrice)
    }
    if (inStock) {
      products = products.filter(p => p.stock > 0)
    }

    switch (sort) {
      case 'price_asc':
        products = [...products].sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price))
        break
      case 'price_desc':
        products = [...products].sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price))
        break
      case 'sale':
        products = [...products].sort((a, b) => {
          const aDisc = a.sale_price ? 1 : 0
          const bDisc = b.sale_price ? 1 : 0
          return bDisc - aDisc
        })
        break
      case 'newest':
        // Default DB order is created_at desc; keep current order after filtering.
        break
    }

    return products
  }, [
    allProducts,
    query,
    categoriesSelected,
    brandsSelected,
    minPrice,
    maxPrice,
    inStock,
    sort,
    categoryDescendants,
  ])

  const hasFilters = Object.values(filters).some(Boolean)
  const showCatalogNotReady = strictDb && allProducts.length === 0 && !query && !hasFilters

  const headingText = categoriesSelected.length === 1
    ? allProducts.find(p => p.category?.slug === categoriesSelected[0])?.category?.name_ua ?? 'Каталог'
    : make
    ? `Запчастини для ${make}`
    : query
    ? `Результати: «${query}»`
    : 'Магазин'

  return (
    <PageTransition>
      <div className="container-xl py-10">
        <div className="mb-8">
          <h1 className="text-headline text-text-primary mb-1">{headingText}</h1>
          <p className="text-sm text-text-muted">
            {filtered.length} товар{filtered.length === 1 ? '' : filtered.length < 5 ? 'и' : 'ів'}
          </p>
        </div>

        <div className="flex gap-8">
          <div className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <ProductFilters filters={filters} categories={categories} brands={brands} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-6">
              <button
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 h-9 px-3 bg-bg-surface border border-border rounded text-sm text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
              >
                <SlidersHorizontal size={14} />
                Фільтри
                {hasFilters && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-accent text-text-primary text-[10px] flex items-center justify-center">
                    {filters.categories.length + filters.brands.length + (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) + (filters.inStock ? 1 : 0)}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-text-muted hidden sm:block">Сортувати:</span>
                <SortSelect />
              </div>
            </div>

            {showCatalogNotReady ? (
              <div className="rounded-md border border-border bg-bg-surface p-8 text-center">
                <h3 className="text-base font-semibold text-text-primary mb-1">Каталог не ініціалізовано</h3>
                <p className="text-sm text-text-muted">
                  Увімкнено strict DB режим і в БД немає товарів. Виконайте синхронізацію каталогу в адмін-панелі.
                </p>
                <div className="mt-4 flex justify-center">
                  <Link href="/admin">
                    <Button size="sm" variant="secondary">
                      Відкрити адмінку
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <ProductGrid products={filtered} />
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
                onClose={() => setFiltersOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
