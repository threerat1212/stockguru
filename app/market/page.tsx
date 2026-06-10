'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  Layers3,
  PieChart,
  TrendingUp,
} from 'lucide-react'
import MarketOverview from '@/components/market/MarketOverview'
import { LoadingCard } from '@/components/ui/Loading'
import type { MarketMover, MarketSectorSummary, MarketSummary } from '@/types/stock'
import { cn, formatCurrency, formatNumber, formatPercent, formatVolume, getPriceColor } from '@/lib/utils/format'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: unknown
}

function toneClass(change: number) {
  return change > 0 ? 'text-brand-success' : change < 0 ? 'text-brand-danger' : 'text-brand-text-secondary'
}

function bgToneClass(change: number) {
  return change > 0 ? 'bg-brand-success/10' : change < 0 ? 'bg-brand-danger/10' : 'bg-brand-text-secondary/10'
}

function SectorBar({ sector }: { sector: MarketSectorSummary }) {
  const max = 12
  const width = Math.max(4, Math.min(100, Math.abs(sector.avgChangePercent) / max * 100))
  return (
    <div className="rounded-xl border border-brand-border bg-brand-card p-3 transition-colors hover:border-brand-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-text-primary">{sector.sector}</p>
          <p className="mt-1 text-xs text-brand-text-secondary">
            {sector.count} หุ้น • นำโดย {sector.topSymbol}
          </p>
        </div>
        <div className={cn('shrink-0 rounded-md px-2 py-1 text-xs font-semibold', bgToneClass(sector.avgChangePercent), toneClass(sector.avgChangePercent))}>
          {formatPercent(sector.avgChangePercent)}
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-bg-secondary">
        <div
          className={cn('h-full rounded-full transition-all', sector.avgChangePercent >= 0 ? 'bg-brand-success' : 'bg-brand-danger')}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-brand-text-muted">
        <span>ขึ้น {sector.advancing}</span>
        <span>ลง {sector.declining}</span>
      </div>
    </div>
  )
}

