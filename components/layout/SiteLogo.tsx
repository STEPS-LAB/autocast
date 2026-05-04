import Link from 'next/link'
import { cn } from '@/lib/utils'

type SiteLogoProps = {
  className?: string
  /** Footer sits on dark background; header uses page tokens. */
  variant?: 'footer' | 'header'
  /** Головний хедер на тьмяному тлі (скрол / сторінка послуги): «auto» білим */
  darkBar?: boolean
}

export default function SiteLogo({ className, variant = 'header', darkBar = false }: SiteLogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center',
        variant === 'header' && 'gap-2 shrink-0 group',
        className
      )}
    >
      <span
        className={cn(
          'font-brand font-bold tracking-tight',
          variant === 'footer' && 'text-2xl leading-tight text-zinc-100',
          variant === 'header' &&
            cn(
              'header-autocast-wordmark text-[26px] leading-none',
              darkBar ? 'text-white' : 'text-text-primary'
            )
        )}
      >
        auto<span className="text-accent">cast</span>
      </span>
    </Link>
  )
}
