'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clampPage, getTotalPages } from '@/lib/pagination'

interface PaginationProps {
  page: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 1
  const safeTotalItems = Number.isFinite(totalItems) && totalItems > 0 ? totalItems : 0
  const totalPages = getTotalPages(safeTotalItems, safePageSize)
  const currentPage = clampPage(page, totalPages)

  if (totalPages <= 1) return null

  function goTo(nextPage: number) {
    const safe = clampPage(nextPage, totalPages)
    if (safe === currentPage) return
    onPageChange(safe)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pages = buildPageNumbers(currentPage, totalPages)

  return (
    <nav
      className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 pt-6', className)}
      aria-label="Пагінація"
    >
      <p className="text-sm text-text-muted order-2 sm:order-1">
        Сторінка {currentPage} з {totalPages}
      </p>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          type="button"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          className={paginationButtonClass(currentPage <= 1)}
          aria-label="Попередня сторінка"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-text-muted text-sm">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => goTo(item)}
              aria-current={item === currentPage ? 'page' : undefined}
              className={cn(
                paginationButtonClass(false),
                'min-w-9',
                item === currentPage && 'bg-accent text-text-primary border-accent'
              )}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={paginationButtonClass(currentPage >= totalPages)}
          aria-label="Наступна сторінка"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  )
}

function paginationButtonClass(disabled: boolean) {
  return cn(
    'inline-flex items-center justify-center h-9 px-2.5 rounded border text-sm transition-colors',
    disabled
      ? 'border-border text-text-muted opacity-50 cursor-not-allowed'
      : 'border-border bg-bg-surface text-text-primary hover:bg-bg-elevated hover:border-border-light'
  )
}

function buildPageNumbers(current: number, total: number): Array<number | 'ellipsis'> {
  const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 1
  const safeCurrent = clampPage(current, safeTotal)

  if (safeTotal <= 7) {
    return Array.from({ length: safeTotal }, (_, index) => index + 1)
  }

  const middle = new Set<number>()
  for (let page = safeCurrent - 1; page <= safeCurrent + 1; page++) {
    if (page > 1 && page < safeTotal) middle.add(page)
  }

  const pages: Array<number | 'ellipsis'> = [1]

  if (middle.size > 0 && Math.min(...middle) > 2) {
    pages.push('ellipsis')
  }

  pages.push(...Array.from(middle).sort((a, b) => a - b))

  if (middle.size > 0 && Math.max(...middle) < safeTotal - 1) {
    pages.push('ellipsis')
  }

  if (safeTotal > 1) pages.push(safeTotal)

  return pages
}
