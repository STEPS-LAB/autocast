import 'server-only'

import { unstable_cache, unstable_noStore as noStore } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { SERVICES as STATIC_SERVICES } from '@/lib/data/services'
import type { ServiceListItem } from '@/types'
import type { LucideIcon } from 'lucide-react'
import { ClipboardCheck, Layers, ListChecks, MessageCircleQuestion, Sparkles } from 'lucide-react'

interface DbServiceRow {
  id: string
  slug: string
  name_ua: string
  description_ua: string
  image_url: string | null
  content: Record<string, unknown> | string | null
  sort_order: number | null
  is_active: boolean | null
  created_at: string
}

export interface ServiceContentStep {
  text: string
}

export interface ServiceContentIncludedItem {
  text: string
  icon: LucideIcon
}

export interface ServiceDetail {
  slug: string
  title: string
  shortDescription: string
  image: string
  intro: string
  metaDescription: string
  whatIncluded: ServiceContentIncludedItem[]
  whyIntro: string
  whyImage: string | null
  whyMatters: string[]
  howSteps: ServiceContentStep[]
  faqs: Array<{ q: string; a: string }>
  relatedSlugs: string[]
}

const DEFAULT_SERVICE_IMAGE = '/images/placeholder-category.svg'
const FALLBACK_ICON = Sparkles

const ICON_BY_KEY: Record<string, LucideIcon> = {
  check: ClipboardCheck,
  layers: Layers,
  steps: ListChecks,
  faq: MessageCircleQuestion,
  sparkles: Sparkles,
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(item => typeof item === 'string')
}

function asContentObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      return {}
    }
  }
  return {}
}

function normalizeWhatIncluded(value: unknown): ServiceContentIncludedItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const raw = item.trim()
        if (!raw) return null
        if (raw.startsWith('{')) {
          try {
            const parsed = JSON.parse(raw) as Record<string, unknown>
            const text = asString(parsed.text).trim()
            if (!text) return null
            const iconKey = asString(parsed.icon, 'sparkles')
            const icon = ICON_BY_KEY[iconKey] ?? FALLBACK_ICON
            return { text, icon }
          } catch {
            return { text: raw, icon: FALLBACK_ICON }
          }
        }
        return { text: raw, icon: FALLBACK_ICON }
      }
      if (!item || typeof item !== 'object') return null
      const source = item as Record<string, unknown>
      const text = asString(source.text).trim()
      if (!text) return null
      const iconKey = asString(source.icon, 'sparkles')
      const icon = ICON_BY_KEY[iconKey] ?? FALLBACK_ICON
      return { text, icon }
    })
    .filter((item): item is ServiceContentIncludedItem => item !== null)
}

function normalizeHowSteps(value: unknown): ServiceContentStep[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const raw = item.trim()
        if (!raw) return null
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>
          const text = asString(parsed.text).trim() || asString(parsed.title).trim()
          if (!text) return null
          return { text }
        } catch {
          return { text: raw }
        }
      }
      if (!item || typeof item !== 'object') return null
      const source = item as Record<string, unknown>
      const text = asString(source.text).trim() || asString(source.title).trim()
      if (!text) return null
      return { text }
    })
    .filter((item): item is ServiceContentStep => item !== null)
}

function normalizeFaqs(value: unknown): Array<{ q: string; a: string }> {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const raw = item.trim()
        if (!raw) return null
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>
          const q = asString(parsed.q).trim()
          const a = asString(parsed.a).trim()
          if (!q || !a) return null
          return { q, a }
        } catch {
          return null
        }
      }
      if (!item || typeof item !== 'object') return null
      const q = asString((item as Record<string, unknown>).q).trim()
      const a = asString((item as Record<string, unknown>).a).trim()
      if (!q || !a) return null
      return { q, a }
    })
    .filter((item): item is { q: string; a: string } => item !== null)
}

const STATIC_FAQS_BY_SLUG: Record<string, Array<{ q: string; a: string }>> = Object.fromEntries(
  STATIC_SERVICES.map(service => [service.slug, service.faqs])
)
const STATIC_SERVICE_BY_SLUG: Record<string, (typeof STATIC_SERVICES)[number]> = Object.fromEntries(
  STATIC_SERVICES.map(service => [service.slug, service])
)

function rowToListItem(row: DbServiceRow): ServiceListItem {
  return {
    slug: row.slug,
    title: row.name_ua,
    shortDescription: row.description_ua,
    image: row.image_url || DEFAULT_SERVICE_IMAGE,
  }
}

