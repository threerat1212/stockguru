'use client'

import { useState, useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatPercent, formatNumber, formatVolume, getPriceColor, cn } from '@/lib/utils/format'

interface SectorData {
  name: string
  nameEn: string
  change1D: number
  change1W: number
  change1M: number
  volume: number
  marketCap: number
  stocks: number
  topGainer?: { symbol: string; change: number }
  topLoser?: { symbol: string; change: number }
  history: number[] // mini chart data points (last 7 days of change%)
}

const SECTORS: SectorData[] = [
  {
    name: 'พลังงานและสาธารณูปโภค', nameEn: 'Energy & Utilities',
    change1D: 1.25, change1W: 2.80, change1M: -1.50, volume: 12500000000, marketCap: 3200000000000,
    stocks: 28, topGainer: { symbol: 'PTT', change: 2.1 }, topLoser: { symbol: 'TOP', change: -0.8 },
    history: [0.5, -0.3, 1.2, 0.8, -0.1, 0.9, 1.25],
  },
  {
    name: 'ธนาคาร', nameEn: 'Banking',
    change1D: 0.85, change1W: 1.45, change1M: 3.20, volume: 8900000000, marketCap: 2800000000000,
    stocks: 12, topGainer: { symbol: 'SCB', change: 1.5 }, topLoser: { symbol: 'TMB', change: -0.2 },
    history: [0.2, 0.5, 0.3, -0.2, 0.8, 0.6, 0.85],
  },
  {
    name: 'เทคโนโลยีสารสนเทศและการสื่อสาร', nameEn: 'ICT',
    change1D: -0.45, change1W: -1.20, change1M: 0.80, volume: 6700000000, marketCap: 1800000000000,
    stocks: 18, topGainer: { symbol: 'ADVANC', change: 0.8 }, topLoser: { symbol: 'TRUE', change: -1.5 },
    history: [0.3, -0.5, -0.8, 0.2, 0.1, -0.9, -0.45],
  },
  {
    name: 'อสังหาริมทรัพย์และก่อสร้าง', nameEn: 'Property & Construction',
    change1D: 0.60, change1W: -0.35, change1M: 2.10, volume: 5400000000, marketCap: 1500000000000,
    stocks: 45, topGainer: { symbol: 'CPN', change: 1.8 }, topLoser: { symbol: 'PSH', change: -0.5 },
    history: [-0.2, 0.4, 0.1, -0.5, 0.3, 0.7, 0.6],
  },
  {
    name: 'พาณิชย์', nameEn: 'Commerce',
    change1D: 1.80, change1W: 3.20, change1M: 5.50, volume: 9200000000, marketCap: 2100000000000,
    stocks: 22, topGainer: { symbol: 'CPALL', change: 2.5 }, topLoser: { symbol: 'BJC', change: -0.3 },
    history: [0.8, 1.2, 0.5, 1.5, 0.9, 1.1, 1.8],
  },
  {
    name: 'เกษตรและอุตสาหกรรมอาหาร', nameEn: 'Agro & Food',
    change1D: -0.30, change1W: 0.50, change1M: -2.10, volume: 4300000000, marketCap: 980000000000,
    stocks: 35, topGainer: { symbol: 'CPF', change: 1.2 }, topLoser: { symbol: 'TU', change: -1.8 },
    history: [0.1, -0.4, -0.2, 0.3, -0.8, 0.2, -0.3],
  },
  {
    name: 'ชิ้นส่วนอิเล็กทรอนิกส์', nameEn: 'Electronics',
    change1D: -1.20, change1W: -2.50, change1M: -4.80, volume: 3800000000, marketCap: 750000000000,
    stocks: 20, topGainer: { symbol: 'KCE', change: 0.5 }, topLoser: { symbol: 'DELTA', change: -2.8 },
    history: [-0.5, -1.0, -0.8, -1.2, 0.3, -0.5, -1.2],
  },
  {
    name: 'ขนส่งและโลจิสติกส์', nameEn: 'Transportation',
    change1D: 0.90, change1W: 1.60, change1M: 0.20, volume: 3200000000, marketCap: 850000000000,
    stocks: 15, topGainer: { symbol: 'AOT', change: 1.3 }, topLoser: { symbol: 'BA', change: -0.4 },
    history: [0.3, 0.6, -0.2, 0.5, 0.1, 0.4, 0.9],
  },
  {
    name: 'โรงพยาบาล', nameEn: 'Healthcare',
    change1D: 0.35, change1W: -0.80, change1M: 1.40, volume: 2800000000, marketCap: 680000000000,
    stocks: 10, topGainer: { symbol: 'BDMS', change: 0.9 }, topLoser: { symbol: 'CHG', change: -0.6 },
    history: [0.2, -0.3, 0.5, -0.4, 0.1, 0.3, 0.35],
  },
  {
    name: 'วัสดุก่อสร้าง', nameEn: 'Construction Materials',
    change1D: -0.55, change1W: 0.20, change1M: -1.00, volume: 2100000000, marketCap: 520000000000,
    stocks: 14, topGainer: { symbol: 'SCC', change: 0.4 }, topLoser: { symbol: 'SCCC', change: -1.2 },
    history: [0.1, -0.3, 0.2, -0.1, -0.5, 0.3, -0.55],
  },
]

