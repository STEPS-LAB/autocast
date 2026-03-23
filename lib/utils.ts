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
