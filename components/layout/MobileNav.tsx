'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, ShoppingBag, Wrench, Phone, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { linkTitleNav } from '@/lib/seo/accessibility'

const NAV_ITEMS = [
  { href: '/', label: 'Головна', icon: Home },
  { href: '/shop', label: 'Магазин', icon: ShoppingBag },
  { href: '/services', label: 'Послуги', icon: Wrench },
  { href: '/contact', label: 'Контакти', icon: Phone },
  { href: '/account', label: 'Акаунт', icon: User },
]

export default function MobileNav() {
  const pathname = usePathname()
  const [inHeroSection, setInHeroSection] = useState(pathname === '/')

  useEffect(() => {
    if (pathname !== '/') {
      setInHeroSection(false)
      return
    }

    let rafId = 0
    let lastVisible = window.scrollY < Math.max(window.innerHeight - 140, 360)

    const updateHeroVisibility = () => {
      const heroThreshold = Math.max(window.innerHeight - 140, 360)
      const nextVisible = window.scrollY < heroThreshold
      if (nextVisible !== lastVisible) {
        lastVisible = nextVisible
        setInHeroSection(nextVisible)
      }
      rafId = 0
    }

    const onScroll = () => {
      if (rafId !== 0) return
      rafId = window.requestAnimationFrame(updateHeroVisibility)
    }

    updateHeroVisibility()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateHeroVisibility)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateHeroVisibility)
      if (rafId !== 0) window.cancelAnimationFrame(rafId)
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
                  title={linkTitleNav(label)}
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