function rowToDetail(row: DbServiceRow): ServiceDetail {
  const content = asContentObject(row.content)
  const staticService = STATIC_SERVICE_BY_SLUG[row.slug]
  const dynamicWhatIncluded = normalizeWhatIncluded(content.whatIncluded)
  const dynamicHowSteps = normalizeHowSteps(content.howSteps)
  const dynamicFaqs = normalizeFaqs(content.faqs)
  return {
    slug: row.slug,
    title: row.name_ua,
    shortDescription: row.description_ua,
    image: row.image_url || DEFAULT_SERVICE_IMAGE,
    intro: asString(content.intro, row.description_ua),
    metaDescription: asString(content.metaDescription, row.description_ua),
    whatIncluded: dynamicWhatIncluded.length > 0 ? dynamicWhatIncluded : (staticService?.whatIncluded ?? []),
    whyIntro: asString(content.whyIntro, staticService?.whyIntro ?? row.description_ua),
    whyImage: asOptionalString(content.whyImage),
    whyMatters: normalizeWhyMatters(content.whyMatters, staticService?.whyMatters),
    howSteps: dynamicHowSteps.length > 0 ? dynamicHowSteps : (staticService?.howSteps ?? []),
    faqs: dynamicFaqs.length > 0 ? dynamicFaqs : (STATIC_FAQS_BY_SLUG[row.slug] ?? []),
    relatedSlugs: staticService?.relatedSlugs ?? asStringArray(content.relatedSlugs),
  }
}

function normalizeWhyMatters(value: unknown, fallback: string[] | undefined): string[] {
  const fromContent = asStringArray(value).map((item) => item.trim()).filter(Boolean)
  if (fromContent.length > 0) return fromContent
  return fallback ?? []
}

async function fetchServicesFromDb(): Promise<ServiceListItem[]> {
  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('services')
      .select('id,slug,name_ua,description_ua,image_url,content,sort_order,is_active,created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true, nullsFirst: false })

    if (error || !data || data.length === 0) return []

    return (data as DbServiceRow[]).map(rowToListItem)
  } catch {
    return []
  }
}

const getServicesCached = unstable_cache(
  fetchServicesFromDb,
  ['services-list-db'],
  { revalidate: 120 }
)

export async function getServicesForListing(): Promise<ServiceListItem[]> {
  return getServicesCached()
}

async function fetchServiceBySlugFromDb(slug: string): Promise<ServiceDetail | null> {
  try {
    noStore()
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('services')
      .select('id,slug,name_ua,description_ua,image_url,content,sort_order,is_active,created_at')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) return null
    return rowToDetail(data as DbServiceRow)
  } catch {
    return null
  }
}

export async function getServiceBySlug(slug: string): Promise<ServiceDetail | null> {
  return fetchServiceBySlugFromDb(slug)
}

export async function getRelatedServices(relatedSlugs: string[]): Promise<ServiceListItem[]> {
  if (relatedSlugs.length === 0) return []
  try {
    noStore()
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('services')
      .select('id,slug,name_ua,description_ua,image_url,content,sort_order,is_active,created_at')
      .in('slug', relatedSlugs)
      .eq('is_active', true)

    if (error || !data || data.length === 0) return []
    const bySlug = new Map((data as DbServiceRow[]).map(row => [row.slug, rowToListItem(row)]))
    return relatedSlugs.map(slug => bySlug.get(slug)).filter((x): x is ServiceListItem => Boolean(x))
  } catch {
    return []
  }
}

export async function getNextServices(currentSlug: string, count = 3): Promise<ServiceListItem[]> {
  if (count <= 0) return []
  noStore()
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('services')
    .select('id,slug,name_ua,description_ua,image_url,content,sort_order,is_active,created_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true, nullsFirst: false })

  if (error || !data || data.length === 0) return []
  const services = (data as DbServiceRow[]).map(rowToListItem)
  if (services.length <= 1) return []
  const currentIndex = services.findIndex((service) => service.slug === currentSlug)
  if (currentIndex < 0) return services.slice(0, Math.min(count, services.length))

  const maxItems = Math.min(count, services.length - 1)
  const result: ServiceListItem[] = []
  for (let offset = 1; offset <= maxItems; offset += 1) {
    const nextIndex = (currentIndex + offset) % services.length
    const nextService = services[nextIndex]
    if (nextService) result.push(nextService)
  }
  return result
}
