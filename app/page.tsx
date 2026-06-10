'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  Activity, ArrowRight, BarChart3, Brain, CheckCircle2, ChevronDown,
  Globe2, LineChart, Search, Shield, Star, Target, TrendingUp, Zap,
} from 'lucide-react'
import { useTrending } from '@/lib/hooks/use-stock'
import { useWatchlist } from '@/lib/hooks/use-watchlist'
import { cn, formatCurrency, formatPercent, getPriceColor } from '@/lib/utils/format'
import type { TrendingStock } from '@/types/stock'

const fallbackStocks: TrendingStock[] = [
  { symbol: 'PTT.BK', name: 'ปตท.', price: 33.75, change: 0.5, changePercent: 1.51, volume: 2845000000, sector: 'Energy', exchange: 'SET', currency: 'THB' },
  { symbol: 'AOT.BK', name: 'ท่าอากาศยานไทย', price: 62, change: 0.75, changePercent: 1.23, volume: 2102000000, sector: 'Transportation', exchange: 'SET', currency: 'THB' },
  { symbol: 'ADVANC.BK', name: 'แอดวานซ์', price: 245, change: -1, changePercent: -0.41, volume: 1856000000, sector: 'ICT', exchange: 'SET', currency: 'THB' },
  { symbol: 'KBANK.BK', name: 'กสิกร', price: 133.5, change: 2, changePercent: 1.52, volume: 1432000000, sector: 'Bank', exchange: 'SET', currency: 'THB' },
  { symbol: 'CPALL.BK', name: 'ซีพีออลล์', price: 57.25, change: 0.5, changePercent: 0.88, volume: 1223000000, sector: 'Commerce', exchange: 'SET', currency: 'THB' },
  { symbol: 'BBL.BK', name: 'กรุงเทพ', price: 153, change: 1.5, changePercent: 0.99, volume: 1104000000, sector: 'Bank', exchange: 'SET', currency: 'THB' },
]

const marketTiles = [
  { label: 'SET', value: '1,387.45', change: '+12.35 (+0.90%)', meta: 'มูลค่า 28,345 ลบ.', tone: 'up' as const, path: 'M2 34 L12 26 L21 31 L30 18 L39 22 L48 10 L58 16 L68 6 L78 9' },
  { label: 'mai', value: '331.27', change: '+3.28 (+1.00%)', meta: 'มูลค่า 1,234 ลบ.', tone: 'up' as const, path: 'M2 18 L10 20 L18 31 L27 16 L35 21 L45 12 L54 16 L63 7 L78 10' },
  { label: 'NASDAQ', value: '18,310.72', change: '+103.47 (+0.57%)', meta: 'Vol. 4.12B', tone: 'up' as const, path: 'M2 31 L10 27 L18 33 L26 24 L35 20 L44 11 L52 14 L61 6 L78 9' },
  { label: 'S&P 500', value: '5,291.34', change: '+32.08 (+0.61%)', meta: 'Vol. 2.45B', tone: 'info' as const, path: 'M2 28 L11 26 L20 23 L29 18 L38 20 L47 13 L56 9 L66 12 L78 5' },
  { label: 'US 10Y', value: '4.28', change: '-0.02 (-0.47%)', meta: 'Yield', tone: 'down' as const, path: 'M2 8 L10 10 L18 16 L27 14 L36 20 L45 23 L54 28 L63 27 L78 34' },
]

const riskChecks = [
  { label: 'SET อยู่เหนือเส้น MA200', status: 'ดี', tone: 'good' as const },
  { label: 'ต่างชาติซื้อสุทธิ 3 วันติด', status: 'ดี', tone: 'good' as const },
  { label: 'มูลค่าซื้อขายวันนี้สูงกว่าค่าเฉลี่ย 20 วัน', status: 'ปานกลาง', tone: 'warn' as const },
  { label: 'VIX อยู่ในระดับปกติ', status: 'ดี', tone: 'good' as const },
  { label: 'US 10Y Yield ทรงตัว', status: 'เฝ้าระวัง', tone: 'danger' as const },
]

