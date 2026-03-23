'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-sm',
  secondary:
    'bg-bg-elevated text-text-primary border border-border hover:border-border-light hover:bg-bg-overlay active:scale-[0.98]',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-bg-elevated active:scale-[0.98]',
  danger:
    'bg-red-900/20 text-red-400 border border-red-900/40 hover:bg-red-900/30 active:scale-[0.98]',
  outline:
    'border border-accent text-accent hover:bg-accent/10 active:scale-[0.98]',
}

const sizes: Record<ButtonSize, string> = {
  sm:  'h-8 px-3 text-sm gap-1.5',
  md:  'h-10 px-5 text-sm gap-2',
  lg:  'h-12 px-7 text-base gap-2.5',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'rounded transition-all duration-150 cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Завантаження...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
