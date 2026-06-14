'use client'

import Link from 'next/link'
import type { MarketSectorSummary } from '@/types/stock'
import { cn, formatPercent } from '@/lib/utils/format'

function toneClass(change: number) {
  return change > 0 ? 'text-brand-success' : change < 0 ? 'text-brand-danger' : 'text-brand-text-secondary'
}

function bgToneClass(change: number) {
  return change > 0 ? 'bg-brand-success/10' : change < 0 ? 'bg-brand-danger/10' : 'bg-brand-text-secondary/10'
}

function intensity(change: number, max: number) {
  return Math.min(1, Math.max(0.12, Math.abs(change) / max))
}

function SectorHeatmapCell({ sector, max }: { sector: MarketSectorSummary; max: number }) {
  const value = intensity(sector.avgChangePercent, max)
  const isPositive = sector.avgChangePercent >= 0
  const style = {
    backgroundColor: isPositive
      ? `rgba(16, 185, 129, ${0.08 + value * 0.24})`
      : `rgba(244, 63, 94, ${0.08 + value * 0.24})`,
  }

  return (
    <div className="rounded-xl border border-brand-border bg-brand-card p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-text-primary">{sector.sector}</p>
          <p className="mt-1 text-xs text-brand-text-secondary">
            {sector.count} หุ้น • ขึ้น {sector.advancing} / ลง {sector.declining}
          </p>
        </div>
        <span className={cn('shrink-0 rounded-md px-2 py-1 text-xs font-semibold', bgToneClass(sector.avgChangePercent), toneClass(sector.avgChangePercent))}>
          {formatPercent(sector.avgChangePercent)}
        </span>
      </div>
      <div className="h-10 overflow-hidden rounded-lg border border-brand-border/40" style={style}>
        <div className="flex h-full items-end justify-between px-2 py-1.5 text-[10px] font-semibold text-brand-text-primary">
          <span>top {sector.topSymbol.replace('.BK', '')}</span>
          <span className={toneClass(sector.topChangePercent)}>{formatPercent(sector.topChangePercent)}</span>
        </div>
      </div>
    </div>
  )
}

export default function SectorHeatmap({ sectors }: { sectors?: MarketSectorSummary[] }) {
  const items = sectors ?? []
  const max = Math.max(1, ...items.map((sector) => Math.abs(sector.avgChangePercent)))

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="rounded-xl border border-brand-border/50 bg-brand-card p-6 text-center text-sm text-brand-text-secondary">
          ไม่พบข้อมูลกลุ่มอุตสาหกรรม
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((sector) => (
            <SectorHeatmapCell key={sector.sector} sector={sector} max={max} />
          ))}
        </div>
      )}
      {items.length > 6 && (
        <div className="flex justify-end">
          <Link href="/sector" className="text-xs font-medium text-brand-primary hover:text-emerald-300">
            ดูกลุ่มอุตสาหกรรมทั้งหมด
          </Link>
        </div>
      )}
    </div>
  )
}
