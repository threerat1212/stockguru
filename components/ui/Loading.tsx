import { cn } from '@/lib/utils/format'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <svg
      className={cn('animate-spin text-brand-primary', sizes[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className, lines = 1 }: LoadingSkeletonProps) {
  const widths = ['92%', '78%', '86%', '68%']

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 shimmer rounded-lg"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-brand-text-secondary text-sm">กำลังโหลดข้อมูล...</p>
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="card-modern rounded-xl p-5">
      <div className="h-4 shimmer rounded-lg w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-3 shimmer rounded-lg w-full" />
        <div className="h-3 shimmer rounded-lg w-4/5" />
        <div className="h-3 shimmer rounded-lg w-2/3" />
      </div>
    </div>
  )
}
