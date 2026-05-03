'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { ServiceSlug } from '@/lib/data/services'
import { SERVICES } from '@/lib/data/services'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  slug: ServiceSlug
  variant?: 'light' | 'dark'
  index?: number
  /** Без кільця/аутлайну при фокусі (наприклад, картки в темній секції на головній) */
  hideFocusOutline?: boolean
  /** Без тонкої рамки навколо плашки з іконкою (світла тема) */
  hideIconBadgeBorder?: boolean
}

export default function ServiceCard({
  slug,
  variant = 'light',
  index = 0,
  hideFocusOutline = false,
  hideIconBadgeBorder = false,
}: ServiceCardProps) {
  const service = SERVICES.find(s => s.slug === slug)
  if (!service) return null

  const { title, shortDescription, icon: Icon, image } = service
  const isDark = variant === 'dark'

  const inner = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-md bg-bg-elevated">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t',
            isDark
              ? 'from-graphite-deep/92 via-graphite/20 to-transparent'
              : 'from-graphite-deep/75 via-graphite/12 to-transparent'
          )}
        />
        <div className="absolute inset-0 bg-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div
          className={cn(
            'pointer-events-none absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-lg',
            'bg-graphite-deep/70 backdrop-blur-sm shadow-[0_4px_14px_-4px_rgba(0,0,0,0.45)]',
            'outline-none ring-0 [&_svg]:outline-none [&_svg]:focus:outline-none',
            !isDark && !hideIconBadgeBorder && 'border border-white/20'
          )}
          aria-hidden
        >
          <Icon size={18} className="text-accent outline-none" aria-hidden />
        </div>
      </div>
      <div
        className={cn(
          'rounded-b-md p-4 md:p-5',
          isDark
            ? 'border-0 bg-gradient-to-br from-white/[0.16] via-white/[0.09] to-white/[0.05]'
            : 'border-0 bg-bg-surface'
        )}
      >
        <h3
          className={cn(
            'text-base font-semibold mb-1.5 transition-colors',
            isDark ? 'text-text-inverse group-hover:text-accent' : 'text-text-primary group-hover:text-accent'
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            'text-sm leading-relaxed line-clamp-3',
            isDark ? 'text-text-inverse-muted' : 'text-text-secondary'
          )}
        >
          {shortDescription}
        </p>
      </div>
    </>
  )

  return (
    <motion.article
      className="h-full"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Link
        href={`/services/${slug}`}
        className={cn(
          'service-card-link group block h-full rounded-md outline-none [-webkit-tap-highlight-color:transparent] [&_svg]:outline-none',
          !hideFocusOutline &&
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          !hideFocusOutline &&
            (isDark ? 'focus-visible:ring-offset-graphite-deep' : 'focus-visible:ring-offset-bg-primary'),
          hideFocusOutline && 'no-focus-outline'
        )}
      >
        <div
          className={cn(
            'h-full overflow-hidden rounded-md transition-[transform,box-shadow,border-color] duration-300',
            isDark
              ? 'service-card-lift-dark border-0 bg-transparent ring-0'
              : 'micro-lift border border-border bg-bg-surface md:hover:ring-2 md:hover:ring-accent/20'
          )}
        >
          {inner}
        </div>
      </Link>
    </motion.article>
  )
}
