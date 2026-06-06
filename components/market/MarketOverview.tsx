'use client'

import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, Clock } from 'lucide-react'
import { useMarketIndices } from '@/lib/hooks/use-stock'
import { cn, formatChange, formatNumber, formatPercent, getPriceColor } from '@/lib/utils/format'
import { LoadingSkeleton } from '@/components/ui/Loading'

export default function MarketOverview() {
  const { data: indices = [], isLoading } = useMarketIndices()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-brand-border bg-brand-card p-4">
            <LoadingSkeleton lines={3} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {indices.map((index) => {
        const isPositive = index.change >= 0
        return (
          <Link
            key={index.symbol}
            href="/screener"
            className={cn(
              'block rounded-lg border border-brand-border bg-brand-card p-4 transition-colors duration-200',
              'hover:border-brand-primary/30 hover:bg-brand-surface-hover/70 cursor-pointer'
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-brand-text-secondary">{index.name}</p>
                <p className="mt-0.5 text-[11px] text-brand-text-muted">{index.symbol}</p>
              </div>
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  isPositive ? 'bg-brand-success/10' : 'bg-brand-danger/10'
                )}
              >
                {isPositive ? (
                  <ArrowUpRight size={14} className="text-brand-success" />
                ) : (
                  <ArrowDownRight size={14} className="text-brand-danger" />
                )}
              </div>
            </div>
            <p className="text-xl font-bold font-mono-nums text-brand-text-primary">
              {formatNumber(index.price, 2)}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className={cn('text-sm font-medium font-mono-nums', getPriceColor(index.change))}>
                {formatPercent(index.changePercent)}
              </span>
              <span className={cn('text-xs font-mono-nums', getPriceColor(index.change))}>
                {formatChange(index.change)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 border-t border-brand-border/60 pt-2 text-[11px] text-brand-text-muted">
              <Clock size={12} />
              <span>ใช้เป็นบริบท ไม่ใช่สัญญาณซื้อขาย</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