// Mini sparkline chart
function MiniChart({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 80
  const height = 32
  const padding = 2

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((val - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  // Area fill points
  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`

  const color = positive ? '#10b981' : '#ef4444'

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polygon points={areaPoints} fill={color} fillOpacity="0.1" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SectorCard({ sector }: { sector: SectorData }) {
  const isPositive = sector.change1D >= 0

  return (
    <Card className="hover:border-brand-primary/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center',
            isPositive ? 'bg-brand-success/10' : 'bg-brand-danger/10'
          )}>
            {isPositive ? (
              <TrendingUp size={18} className="text-brand-success" />
            ) : (
              <TrendingDown size={18} className="text-brand-danger" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-text-primary">{sector.name}</h3>
            <p className="text-xs text-brand-text-secondary">{sector.nameEn}</p>
          </div>
        </div>
        <MiniChart data={sector.history} positive={isPositive} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-brand-bg-secondary rounded-lg">
          <p className="text-xs text-brand-text-secondary mb-0.5">วันนี้</p>
          <p className={cn('text-sm font-mono-nums font-bold', getPriceColor(sector.change1D))}>
            {formatPercent(sector.change1D)}
          </p>
        </div>
        <div className="text-center p-2 bg-brand-bg-secondary rounded-lg">
          <p className="text-xs text-brand-text-secondary mb-0.5">สัปดาห์</p>
          <p className={cn('text-sm font-mono-nums font-bold', getPriceColor(sector.change1W))}>
            {formatPercent(sector.change1W)}
          </p>
        </div>
        <div className="text-center p-2 bg-brand-bg-secondary rounded-lg">
          <p className="text-xs text-brand-text-secondary mb-0.5">เดือน</p>
          <p className={cn('text-sm font-mono-nums font-bold', getPriceColor(sector.change1M))}>
            {formatPercent(sector.change1M)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-brand-text-secondary pt-2 border-t border-brand-border">
        <span>{sector.stocks} หุ้น</span>
        <span>Vol {formatVolume(sector.volume)}</span>
      </div>

      {sector.topGainer && sector.topLoser && (
        <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-brand-border">
          <div className="flex items-center gap-1">
            <span className="text-brand-text-secondary">ขึ้นสูงสุด:</span>
            <Link href={`/stock/${encodeURIComponent(sector.topGainer.symbol + '.BK')}`} className="font-semibold text-brand-success hover:underline">
              {sector.topGainer.symbol}
            </Link>
            <span className="text-brand-success font-mono-nums">{formatPercent(sector.topGainer.change)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-brand-text-secondary">ลงสูงสุด:</span>
            <Link href={`/stock/${encodeURIComponent(sector.topLoser.symbol + '.BK')}`} className="font-semibold text-brand-danger hover:underline">
              {sector.topLoser.symbol}
            </Link>
            <span className="text-brand-danger font-mono-nums">{formatPercent(sector.topLoser.change)}</span>
          </div>
        </div>
      )}
    </Card>
  )
}

type SortKey = 'name' | 'change1D' | 'change1W' | 'change1M' | 'volume'

export default function SectorPage() {
  const [sortBy, setSortBy] = useState<SortKey>('change1D')
  const [sortDesc, setSortDesc] = useState(true)

  const sorted = useMemo(() => {
    return [...SECTORS].sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'change1D': cmp = a.change1D - b.change1D; break
        case 'change1W': cmp = a.change1W - b.change1W; break
        case 'change1M': cmp = a.change1M - b.change1M; break
        case 'volume': cmp = a.volume - b.volume; break
      }
      return sortDesc ? -cmp : cmp
    })
  }, [sortBy, sortDesc])

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDesc(!sortDesc)
    } else {
      setSortBy(key)
      setSortDesc(true)
    }
  }

  const winners = SECTORS.filter(s => s.change1D > 0).length
  const losers = SECTORS.filter(s => s.change1D < 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-accent/10 rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">วิเคราะห์รายกลุ่มอุตสาหกรรม</h1>
            <p className="text-sm text-brand-text-secondary">ภาพรวมผลการดำเนินงานของแต่ละกลุ่มอุตสาหกรรม</p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-brand-warning/30 bg-brand-warning/5 px-4 py-3 text-sm text-brand-text-secondary">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-brand-warning" />
        <p>
          ข้อมูลกลุ่มอุตสาหกรรมบนหน้านี้เป็นตัวอย่างเพื่อ UI demo เท่านั้น ยังไม่ได้เชื่อมแหล่งข้อมูล SET จริง
          — ดู roadmap ใน START_HERE.md สำหรับแผนต่อ SET data provider
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-xs text-brand-text-secondary mb-1">กลุ่มทั้งหมด</p>
            <p className="text-xl font-bold text-brand-text-primary">{SECTORS.length}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-xs text-brand-text-secondary mb-1">กลุ่มขึ้น</p>
            <p className="text-xl font-bold text-brand-success">{winners}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-xs text-brand-text-secondary mb-1">กลุ่มลง</p>
            <p className="text-xl font-bold text-brand-danger">{losers}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-xs text-brand-text-secondary mb-1">หุ้นทั้งหมด</p>
            <p className="text-xl font-bold text-brand-primary">{SECTORS.reduce((sum, s) => sum + s.stocks, 0)}</p>
          </div>
        </Card>
      </div>

      {/* Sort Controls */}
      <Card padding="sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          <BarChart3 size={16} className="text-brand-text-secondary flex-shrink-0" />
          <span className="text-xs text-brand-text-secondary flex-shrink-0">เรียงตาม:</span>
          {([
            { key: 'change1D' as SortKey, label: 'เปลี่ยนแปลงวันนี้' },
            { key: 'change1W' as SortKey, label: 'สัปดาห์' },
            { key: 'change1M' as SortKey, label: 'เดือน' },
            { key: 'volume' as SortKey, label: 'Volume' },
            { key: 'name' as SortKey, label: 'ชื่อ' },
          ]).map(s => (
            <button
              key={s.key}
              onClick={() => handleSort(s.key)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-all',
                sortBy === s.key
                  ? 'bg-brand-primary text-white'
                  : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg-secondary'
              )}
            >
              {s.label} {sortBy === s.key && (sortDesc ? '↓' : '↑')}
            </button>
          ))}
        </div>
      </Card>

      {/* Sector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map(sector => (
          <SectorCard key={sector.nameEn} sector={sector} />
        ))}
      </div>
    </div>
  )
}
