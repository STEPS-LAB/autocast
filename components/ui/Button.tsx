'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import {
  buttonBaseClasses,
  buttonSizeClasses,
  buttonVariantClasses,
  type ButtonSize,
  type ButtonVariant,
} from '@/components/ui/buttonStyles'
import type { ButtonHTMLAttributes } from 'react'

export type { ButtonSize, ButtonVariant }

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
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
          buttonBaseClasses,
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          buttonVariantClasses[variant],
          buttonSizeClasses[size],
          fullWidth ? 'w-full' : size !== 'sm' && 'max-md:w-full md:w-auto',
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
