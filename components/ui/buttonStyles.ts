export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-text-primary hover:bg-accent-hover active:scale-[0.98] shadow-sm',
  secondary:
    'bg-bg-elevated text-text-primary border border-border hover:border-border-light hover:bg-bg-overlay active:scale-[0.98]',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-bg-elevated active:scale-[0.98]',
  danger:
    'bg-error/15 text-error border border-error/35 hover:bg-error/25 active:scale-[0.98]',
  outline:
    'border border-accent text-accent hover:bg-accent/10 active:scale-[0.98]',
}

export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2.5',
}

export const buttonBaseClasses =
  'inline-flex items-center justify-center font-medium rounded transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2'

export function buttonLinkClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth = false,
) {
  return [
    buttonBaseClasses,
    buttonVariantClasses[variant],
    buttonSizeClasses[size],
    fullWidth ? 'w-full' : size !== 'sm' ? 'max-md:w-full md:w-auto' : '',
  ]
    .filter(Boolean)
    .join(' ')
}