function MoverRow({ item }: { item: MarketMover }) {
  return (
    <Link href={`/stock/${encodeURIComponent(item.symbol)}`} className="group grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-brand-border p-3 transition-colors hover:border-brand-primary/30 hover:bg-brand-surface-hover/70">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-brand-text-primary group-hover:text-brand-primary">{item.symbol.replace('.BK', '')}</p>
          {item.exchange && (
            <span className="rounded bg-brand-bg-secondary px-1.5 py-0.5 text-[10px] text-brand-text-muted">{item.exchange}</span>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-brand-text-secondary">{item.name}</p>
        <p className="mt-1 text-[11px] text-brand-text-muted">Vol {formatVolume(item.volume)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-mono-nums font-semibold text-brand-text-primary">{formatNumber(item.price, 2)}</p>
        <p className={cn('text-xs font-mono-nums font-semibold', toneClass(item.changePercent))}>
          {formatPercent(item.changePercent)}
        </p>
      </div>
    </Link>
  )
}

function MoverColumn({ title, items, empty }: { title: string; items: MarketMover[]; empty: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-text-primary">{title}</h3>
        <Activity size={15} className="text-brand-primary" />
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-brand-border p-4 text-center text-sm text-brand-text-secondary">{empty}</div>
      ) : (
        items.map((item) => <MoverRow key={`${title}-${item.symbol}`} item={item} />)
      )}
    </div>
  )
}

export default function MarketPage() {
  const [summary, setSummary] = useState<MarketSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/market/summary', { cache: 'no-store' })
        const json = (await res.json()) as ApiResponse<MarketSummary>
        if (!res.ok || !json.success) throw new Error(json.error ?? 'ไม่สามารถโหลดข้อมูลตลาดได้')
        if (mounted) setSummary(json.data ?? null)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลตลาดได้')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const breadthRatio = useMemo(() => {
    if (!summary?.breadth.total) return 0
    return summary.breadth.advancing / summary.breadth.total
  }, [summary])

  if (isLoading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="rounded-xl border border-brand-danger/30 bg-brand-danger/5 p-6 text-sm text-brand-danger">
        {error ?? 'ไม่พบข้อมูลตลาด'}
      </div>
    )
  }

  const setIndex = summary.indices.find((index) => index.symbol === 'SET') ?? summary.indices[0]

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Market Dashboard</p>
          <h1 className="heading-balance mt-2 text-2xl font-bold text-brand-text-primary">ภาพรวมตลาดไทย</h1>
          <p className="mt-1 text-sm text-brand-text-secondary">
            SET / mai breadth, sector heatmap, และหุ้นเคลื่อนไหวสูงสุดจากข้อมูลล่าสุด
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-brand-text-muted">
          <Clock size={14} />
          อัปเดต {new Date(summary.updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="space-y-4">
          <MarketOverview />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-brand-border bg-brand-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart size={18} className="text-brand-primary" />
                  <h2 className="text-sm font-semibold text-brand-text-primary">Market Breadth</h2>
                </div>
                <span className="text-xs text-brand-text-muted">{summary.breadth.total} หุ้น</span>
              </div>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-brand-text-secondary">ขึ้น / ลง / ไม่เปลี่ยน</p>
                  <p className="mt-1 text-2xl font-mono-nums font-bold text-brand-text-primary">
                    {summary.breadth.advancing} / {summary.breadth.declining} / {summary.breadth.unchanged}
                  </p>
                </div>
                <p className={cn('text-lg font-mono-nums font-bold', toneClass(summary.breadth.advancing - summary.breadth.declining))}>
                  {formatPercent((breadthRatio - 0.5) * 200)}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-brand-bg-secondary">
                <div className="h-full rounded-full bg-brand-success" style={{ width: `${breadthRatio * 100}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-brand-bg-secondary p-3">
                  <p className="text-brand-text-muted">มูลค่าซื้อขายโดยประมาณ</p>
                  <p className="mt-1 font-mono-nums font-semibold text-brand-text-primary">{formatCurrency(summary.breadth.value, 'THB')}</p>
                </div>
                <div className="rounded-lg bg-brand-bg-secondary p-3">
                  <p className="text-brand-text-muted">ปริมาณซื้อขาย</p>
                  <p className="mt-1 font-mono-nums font-semibold text-brand-text-primary">{formatVolume(summary.breadth.volume)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-brand-border bg-brand-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers3 size={18} className="text-brand-primary" />
                  <h2 className="text-sm font-semibold text-brand-text-primary">Top Sectors</h2>
                </div>
                <Link href="/sector" className="text-xs text-brand-primary hover:text-emerald-300">ดูทั้งหมด</Link>
              </div>
              <div className="space-y-3">
                {summary.sectors.slice(0, 5).map((sector) => (
                  <div key={sector.sector} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-brand-text-primary">{sector.sector}</p>
                      <p className="text-xs text-brand-text-muted">top {sector.topSymbol} • {formatPercent(sector.topChangePercent)}</p>
                    </div>
                    <span className={cn('text-xs font-mono-nums font-semibold', toneClass(sector.avgChangePercent))}>
                      {formatPercent(sector.avgChangePercent)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-text-secondary">SET Index</p>
                <p className="mt-1 text-3xl font-mono-nums font-bold text-brand-text-primary">{formatNumber(setIndex?.price ?? 0, 2)}</p>
              </div>
              <div className={cn('rounded-xl p-3', bgToneClass(setIndex?.change ?? 0))}>
                {setIndex && setIndex.change >= 0 ? <ArrowUpRight className={toneClass(setIndex.change)} /> : <ArrowDownRight className={toneClass(setIndex?.change ?? 0)} />}
              </div>
            </div>
            <div className={cn('text-sm font-mono-nums font-semibold', toneClass(setIndex?.change ?? 0))}>
              {setIndex ? `${formatPercent(setIndex.changePercent)} (${formatNumber(setIndex.change, 2)})` : '—'}
            </div>
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-text-primary">Movers</h2>
              <BarChart3 size={16} className="text-brand-primary" />
            </div>
            <div className="space-y-4">
              <MoverColumn title="Gainers" items={summary.movers.gainers} empty="ไม่มีข้อมูล" />
              <MoverColumn title="Losers" items={summary.movers.losers} empty="ไม่มีข้อมูล" />
            </div>
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <h2 className="mb-2 text-sm font-semibold text-brand-text-primary">Active by Volume</h2>
            <div className="space-y-2">
              {summary.movers.active.slice(0, 5).map((item) => (
                <MoverRow key={`active-${item.symbol}`} item={item} />
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="rounded-xl border border-brand-warning/20 bg-brand-warning/5 p-4 text-xs leading-relaxed text-brand-text-secondary">
        ข้อมูลนี้ใช้เพื่อติดตามภาพรวมตลาดเท่านั้น ไม่ใช่คำแนะนำการลงทุน กรุณาตรวจสอบแหล่งข้อมูลและบริหารความเสี่ยงก่อนตัดสินใจ
      </div>
    </div>
  )
}
