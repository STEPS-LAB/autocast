import Link from 'next/link'
import { cn } from '@/lib/utils'

type SiteLogoProps = {
  className?: string
  /** Footer sits on dark background; header uses page tokens. */
  variant?: 'footer' | 'header'
}

export default function SiteLogo({ className, variant = 'header' }: SiteLogoProps) {
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
          'font-bold tracking-tight',
          variant === 'footer' && 'text-lg text-zinc-100',
          variant === 'header' && 'text-[22px] text-text-primary'
        )}
      >
        AUTO<span className="text-accent">CAST</span>
      </span>
    </Link>
  )
}
