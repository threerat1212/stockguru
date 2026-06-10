'use client'

import Link from 'next/link'
import { Star, TrendingUp, TrendingDown, Trash2, ArrowRight, Lock } from 'lucide-react'
import { useWatchlist } from '@/lib/hooks/use-watchlist'
import { useQuote } from '@/lib/hooks/use-stock'
import { formatCurrency, formatPercent, formatVolume, getPriceColor, cn } from '@/lib/utils/format'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import AuthModal from '@/components/auth/AuthModal'
import { useState } from 'react'

function WatchlistItem({ symbol, onRemove }: { symbol: string; onRemove: (s: string) => void }) {
  const { data: quote, isLoading } = useQuote(symbol)
  const displaySym = symbol.replace('.BK', '')

  if (isLoading) {
    return (
      <div className="flex items-center justify-between p-4 bg-brand-card border border-brand-border rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-brand-primary">{displaySym.substring(0, 3)}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-text-primary">{displaySym}</p>
            <p className="text-xs text-brand-text-secondary">กำลังโหลด...</p>
          </div>
        </div>
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-between p-4 bg-brand-card border border-brand-border rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-danger/10 rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-brand-danger">{displaySym.substring(0, 3)}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-text-primary">{displaySym}</p>
            <p className="text-xs text-brand-danger">ไม่พบข้อมูล</p>
          </div>
        </div>
        <button
          onClick={() => onRemove(symbol)}
          className="p-2 text-brand-text-secondary hover:text-brand-danger rounded-lg hover:bg-brand-danger/10 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    )
  }

  const isPositive = quote.change >= 0
  const currency = quote.currency ?? (quote.symbol.endsWith('.BK') ? 'THB' : 'USD')

  return (
    <Link href={`/stock/${encodeURIComponent(symbol)}`} className="block group">
      <div className="flex items-center justify-between p-4 bg-brand-card border border-brand-border rounded-xl hover:border-brand-primary/30 hover:glow-primary transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-brand-primary">{displaySym.substring(0, 3)}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-text-primary group-hover:text-brand-primary transition-colors">
              {displaySym}
            </p>
            <p className="text-xs text-brand-text-secondary truncate max-w-[200px]">{quote.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-bold font-mono-nums text-brand-text-primary">
              {formatCurrency(quote.price, currency)}
            </p>
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp size={12} className="text-brand-success" />
              ) : (
                <TrendingDown size={12} className="text-brand-danger" />
              )}
              <span className={cn('text-xs font-mono-nums font-medium', getPriceColor(quote.change))}>
                {formatPercent(quote.changePercent)}
              </span>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-xs text-brand-text-secondary">Volume</p>
            <p className="text-xs font-mono-nums text-brand-text-primary">
              {formatVolume(quote.volume)}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove(symbol)
            }}
            className="p-2 text-brand-text-secondary hover:text-brand-danger rounded-lg hover:bg-brand-danger/10 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </Link>
  )
}

export default function WatchlistPage() {
  const { watchlist, isLoading, isAuthenticated, removeWatchlistItem } = useWatchlist()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const handleRemove = async (symbol: string) => {
    try {
      await removeWatchlistItem(symbol)
    } catch (err) {
      console.error('Failed to remove watchlist item:', err)
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-warning/10 rounded-lg flex items-center justify-center">
            <Star size={20} className="text-brand-warning" />
          </div>
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">รายการโปรด</h1>
            <p className="text-sm text-brand-text-secondary">
              {isAuthenticated
                ? `หุ้นที่คุณติดตาม ${watchlist.length > 0 ? `(${watchlist.length} รายการ)` : ''}`
                : 'เข้าสู่ระบบเพื่อบันทึกรายการโปรดบนคลาวด์ (ขณะนี้ใช้ local อยู่)'}
            </p>
          </div>
        </div>
        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/30 bg-brand-primary/10 px-3 py-1.5 text-xs text-brand-primary transition-colors hover:bg-brand-primary/20"
          >
            <Lock size={13} />
            เข้าสู่ระบบ
          </button>
        )}
      </div>

      {/* Watchlist */}
      {isLoading ? (
        <Card>
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        </Card>
      ) : watchlist.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 bg-brand-warning/10 rounded-full flex items-center justify-center">
              <Star size={28} className="text-brand-warning" />
            </div>
            <div className="text-center">
              <p className="text-brand-text-primary font-medium mb-1">ยังไม่มีหุ้นในรายการโปรด</p>
              <p className="text-sm text-brand-text-secondary">
                กดไอคอนดาวบนหน้าหุ้นเพื่อเพิ่มเข้ารายการโปรด
              </p>
            </div>
            <Link href="/screener">
              <Button variant="secondary">
                ค้นหาหุ้น <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {watchlist.map((item) => (
            <WatchlistItem
              key={item.symbol}
              symbol={item.symbol}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
