import { absoluteUrl } from '@/lib/seo/metadata'
import {
  productDescriptionFallback,
  safeArray,
  safeSlug,
  safeText,
  serviceDescriptionFallback,
} from '@/lib/seo/fallbacks'
import { BUSINESS, DEFAULT_OG_IMAGE, SITE_DOMAIN, SITE_NAME } from '@/lib/seo/site'
import type { ServiceDetail } from '@/lib/data/services-db'
import type { Product } from '@/types'

const SCHEMA_CONTEXT = 'https://schema.org'
const DEFAULT_PRODUCT_IMAGE = '/images/placeholder-product.svg'

function businessAddress() {
  return {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.address.street,
    addressLocality: BUSINESS.address.locality,
    addressRegion: BUSINESS.address.region,
    postalCode: BUSINESS.address.postalCode,
    addressCountry: BUSINESS.address.country,
  }
}

function businessGeo() {
  return {
    '@type': 'GeoCoordinates',
    latitude: BUSINESS.geo.latitude,
    longitude: BUSINESS.geo.longitude,
  }
}

function openingHoursSpecification() {
  return BUSINESS.openingHours.map(spec => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: spec.days,
    opens: spec.opens,
    closes: spec.closes,
  }))
}

export function buildLocalBusinessSchema(siteUrl?: string) {
  const url = absoluteUrl('/', siteUrl)
  return {
    '@type': ['AutoRepair', 'LocalBusiness', 'Store'],
    '@id': `${url}#business`,
    name: SITE_NAME,
    legalName: BUSINESS.legalName,
    url,
    image: absoluteUrl(DEFAULT_OG_IMAGE, siteUrl),
    logo: absoluteUrl('/images/mk.svg', siteUrl),
    description: BUSINESS.description,
    email: BUSINESS.email,
    telephone: BUSINESS.phones,
    foundingDate: String(BUSINESS.foundingYear),
    address: businessAddress(),
    geo: businessGeo(),
    openingHoursSpecification: openingHoursSpecification(),
    areaServed: [
      { '@type': 'City', name: 'Житомир' },
      { '@type': 'AdministrativeArea', name: 'Житомирська область' },
      { '@type': 'Country', name: 'Україна' },
    ],
    priceRange: '₴₴',
    currenciesAccepted: 'UAH',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer',
    sameAs: [BUSINESS.social.instagram, BUSINESS.social.facebook],
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${BUSINESS.address.street}, ${BUSINESS.address.locality}`)}`,
  }
}

export function buildWebSiteSchema(siteUrl?: string) {
  const url = absoluteUrl('/', siteUrl)
  return {
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name: SITE_NAME,
    url,
    inLanguage: 'uk-UA',
    publisher: { '@id': `${url}#business` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>,
  siteUrl?: string
) {
  const validItems = items.filter(item => safeText(item.name, '') && safeText(item.path, ''))
  if (validItems.length === 0) return null

  return {
    '@type': 'BreadcrumbList',
    itemListElement: validItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: safeText(item.name, SITE_NAME),
      item: absoluteUrl(item.path, siteUrl),
    })),
  }
}

export function buildServiceSchema(service: ServiceDetail, siteUrl?: string) {
  const slug = safeSlug(service.slug, 'service')
  const title = safeText(service.title, 'Автопослуга Autocast')
  const description = safeText(
    service.metaDescription || service.intro || service.shortDescription,
    serviceDescriptionFallback(title)
  )
  const url = absoluteUrl(`/services/${slug}`, siteUrl)

  return {
    '@type': 'Service',
    '@id': `${url}#service`,
    name: title,
    description,
    url,
    image: absoluteUrl(service.image || DEFAULT_OG_IMAGE, siteUrl),
    provider: { '@id': `${absoluteUrl('/', siteUrl)}#business` },
    areaServed: {
      '@type': 'City',
      name: 'Житомир',
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: 'Житомирська область',
      },
    },
    serviceType: title,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'UAH',
      availability: `${SCHEMA_CONTEXT}/InStock`,
      areaServed: 'Житомир',
      seller: { '@id': `${absoluteUrl('/', siteUrl)}#business` },
    },
  }
}

