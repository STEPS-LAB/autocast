import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  // Deterministic formatting to avoid hydration mismatches between server/client.
  // We intentionally do NOT use `Intl.NumberFormat(..., { style: 'currency' })`
  // because its output (e.g. `₴` vs `грн`) can differ across environments/locales.
  const rounded = Math.round(price)
  const sign = rounded < 0 ? '-' : ''
  const abs = Math.abs(rounded)
  const digits = abs.toString()

  // Thousands separator as NBSP (typography-friendly and stable).
  const withSeparators = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')
  return `${sign}${withSeparators}\u00A0₴`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** SEO service URL slugs: lowercase letters, digits, hyphens only. */
export const SERVICE_SLUG_REGEX = /^[a-z0-9-]+$/

export function validateServiceSlug(slug: string): string | null {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) return null
  if (!SERVICE_SLUG_REGEX.test(normalized)) {
    return 'Слаг може містити лише малі латинські літери, цифри та дефіси.'
  }
  return null
}

export function normalizeServiceSlugInput(slug: string): string {
  return slug.trim().toLowerCase()
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

export function getDiscountPercent(price: number, salePrice: number): number {
  return Math.round(((price - salePrice) / price) * 100)
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

/** Smooth in-page anchor scroll without enabling global `scroll-behavior: smooth`. */
export function smoothScrollToAnchor(
  event: { preventDefault: () => void },
  href: string,
) {
  event.preventDefault()

  const id = href.startsWith('#') ? href.slice(1) : href
  if (!id) return

  const target = document.getElementById(id)
  if (!target) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  })

  window.history.pushState(null, '', `#${id}`)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
