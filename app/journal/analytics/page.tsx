'use client'

import Link from 'next/link'
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Target, AlertTriangle, Award, XCircle } from 'lucide-react'
import { useTrades } from '@/lib/hooks/use-journal'
import JournalGate from '@/components/journal/JournalGate'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { formatCurrency, formatPercent, cn } from '@/lib/utils/format'
import type { Trade } from '@/lib/hooks/use-journal'

function EquityCurve({ trades }: { trades: Trade[] }) {
  // Sort by closed/open date
  const sorted = [...trades].sort((a, b) => new Date(a.closed_at ?? a.opened_at).getTime() - new Date(b.closed_at ?? b.opened_at).getTime())
  const points = sorted.reduce<{ x: number; y: number; label: string }[]>((acc, t, i) => {
    const prev = acc[i - 1]?.y ?? 0
    acc.push({ x: i, y: prev + (t.pnl ?? 0), label: t.symbol })
    return acc
  }, [])

  if (points.length < 2) return null

  const minY = Math.min(0, ...points.map((p) => p.y))
  const maxY = Math.max(0, ...points.map((p) => p.y))
  const range = maxY - minY || 1
  const width = 800
  const height = 200
  const pad = { top: 10, right: 10, bottom: 20, left: 10 }

  const toX = (i: number) => pad.left + (i / (points.length - 1)) * (width - pad.left - pad.right)
  const toY = (v: number) => height - pad.bottom - ((v - minY) / range) * (height - pad.top - pad.bottom)

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.y)}`).join(' ')
  const zeroY = toY(0)

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[400px]" preserveAspectRatio="none">
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <line key={r} x1={pad.left} y1={toY(minY + range * r)} x2={width - pad.right} y2={toY(minY + range * r)} stroke="currentColor" strokeOpacity={0.1} className="text-brand-border" />
        ))}
        {/* Zero line */}
        <line x1={pad.left} y1={zeroY} x2={width - pad.right} y2={zeroY} stroke="currentColor" strokeOpacity={0.3} strokeDasharray="4 4" className="text-brand-text-secondary" />
        {/* Area fill */}
        <path d={`${pathD} L ${toX(points.length - 1)} ${zeroY} L ${toX(0)} ${zeroY} Z`} fill="currentColor" fillOpacity={0.08} className={points[points.length - 1].y >= 0 ? 'text-brand-success' : 'text-brand-danger'} />
        {/* Line */}
        <path d={pathD} fill="none" stroke="currentColor" strokeWidth={2} className={points[points.length - 1].y >= 0 ? 'text-brand-success' : 'text-brand-danger'} />
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={toX(i)} cy={toY(p.y)} r={3} fill="currentColor" className={p.y >= 0 ? 'text-brand-success' : 'text-brand-danger'} />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-brand-text-muted mt-1">
        <span>{sorted[0].symbol} · {new Date(sorted[0].closed_at ?? sorted[0].opened_at).toLocaleDateString('th-TH')}</span>
        <span>{sorted[sorted.length - 1].symbol} · {new Date(sorted[sorted.length - 1].closed_at ?? sorted[sorted.length - 1].opened_at).toLocaleDateString('th-TH')}</span>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: trades, isLoading } = useTrades()

  if (isLoading) {
    return (
      <JournalGate>
        <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
      </JournalGate>
    )
  }

  const all = trades ?? []
  const closed = all.filter((t) => t.status === 'closed')
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0)
  const losses = closed.filter((t) => (t.pnl ?? 0) <= 0)

  const totalTrades = closed.length
  const winRate = totalTrades > 0 ? wins.length / totalTrades : 0
  const totalProfit = wins.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const totalLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0))
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0
  const avgWin = wins.length > 0 ? totalProfit / wins.length : 0
  const avgLoss = losses.length > 0 ? totalLoss / losses.length : 0
  const expectancy = totalTrades > 0 ? closed.reduce((s, t) => s + (t.pnl ?? 0), 0) / totalTrades : 0
  const avgR = closed.length > 0 && closed.some((t) => t.r_multiple !== null) ? closed.reduce((s, t) => s + (t.r_multiple ?? 0), 0) / closed.filter((t) => t.r_multiple !== null).length : 0

  // Best/worst setup
  const setupMap = new Map<string, { wins: number; total: number; pnl: number }>()
  closed.forEach((t) => {
    if (!t.setup) return
    const existing = setupMap.get(t.setup) ?? { wins: 0, total: 0, pnl: 0 }
    existing.total++
    existing.pnl += t.pnl ?? 0
    if ((t.pnl ?? 0) > 0) existing.wins++
    setupMap.set(t.setup, existing)
  })
  const setups = Array.from(setupMap.entries()).map(([name, data]) => ({ name, ...data }))
  const bestSetup = setups.length > 0 ? setups.reduce((a, b) => a.pnl > b.pnl ? a : b) : null
  const worstSetup = setups.length > 0 ? setups.reduce((a, b) => a.pnl < b.pnl ? a : b) : null

  // Common mistake
  const mistakeCounts = new Map<string, number>()
  closed.forEach((t) => {
    t.mistake_tags?.forEach((tag) => {
      mistakeCounts.set(tag, (mistakeCounts.get(tag) ?? 0) + 1)
    })
  })
  const commonMistakes = Array.from(mistakeCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Running PnL for drawdown
  let peak = 0
  let maxDrawdown = 0
  let running = 0
  closed.forEach((t) => {
    running += t.pnl ?? 0
    if (running > peak) peak = running
    const dd = peak - running
    if (dd > maxDrawdown) maxDrawdown = dd
  })

  return (
    <JournalGate>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/journal">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft size={16} />
              กลับ
            </Button>
          </Link>
          <h1 className="heading-balance text-2xl font-bold text-brand-text-primary flex items-center gap-2">
            <BarChart3 size={24} className="text-brand-primary" />
            วิเคราะห์ผลงาน
          </h1>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <p className="text-xs text-brand-text-secondary">Total Trades</p>
            <p className="text-2xl font-bold text-brand-text-primary">{totalTrades}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-brand-text-secondary">Win Rate</p>
            <p className={cn('text-2xl font-bold', winRate >= 0.5 ? 'text-brand-success' : 'text-brand-danger')}>
              {formatPercent(winRate * 100)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-brand-text-secondary">Profit Factor</p>
            <p className={cn('text-2xl font-bold', profitFactor >= 1.5 ? 'text-brand-success' : 'text-brand-warning')}>
              {profitFactor === 999 ? '>999' : profitFactor.toFixed(2)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-brand-text-secondary">Expectancy</p>
            <p className={cn('text-2xl font-bold', expectancy >= 0 ? 'text-brand-success' : 'text-brand-danger')}>
              {formatCurrency(expectancy)}
            </p>
          </Card>
        </div>

        {/* Equity Curve */}
        {closed.length > 1 && (
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-brand-text-primary mb-3">Equity Curve</h2>
            <EquityCurve trades={closed} />
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Stats */}
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-brand-text-primary flex items-center gap-2">
              <Target size={16} className="text-brand-primary" />
              สถิติ
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Win</span>
                <span className="text-brand-success font-medium">{wins.length} ({formatPercent(winRate * 100)})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Loss</span>
                <span className="text-brand-danger font-medium">{losses.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Avg Win</span>
                <span className="text-brand-success font-medium">{formatCurrency(avgWin)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Avg Loss</span>
                <span className="text-brand-danger font-medium">{formatCurrency(-avgLoss)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Avg R</span>
                <span className={cn('font-medium', avgR >= 0 ? 'text-brand-success' : 'text-brand-danger')}>
                  {avgR.toFixed(2)}R
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Max Drawdown</span>
                <span className="text-brand-danger font-medium">{formatCurrency(maxDrawdown)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Net P&L</span>
                <span className={cn('font-medium', (totalProfit - totalLoss) >= 0 ? 'text-brand-success' : 'text-brand-danger')}>
                  {formatCurrency(totalProfit - totalLoss)}
                </span>
              </div>
            </div>
          </Card>

          {/* Setups */}
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-brand-text-primary flex items-center gap-2">
              <Award size={16} className="text-brand-accent" />
              รูปแบบการเทรด
            </h2>
            {bestSetup && (
              <div className="p-3 bg-brand-success/5 border border-brand-success/20 rounded-lg">
                <p className="text-xs text-brand-text-secondary">Best Setup</p>
                <p className="text-sm font-medium text-brand-success">{bestSetup.name}</p>
                <p className="text-xs text-brand-text-muted">{formatCurrency(bestSetup.pnl)} · {bestSetup.wins}/{bestSetup.total} wins</p>
              </div>
            )}
            {worstSetup && (
              <div className="p-3 bg-brand-danger/5 border border-brand-danger/20 rounded-lg">
                <p className="text-xs text-brand-text-secondary">Worst Setup</p>
                <p className="text-sm font-medium text-brand-danger">{worstSetup.name}</p>
                <p className="text-xs text-brand-text-muted">{formatCurrency(worstSetup.pnl)} · {worstSetup.wins}/{worstSetup.total} wins</p>
              </div>
            )}
            {setups.length === 0 && (
              <p className="text-sm text-brand-text-muted">ยังไม่มีข้อมูลรูปแบบการเทรด</p>
            )}
          </Card>

          {/* Mistakes */}
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-brand-text-primary flex items-center gap-2">
              <XCircle size={16} className="text-brand-danger" />
              ความผิดพลาดที่พบบ่อย
            </h2>
            {commonMistakes.length > 0 ? (
              <div className="space-y-2">
                {commonMistakes.map(([tag, count]) => (
                  <div key={tag} className="flex items-center justify-between p-2 bg-brand-bg-secondary rounded-lg">
                    <span className="text-sm text-brand-text-primary">{tag}</span>
                    <span className="text-xs text-brand-danger font-medium">{count} ครั้ง</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-brand-text-muted">ยังไม่มีข้อมูลความผิดพลาด</p>
            )}
          </Card>
        </div>

        <div className="flex items-start gap-2 p-3 bg-brand-warning/5 border border-brand-warning/20 rounded-lg">
          <AlertTriangle size={16} className="text-brand-warning shrink-0 mt-0.5" />
          <p className="text-xs text-brand-text-secondary leading-relaxed">
            ข้อมูลนี้ใช้เพื่อการทบทวนตนเองและวิเคราะห์พฤติกรรมการเทรดเท่านั้น ไม่ใช่คำแนะนำการลงทุน
          </p>
        </div>
      </div>
    </JournalGate>
  )
}
