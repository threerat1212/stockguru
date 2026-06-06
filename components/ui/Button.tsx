'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/format'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

    const variants = {
      primary: 'bg-brand-primary hover:bg-blue-600 text-white focus:ring-brand-primary',
      secondary: 'bg-brand-card hover:bg-slate-600 text-brand-text-primary border border-brand-border focus:ring-brand-border',
      ghost: 'bg-transparent hover:bg-brand-card text-brand-text-secondary hover:text-brand-text-primary focus:ring-brand-border',
      danger: 'bg-brand-danger hover:bg-rose-600 text-white focus:ring-brand-danger',
      success: 'bg-brand-success hover:bg-emerald-600 text-white focus:ring-brand-success',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[40px]',
      md: 'px-4 py-2 text-sm gap-2 min-h-[40px]',
      lg: 'px-6 py-3 text-base gap-2.5 min-h-[44px]',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
