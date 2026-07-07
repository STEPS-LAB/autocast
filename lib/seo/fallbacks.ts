import { BUSINESS, SITE_NAME } from '@/lib/seo/site'

/** Shared robots directive — always indexable public pages. */
export const INDEX_ROBOTS = { index: true, follow: true } as const

export function safeText(value: string | null | undefined, fallback: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed.length > 0 ? trimmed : fallback
}

export function safeSlug(value: string | null | undefined, fallback = 'item'): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed.length > 0 ? trimmed : fallback
}

export function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

export function serviceTitleFallback(slug?: string): string {
  if (!slug) return 'Автопослуга Autocast'
  return `Послуга ${slug.replace(/-/g, ' ')} — Autocast`
}

export function serviceDescriptionFallback(title: string): string {
  const name = safeText(title, 'Автопослуга')
  return `${name} у майстерні ${SITE_NAME}, Житомир. Професійний монтаж, консультація та гарантія на роботи.`
}

export function productNameFallback(slug?: string): string {
  if (!slug) return 'Товар Autocast'
  return slug.replace(/-/g, ' ')
}

export function productDescriptionFallback(name: string): string {
  const label = safeText(name, 'Автотовар')
  return `${label} — купити в інтернет-магазині ${SITE_NAME}. Преміальна якість, доставка по Україні.`
}

export function categoryNameFallback(slug?: string): string {
  if (!slug) return 'Каталог'
  return slug.replace(/-/g, ' ')
}

export function categoryDescriptionFallback(name: string): string {
  const label = safeText(name, 'Автоелектроніка')
  return `Каталог ${label.toLowerCase()} в інтернет-магазині ${SITE_NAME}. Преміальні бренди, доставка по Україні.`
}

export function defaultSiteDescription(): string {
  return BUSINESS.description
}
