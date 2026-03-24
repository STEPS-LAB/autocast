import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface AnalyticsCardProps {
  title: string
  value: string
  change?: string
  positive?: boolean
  icon: LucideIcon
  description?: string
}

export default function AnalyticsCard({
  title,
  value,
  change,
  positive,
  icon: Icon,
  description,
}: AnalyticsCardProps) {
  const isMoneyValue = value.includes('₴')

  return (
    <div className="bg-bg-surface border border-border rounded-md p-5 flex flex-col gap-3 fade-up-in micro-lift group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {title}
        </span>
        <div className="size-8 rounded bg-accent/20 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-105">
          <Icon size={15} className="text-black" />
        </div>
      </div>

      <div>
        <p className={cn('text-2xl font-bold text-text-primary', isMoneyValue && 'price')}>{value}</p>
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>

      {change && (
        <p
          className={cn(
            'text-xs font-medium',
            positive ? 'text-success' : 'text-error'
          )}
        >
          {positive ? '↑' : '↓'} {change} за минулий місяць
        </p>
      )}
    </div>
  )
}
