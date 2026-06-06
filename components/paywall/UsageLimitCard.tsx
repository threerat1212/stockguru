import { cn } from '@/lib/utils/format'
import Link from 'next/link'
import Button from '@/components/ui/Button'

interface UsageLimitCardProps {
  current: number
  limit: number
  label: string
  upgradePath?: string
}

export default function UsageLimitCard({ current, limit, label, upgradePath = '/pricing' }: UsageLimitCardProps) {
  const percent = Math.min(100, Math.round((current / limit) * 100))
  const isNearLimit = percent >= 80
  const isAtLimit = current >= limit

  return (
    <div className={cn(
      'p-3 rounded-lg border',
      isAtLimit
        ? 'bg-brand-danger/5 border-brand-danger/20'
        : isNearLimit
          ? 'bg-brand-warning/5 border-brand-warning/20'
          : 'bg-brand-bg-secondary border-brand-border'
    )}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-brand-text-secondary">{label}</span>
        <span className={cn(
          'text-xs font-medium',
          isAtLimit ? 'text-brand-danger' : isNearLimit ? 'text-brand-warning' : 'text-brand-text-primary'
        )}>
          {current} / {limit}
        </span>
      </div>
      <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isAtLimit ? 'bg-brand-danger' : isNearLimit ? 'bg-brand-warning' : 'bg-brand-primary'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isAtLimit && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-brand-danger">ถึงขีดจำกัดแล้ว</span>
          <Link href={upgradePath}>
            <Button size="sm" variant="primary">อัพเกรด</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
