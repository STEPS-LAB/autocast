'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import {
  DEFAULT_SHOP_PRODUCT_SORT,
  parseProductSortKey,
  type ProductSortKey,
} from '@/lib/product-sort'
import { useClientMounted } from '@/lib/hooks/useClientMounted'

/** Зафіксовано тут, щоб HMR не підміняв список на ADMIN_PRODUCT_SORT_OPTIONS. */
const OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: 'name_asc', label: 'Назва: А → Я' },
  { value: 'name_desc', label: 'Назва: Я → А' },
  { value: 'price_asc', label: 'Ціна: зростання' },
  { value: 'price_desc', label: 'Ціна: спадання' },
]

export default function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const mounted = useClientMounted()

  const fromUrl = parseProductSortKey(
    searchParams.get('sort'),
    OPTIONS,
    DEFAULT_SHOP_PRODUCT_SORT
  )
  // До mount тримаємо дефолт, щоб SSR і перший клієнтський прохід збігались.
  const current: ProductSortKey = mounted ? fromUrl : DEFAULT_SHOP_PRODUCT_SORT

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (value === DEFAULT_SHOP_PRODUCT_SORT) {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    const next = params.toString()
    router.push(next ? `${pathname}?${next}` : pathname)
  }

  return (
    <div className="relative">
      <select
        value={current}
        onChange={e => handleChange(e.target.value)}
        suppressHydrationWarning
        className="h-9 pl-3 pr-8 bg-bg-surface border border-border rounded text-sm text-text-secondary appearance-none cursor-pointer focus:outline-none focus:border-accent transition-colors hover:border-border-light"
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </div>
  )
}