const scanPresets = [
  { href: '/screener', icon: Target, title: 'หุ้นเด่นวันนี้', detail: 'เทรนด์ขึ้นกำลังเปลี่ยนสูง', count: '52 หุ้น', tone: 'cyan' as const },
  { href: '/screener', icon: TrendingUp, title: 'Breakout', detail: 'ทะลุแนวต้าน 20 วัน', count: '38 หุ้น', tone: 'green' as const },
  { href: '/screener', icon: BarChart3, title: 'High Volume', detail: 'มูลค่าซื้อขายสูงกว่าค่าเฉลี่ย', count: '61 หุ้น', tone: 'violet' as const },
  { href: '/screener', icon: Zap, title: 'Gainer 5%+', detail: 'ปรับตัวขึ้นมากกว่า 5%', count: '24 หุ้น', tone: 'emerald' as const },
]

const opportunityRows = [
  { rank: 1, symbol: 'PTT', signal: 'Breakout', reason: 'ทะลุแนวต้าน 34.00', score: 5, tone: 'success' as const },
  { rank: 2, symbol: 'BH', signal: 'Volume Spike', reason: 'ปริมาณเพิ่มขึ้น 3.2 เท่า', score: 4, tone: 'warning' as const },
  { rank: 3, symbol: 'GPSC', signal: 'MA Golden Cross', reason: 'ตัดเส้น MA20 ขึ้น MA50', score: 4, tone: 'warning' as const },
  { rank: 4, symbol: 'MINT', signal: 'Rebound', reason: 'เด้งจากแนวรับสำคัญ', score: 3, tone: 'danger' as const },
  { rank: 5, symbol: 'VGI', signal: 'High Volume', reason: 'มูลค่าซื้อขายพุ่ง', score: 3, tone: 'info' as const },
]

const usLeaders = [
  ['NVDA', '1,193.35', '+18.75', '+1.60%'],
  ['AAPL', '195.89', '+1.42', '+0.73%'],
  ['MSFT', '420.76', '+2.57', '+0.61%'],
  ['AMZN', '187.12', '+1.88', '+1.02%'],
  ['META', '499.32', '+6.41', '+1.30%'],
]

