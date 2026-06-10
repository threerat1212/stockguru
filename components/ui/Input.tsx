'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/format'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-brand-border bg-brand-bg-secondary text-brand-text-primary placeholder-brand-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/60',
            'hover:border-brand-primary/35 hover:bg-brand-card',
            'transition-colors duration-200 text-sm',
            icon ? 'pl-10 pr-4 py-2.5' : 'px-4 py-2.5',
            error && 'border-brand-danger/60 focus:ring-brand-danger/30 focus:border-brand-danger/60',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-brand-danger">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
