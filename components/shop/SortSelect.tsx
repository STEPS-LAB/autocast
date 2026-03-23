'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'default', label: 'За замовчуванням' },
  { value: 'price_asc', label: 'Ціна: від низької' },
  { value: 'price_desc', label: 'Ціна: від високої' },
  { value: 'newest', label: 'Нові надходження' },
  { value: 'sale', label: 'Акційні товари' },
]

export default function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('sort') ?? 'default'

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'default') {
      params.delete('sort')
    } else {
      params.set('sort', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative">
      <select
        value={current}
        onChange={e => handleChange(e.target.value)}
        className="h-9 pl-3 pr-8 bg-bg-surface border border-border rounded text-sm text-text-secondary appearance-none cursor-pointer focus:outline-none focus:border-accent transition-colors hover:border-border-light"
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </div>
  )
}
