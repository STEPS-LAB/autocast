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
  return (
    <div className="bg-bg-surface border border-border rounded-md p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {title}
        </span>
        <div className="size-8 rounded bg-bg-elevated flex items-center justify-center">
          <Icon size={15} className="text-accent" />
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
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
