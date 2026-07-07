import type { ReactNode } from 'react'
import { JsonLdGraph } from '@/lib/seo/json-ld'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { buildBreadcrumbSchema, buildLocalBusinessSchema } from '@/lib/seo/schemas'
import { KEYWORD_CLUSTERS } from '@/lib/seo/site'
import { getSiteUrl } from '@/lib/supabase/env'

export const metadata = buildPageMetadata({
  title: 'Контакти Autocast у Житомирі',
  description:
    'Звʼяжіться з Autocast: адреса вулиця Вітрука 12в, Житомир. Телефони, email, графік роботи. Запис на установку автозвуку, фар, магнітол та сигналізацій.',
  path: '/contact',
  keywords: [
    'контакти Autocast',
    'автосервіс Житомир адреса',
    ...KEYWORD_CLUSTERS.localServices.slice(0, 6),
  ],
})

export default function ContactLayout({ children }: { children: ReactNode }) {
  const siteUrl = getSiteUrl()
  return (
    <>
      <JsonLdGraph
        graphs={[
          buildLocalBusinessSchema(siteUrl),
          buildBreadcrumbSchema(
            [
              { name: 'Головна', path: '/' },
              { name: 'Контакти', path: '/contact' },
            ],
            siteUrl
          ),
        ]}
      />
      {children}
    </>
  )
}
