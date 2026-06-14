'use client'

import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { MarketIndex } from '@/types/stock'
import { cn, formatChange, formatNumber, formatPercent, getPriceColor } from '@/lib/utils/format'

const TARGET_INDICES = [
  { symbol: 'SET', label: 'SET' },
  { symbol: 'SET50', label: 'SET50' },
  { symbol: 'SET100', label: 'SET100' },
  { symbol: 'SETHD', label: 'SETHD' },
  { symbol: 'MAI', label: 'mai' },
]

function IndexCard({ index, label }: { index?: MarketIndex; label: string }) {
  const isPositive = index ? index.change >= 0 : true

  return (
    <Link
      href={index ? `/stock/${encodeURIComponent(index.symbol)}` : '#'}
      className={cn(
        'group block rounded-xl border bg-brand-card p-4 transition-colors duration-200',
        index
          ? 'border-brand-border hover:border-brand-primary/40 hover:bg-brand-surface-hover/70 cursor-pointer'
          : 'border-brand-border/50 cursor-default'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-brand-text-secondary">{index?.name ?? label}</p>
          <p className="mt-0.5 text-[11px] text-brand-text-muted">{index?.symbol ?? label}</p>
        </div>
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
            isPositive ? 'bg-brand-success/10 border-brand-success/20' : 'bg-brand-danger/10 border-brand-danger/20'
          )}
        >
          {index ? (
            isPositive ? (
              <ArrowUpRight size={14} className="text-brand-success" />
            ) : (
              <ArrowDownRight size={14} className="text-brand-danger" />
            )
          ) : (
            <span className="text-[10px] text-brand-text-muted">รอ</span>
          )}
        </div>
      </div>
      <p className="text-xl font-bold font-mono-nums text-brand-text-primary">
        {index ? formatNumber(index.price, 2) : '—'}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={cn('text-sm font-medium font-mono-nums', index ? getPriceColor(index.change) : 'text-brand-text-muted')}>
          {index ? formatPercent(index.changePercent) : 'รอข้อมูล'}
        </span>
        <span className={cn('text-xs font-mono-nums', index ? getPriceColor(index.change) : 'text-brand-text-muted')}>
          {index ? formatChange(index.change) : '—'}
        </span>
      </div>
    </Link>
  )
}

export default function IndexCards({ indices }: { indices?: MarketIndex[] }) {
  const bySymbol = new Map(indices?.map((index) => [index.symbol, index]))

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {TARGET_INDICES.map((target) => (
        <IndexCard key={target.symbol} label={target.label} index={bySymbol.get(target.symbol)} />
      ))}
    </div>
  )
}
