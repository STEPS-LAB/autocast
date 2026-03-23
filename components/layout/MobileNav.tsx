'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, ShoppingBag, Phone, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Головна', icon: Home },
  { href: '/shop', label: 'Магазин', icon: ShoppingBag },
  { href: '/contact', label: 'Контакти', icon: Phone },
  { href: '/account', label: 'Акаунт', icon: User },
]

export default function MobileNav() {
  const pathname = usePathname()
  const [inHeroSection, setInHeroSection] = useState(pathname === '/')

  useEffect(() => {
    const updateHeroVisibility = () => {
      if (pathname !== '/') {
        setInHeroSection(false)
        return
      }
      const heroThreshold = Math.max(window.innerHeight - 140, 360)
      setInHeroSection(window.scrollY < heroThreshold)
    }

    updateHeroVisibility()
    window.addEventListener('scroll', updateHeroVisibility, { passive: true })
    window.addEventListener('resize', updateHeroVisibility)
    return () => {
      window.removeEventListener('scroll', updateHeroVisibility)
      window.removeEventListener('resize', updateHeroVisibility)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      {!inHeroSection && (
        <motion.nav
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/15 bg-bg-surface/85 backdrop-blur-xl shadow-[0_-8px_28px_rgba(0,0,0,0.18)] safe-area-inset-bottom"
        >
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
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
