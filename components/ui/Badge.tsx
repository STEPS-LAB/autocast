import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'muted'

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-bg-elevated text-text-secondary border border-border',
  accent:   'bg-accent/15 text-accent border border-accent/30',
  success:  'bg-success/15 text-success border border-success/30',
  warning:  'bg-warning/15 text-warning border border-warning/30',
  error:    'bg-error/15 text-error border border-error/30',
  muted:    'bg-bg-surface text-text-muted border border-border',
}

export default function Badge({
  variant = 'default',
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
