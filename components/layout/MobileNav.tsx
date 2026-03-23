'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, Info, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Головна', icon: Home },
  { href: '/shop', label: 'Магазин', icon: ShoppingBag },
  { href: '/about', label: 'Про нас', icon: Info },
  { href: '/contact', label: 'Контакти', icon: Phone },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass border-t border-border/50 safe-area-inset-bottom">
      <div className="flex items-center justify-around py-2 px-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded transition-colors',
                isActive
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                className="transition-all"
              />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
