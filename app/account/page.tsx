'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Package, LogOut, Settings, ShoppingBag, Shield } from 'lucide-react'
import Button from '@/components/ui/Button'
import PageTransition from '@/components/layout/PageTransition'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types'

interface AuthUser {
  id: string
  email?: string
  created_at: string
}

export default function AccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const accessDenied = searchParams.get('error') === 'admin_access_denied'

  useEffect(() => {
    async function loadUser() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) { router.replace('/login'); return }
        setUser({ id: authUser.id, email: authUser.email, created_at: authUser.created_at })
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()
        if (profileData) setProfile(profileData as Profile)
      } catch {
        // If auth backend is unavailable, treat user as signed out.
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }
    void loadUser()
  }, [router])

  async function handleSignOut() {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="container-xl py-16 flex items-center justify-center">
          <div className="size-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container-xl py-10 max-w-3xl">
        <h1 className="text-headline text-text-primary mb-8">Мій акаунт</h1>
        {accessDenied && (
          <div className="mb-6 rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text-secondary">
            Недостатньо прав для доступу до адмін-панелі.
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-6">
          {/* Sidebar nav */}
          <nav className="space-y-1">
            {[
              { icon: User, label: 'Профіль', active: true },
              { icon: Package, label: 'Замовлення', active: false },
              { icon: Settings, label: 'Налаштування', active: false },
              ...(profile?.role === 'admin'
                ? [{ icon: Shield, label: 'Адмін-панель', active: false, href: '/admin' }]
                : []),
              { icon: LogOut, label: 'Вийти з акаунту', active: false, action: 'signout' as const },
            ].map(({ icon: Icon, label, active, href, action }) => (
              href ? (
                <Link
                  key={label}
                  href={href}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm transition-colors text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ) : action === 'signout' ? (
                <button
                  key={label}
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm transition-colors text-text-secondary hover:text-error hover:bg-bg-elevated"
                >
                  <Icon size={16} />
                  {label}
                </button>
              ) : (
                <button
                  key={label}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm transition-colors ${
                    active
                      ? 'bg-accent/30 text-black'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              )
            ))}
          </nav>

          {/* Content */}
          <div className="sm:col-span-2 space-y-6">
            {/* Profile card */}
            <div className="bg-bg-surface border border-border rounded-md p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className="size-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <User size={24} className="text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{user?.email}</p>
                  <p className="text-xs text-text-muted">
                    Клієнт з {user?.created_at ? formatDate(user.created_at) : '—'}
                  </p>
                  {profile?.role === 'admin' && (
                    <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded mt-1 inline-block">
                      Адміністратор
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div>
                  <p className="text-xs text-text-muted mb-1">Email</p>
                  <p className="text-sm text-text-primary">{user?.email}</p>
                </div>
                {profile?.phone && (
                  <div>
                    <p className="text-xs text-text-muted mb-1">Телефон</p>
                    <p className="text-sm text-text-primary">{profile.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Orders placeholder */}
            <div className="bg-bg-surface border border-border rounded-md p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Package size={16} className="text-accent" />
                Мої замовлення
              </h3>
              <div className="flex flex-col items-center py-6 text-center gap-3">
                <ShoppingBag size={28} className="text-text-muted" />
                <p className="text-sm text-text-muted">Замовлень поки немає</p>
                <Link href="/shop">
                  <Button variant="secondary" size="sm">Перейти в магазин</Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  )
}
