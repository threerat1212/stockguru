'use client'

import Link from 'next/link'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  Layers3,
  PieChart,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { DataHonestyBanner } from '@/components/market/DataSourceBadge'
import IndexCards from '@/components/market/IndexCards'
import MarketStatusBanner from '@/components/market/MarketStatusBanner'
import SectorHeatmap from '@/components/market/SectorHeatmap'
import { useMarketSummary } from '@/lib/hooks/use-stock'
import type { MarketBreadthSegment, MarketMover, MarketSummary } from '@/types/stock'
import { cn, formatCurrency, formatNumber, formatPercent, formatVolume, getPriceColor } from '@/lib/utils/format'

function toneClass(change: number) {
  return change > 0 ? 'text-brand-success' : change < 0 ? 'text-brand-danger' : 'text-brand-text-secondary'
}

function breadthRatio(segment?: MarketBreadthSegment) {
  if (!segment?.total) return 0
  return segment.advancing / segment.total
}

function BreadthSegmentCard({
  title,
  segment,
}: {
  title: string
  segment?: MarketBreadthSegment
}) {
  if (!segment) {
    return (
      <div className="rounded-lg border border-brand-border/50 bg-brand-bg-secondary p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-brand-text-primary">{title}</p>
          <span className="text-xs text-brand-text-muted">รอข้อมูล</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-bg-secondary" />
        <p className="mt-2 text-xs text-brand-text-secondary">กำลังโหลด breadth</p>
      </div>
    )
  }

  const ratio = breadthRatio(segment)
  const balance = (ratio - 0.5) * 200
  const tone = toneClass(segment.advancing - segment.declining)

  return (
    <div className="rounded-lg border border-brand-border/50 bg-brand-bg-secondary p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-brand-text-primary">{title}</p>
        <span className={cn('text-xs font-mono-nums font-semibold', tone)}>{formatPercent(balance)}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-bg-secondary">
        <div className="h-full rounded-full bg-brand-success transition-all" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-text-secondary">
        <span className="text-brand-success">ขึ้น {segment.advancing}</span>
        <span className="text-brand-danger">ลง {segment.declining}</span>
        <span>ไม่เปลี่ยน {segment.unchanged}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-brand-text-muted">
        <span>Vol {formatVolume(segment.volume)}</span>
        <span>Value {formatCurrency(segment.value, 'THB')}</span>
      </div>
    </div>
  )
}

function BreadthPanel({ summary }: { summary: MarketSummary }) {
  const totalRatio = breadthRatio(summary.breadth)
  const split = summary.breadthByExchange

  return (
    <div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-brand-bg-secondary">
        <div className="h-full rounded-full bg-brand-success transition-all" style={{ width: `${totalRatio * 100}%` }} />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <BreadthSegmentCard title="SET" segment={split.SET} />
        <BreadthSegmentCard title="mai" segment={split.mai} />
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
        <p className={cn('text-xs font-mono-nums font-semibold', getPriceColor(item.changePercent))}>
          {formatPercent(item.changePercent)}
        </p>
      </div>
    </Link>
  )
}

function MoverColumn({ title, items, empty, limit = 5 }: { title: string; items: MarketMover[]; empty: string; limit?: number }) {
  const visibleItems = items.slice(0, limit)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-text-primary">{title}</h3>
        <span className="text-[11px] text-brand-text-muted">Top {Math.min(limit, items.length || limit)}</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-brand-border p-4 text-center text-sm text-brand-text-secondary">{empty}</div>
      ) : (
        visibleItems.map((item) => <MoverRow key={`${title}-${item.symbol}`} item={item} />)
      )}
    </div>
  )
}

function PageError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-brand-danger/30 bg-brand-danger/5 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-text-primary">ไม่สามารถโหลดข้อมูลตลาด</h2>
          <p className="mt-1 text-sm text-brand-text-secondary">{error}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onRetry}>ลองอีกครั้ง</Button>
      </div>
    </div>
  )
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-card p-8 text-center">
      <BarChart3 size={32} className="mx-auto text-brand-text-muted" />
      <h2 className="mt-4 text-lg font-bold text-brand-text-primary">ยังไม่พบข้อมูลตลาด</h2>
      <p className="mt-1 text-sm text-brand-text-secondary">ลองรีเฟรชเพื่อตรวจสอบข้อมูลล่าสุด</p>
      <div className="mt-4">
        <Button variant="secondary" size="sm" onClick={onRetry}>รีเฟรชข้อมูล</Button>
      </div>
    </div>
  )
}

