'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatPercent, formatChange, getPriceColor, cn } from '@/lib/utils/format'
import type { StockQuote } from '@/types/stock'

interface PriceDisplayProps {
  quote: StockQuote
  size?: 'sm' | 'md' | 'lg'
}

export default function PriceDisplay({ quote, size = 'md' }: PriceDisplayProps) {
  const isPositive = quote.change >= 0

  const sizes = {
    sm: { price: 'text-xl', change: 'text-sm' },
    md: { price: 'text-3xl', change: 'text-base' },
    lg: { price: 'text-4xl', change: 'text-lg' },
  }

  return (
    <div className="flex items-center gap-4">
      <div>
        <p className={cn('font-bold font-mono-nums', sizes[size].price, getPriceColor(quote.change))}>
          {formatCurrency(quote.price, quote.currency)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {isPositive ? (
            <TrendingUp size={size === 'sm' ? 14 : 18} className="text-brand-success" />
          ) : (
            <TrendingDown size={size === 'sm' ? 14 : 18} className="text-brand-danger" />
          )}
          <span className={cn('font-medium font-mono-nums', sizes[size].change, getPriceColor(quote.change))}>
            {formatChange(quote.change)}
          </span>
          <span className={cn('font-medium font-mono-nums', sizes[size].change, getPriceColor(quote.change))}>
            ({formatPercent(quote.changePercent)})
          </span>
        </div>
      </div>
    </div>
  )
}

interface PriceStatsProps {
  quote: StockQuote
}

export function PriceStats({ quote }: PriceStatsProps) {
  const stats = [
    { label: 'เปิด', value: quote.open },
    { label: 'สูงสุด', value: quote.high },
    { label: 'ต่ำสุด', value: quote.low },
    { label: 'ปิดก่อนหน้า', value: quote.previousClose },
    { label: '52W สูง', value: quote.week52High ?? null },
    { label: '52W ต่ำ', value: quote.week52Low ?? null },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col">
          <span className="text-xs text-brand-text-secondary">{stat.label}</span>
          <span className="text-sm font-medium font-mono-nums text-brand-text-primary">
            {stat.value != null ? formatCurrency(stat.value, quote.currency) : '-'}
          </span>
        </div>
      ))}
    </div>
  )
}

interface PriceMetricProps {
  label: string
  value: string | number
  suffix?: string
  className?: string
}

export function PriceMetric({ label, value, suffix, className }: PriceMetricProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <span className="text-xs text-brand-text-secondary">{label}</span>
      <span className="text-sm font-medium font-mono-nums text-brand-text-primary">
        {value}{suffix && <span className="text-brand-text-secondary ml-1">{suffix}</span>}
      </span>
    </div>
  )
}