function MiniSparkline({ id, path, tone }: { id: string; path: string; tone: 'up' | 'down' | 'info' }) {
  const stroke = tone === 'down' ? '#EF4444' : tone === 'info' ? '#22D3EE' : '#10B981'
  return (
    <svg viewBox="0 0 80 40" className="h-14 w-28 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.45" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L78 40 L2 40 Z`} fill={`url(#${id}-fill)`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MarketTile({ tile, index }: { tile: typeof marketTiles[0]; index: number }) {
  const toneClass = tile.tone === 'down' ? 'text-brand-danger' : tile.tone === 'info' ? 'text-brand-accent' : 'text-brand-primary'
  return (
    <div className="card-modern card-modern-hover group relative min-h-[112px] overflow-hidden rounded-xl p-3">
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-brand-primary/8 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-brand-text-primary">{tile.label}</p>
          <p className="mt-3 font-mono-nums text-xl font-semibold text-brand-text-primary">{tile.value}</p>
          <p className={cn('mt-1 font-mono-nums text-xs font-semibold', toneClass)}>{tile.change}</p>
          <p className="mt-2 text-[11px] text-brand-text-secondary">{tile.meta}</p>
        </div>
        <MiniSparkline id={`tile-${index}`} path={tile.path} tone={tile.tone} />
      </div>
    </div>
  )
}

function IntradayChartPanel() {
  const bars = [18, 15, 22, 12, 28, 19, 16, 26, 35, 20, 18, 24, 17, 30, 22, 15, 16, 23, 19, 21, 26, 31, 18, 16, 24, 22, 28, 34, 19, 17, 20, 27, 29, 35, 30, 38, 31, 25, 22, 28, 33, 40]
  return (
    <section className="market-frame min-h-[366px] rounded-xl p-4 lg:p-5">
      <div className="relative z-10 flex h-full min-h-[326px] flex-col">
        <div className="flex flex-col gap-3 border-b border-brand-border/65 pb-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="font-semibold text-brand-text-primary">SET Index • 1D • SET</span>
            <span className="font-mono-nums text-brand-primary">O 1,380.21</span>
            <span className="font-mono-nums text-brand-primary">H 1,389.11</span>
            <span className="font-mono-nums text-brand-primary">L 1,379.12</span>
            <span className="font-mono-nums text-brand-primary">C 1,387.45</span>
            <span className="font-mono-nums text-brand-primary">+12.35 (+0.90%)</span>
          </div>
          <div className="flex items-center gap-1">
            {(['1D', '1W', '1M', '3M', '1Y', '5Y'] as const).map((t) => (
              <button key={t} className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-colors', t === '1D' ? 'bg-brand-primary/15 text-brand-primary' : 'text-brand-text-secondary hover:text-brand-text-primary')}>
                {t}
              </button>
            ))}
            <button className="ml-1 rounded-md p-1.5 text-brand-text-secondary transition-colors hover:text-brand-text-primary">
              <LineChart size={16} />
            </button>
          </div>
        </div>

        <div className="relative mt-3 flex flex-1 flex-col justify-end gap-1">
          <div className="pointer-events-none absolute inset-0 flex items-end">
            <svg viewBox="0 0 420 100" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="setFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,85 Q20,80 40,75 T80,65 T120,55 T160,50 T200,45 T240,40 T280,42 T320,35 T360,30 T400,25 L420,20 L420,100 L0,100 Z" fill="url(#setFill)" />
              <path d="M0,85 Q20,80 40,75 T80,65 T120,55 T160,50 T200,45 T240,40 T280,42 T320,35 T360,30 T400,25 L420,20" fill="none" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>

          <div className="pointer-events-none absolute inset-0">
            <div className="flex h-full flex-col justify-between">
              {[1395, 1390, 1385, 1380, 1375].map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <span className="w-10 text-right text-[10px] text-brand-text-muted font-mono">{p}.00</span>
                  <div className="h-px flex-1 bg-brand-border/30" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="font-mono-nums text-3xl font-bold text-brand-text-primary">1,387.45</p>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-brand-primary/15 px-1.5 py-0.5 text-xs font-semibold text-brand-primary">+0.90%</span>
                <span className="text-xs text-brand-text-secondary">มูลค่าซื้อขาย 12.68 ลบ.</span>
              </div>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs text-brand-text-secondary">+1,234 ลบ.</p>
              <p className="text-[10px] text-brand-text-muted">Realtime</p>
            </div>
          </div>

          <div className="mt-4 flex items-end gap-[2px] px-10">
            {bars.map((h, i) => (
              <div key={i} className="flex-1">
                <div className={cn('rounded-t-[1px]', i >= bars.length - 8 ? 'bg-brand-primary/80' : 'bg-brand-primary/30')} style={{ height: `${h * 0.8}px` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function RiskPanel() {
  return (
    <div className="card-modern rounded-xl p-4 lg:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-brand-text-primary">
          <Shield size={17} className="text-brand-primary" />
          ก่อนตัดสินใจ
        </h2>
        <span className="text-[11px] font-medium text-brand-text-muted">Risk first</span>
      </div>
      <div className="space-y-3">
        {riskChecks.map((item, index) => {
          const iconColor = item.tone === 'good' ? 'text-brand-primary' : item.tone === 'warn' ? 'text-brand-warning' : 'text-brand-danger'
          return (
            <div key={index} className="flex items-start gap-2.5 rounded-lg border border-brand-border/40 bg-brand-bg-secondary/50 p-2.5 transition-colors hover:border-brand-primary/30">
              <CheckCircle2 size={16} className={cn('mt-0.5 shrink-0', iconColor)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-brand-text-primary">{item.label}</p>
                <p className={cn('mt-0.5 text-xs font-medium', iconColor)}>{item.status}</p>
              </div>
            </div>
          )
        })}
      </div>
      <Link href="/learn" className="mt-4 flex items-center gap-1 text-xs font-medium text-brand-primary transition-colors hover:text-emerald-300">
        Risk Dashboard เต็มรูปแบบ <ArrowRight size={13} />
      </Link>
    </div>
  )
}

function ScanPresetCard({ preset }: { preset: typeof scanPresets[0] }) {
  const Icon = preset.icon
  const toneColors: Record<string, string> = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    emerald: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  }
  return (
    <Link href={preset.href} className="card-modern card-modern-hover flex flex-col rounded-xl p-4">
      <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl border', toneColors[preset.tone])}>
        <Icon size={20} />
      </div>
      <p className="text-sm font-semibold text-brand-text-primary">{preset.title}</p>
      <p className="mt-1 text-xs text-brand-text-secondary">{preset.detail}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-md bg-brand-bg-secondary px-2 py-0.5 text-[11px] font-medium text-brand-text-secondary">{preset.count}</span>
        <span className="text-[11px] text-brand-text-muted">Screener คัดกรอง</span>
      </div>
    </Link>
  )
}

function OpportunityQueue() {
  const getScoreColor = (score: number) => {
    if (score >= 5) return 'bg-brand-success'
    if (score >= 4) return 'bg-brand-warning'
    if (score >= 3) return 'bg-brand-danger'
    return 'bg-brand-text-muted'
  }
  const getSignalBadge = (tone: string) => {
    const colors: Record<string, string> = {
      success: 'bg-brand-success/10 text-brand-success border-brand-success/20',
      warning: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
      danger: 'bg-brand-danger/10 text-brand-danger border-brand-danger/20',
      info: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
    }
    return colors[tone] || colors.info
  }
  return (
    <div className="card-modern rounded-xl p-4 lg:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-brand-text-primary">
          <Target size={17} className="text-brand-primary" />
          Opportunity Queue
          <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-xs font-bold text-brand-primary">18</span>
        </h2>
        <Link href="/screener" className="text-xs font-medium text-brand-primary hover:text-emerald-300">ดูทั้งหมด</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-border/50">
              <th className="pb-2 text-left text-[11px] font-medium text-brand-text-muted">อันดับ</th>
              <th className="pb-2 text-left text-[11px] font-medium text-brand-text-muted">สัญลักษณ์</th>
              <th className="pb-2 text-left text-[11px] font-medium text-brand-text-muted">สัญญาณ</th>
              <th className="pb-2 text-left text-[11px] font-medium text-brand-text-muted">เหตุผล</th>
              <th className="pb-2 text-center text-[11px] font-medium text-brand-text-muted">ความน่าสนใจ</th>
            </tr>
          </thead>
          <tbody>
            {opportunityRows.map((row) => (
              <tr key={row.rank} className="opp-row border-b border-brand-border/30">
                <td className="py-2.5 text-sm font-mono-nums text-brand-text-secondary">{row.rank}</td>
                <td className="py-2.5 text-sm font-semibold text-brand-text-primary">{row.symbol}</td>
                <td className="py-2.5">
                  <span className={cn('rounded-md border px-2 py-0.5 text-[11px] font-medium', getSignalBadge(row.tone))}>{row.signal}</span>
                </td>
                <td className="py-2.5 text-xs text-brand-text-secondary">{row.reason}</td>
                <td className="py-2.5">
                  <div className="flex justify-center gap-[2px]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={cn('h-2 w-4 rounded-sm', i < row.score ? getScoreColor(row.score) : 'bg-brand-border')} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VolumeLeaderTable({ stocks, title, icon: Icon }: { stocks: string[][]; title: string; icon: any }) {
  return (
    <div className="card-modern rounded-xl p-4 lg:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={17} className="text-brand-primary" />
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
      </div>
      <div className="space-y-2">
        {stocks.map(([symbol, price, change, changePct], i) => (
          <div key={symbol} className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-brand-bg-secondary/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-nums text-brand-text-muted">{i + 1}</span>
              <span className="text-sm font-semibold text-brand-text-primary">{symbol}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono-nums text-brand-text-primary">{price}</p>
              <p className="text-xs font-mono-nums text-brand-primary">{change} {changePct}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { data: stocks = [] } = useTrending()
  const { isInWatchlist } = useWatchlist()
  const displayStocks = stocks.length > 0 ? stocks : fallbackStocks
  const watchlistPreview = displayStocks.filter((s) => isInWatchlist(s.symbol)).slice(0, 4)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div className="min-w-0 space-y-5 fade-in">
      {/* Market Overview */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary sm:text-3xl">Market desk วันนี้</h1>
            <p className="mt-1 text-sm text-brand-text-secondary">สแกนตลาดไทยและต่างประเทศ พร้อมระบบประเมินความเสี่ยง</p>
          </div>
          <button className="hidden items-center gap-1 rounded-lg border border-brand-border bg-brand-card px-3 py-1.5 text-xs text-brand-text-secondary transition-colors hover:border-brand-primary/40 hover:text-brand-text-primary sm:flex">
            <Globe2 size={14} /> SET <ChevronDown size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {marketTiles.map((tile, i) => <MarketTile key={tile.label} tile={tile} index={i} />)}
        </div>
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <IntradayChartPanel />

          {/* AI Market Brief + Scan Presets */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
            <div className="card-modern rounded-xl p-4 lg:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Brain size={17} className="text-brand-accent" />
                <h2 className="text-base font-semibold text-brand-text-primary">AI Market Brief</h2>
                <span className="ml-auto text-[11px] text-brand-text-muted">อัปเดต 10:00</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-brand-border/40 bg-brand-bg-secondary/50 p-3">
                  <p className="text-sm leading-relaxed text-brand-text-secondary">
                    ตลาดหุ้นไทยเช้านี้เปิดบวกตามแรงซื้อจากต่างชาติ นักลงทุนให้ความสนใจกลุ่มพลังงานและแบงก์
                    หลังราคาน้ำมันดิบเวสต์เท็กซ์ฟื้นตัว 1,395 ดอลลาร์ และสัญญาณเงินเฟ้อสหรัฐชะลอตัว
                    มองแนวรับสำคัญ 1,375 จุด
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md border border-brand-border bg-brand-card px-2.5 py-1 text-xs text-brand-text-secondary">Energy, Bank, Commerce</span>
                  <span className="rounded-md border border-brand-border bg-brand-card px-2.5 py-1 text-xs text-brand-text-secondary">US CPI, Fed policy</span>
                  <span className="rounded-md border border-brand-border bg-brand-card px-2.5 py-1 text-xs text-brand-text-secondary">Fund flow, OPEC+</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {scanPresets.map((preset) => <ScanPresetCard key={preset.title} preset={preset} />)}
            </div>
          </div>

          {/* Volume Leader + US Leaders */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <VolumeLeaderTable stocks={[['PTT', '33.75', '+0.50', '+1.51%'], ['ADVANC', '245.00', '-1.00', '-0.41%'], ['KBANK', '133.50', '+2.00', '+1.52%'], ['CPALL', '57.25', '+0.50', '+0.88%'], ['BBL', '153.00', '+1.50', '+0.99%']]} title="Volume leader" icon={BarChart3} />
            <VolumeLeaderTable stocks={usLeaders} title="US leaders" icon={TrendingUp} />
          </div>

          <OpportunityQueue />
        </div>

        {/* Right sidebar */}
        <aside className="space-y-5">
          <RiskPanel />

          {/* Watchlist */}
          <div className="card-modern rounded-xl p-4 lg:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-brand-text-primary">
                <Star size={17} className="text-brand-warning" /> หุ้นที่สนใจ
              </h2>
              <Link href="/watchlist" className="text-xs text-brand-primary hover:text-emerald-300">ดูทั้งหมด</Link>
            </div>
            <div className="space-y-2">
              {watchlistPreview.length > 0 ? watchlistPreview.map((stock) => (
                <Link key={stock.symbol} href={`/stock/${stock.symbol}`} className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-brand-bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-text-primary">{stock.symbol.replace('.BK', '')}</span>
                    <span className="text-xs text-brand-text-muted">{stock.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono-nums text-brand-text-primary">{formatCurrency(stock.price, getCurrency(stock))}</p>
                    <p className={cn('text-xs font-mono-nums', getPriceColor(stock.changePercent))}>{formatPercent(stock.changePercent)}</p>
                  </div>
                </Link>
              )) : (
                <div className="text-center py-4">
                  <p className="text-sm text-brand-text-secondary">ยังไม่มีหุ้นในรายการโปรด</p>
                  <Link href="/screener" className="mt-2 text-xs text-brand-primary hover:text-emerald-300">ไปสแกนหุ้น</Link>
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}

function getCurrency(stock: TrendingStock) {
  return stock.currency ?? (stock.symbol.endsWith('.BK') ? 'THB' : 'USD')
}
