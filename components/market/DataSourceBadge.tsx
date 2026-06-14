'use client'

import { AlertTriangle, Clock, Database, Wifi } from 'lucide-react'
import type { MarketDataSourceMeta, MarketSummaryMeta } from '@/types/stock'
import type { MarketDataMeta } from '@/lib/market-data/types'
import { cn } from '@/lib/utils/format'

interface DataSourceBadgeProps {
  meta?: MarketDataSourceMeta | null
  className?: string
  compact?: boolean
}

function isMarketDataMeta(value: unknown): value is MarketDataMeta {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'source' in value &&
      'provider' in value &&
      'updatedAt' in value
  )
}

function isMarketSummaryMeta(value: unknown): value is MarketSummaryMeta {
  return Boolean(value && typeof value === 'object' && 'sources' in value)
}

function collectMeta(meta?: MarketDataSourceMeta | null): MarketDataMeta[] {
  if (!meta) return []
  if (isMarketSummaryMeta(meta)) return Object.values(meta.sources).filter(isMarketDataMeta)
  if (isMarketDataMeta(meta)) return [meta]
  return []
}

function latestUpdatedAt(meta: MarketDataMeta[]) {
  return meta.reduce((latest, item) => Math.max(latest, item.updatedAt), 0)
}

export default function DataSourceBadge({ meta, className, compact = false }: DataSourceBadgeProps) {
  const metas = collectMeta(meta)
  if (!metas.length) return null

  const isDemo = metas.some((item) => item.isDemo || item.source === 'fallback')
  const isCache = metas.some((item) => item.source === 'cache')
  const providers = Array.from(new Set(metas.map((item) => item.provider).filter(Boolean)))
  const providerLabel = providers.length ? providers.join(' + ') : 'Market Data'

  const config = isDemo
    ? {
        icon: AlertTriangle,
        label: compact ? 'ข้อมูลตัวอย่าง' : `ข้อมูลตัวอย่าง (${providerLabel})`,
        className: 'border-brand-warning/40 bg-brand-warning/10 text-brand-warning',
      }
    : isCache
      ? {
          icon: Clock,
          label: compact ? 'แคช' : `ข้อมูลแคช (${providerLabel})`,
          className: 'border-brand-border bg-brand-bg-secondary text-brand-text-secondary',
        }
      : {
          icon: Wifi,
          label: compact ? providerLabel : providerLabel,
          className: 'border-brand-success/30 bg-brand-success/10 text-brand-success',
        }

  const Icon = config.icon
  const updatedAt = latestUpdatedAt(metas)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium',
        config.className,
        className
      )}
      title={metas.find((item) => item.warning)?.warning ?? `${config.label} · อัปเดต ${new Date(updatedAt).toLocaleTimeString('th-TH')}`}
    >
      <Icon size={11} aria-hidden />
      <span>{config.label}</span>
      {!compact && metas.some((item) => item.warning) && (
        <span className="sr-only">{metas.find((item) => item.warning)?.warning}</span>
      )}
    </div>
  )
}

export function DataHonestyBanner({ meta }: { meta?: MarketDataSourceMeta | null }) {
  const metas = collectMeta(meta)
  const demoMeta = metas.find((item) => item.isDemo || item.source === 'fallback')
  if (!demoMeta) return null

  return (
    <div className="flex items-start gap-2 rounded-lg border border-brand-warning/30 bg-brand-warning/5 px-3 py-2 text-xs text-brand-text-secondary">
      <Database size={14} className="mt-0.5 shrink-0 text-brand-warning" />
      <p>
        {demoMeta.warning ??
          'ไม่สามารถดึงราคาสดได้ในขณะนี้ กำลังแสดงข้อมูลตัวอย่างเพื่อการสาธิต อย่าใช้ตัดสินใจลงทุน'}
      </p>
    </div>
  )
}
