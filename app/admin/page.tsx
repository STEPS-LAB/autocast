import { ShoppingCart, Package, Users, TrendingUp } from 'lucide-react'
import AnalyticsCard from '@/components/admin/AnalyticsCard'
import Badge from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Адмін — Дашборд' }

const STATUS_LABELS: Record<string, { label: string; variant: 'warning' | 'accent' | 'success' | 'error' | 'muted' }> = {
  pending:    { label: 'Очікує відправки', variant: 'warning' },
  processing: { label: 'Обробляється', variant: 'accent' },
  shipped:    { label: 'Відправлено', variant: 'muted' },
  delivered:  { label: 'Доставлено', variant: 'success' },
  cancelled:  { label: 'Скасовано', variant: 'error' },
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const [productsResult, categoriesResult, ordersResult, profilesResult] = await Promise.all([
    supabase
      .from('products')
      .select('id,name_ua,price,sale_price,stock,is_featured,created_at')
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id,status,total,shipping_info,created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  const products = productsResult.data ?? []
  const categoriesCount = categoriesResult.count ?? 0
  const orders = ordersResult.data ?? []
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0)
  const usersCount = profilesResult.count ?? 0
  return (
    <div className="fade-up-in">
      <div className="mb-6 fade-up-in">
        <h1 className="text-xl font-bold text-text-primary">Дашборд</h1>
        <p className="text-sm text-text-muted">Огляд діяльності магазину</p>
      </div>

      {/* Analytics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AnalyticsCard
          title="Дохід"
          value={formatPrice(totalRevenue)}
          change="12%"
          positive
          icon={TrendingUp}
          description="Поточний місяць"
        />
        <AnalyticsCard
          title="Замовлення"
          value={String(orders.length)}
          change="8%"
          positive
          icon={ShoppingCart}
          description="Поточний місяць"
        />
        <AnalyticsCard
          title="Товарів"
          value={String(products.length)}
          icon={Package}
          description={`${categoriesCount} категорій`}
        />
        <AnalyticsCard
          title="Клієнти"
          value={String(usersCount)}
          icon={Users}
          description="Зареєстровані"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-bg-surface border border-border rounded-md overflow-hidden fade-up-in transition-shadow duration-300 hover:shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Останні замовлення</h2>
            <a href="/admin/orders" className="text-xs text-accent hover:underline transition-colors duration-300">Всі →</a>
          </div>
          <div className="divide-y divide-border">
            {orders.map(order => {
              const s = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending!
              const shipping = (order.shipping_info ?? {}) as Record<string, string>
              const customerName = `${shipping.first_name ?? ''} ${shipping.last_name ?? ''}`.trim() || 'Клієнт'
              return (
                <div key={order.id} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-elevated transition-all duration-300 ease-out">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-text-muted truncate">{customerName}</p>
                  </div>
                  <Badge variant={s.variant}>{s.label}</Badge>
                  <span className="text-sm font-semibold text-text-primary price shrink-0">
                    {formatPrice(order.total)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-bg-surface border border-border rounded-md overflow-hidden fade-up-in transition-shadow duration-300 hover:shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Товари</h2>
            <a href="/admin/products" className="text-xs text-accent hover:underline transition-colors duration-300">Всі →</a>
          </div>
          <div className="divide-y divide-border">
            {products.filter(p => p.is_featured).slice(0, 5).length > 0 ? (
              products.filter(p => p.is_featured).slice(0, 5).map((product, i) => (
                <div key={product.id} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-elevated transition-all duration-300 ease-out">
                  <span className="text-xs text-text-muted w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary line-clamp-1">{product.name_ua}</p>
                    <p className="text-xs text-text-muted">{product.stock} шт. залишок</p>
                  </div>
                  <span className="text-sm font-semibold text-text-primary price shrink-0">
                    {formatPrice(product.sale_price ?? product.price)}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-6 text-sm text-text-muted">
                Товари ще не додано
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
