'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import StorePersistHydration from '@/components/layout/StorePersistHydration'
import Footer from '@/components/layout/Footer'
import MobileNav from '@/components/layout/MobileNav'
import CartDrawer from '@/components/cart/CartDrawer'
import WishlistDrawer from '@/components/wishlist/WishlistDrawer'
import AIAssistant from '@/components/ai/AIAssistant'
import { cn } from '@/lib/utils'

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPath = pathname.startsWith('/admin')
  const isHome = pathname === '/'

  useEffect(() => {
    document.body.classList.toggle('page-bg-subtle-dark', !isHome)
    return () => {
      document.body.classList.remove('page-bg-subtle-dark')
    }
  }, [isHome])

  return (
    <>
      <StorePersistHydration />
      {!isAdminPath && <Header />}
      <main className={cn('flex-1', !isAdminPath && 'pt-[70px]')}>
        {children}
      </main>
      <Footer />
      <div
        className="md:hidden h-[calc(72px+env(safe-area-inset-bottom))] bg-zinc-900"
        aria-hidden="true"
      />
      <MobileNav />
      <CartDrawer />
      <WishlistDrawer />
      {!isAdminPath && <AIAssistant />}
    </>
  )
}