function MarketLoadingState() {
  return (
    <div className="space-y-6 fade-in" aria-busy="true">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Market Dashboard</p>
          <h1 className="heading-balance mt-2 text-2xl font-bold text-brand-text-primary">ภาพรวมตลาดไทย</h1>
          <p className="mt-1 text-sm text-brand-text-secondary">
            กำลังโหลด breadth, sector heatmap และหุ้นเคลื่อนไหวสูงสุดจากข้อมูลล่าสุด
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-brand-text-muted">
          <div className="flex min-h-10 items-center gap-1 rounded-lg border border-brand-border bg-brand-card px-2.5">
            <Clock size={14} />
            Auto-refresh 60s
          </div>
          <div className="flex min-h-10 items-center gap-1 rounded-lg border border-brand-border bg-brand-card px-2.5">
            <Activity size={14} />
            รอข้อมูลล่าสุด
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-card p-5">
        <div className="flex items-center gap-3 text-sm text-brand-text-secondary">
          <Activity size={18} className="animate-spin text-brand-primary" />
          กำลังโหลดข้อมูลตลาด...
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <PieChart size={18} className="text-brand-primary" />
              <h2 className="text-sm font-semibold text-brand-text-primary">Market Breadth</h2>
            </div>
            <div className="h-28 animate-pulse rounded-lg bg-brand-bg-secondary" />
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Layers3 size={18} className="text-brand-primary" />
              <h2 className="text-sm font-semibold text-brand-text-primary">Sector Heatmap</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg bg-brand-bg-secondary" />
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-brand-border bg-brand-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand-text-primary">Movers</h2>
            <BarChart3 size={16} className="text-brand-primary" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-brand-bg-secondary" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function MarketPage() {
  const { data: summary, meta, error, isLoading, isFetching, refetch } = useMarketSummary()

  const isEmpty = Boolean(
    summary &&
      (!summary.indices.length || !summary.breadth.total || !summary.sectors.length)
  )

  if (isLoading) {
    return <MarketLoadingState />
  }

  if ((error || isEmpty) && !summary) {
    return <PageError error={error instanceof Error ? error.message : 'ไม่พบข้อมูลตลาด'} onRetry={() => refetch()} />
  }

  if (isEmpty) {
    return <EmptyState onRetry={() => refetch()} />
  }

  if (!summary) {
    return <EmptyState onRetry={() => refetch()} />
  }

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
        <div className="flex flex-wrap items-center gap-2 text-xs text-brand-text-muted">
          <div className="flex items-center gap-1 rounded-lg border border-brand-border bg-brand-card px-2.5 py-1.5">
            <Clock size={14} />
            Auto-refresh 60s
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-brand-border bg-brand-card px-2.5 py-1.5">
            <Activity size={14} />
            {summary.breadth.total} หุ้นติดตาม
          </div>
        </div>
      </div>

      <DataHonestyBanner meta={meta} />
      <MarketStatusBanner summary={summary} meta={meta} isFetching={isFetching} refetch={() => refetch()} />
      <IndexCards indices={summary.indices} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart size={18} className="text-brand-primary" />
                <h2 className="text-sm font-semibold text-brand-text-primary">Market Breadth</h2>
              </div>
              <span className="text-xs text-brand-text-muted">SET vs mai</span>
            </div>
            <BreadthPanel summary={summary} />
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers3 size={18} className="text-brand-primary" />
                <h2 className="text-sm font-semibold text-brand-text-primary">Sector Heatmap</h2>
              </div>
              <Link href="/sector" className="text-xs text-brand-primary hover:text-emerald-300">ดูทั้งหมด</Link>
            </div>
            <SectorHeatmap sectors={summary.sectors} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-brand-text-primary">Movers</h2>
                <p className="text-[11px] text-brand-text-muted">แสดงเฉพาะตัวที่ควร scan ก่อน</p>
              </div>
              <Link href="/trending" className="text-xs font-semibold text-brand-primary hover:text-emerald-300">ดูทั้งหมด</Link>
            </div>
            <div className="space-y-4">
              <MoverColumn title="Gainers" items={summary.movers.gainers} empty="ไม่มีข้อมูล" limit={5} />
              <MoverColumn title="Losers" items={summary.movers.losers} empty="ไม่มีข้อมูล" limit={5} />
            </div>
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-text-primary">Active Volume</h2>
              <span className="text-[11px] text-brand-text-muted">Top 6</span>
            </div>
            <div className="space-y-2">
              {summary.movers.active.length === 0 ? (
                <div className="rounded-lg border border-brand-border p-4 text-center text-sm text-brand-text-secondary">ไม่มีข้อมูล volume</div>
              ) : (
                summary.movers.active.slice(0, 6).map((item: MarketMover) => <MoverRow key={`active-${item.symbol}`} item={item} />)
              )}
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
