import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/format'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'outline'
  size?: 'sm' | 'md'
}

export default function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-brand-card text-brand-text-secondary border-brand-border',
    success: 'bg-brand-success/10 text-brand-success border-brand-success/20',
    danger: 'bg-brand-danger/10 text-brand-danger border-brand-danger/20',
    warning: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
    info: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    outline: 'bg-transparent text-brand-text-secondary border-brand-border',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
