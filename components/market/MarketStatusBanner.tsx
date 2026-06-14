'use client'

import { Clock, RefreshCw, Signal } from 'lucide-react'
import Button from '@/components/ui/Button'
import DataSourceBadge from '@/components/market/DataSourceBadge'
import type { MarketDataSourceMeta, MarketSummary } from '@/types/stock'
import { cn } from '@/lib/utils/format'

interface MarketStatus {
  label: string
  detail: string
  tone: 'success' | 'warning' | 'neutral'
}

function getMarketStatus(meta?: MarketDataSourceMeta | null, now = new Date()): MarketStatus {
  const trading = meta && 'trading' in meta ? meta.trading : undefined
  const phase = trading?.session.phase

  if (phase === 'market_open') {
    return { label: 'เปิดตลาด', detail: 'ตลาดไทยกำลังซื้อขาย', tone: 'success' }
  }

  if (phase === 'lunch_break') {
    return { label: 'พักเที่ยง', detail: 'ตลาดไทยพัก 12:30-14:30 น.', tone: 'warning' }
  }

  if (phase === 'pre_open') {
    return { label: 'รอเปิดตลาด', detail: 'ตลาดไทยเปิด 10:00 น.', tone: 'neutral' }
  }

  if (phase === 'after_hours') {
    return { label: 'ปิดตลาด', detail: 'ตลาดไทยปิดทำการ 16:30 น.', tone: 'neutral' }
  }

  if (phase === 'closed') {
    return { label: 'ปิดตลาด', detail: 'วันหยุดตลาดไทย', tone: 'neutral' }
  }

  const day = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()

  if (day === 0 || day === 6) {
    return { label: 'ปิดตลาด', detail: 'วันหยุดตลาดไทย', tone: 'neutral' }
  }

  if (minutes < 600) {
    return { label: 'รอเปิดตลาด', detail: 'ตลาดไทยเปิด 10:00 น.', tone: 'neutral' }
  }

  if (minutes >= 600 && minutes < 750) {
    return { label: 'เปิดตลาด', detail: 'ช่วงเช้า 10:00-12:30 น.', tone: 'success' }
  }

  if (minutes >= 750 && minutes < 870) {
    return { label: 'พักเที่ยง', detail: 'ตลาดไทยพัก 12:30-14:30 น.', tone: 'warning' }
  }

  if (minutes >= 870 && minutes < 990) {
    return { label: 'เปิดตลาด', detail: 'ช่วงบ่าย 14:30-16:30 น.', tone: 'success' }
  }

  return { label: 'ปิดตลาด', detail: 'ตลาดไทยปิดทำการ 16:30 น.', tone: 'neutral' }
}

function toneClasses(tone: MarketStatus['tone']) {
  switch (tone) {
    case 'success':
      return {
        icon: 'border-brand-success/30 bg-brand-success/10 text-brand-success',
        text: 'text-brand-success',
      }
    case 'warning':
      return {
        icon: 'border-brand-warning/30 bg-brand-warning/10 text-brand-warning',
        text: 'text-brand-warning',
      }
    default:
      return {
        icon: 'border-brand-border bg-brand-bg-secondary text-brand-text-secondary',
        text: 'text-brand-text-secondary',
      }
  }
}

export default function MarketStatusBanner({
  summary,
  meta,
  isFetching,
  refetch,
}: {
  summary: MarketSummary
  meta?: MarketDataSourceMeta | null
  isFetching: boolean
  refetch: () => void
}) {
  const status = getMarketStatus(meta)
  const classes = toneClasses(status.tone)
  const updatedAt = new Date(summary.updatedAt)

  return (
    <div className="rounded-xl border border-brand-border bg-brand-card p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', classes.icon)}>
            <Signal size={18} aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Market Status</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className={cn('text-lg font-bold text-brand-text-primary', classes.text)}>
                {status.label}
              </h2>
              <div className="flex items-center gap-1 text-xs text-brand-text-muted">
                <Clock size={13} />
                อัปเดต {updatedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <p className="mt-1 text-xs text-brand-text-secondary">
              {status.detail} • รีเฟรชอัตโนมัติทุก 60 วินาที • ข้อมูลล่าสุด {updatedAt.toLocaleDateString('th-TH')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <DataSourceBadge meta={meta} compact />
          <Button variant="secondary" size="sm" onClick={() => refetch()} isLoading={isFetching}>
            <RefreshCw size={14} />
            {isFetching ? 'กำลังรีเฟรช' : 'รีเฟรช'}
          </Button>
        </div>
      </div>
    </div>
  )
}
