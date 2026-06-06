'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/format'

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
}

export function Tabs({ className, children, ...props }: TabsProps) {
  return (
    <div className={cn('w-full', className)} {...props}>
      {children}
    </div>
  )
}

interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center bg-brand-bg-secondary rounded-lg p-1 gap-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsList.displayName = 'TabsList'

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
  isActive?: boolean
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, isActive, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
          isActive
            ? 'bg-brand-card text-brand-text-primary shadow-sm'
            : 'text-brand-text-secondary hover:text-brand-text-primary',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  activeValue: string
}

export function TabsContent({ value, activeValue, className, children, ...props }: TabsContentProps) {
  if (value !== activeValue) return null
  return (
    <div className={cn('mt-4', className)} {...props}>
      {children}
    </div>
  )
}