export function buildFaqPageSchema(
  faqs: Array<{ q: string; a: string }> | null | undefined,
  pageUrl: string,
  siteUrl?: string
) {
  const validFaqs = safeArray(faqs).filter(faq => safeText(faq.q, '') && safeText(faq.a, ''))
  if (validFaqs.length === 0) return null

  const url = absoluteUrl(pageUrl, siteUrl)
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: validFaqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }
}

export function buildProductSchema(
  product: Product,
  options?: {
    siteUrl?: string
    reviewCount?: number
    ratingValue?: number
  }
) {
  const siteUrl = options?.siteUrl
  const slug = safeSlug(product.slug, 'product')
  const name = safeText(product.name_ua, 'Товар Autocast')
  const description = safeText(product.description_ua, productDescriptionFallback(name))
  const url = absoluteUrl(`/product/${slug}`, siteUrl)
  const displayPrice = Number.isFinite(product.sale_price ?? product.price)
    ? (product.sale_price ?? product.price)
    : 0
  const images = safeArray(product.images).filter(Boolean)
  const image = images.length
    ? images.map(img => absoluteUrl(img, siteUrl))
    : [absoluteUrl(DEFAULT_PRODUCT_IMAGE, siteUrl)]

  const schema: Record<string, unknown> = {
    '@type': 'Product',
    '@id': `${url}#product`,
    name,
    description,
    image,
    sku: safeText(product.id, slug),
    url,
    brand: product.brand?.name
      ? { '@type': 'Brand', name: product.brand.name }
      : undefined,
    category: product.category?.name_ua || undefined,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'UAH',
      price: String(displayPrice),
      availability:
        product.stock > 0
          ? `${SCHEMA_CONTEXT}/InStock`
          : `${SCHEMA_CONTEXT}/OutOfStock`,
      itemCondition: `${SCHEMA_CONTEXT}/NewCondition`,
      seller: { '@id': `${absoluteUrl('/', siteUrl)}#business` },
    },
  }

  const reviewCount = options?.reviewCount ?? 0
  if (reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: options?.ratingValue ?? 5,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return schema
}

export function buildOrganizationSchema(siteUrl?: string) {
  const url = absoluteUrl('/', siteUrl)
  return {
    '@type': 'Organization',
    '@id': `${url}#organization`,
    name: SITE_NAME,
    url,
    logo: absoluteUrl('/images/mk.svg', siteUrl),
    email: BUSINESS.email,
    telephone: BUSINESS.phones[0],
    address: businessAddress(),
    sameAs: [BUSINESS.social.instagram, BUSINESS.social.facebook],
    contactPoint: BUSINESS.phones.map(phone => ({
      '@type': 'ContactPoint',
      telephone: phone,
      contactType: 'customer service',
      areaServed: 'UA',
      availableLanguage: ['Ukrainian'],
    })),
  }
}

/** ItemList for services index — helps LLMs map service offerings. */
export function buildServiceListSchema(
  services: Array<{ slug: string; title: string; shortDescription: string }> | null | undefined,
  siteUrl?: string
) {
  const validServices = safeArray(services).filter(
    service => safeSlug(service.slug, '') && safeText(service.title, '')
  )
  if (validServices.length === 0) return null

  const url = absoluteUrl('/services', siteUrl)
  return {
    '@type': 'ItemList',
    '@id': `${url}#service-list`,
    name: `Послуги ${SITE_NAME} у Житомирі`,
    itemListElement: validServices.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: safeText(service.title, 'Послуга Autocast'),
      url: absoluteUrl(`/services/${safeSlug(service.slug)}`, siteUrl),
      description: safeText(service.shortDescription, serviceDescriptionFallback(service.title)),
    })),
  }
}

export { SITE_DOMAIN }
