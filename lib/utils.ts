import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  const rounded = Math.round(price)
  const sign = rounded < 0 ? '-' : ''
  const abs = Math.abs(rounded)
  const digits = abs.toString()
  const withSeparators = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')
  return `${sign}${withSeparators}\u00A0₴`
}

export function formatDate(date: string | Date): string {
  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return '—'

  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Ukrainian + Russian Cyrillic → Latin for SEO-friendly slugs. */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ye',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'yi',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'yu',
  я: 'ya',
  ы: 'y',
  э: 'e',
  ё: 'yo',
  ъ: '',
}

export function transliterateCyrillic(str: string): string {
  let out = ''
  for (const char of str) {
    const lower = char.toLowerCase()
    const mapped = CYRILLIC_TO_LATIN[lower]
    if (mapped !== undefined) {
      out += mapped
    } else {
      out += char
    }
  }
  return out
}

/**
 * Slug for category/product names that may contain Cyrillic.
 * Transliterates first so Ukrainian titles become readable Latin slugs.
 */
export function slugifyName(str: string, fallback = 'item'): string {
  const slug = slugify(transliterateCyrillic(str.trim()))
  return slug || fallback
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

/**
 * Нормалізує пару price/sale_price: list = вища, sale = нижча.
 * У фідах інколи місця переплутані — UI завжди показує коректну знижку.
 */
export function resolveSalePricing(price: number, salePrice: number | null | undefined) {
  if (salePrice == null || !Number.isFinite(salePrice) || salePrice <= 0) {
    return {
      listPrice: price,
      salePrice: null as number | null,
      displayPrice: price,
      discountPercent: null as number | null,
    }
  }
  const high = Math.max(price, salePrice)
  const low = Math.min(price, salePrice)
  if (!(high > low) || high <= 0) {
    return {
      listPrice: price,
      salePrice: null as number | null,
      displayPrice: price,
      discountPercent: null as number | null,
    }
  }
  const discountPercent = Math.round(((high - low) / high) * 100)
  if (discountPercent <= 0) {
    return {
      listPrice: price,
      salePrice: null as number | null,
      displayPrice: price,
      discountPercent: null as number | null,
    }
  }
  return {
    listPrice: high,
    salePrice: low,
    displayPrice: low,
    discountPercent,
  }
}

export function getDiscountPercent(price: number, salePrice: number): number {
  return resolveSalePricing(price, salePrice).discountPercent ?? 0
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
  const isMobile = window.matchMedia('(max-width: 767px)').matches
  const mobileTopOffset = 80

  if (id === 'contact' && isMobile) {
    const formAnchor =
      target.querySelector<HTMLElement>('[data-contact-form]') ?? target
    const top = formAnchor.getBoundingClientRect().top + window.scrollY - mobileTopOffset
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  } else {
    target.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

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
