'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Package, LogOut, Settings, ShoppingBag, Shield } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import PageTransition from '@/components/layout/PageTransition'
import { formatDate, formatPrice } from '@/lib/utils'
import type { Order, Profile } from '@/types'

interface AuthUser {
  id: string
  email?: string
  created_at: string
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Очікує',
  processing: 'Обробляється',
  shipped: 'Відправлено',
  delivered: 'Доставлено',
  cancelled: 'Скасовано',
}

type OrderDetails = Order & {
  order_items?: Array<{
    id: string
    qty: number
    unit_price: number
    product?: { id: string; slug: string; name_ua: string } | { id: string; slug: string; name_ua: string }[] | null
  }>
}

function formatPhoneUa(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!raw) return '—'
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 9) {
    const xx = digits.slice(0, 2)
    const rest = digits.slice(2)
    return `+38 (0${xx}) ${rest.slice(0, 3)}-${rest.slice(3, 5)}-${rest.slice(5, 7)}`
  }
  if (digits.startsWith('380') && digits.length >= 12) {
    const local = digits.slice(3)
    const trimmed = local.startsWith('0') ? local.slice(1) : local
    if (trimmed.length >= 9) {
      const d9 = trimmed.slice(0, 9)
      const xx = d9.slice(0, 2)
      const rest = d9.slice(2)
      return `+38 (0${xx}) ${rest.slice(0, 3)}-${rest.slice(3, 5)}-${rest.slice(5, 7)}`
    }
  }
  return raw
}

function AccountPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null)
  const [selectedOrderLoading, setSelectedOrderLoading] = useState(false)
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

        setOrdersLoading(true)
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id,user_id,status,total,shipping_info,created_at')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
        setOrders((ordersData as Order[] | null) ?? [])
        setOrdersLoading(false)
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

  async function openOrder(orderId: string) {
    setSelectedOrderId(orderId)
    setSelectedOrder(null)
    setSelectedOrderLoading(true)
    setOrderModalOpen(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data } = await supabase
        .from('orders')
        .select(`
          id,user_id,status,total,shipping_info,created_at,
          order_items(
            id,qty,unit_price,
            product:products(id,slug,name_ua)
          )
        `)
        .eq('id', orderId)
        .maybeSingle()
      setSelectedOrder((data as OrderDetails | null) ?? null)
    } catch {
      setSelectedOrder(null)
    } finally {
      setSelectedOrderLoading(false)
    }
  }

  function closeOrderModal() {
    setOrderModalOpen(false)
    setSelectedOrderId(null)
    setSelectedOrder(null)
    setSelectedOrderLoading(false)
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
              {ordersLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="size-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center gap-3">
                  <ShoppingBag size={28} className="text-text-muted" />
                  <p className="text-sm text-text-muted">Замовлень поки немає</p>
                  <Link href="/shop">
                    <Button variant="secondary" size="sm">Перейти в магазин</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(o => (
                    <button
                      type="button"
                      key={o.id}
                      onClick={() => void openOrder(o.id)}
                      className="w-full text-left border border-border rounded-md p-4 bg-bg-primary/40 hover:bg-bg-elevated transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            Замовлення #{o.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {formatDate(o.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-text-primary price">
                            {formatPrice(Number(o.total))}
                          </p>
                          <p className="text-xs text-text-muted">
                            {ORDER_STATUS_LABELS[o.status] ?? o.status}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <Modal
        open={orderModalOpen}
        onClose={closeOrderModal}
        size="lg"
        title={selectedOrderId ? `Замовлення #${selectedOrderId.slice(0, 8).toUpperCase()}` : 'Замовлення'}
        description="Деталі замовлення"
      >
        {selectedOrderLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="size-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !selectedOrder ? (
          <div className="text-sm text-text-muted">
            Не вдалося завантажити деталі замовлення.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-bg-primary/30 p-4">
                <p className="text-xs text-text-muted mb-1">Статус</p>
                <p className="text-sm font-semibold text-text-primary">
                  {ORDER_STATUS_LABELS[selectedOrder.status] ?? selectedOrder.status}
                </p>
              </div>
              <div className="rounded-md border border-border bg-bg-primary/30 p-4">
                <p className="text-xs text-text-muted mb-1">Сума</p>
                <p className="text-sm font-bold text-text-primary price">
                  {formatPrice(Number(selectedOrder.total))}
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border bg-bg-primary/30 p-4 space-y-2 text-sm">
              <p className="text-text-secondary">
                <span className="text-text-muted">Дата:</span>{' '}
                <span className="text-text-primary">{formatDate(selectedOrder.created_at)}</span>
              </p>
              <p className="text-text-secondary">
                <span className="text-text-muted">ПІБ:</span>{' '}
                <span className="text-text-primary">
                  {String((selectedOrder.shipping_info as any)?.first_name ?? '')}{' '}
                  {String((selectedOrder.shipping_info as any)?.last_name ?? '')}
                </span>
              </p>
              <p className="text-text-secondary">
                <span className="text-text-muted">Email:</span>{' '}
                <span className="text-text-primary break-all">
                  {String((selectedOrder.shipping_info as any)?.email ?? '—')}
                </span>
              </p>
              <p className="text-text-secondary">
                <span className="text-text-muted">Телефон:</span>{' '}
                <span className="text-text-primary">
                  {formatPhoneUa((selectedOrder.shipping_info as any)?.phone)}
                </span>
              </p>
              <p className="text-text-secondary">
                <span className="text-text-muted">Доставка:</span>{' '}
                <span className="text-text-primary">
                  {(selectedOrder.shipping_info as any)?.delivery_method === 'pickup'
                    ? 'Самовивіз (м. Житомир, вулиця Вітрука, 12в)'
                    : `${String((selectedOrder.shipping_info as any)?.city ?? '—')}, ${String((selectedOrder.shipping_info as any)?.address ?? '—')}`}
                </span>
              </p>
            </div>

            <div className="rounded-md border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-bg-surface">
                <p className="text-sm font-semibold text-text-primary">Товари</p>
              </div>
              <div className="divide-y divide-border">
                {(selectedOrder.order_items ?? []).map((it) => {
                  const product = Array.isArray(it.product) ? it.product[0] : it.product
                  const lineTotal = Number(it.unit_price) * Number(it.qty)
                  return (
                    <div key={it.id} className="px-4 py-3 flex items-start justify-between gap-4 bg-bg-surface">
                      <div className="min-w-0">
                        {product?.slug ? (
                          <Link
                            href={`/product/${product.slug}`}
                            className="text-sm font-medium text-text-primary hover:text-accent transition-colors line-clamp-2"
                            onClick={closeOrderModal}
                          >
                            {product.name_ua}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium text-text-primary">Товар</p>
                        )}
                        <p className="text-xs text-text-muted mt-0.5">
                          {it.qty} шт. × {formatPrice(Number(it.unit_price))}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-text-primary price">
                          {formatPrice(lineTotal)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {(selectedOrder.order_items ?? []).length === 0 && (
                  <div className="px-4 py-6 text-sm text-text-muted bg-bg-surface">
                    Товари не знайдено.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={(
      <PageTransition>
        <div className="container-xl py-16 flex items-center justify-center">
          <div className="size-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </PageTransition>
    )}
    >
      <AccountPageContent />
    </Suspense>
  )
}
