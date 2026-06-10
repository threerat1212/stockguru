'use client'

import { AlertTriangle, Clock, Database, Wifi } from 'lucide-react'
import type { MarketDataMeta } from '@/lib/market-data/types'
import { cn } from '@/lib/utils/format'

interface DataSourceBadgeProps {
  meta?: MarketDataMeta | null
  className?: string
  compact?: boolean
}

export default function DataSourceBadge({ meta, className, compact = false }: DataSourceBadgeProps) {
  if (!meta) return null

  const isDemo = meta.isDemo || meta.source === 'fallback'
  const providerLabel = meta.provider || 'Market Data'

  const config = isDemo
    ? {
        icon: AlertTriangle,
        label: compact ? 'ข้อมูลตัวอย่าง' : 'ข้อมูลตัวอย่าง (ไม่ใช่ราคาสด)',
        className: 'border-brand-warning/40 bg-brand-warning/10 text-brand-warning',
      }
    : meta.source === 'cache'
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

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium',
        config.className,
        className
      )}
      title={meta.warning ?? `${config.label} · อัปเดต ${new Date(meta.updatedAt).toLocaleTimeString('th-TH')}`}
    >
      <Icon size={11} aria-hidden />
      <span>{config.label}</span>
      {!compact && meta.warning && (
        <span className="sr-only">{meta.warning}</span>
      )}
    </div>
  )
}

export function DataHonestyBanner({ meta }: { meta?: MarketDataMeta | null }) {
  if (!meta?.isDemo && meta?.source !== 'fallback') return null

  return (
    <div className="flex items-start gap-2 rounded-lg border border-brand-warning/30 bg-brand-warning/5 px-3 py-2 text-xs text-brand-text-secondary">
      <Database size={14} className="mt-0.5 shrink-0 text-brand-warning" />
      <p>
        {meta.warning ??
          'ไม่สามารถดึงราคาสดได้ในขณะนี้ กำลังแสดงข้อมูลตัวอย่างเพื่อการสาธิต อย่าใช้ตัดสินใจลงทุน'}
      </p>
    </div>
  )
}
