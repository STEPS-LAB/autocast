'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Tag, ShoppingCart,
  Users, Zap, ChevronRight, BarChart2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Товари', icon: Package },
  { href: '/admin/categories', label: 'Категорії', icon: Tag },
  { href: '/admin/orders', label: 'Замовлення', icon: ShoppingCart },
  { href: '/admin/users', label: 'Користувачі', icon: Users },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-bg-surface border-r border-border shrink-0 py-6 fade-up-in">
        {/* Brand */}
        <div className="px-5 mb-6">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-accent" />
            <span className="text-sm font-bold text-text-primary">Адмін-панель</span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">Autocast</p>
        </div>

        <nav className="flex flex-col gap-0.5 px-2">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all duration-300 ease-out',
                  isActive
                    ? 'bg-accent/20 text-black'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
              >
                <Icon size={15} />
                {label}
                {isActive && <ChevronRight size={12} className="ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto px-5 pt-4 border-t border-border">
          <Link
            href="/"
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            ← Повернутися на сайт
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Mobile breadcrumb nav */}
        <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-border overflow-x-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs whitespace-nowrap transition-all duration-300 ease-out shrink-0',
                  isActive
                    ? 'bg-accent/20 text-black'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
                )}
              >
                <Icon size={13} />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="p-5 md:p-8 fade-up-in">
          {children}
        </div>
      </main>
    </div>
  )
}
