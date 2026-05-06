import 'server-only'

import { unstable_cache } from 'next/cache'
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
  content: Record<string, unknown> | null
  sort_order: number | null
  is_active: boolean | null
  created_at: string
}

export interface ServiceContentStep {
  title: string
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(item => typeof item === 'string')
}

function normalizeWhatIncluded(value: unknown): ServiceContentIncludedItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const text = asString((item as Record<string, unknown>).text).trim()
      if (!text) return null
      const iconKey = asString((item as Record<string, unknown>).icon, 'sparkles')
      const icon = ICON_BY_KEY[iconKey] ?? FALLBACK_ICON
      return { text, icon }
    })
    .filter((item): item is ServiceContentIncludedItem => item !== null)
}

function normalizeHowSteps(value: unknown): ServiceContentStep[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const title = asString((item as Record<string, unknown>).title).trim()
      const text = asString((item as Record<string, unknown>).text).trim()
      if (!title || !text) return null
      return { title, text }
    })
    .filter((item): item is ServiceContentStep => item !== null)
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
  const content = (row.content ?? {}) as Record<string, unknown>
  const staticService = STATIC_SERVICE_BY_SLUG[row.slug]
  return {
    slug: row.slug,
    title: row.name_ua,
    shortDescription: row.description_ua,
    image: row.image_url || DEFAULT_SERVICE_IMAGE,
    intro: asString(content.intro, row.description_ua),
    metaDescription: asString(content.metaDescription, row.description_ua),
    whatIncluded: staticService?.whatIncluded ?? normalizeWhatIncluded(content.whatIncluded),
    whyIntro: staticService?.whyIntro ?? asString(content.whyIntro, row.description_ua),
    whyMatters: staticService?.whyMatters ?? asStringArray(content.whyMatters),
    howSteps: staticService?.howSteps ?? normalizeHowSteps(content.howSteps),
    faqs: STATIC_FAQS_BY_SLUG[row.slug] ?? [],
    relatedSlugs: staticService?.relatedSlugs ?? asStringArray(content.relatedSlugs),
  }
}

async function fetchServicesFromDb(): Promise<ServiceListItem[]> {
  try {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('services')
      .select('id,slug,name_ua,description_ua,image_url,content,sort_order,is_active,created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false })

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
