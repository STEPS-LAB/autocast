import { ShoppingCart, Package, Users, TrendingUp } from 'lucide-react'
import AnalyticsCard from '@/components/admin/AnalyticsCard'
import { PRODUCTS, CATEGORIES } from '@/lib/data/seed'
import { formatPrice } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Адмін — Дашборд' }

const DEMO_ORDERS = [
  { id: 'AC-991234', status: 'pending', total: 13000, customer: 'Іван Петренко', date: '23.03.2026' },
  { id: 'AC-991235', status: 'processing', total: 4450, customer: 'Марія Коваль', date: '22.03.2026' },
  { id: 'AC-991236', status: 'shipped', total: 15200, customer: 'Олег Бондар', date: '21.03.2026' },
  { id: 'AC-991237', status: 'delivered', total: 8900, customer: 'Наталія Шевченко', date: '20.03.2026' },
  { id: 'AC-991238', status: 'pending', total: 2840, customer: 'Дмитро Мельник', date: '19.03.2026' },
]

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Очікує', cls: 'text-warning bg-warning/10 border-warning/20' },
  processing: { label: 'Обробляється', cls: 'text-accent bg-accent/10 border-accent/20' },
  shipped:    { label: 'Відправлено', cls: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  delivered:  { label: 'Доставлено', cls: 'text-success bg-success/10 border-success/20' },
  cancelled:  { label: 'Скасовано', cls: 'text-error bg-error/10 border-error/20' },
}

export default function AdminDashboard() {
  const totalRevenue = DEMO_ORDERS.reduce((s, o) => s + o.total, 0)

  return (
    <div>
      <div className="mb-6">
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
          value={String(DEMO_ORDERS.length)}
          change="8%"
          positive
          icon={ShoppingCart}
          description="Поточний місяць"
        />
        <AnalyticsCard
          title="Товарів"
          value={String(PRODUCTS.length)}
          icon={Package}
          description={`${CATEGORIES.length} категорій`}
        />
        <AnalyticsCard
          title="Клієнти"
          value="247"
          change="5%"
          positive
          icon={Users}
          description="Зареєстровані"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-bg-surface border border-border rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Останні замовлення</h2>
            <a href="/admin/orders" className="text-xs text-accent hover:underline">Всі →</a>
          </div>
          <div className="divide-y divide-border">
            {DEMO_ORDERS.map(order => {
              const s = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending!
              return (
                <div key={order.id} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-elevated transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{order.id}</p>
                    <p className="text-xs text-text-muted truncate">{order.customer}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${s.cls}`}>
                    {s.label}
                  </span>
                  <span className="text-sm font-semibold text-text-primary price shrink-0">
                    {formatPrice(order.total)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-bg-surface border border-border rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Топ товарів</h2>
            <a href="/admin/products" className="text-xs text-accent hover:underline">Всі →</a>
          </div>
          <div className="divide-y divide-border">
            {PRODUCTS.filter(p => p.is_featured).slice(0, 5).map((product, i) => (
              <div key={product.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xs text-text-muted w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary line-clamp-1">{product.name_ua}</p>
                  <p className="text-xs text-text-muted">{product.stock} шт. залишок</p>
                </div>
                <span className="text-sm font-semibold text-text-primary price shrink-0">
                  {formatPrice(product.sale_price ?? product.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
