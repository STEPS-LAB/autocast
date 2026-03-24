'use client'

import { useRef, useEffect, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, X, Clock, TrendingUp, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearch } from '@/lib/hooks/useSearch'
import { formatPrice, cn } from '@/lib/utils'

interface SmartSearchBarProps {
  compact?: boolean
  autoFocus?: boolean
  className?: string
}

export default function SmartSearchBar({
  compact = false,
  autoFocus = false,
  className,
}: SmartSearchBarProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    query, setQuery, results, loading,
    open, setOpen, recent, clearRecent,
    popularSearches, submit,
  } = useSearch()

  const [activeIndex, setActiveIndex] = [
    useRef(-1).current,
    (i: number) => { activeRef.current = i },
  ]
  const activeRef = useRef(-1)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setOpen])

  const allOptions = results.map(r => ({
    type: 'result' as const,
    slug: r.slug,
    name: r.name_ua,
    price: r.price,
    sale_price: r.sale_price,
    image: r.images[0],
  }))

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const total = allOptions.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      activeRef.current = Math.min(activeRef.current + 1, total - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      activeRef.current = Math.max(activeRef.current - 1, -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const active = allOptions[activeRef.current]
      if (active) {
        router.push(`/product/${active.slug}`)
        submit(query)
        setQuery('')
      } else if (query.trim()) {
        router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
        submit(query)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  function handleSelect(q: string, isSlug?: boolean) {
    if (isSlug) {
      router.push(`/product/${q}`)
      submit(q)
    } else {
      router.push(`/shop?q=${encodeURIComponent(q)}`)
      submit(q)
    }
    setQuery('')
    setOpen(false)
  }

  const showDropdown = open && (query.trim() || recent.length > 0 || popularSearches.length > 0)

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-accent" />
          ) : (
            <Search size={16} />
          )}
        </span>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Пошук товарів…"
          autoComplete="off"
          className={cn(
            'no-focus-outline w-full bg-bg-surface border border-border rounded',
            'text-text-primary placeholder:text-text-muted text-sm',
            'pl-9 pr-8 transition-colors duration-150',
            'focus:outline-none focus-visible:outline-none focus-visible:outline-0 focus:border-border-light focus:ring-0 focus-visible:ring-0',
            compact ? 'h-9' : 'h-11'
          )}
        />

        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Очистити"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 z-50 bg-bg-surface border border-border rounded-md shadow-lg overflow-hidden"
          >
            {/* Results */}
            {results.length > 0 && (
              <div>
                <div className="px-3 py-2 border-b border-border">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Результати
                  </span>
                </div>
                {allOptions.map((opt, i) => (
                  <button
                    key={opt.slug}
                    onClick={() => handleSelect(opt.slug, true)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                      'hover:bg-bg-elevated',
                      activeIndex === i && 'bg-bg-elevated'
                    )}
                  >
                    {opt.image && (
                      <div className="relative size-10 rounded bg-bg-elevated shrink-0 overflow-hidden">
                        <Image
                          src={opt.image}
                          alt={opt.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{opt.name}</p>
                      <p className="text-xs text-accent font-medium price mt-0.5">
                        {formatPrice(opt.sale_price ?? opt.price)}
                      </p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-border p-2">
                  <button
                    onClick={() => handleSelect(query)}
                    className="w-full text-left px-2 py-1.5 text-xs text-accent hover:bg-bg-elevated rounded transition-colors"
                  >
                    Показати всі результати для «{query}»
                  </button>
                </div>
              </div>
            )}

            {/* Empty state with hints */}
            {!loading && !results.length && query.trim() && (
              <div className="p-4 text-center">
                <p className="text-sm text-text-muted">Нічого не знайдено для «{query}»</p>
              </div>
            )}

            {/* Recent searches */}
            {!query.trim() && recent.length > 0 && (
              <div>
                <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={11} /> Нещодавні
                  </span>
                  <button
                    onClick={clearRecent}
                    className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                  >
                    Очистити
                  </button>
                </div>
                {recent.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSelect(q)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-bg-elevated transition-colors"
                  >
                    <Clock size={13} className="text-text-muted shrink-0" />
                    <span className="text-sm text-text-secondary">{q}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular */}
            {!query.trim() && (
              <div>
                <div className="px-3 py-2 border-t border-border">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={11} /> Популярні
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 px-3 pb-3">
                  {popularSearches.slice(0, 4).map(q => (
                    <button
                      key={q}
                      onClick={() => handleSelect(q)}
                      className="px-2.5 py-1 bg-bg-elevated border border-border rounded text-xs text-text-secondary hover:border-border-light hover:text-text-primary transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
