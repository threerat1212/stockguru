'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Star, StarOff } from 'lucide-react'
import type { TrendingStock } from '@/types/stock'
import { formatCurrency, formatPercent, formatVolume, formatMarketCapUsd, getPriceColor, cn } from '@/lib/utils/format'
import { useAppStore } from '@/lib/store/stockStore'
import Badge from '@/components/ui/Badge'

interface StockCardProps {
  stock: TrendingStock
  rank?: number
}

export default function StockCard({ stock, rank }: StockCardProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useAppStore()
  const inWatchlist = isInWatchlist(stock.symbol)
  const isPositive = stock.change >= 0
  const currency = stock.currency ?? (stock.symbol.endsWith('.BK') ? 'THB' : 'USD')
  const exchange = stock.exchange ?? (stock.symbol.endsWith('.BK') ? 'SET' : 'US')

  function toggleWatchlist(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (inWatchlist) {
      removeFromWatchlist(stock.symbol)
    } else {
      addToWatchlist(stock.symbol)
    }
  }

  return (
    <Link href={`/stock/${encodeURIComponent(stock.symbol)}`}>
      <div className="group bg-brand-card border border-brand-border rounded-lg p-4 hover:border-brand-primary/40 hover:bg-brand-card/80 transition-colors duration-200 cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {rank && (
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-bg-secondary text-xs font-bold text-brand-text-secondary">{rank}</span>
            )}
            <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-brand-primary">
                {stock.symbol.replace('.BK', '').substring(0, 3)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-brand-text-primary group-hover:text-brand-primary transition-colors">
                  {stock.symbol.replace('.BK', '')}
                </h3>
                <span className="rounded border border-brand-border px-1.5 py-0.5 text-[10px] text-brand-text-secondary">
                  {exchange}
                </span>
              </div>
              <p className="text-xs text-brand-text-secondary truncate max-w-[150px]">
                {stock.name}
              </p>
            </div>
          </div>

          <button
            onClick={toggleWatchlist}
            aria-label={inWatchlist ? `ลบ ${stock.symbol} จากรายการโปรด` : `เพิ่ม ${stock.symbol} เข้ารายการโปรด`}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              inWatchlist
                ? 'text-brand-warning bg-brand-warning/10'
                : 'text-brand-text-secondary hover:text-brand-warning hover:bg-brand-warning/10 sm:opacity-0 sm:group-hover:opacity-100'
            )}
          >
            {inWatchlist ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
          </button>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold font-mono-nums text-brand-text-primary">
              {formatCurrency(stock.price, currency)}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isPositive ? (
                <TrendingUp size={14} className="text-brand-success" />
              ) : (
                <TrendingDown size={14} className="text-brand-danger" />
              )}
              <span className={cn('text-sm font-medium font-mono-nums', getPriceColor(stock.change))}>
                {formatPercent(stock.changePercent)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-brand-text-secondary">Market Cap</p>
            <p className="text-sm font-mono-nums text-brand-text-primary">
              {formatMarketCapUsd(stock.marketCap, currency)}
            </p>
          </div>
        </div>

        {stock.sector && (
          <div className="mt-3 pt-3 border-t border-brand-border">
            <Badge variant="outline" size="sm">{stock.sector}</Badge>
          </div>
        )}
      </div>
    </Link>
  )
}
