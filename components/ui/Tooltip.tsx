import { cn } from '@/lib/utils/format'

interface TooltipProps {
  children: React.ReactNode
  content: string
  className?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({ children, content, className, position = 'top' }: TooltipProps) {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className={cn('relative group inline-flex', className)}>
      {children}
      <div
        className={cn(
          'absolute z-tooltip px-2 py-1 text-xs font-medium text-brand-text-primary bg-brand-bg-secondary border border-brand-border rounded-md',
          'opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200',
          'whitespace-nowrap pointer-events-none',
          positions[position]
        )}
      >
        {content}
      </div>
    </div>
  )
}
