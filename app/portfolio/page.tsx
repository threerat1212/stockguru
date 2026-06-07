'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  PieChart,
  Lock,
} from 'lucide-react'
import { useQuote } from '@/lib/hooks/use-stock'
import { useHoldings } from '@/lib/hooks/use-holdings'
import { formatPercent, formatCurrency, getPriceColor, cn } from '@/lib/utils/format'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import AuthModal from '@/components/auth/AuthModal'

interface PortfolioItem {
  id: string
  symbol: string
  quantity: number
  buyPrice: number
  addedAt: number
}

const FOREIGN_SYMBOLS = new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'JPM', 'BABA'])

function normalizeSymbol(symbol: string) {
  const upper = symbol.trim().toUpperCase()
  if (!upper) return ''
  if (upper.includes('.')) return upper
  return FOREIGN_SYMBOLS.has(upper) ? upper : `${upper}.BK`
}

function PortfolioStock({ item, onRemove }: { item: PortfolioItem; onRemove: () => void }) {
  const { data: quote, isLoading } = useQuote(item.symbol)
  const displaySym = item.symbol.replace('.BK', '')
  const currency = quote?.currency ?? (item.symbol.endsWith('.BK') ? 'THB' : 'USD')

  const currentPrice = quote?.price ?? 0
  const totalCost = item.quantity * item.buyPrice
  const totalValue = item.quantity * currentPrice
  const pnl = totalValue - totalCost
  const pnlPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0

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

  return (
    <div className="flex items-center justify-between p-4 bg-brand-card border border-brand-border rounded-xl hover:border-brand-primary/30 transition-all group">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
          pnl >= 0 ? 'bg-brand-success/10' : 'bg-brand-danger/10'
        )}>
          {pnl >= 0 ? (
            <TrendingUp size={18} className="text-brand-success" />
          ) : (
            <TrendingDown size={18} className="text-brand-danger" />
          )}
        </div>
        <div>
          <Link href={`/stock/${encodeURIComponent(item.symbol)}`} className="group/link">
            <p className="text-sm font-semibold text-brand-text-primary group-hover/link:text-brand-primary transition-colors">
              {displaySym}
            </p>
          </Link>
          <p className="text-xs text-brand-text-secondary">
            {item.quantity} หุ้น @ {formatCurrency(item.buyPrice, currency)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-mono-nums text-brand-text-primary">
            {formatCurrency(currentPrice, currency)}
          </p>
          <div className="flex items-center gap-1">
            {pnl >= 0 ? (
              <TrendingUp size={12} className="text-brand-success" />
            ) : (
              <TrendingDown size={12} className="text-brand-danger" />
            )}
            <span className={cn('text-xs font-mono-nums font-semibold', getPriceColor(pnl))}>
              {formatPercent(pnlPercent)}
            </span>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <p className="text-xs text-brand-text-secondary">กำไร/ขาดทุน</p>
          <p className={cn('text-sm font-mono-nums font-bold', getPriceColor(pnl))}>
            {pnl >= 0 ? '+' : ''}{formatCurrency(pnl, currency)}
          </p>
        </div>

        <button
          onClick={onRemove}
          className="p-2 text-brand-text-secondary hover:text-brand-danger rounded-lg hover:bg-brand-danger/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

// Simple pie chart using SVG
function PieChartSVG({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + Math.abs(d.value), 0)
  if (total === 0) return null

  let cumulative = 0
  const radius = 60
  const cx = 75
  const cy = 75

  const slices = data.filter(d => Math.abs(d.value) > 0).map((d) => {
    const pct = Math.abs(d.value) / total
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2
    cumulative += pct
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2

    const x1 = cx + radius * Math.cos(startAngle)
    const y1 = cy + radius * Math.sin(startAngle)
    const x2 = cx + radius * Math.cos(endAngle)
    const y2 = cy + radius * Math.sin(endAngle)

    const largeArc = pct > 0.5 ? 1 : 0

    return {
      ...d,
      pct,
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
    }
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg width="150" height="150" viewBox="0 0 150 150">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="var(--brand-bg)" strokeWidth="2" />
        ))}
        <circle cx={cx} cy={cy} r="30" fill="var(--brand-bg)" />
        <text x={cx} y={cy} textAnchor="middle" dy="0.35em" fill="var(--brand-text-primary)" fontSize="11" fontWeight="bold">
          {data.length}
        </text>
      </svg>
      <div className="flex flex-wrap gap-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-brand-text-secondary">{s.label}</span>
            <span className="text-brand-text-primary font-mono-nums">{(s.pct * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
]

export default function PortfolioPage() {
  const { holdings, isLoading, isAuthenticated, addHolding, removeHolding } = useHoldings()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Form state
  const [formSymbol, setFormSymbol] = useState('')
  const [formQty, setFormQty] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const portfolio: PortfolioItem[] = useMemo(() => {
    return holdings.map(h => ({
      id: h.id,
      symbol: h.symbol,
      quantity: h.quantity,
      buyPrice: h.buyPrice,
      addedAt: new Date(h.createdAt).getTime(),
    }))
  }, [holdings])

  const handleRemove = useCallback(async (id: string) => {
    try {
      await removeHolding(id)
    } catch (err) {
      console.error('Failed to remove holding:', err)
    }
  }, [removeHolding])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const symbol = normalizeSymbol(formSymbol)
    const quantity = parseInt(formQty)
    const buyPrice = parseFloat(formPrice)

    if (!symbol) { setFormError('กรุณาใส่ชื่อหุ้น'); return }
    if (isNaN(quantity) || quantity <= 0) { setFormError('จำนวนหุ้นต้องมากกว่า 0'); return }
    if (isNaN(buyPrice) || buyPrice <= 0) { setFormError('ราคาซื้อต้องมากกว่า 0'); return }

    try {
      await addHolding(symbol, quantity, buyPrice)
      setFormSymbol('')
      setFormQty('')
      setFormPrice('')
    } catch (err) {
      setFormError('ไม่สามารถเพิ่มหุ้นได้ กรุณาลองใหม่')
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-accent/10 rounded-lg flex items-center justify-center">
            <Briefcase size={20} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">พอร์ตการลงทุน</h1>
            <p className="text-sm text-brand-text-secondary">
              {isAuthenticated
                ? `ติดตามผลกำไรขาดทุนของพอร์ตคุณ ${portfolio.length > 0 ? `(${portfolio.length} หุ้น)` : ''}`
                : 'เข้าสู่ระบบเพื่อบันทึกพอร์ตบน Supabase'}
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

      {isLoading && !isAuthenticated ? (
        <Card>
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        </Card>
      ) : !isAuthenticated ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
              <Lock size={28} className="text-brand-primary" />
            </div>
            <div>
              <p className="mb-1 font-medium text-brand-text-primary">เข้าสู่ระบบเพื่อใช้งานพอร์ต</p>
              <p className="max-w-md text-sm text-brand-text-secondary">
                พอร์ตการลงทุนจะบันทึกแยกตามบัญชีผู้ใช้ด้วย Supabase เพื่อให้ข้อมูลยังอยู่หลัง refresh และใช้งานข้ามเครื่องได้
              </p>
            </div>
            <Button type="button" onClick={() => setAuthModalOpen(true)}>
              <Lock size={16} />
              เข้าสู่ระบบ
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Add Stock Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus size={18} className="text-brand-primary" />
                เพิ่มหุ้นในพอร์ต
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="ชื่อหุ้น (เช่น PTT, AAPL)"
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value)}
                  icon={<Briefcase size={16} />}
                />
              </div>
              <div className="w-full sm:w-32">
                <Input
                  type="number"
                  placeholder="จำนวน"
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  min="1"
                />
              </div>
              <div className="w-full sm:w-36">
                <Input
                  type="number"
                  placeholder="ราคาซื้อ"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <Button type="submit" className="sm:w-auto" isLoading={isLoading}>
                <Plus size={16} />
                เพิ่ม
              </Button>
            </form>
            {formError && (
              <p className="mt-2 text-xs text-brand-danger">{formError}</p>
            )}
          </Card>

          {/* Portfolio Summary */}
          {portfolio.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart size={18} className="text-brand-accent" />
                  สัดส่วนพอร์ต
                </CardTitle>
              </CardHeader>
              <PieChartSVG
                data={portfolio.map((item, i) => ({
                  label: item.symbol.replace('.BK', ''),
                  value: item.quantity * item.buyPrice,
                  color: PIE_COLORS[i % PIE_COLORS.length],
                }))}
              />
            </Card>
          )}

          {/* Portfolio List */}
          {isLoading ? (
            <Card>
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner size="lg" />
              </div>
            </Card>
          ) : portfolio.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center">
                  <Briefcase size={28} className="text-brand-accent" />
                </div>
                <div className="text-center">
                  <p className="text-brand-text-primary font-medium mb-1">ยังไม่มีหุ้นในพอร์ต</p>
                  <p className="text-sm text-brand-text-secondary">
                    เพิ่มหุ้นด้วยฟอร์มด้านบนเพื่อเริ่มติดตามผลกำไรขาดทุน
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {portfolio.map((item) => (
                <PortfolioStock
                  key={item.id}
                  item={item}
                  onRemove={() => handleRemove(item.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
