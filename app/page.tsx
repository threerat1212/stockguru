'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, BarChart3, Brain, CheckCircle2, ChevronDown, Coins,
  Globe2, LineChart, Shield, Star, Target, TrendingUp, Zap,
} from 'lucide-react'
import { useMarketIndices, useTrending } from '@/lib/hooks/use-stock'
import { useWatchlist } from '@/lib/hooks/use-watchlist'
import { opportunityRows } from '@/lib/data/opportunities'
import { cn, formatPercent, getPriceColor } from '@/lib/utils/format'
import type { MarketIndex, TrendingStock } from '@/types/stock'

const fallbackStocks: TrendingStock[] = [
  { symbol: 'PTT.BK', name: 'ปตท.', price: 33.75, change: 0.5, changePercent: 1.51, volume: 2845000000, sector: 'Energy', exchange: 'SET', currency: 'THB' },
  { symbol: 'AOT.BK', name: 'ท่าอากาศยานไทย', price: 62, change: 0.75, changePercent: 1.23, volume: 2102000000, sector: 'Transportation', exchange: 'SET', currency: 'THB' },
  { symbol: 'ADVANC.BK', name: 'แอดวานซ์', price: 245, change: -1, changePercent: -0.41, volume: 1856000000, sector: 'ICT', exchange: 'SET', currency: 'THB' },
  { symbol: 'KBANK.BK', name: 'กสิกร', price: 133.5, change: 2, changePercent: 1.52, volume: 1432000000, sector: 'Bank', exchange: 'SET', currency: 'THB' },
  { symbol: 'CPALL.BK', name: 'ซีพีออลล์', price: 57.25, change: 0.5, changePercent: 0.88, volume: 1223000000, sector: 'Commerce', exchange: 'SET', currency: 'THB' },
  { symbol: 'BBL.BK', name: 'กรุงเทพ', price: 153, change: 1.5, changePercent: 0.99, volume: 1104000000, sector: 'Bank', exchange: 'SET', currency: 'THB' },
]

const marketTiles: MarketTileData[] = [
  { id: 'SET', label: 'SET', name: 'SET Index', price: 1387.45, change: 12.35, changePercent: 0.90, meta: 'มูลค่า 28,345 ลบ.', tone: 'up', path: 'M2 34 L12 26 L21 31 L30 18 L39 22 L48 10 L58 16 L68 6 L78 9' },
  { id: 'MAI', label: 'mai', name: 'mai Index', price: 331.27, change: 3.28, changePercent: 1.00, meta: 'มูลค่า 1,234 ลบ.', tone: 'up', path: 'M2 18 L10 20 L18 31 L27 16 L35 21 L45 12 L54 16 L63 7 L78 10' },
  { id: 'NASDAQ', label: 'NASDAQ', name: 'NASDAQ Composite', price: 18310.72, change: 103.47, changePercent: 0.57, meta: 'Vol. 4.12B', tone: 'up', path: 'M2 31 L10 27 L18 33 L26 24 L35 20 L44 11 L52 14 L61 6 L78 9' },
  { id: 'SP500', label: 'S&P 500', name: 'S&P 500', price: 5291.34, change: 32.08, changePercent: 0.61, meta: 'Vol. 2.45B', tone: 'info', path: 'M2 28 L11 26 L20 23 L29 18 L38 20 L47 13 L56 9 L66 12 L78 5' },
  { id: 'US10Y', label: 'US 10Y', name: 'US 10Y Yield', price: 4.28, change: -0.02, changePercent: -0.47, meta: 'Yield', tone: 'down', path: 'M2 8 L10 10 L18 16 L27 14 L36 20 L45 23 L54 28 L63 27 L78 34' },
]

const scanPresets = [
  { href: '/screener', icon: Target, title: 'หุ้นเด่นวันนี้', detail: 'เทรนด์ขึ้นกำลังเปลี่ยนสูง', count: '52 หุ้น', tone: 'cyan' as const },
  { href: '/screener', icon: TrendingUp, title: 'Breakout', detail: 'ทะลุแนวต้าน 20 วัน', count: '38 หุ้น', tone: 'green' as const },
  { href: '/screener', icon: BarChart3, title: 'High Volume', detail: 'มูลค่าซื้อขายสูงกว่าค่าเฉลี่ย', count: '61 หุ้น', tone: 'violet' as const },
  { href: '/screener', icon: Coins, title: 'Dividend', detail: 'ผลตอบแทนปันผลสม่ำเสมอ', count: '43 หุ้น', tone: 'amber' as const },
  { href: '/screener', icon: Zap, title: 'Gainer 5%+', detail: 'ปรับตัวขึ้นมากกว่า 5%', count: '24 หุ้น', tone: 'emerald' as const },
]

const usLeaders = [
  ['NVDA', '1,193.35', '+18.75', '+1.60%'],
  ['AAPL', '195.89', '+1.42', '+0.73%'],
  ['MSFT', '420.76', '+2.57', '+0.61%'],
  ['AMZN', '187.12', '+1.88', '+1.02%'],
  ['META', '499.32', '+6.41', '+1.30%'],
]
const usLeaderSymbols = new Set(usLeaders.map(([symbol]) => symbol))

type ChartRange = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y'
type ChartMode = 'area' | 'line' | 'bars'
type MarketTone = 'up' | 'down' | 'info'
type RiskTone = 'good' | 'warn' | 'danger'
type MarketTileData = {
  id: string
  label: string
  name: string
  price: number
  change: number
  changePercent: number
  meta: string
  tone: MarketTone
  path: string
}
type LiveChartPoint = { price: number; volume: number; time: string }
type RiskCheck = {
  label: string
  detail: string
  status: string
  tone: RiskTone
}

const chartRanges: ChartRange[] = ['1D', '1W', '1M', '3M', '1Y', '5Y']
const chartModes: Array<{ id: ChartMode; label: string; icon: typeof LineChart }> = [
  { id: 'area', label: 'พื้นที่', icon: LineChart },
  { id: 'line', label: 'เส้น', icon: TrendingUp },
  { id: 'bars', label: 'แท่ง', icon: BarChart3 },
]
const AI_MARKET_BRIEF_REFRESH_MS = 10 * 60 * 1000
const AI_MARKET_BRIEF_REFRESH_SECONDS = AI_MARKET_BRIEF_REFRESH_MS / 1000
const previousSetClose = 1375.10
const seedPrices = [
  1381.7, 1383.2, 1382.4, 1384.9, 1383.7, 1385.8, 1383.0, 1384.2, 1381.8,
  1379.4, 1382.1, 1380.8, 1382.9, 1384.0, 1384.7, 1386.6, 1385.4, 1385.9,
  1384.7, 1385.2, 1383.8, 1384.6, 1384.3, 1385.5, 1386.0, 1387.2, 1387.45,
]
const seedVolumes = [18, 12, 24, 17, 26, 20, 34, 18, 16, 30, 22, 15, 19, 21, 28, 35, 24, 20, 18, 26, 31, 28, 33, 38, 30, 36, 40]

function buildSeedIntradayPoints(market: MarketTileData = marketTiles[0]): LiveChartPoint[] {
  const anchorPrice = seedPrices[seedPrices.length - 1]
  return seedPrices.map((price, index) => ({
    price: Number((market.price * (price / anchorPrice)).toFixed(market.price < 10 ? 3 : 2)),
    volume: seedVolumes[index] ?? 20,
    time: `${String(10 + Math.floor(index / 4)).padStart(2, '0')}:${String((index % 4) * 15).padStart(2, '0')}`,
  }))
}

function formatClockTime(date = new Date()) {
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function stockHrefFromDeskSymbol(symbol: string) {
  const clean = symbol.trim().toUpperCase()
  const nextSymbol = clean.includes('.') || usLeaderSymbols.has(clean) ? clean : `${clean}.BK`
  return `/stock/${encodeURIComponent(nextSymbol)}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function niceStep(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1
  const exponent = Math.floor(Math.log10(value))
  const fraction = value / Math.pow(10, exponent)
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return niceFraction * Math.pow(10, exponent)
}

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`

  const segments = [`M${points[0].x} ${points[0].y}`]
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const previous = points[index - 1] ?? current
    const afterNext = points[index + 2] ?? next
    const controlOne = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    }
    const controlTwo = {
      x: next.x - (afterNext.x - current.x) / 6,
      y: next.y - (afterNext.y - current.y) / 6,
    }

    segments.push(
      `C${controlOne.x.toFixed(1)} ${controlOne.y.toFixed(1)} ${controlTwo.x.toFixed(1)} ${controlTwo.y.toFixed(1)} ${next.x} ${next.y}`
    )
  }

  return segments.join(' ')
}

function axisDecimals(step: number) {
  if (step >= 1) return 0
  if (step >= 0.1) return 1
  return 2
}

function formatAxisNumber(value: number, decimals: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function getRiskStatus(tone: RiskTone) {
  if (tone === 'good') return 'ดี'
  if (tone === 'warn') return 'ปานกลาง'
  return 'เฝ้าระวัง'
}

function getMomentumTone(changePercent: number): RiskTone {
  if (changePercent >= 0.45) return 'good'
  if (changePercent <= -0.75) return 'danger'
  return 'warn'
}

function getVolatilityTone(changePercent: number): RiskTone {
  const absMove = Math.abs(changePercent)
  if (absMove <= 0.75) return 'good'
  if (absMove <= 1.6) return 'warn'
  return 'danger'
}

function buildRiskChecks(market: MarketTileData): RiskCheck[] {
  const points = buildSeedIntradayPoints(market)
  const sessionAverage = points.reduce((sum, point) => sum + point.price, 0) / Math.max(points.length, 1)
  const current = market.price
  const aboveAverage = current >= sessionAverage
  const volatilityTone = getVolatilityTone(market.changePercent)
  const momentumTone = getMomentumTone(market.changePercent)
  const isYield = market.id === 'US10Y'
  const isUsEquity = market.id === 'NASDAQ' || market.id === 'SP500'
  const directionText = market.changePercent >= 0 ? 'บวก' : 'ลบ'

  if (isYield) {
    const yieldTone: RiskTone = market.changePercent <= -0.2 ? 'good' : market.changePercent <= 0.15 ? 'warn' : 'danger'
    return [
      {
        label: 'แรงกดดันจาก Bond Yield',
        detail: `US 10Y ${directionText} ${Math.abs(market.changePercent).toFixed(2)}% วันนี้ ถ้าดีดแรงจะกด valuation หุ้น growth`,
        tone: yieldTone,
        status: getRiskStatus(yieldTone),
      },
      {
        label: 'ทิศทางเทียบค่าเฉลี่ย session',
        detail: `Yield ล่าสุด ${current.toFixed(2)} เทียบค่าเฉลี่ยระหว่างวัน ${sessionAverage.toFixed(2)}`,
        tone: current <= sessionAverage ? 'good' : 'warn',
        status: getRiskStatus(current <= sessionAverage ? 'good' : 'warn'),
      },
      {
        label: 'ความผันผวนของ yield',
        detail: `การแกว่ง ${Math.abs(market.changePercent).toFixed(2)}% ยังต้องดูต่อกับ USD และ Fed speak`,
        tone: volatilityTone,
        status: getRiskStatus(volatilityTone),
      },
      {
        label: 'ผลกระทบต่อหุ้นสหรัฐ',
        detail: 'ถ้า yield ลงต่อ จะช่วยลดแรงกดดันต่อ NASDAQ และหุ้นที่ valuation สูง',
        tone: market.changePercent < 0 ? 'good' : 'warn',
        status: getRiskStatus(market.changePercent < 0 ? 'good' : 'warn'),
      },
      {
        label: 'Risk appetite',
        detail: 'ใช้ประกอบกับดัชนีหุ้น ไม่ใช่สัญญาณซื้อขายเดี่ยว',
        tone: 'warn',
        status: 'รอดูยืนยัน',
      },
    ]
  }

  return [
    {
      label: 'Momentum วันนี้',
      detail: `${market.label} ${directionText} ${Math.abs(market.changePercent).toFixed(2)}% เทียบกับวันก่อนหน้า`,
      tone: momentumTone,
      status: getRiskStatus(momentumTone),
    },
    {
      label: 'ราคาเทียบค่าเฉลี่ย session',
      detail: `ล่าสุด ${formatDashboardNumber(current)} ${aboveAverage ? 'สูงกว่า' : 'ต่ำกว่า'}ค่าเฉลี่ยระหว่างวัน ${formatDashboardNumber(sessionAverage)}`,
      tone: aboveAverage ? 'good' : 'danger',
      status: getRiskStatus(aboveAverage ? 'good' : 'danger'),
    },
    {
      label: isUsEquity ? 'แรงหนุนหุ้นใหญ่สหรัฐ' : 'คุณภาพมูลค่าซื้อขาย',
      detail: isUsEquity
        ? `${market.label} ต้องดู megacap และ bond yield ประกอบ ไม่ใช่ดูดัชนีอย่างเดียว`
        : `${market.meta} ใช้ดูว่าการขึ้นลงมีมูลค่าซื้อขายรองรับหรือไม่`,
      tone: market.change >= 0 ? 'good' : 'warn',
      status: getRiskStatus(market.change >= 0 ? 'good' : 'warn'),
    },
    {
      label: 'ความผันผวนระหว่างวัน',
      detail: `การเปลี่ยนแปลง ${Math.abs(market.changePercent).toFixed(2)}% อยู่ในกรอบ ${volatilityTone === 'good' ? 'ปกติ' : volatilityTone === 'warn' ? 'เริ่มกว้าง' : 'กว้างผิดปกติ'}`,
      tone: volatilityTone,
      status: getRiskStatus(volatilityTone),
    },
    {
      label: isUsEquity ? 'US 10Y และ VIX context' : 'ปัจจัยข้ามตลาด',
      detail: isUsEquity
        ? 'ถ้า yield หรือ VIX ดีดขึ้น ต้องลดน้ำหนักสัญญาณบวกจากราคา'
        : 'ติดตาม US 10Y, ค่าเงิน และ fund flow ก่อนเพิ่มน้ำหนัก',
      tone: 'warn',
      status: 'ต้องติดตาม',
    },
  ]
}

function getLiveTickBounds(referencePrice: number) {
  const spread = Math.max(referencePrice * 0.008, 8)
  return {
    lower: referencePrice - spread,
    upper: referencePrice + spread,
  }
}

function createChartGeometry(points: LiveChartPoint[]) {
  const plotLeft = 42
  const plotRight = 700
  const plotTop = 30
  const plotBottom = 198
  const prices = points.map((point) => point.price)
  const rawMin = Math.min(...prices)
  const rawMax = Math.max(...prices)
  const rawRange = Math.max(rawMax - rawMin, Math.abs(rawMax) * 0.001, 1)
  const step = niceStep(rawRange / 4)
  const minPrice = Math.floor((rawMin - step * 0.6) / step) * step
  const maxPrice = Math.ceil((rawMax + step * 0.6) / step) * step
  const priceRange = Math.max(maxPrice - minPrice, 1)
  const pointToXY = (point: LiveChartPoint, index: number) => {
    const x = plotLeft + (index / Math.max(points.length - 1, 1)) * (plotRight - plotLeft)
    const y = plotTop + ((maxPrice - point.price) / priceRange) * (plotBottom - plotTop)
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) }
  }
  const xy = points.map(pointToXY)
  const linePath = buildSmoothPath(xy)
  const first = xy[0]
  const last = xy[xy.length - 1]
  const areaPath = `${linePath} L${last.x} ${plotBottom} L${first.x} ${plotBottom} Z`
  const yLabels = Array.from({ length: 5 }, (_, index) => {
    const value = maxPrice - index * step
    return Number(value.toFixed(2))
  })
  return {
    axisDecimals: axisDecimals(step),
    areaPath,
    linePath,
    lastY: last.y,
    maxVolume: Math.max(...points.map((point) => point.volume)),
    plotBottom,
    xy,
    yLabels,
  }
}

function MiniSparkline({ id, path, tone }: { id: string; path: string; tone: 'up' | 'down' | 'info' }) {
  const stroke = tone === 'down' ? '#EF4444' : tone === 'info' ? '#22D3EE' : '#10B981'
  return (
    <svg viewBox="0 0 80 40" className="h-11 w-20 shrink-0 sm:h-12 sm:w-20" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.45" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="20" y="0" width="60" height="40" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <path d={`${path} L78 40 L2 40 Z`} fill={`url(#${id}-fill)`} />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

function MarketTile({
  tile,
  index,
  selected,
  onSelect,
}: {
  tile: MarketTileData
  index: number
  selected: boolean
  onSelect: () => void
}) {
  const toneClass = tile.tone === 'down' ? 'text-brand-danger' : tile.tone === 'info' ? 'text-brand-accent' : 'text-brand-primary'
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'market-tile card-modern-hover group min-h-[112px] rounded-xl p-3 text-left outline-none transition-[border-color,background-color,box-shadow,transform] focus-visible:ring-2 focus-visible:ring-brand-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg active:scale-[0.99] sm:p-4',
        selected && 'border-brand-primary/70 bg-brand-primary/10 shadow-[0_0_0_1px_rgba(52,211,153,0.22)]'
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-brand-primary/8 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="whitespace-nowrap text-xs font-semibold text-brand-text-primary">{tile.label}</p>
            <ArrowRight size={12} className={cn('text-brand-text-muted transition-opacity group-hover:opacity-100', selected ? 'opacity-100 text-brand-primary' : 'opacity-0')} />
          </div>
          <p className="mt-3 font-mono-nums text-lg font-semibold leading-none text-brand-text-primary sm:text-xl">{formatDashboardNumber(tile.price)}</p>
          <p className={cn('mt-1 font-mono-nums text-xs font-semibold', toneClass)}>
            {formatSignedNumber(tile.change)} ({formatSignedPercent(tile.changePercent)})
          </p>
          <p className="mt-2 text-[11px] text-brand-text-secondary">{tile.meta}</p>
        </div>
        <MiniSparkline id={`tile-${index}`} path={tile.path} tone={tile.tone} />
      </div>
    </button>
  )
}

function findSetIndex(indices?: MarketIndex[]) {
  return indices?.find((index) => index.symbol === 'SET')
    ?? indices?.find((index) => /SET/i.test(index.symbol) || /SET/i.test(index.name))
}

function buildDashboardTiles(liveSetIndex?: MarketIndex) {
  if (!liveSetIndex) return marketTiles
  const [setTile, ...rest] = marketTiles

  return [
    {
      ...setTile,
      price: liveSetIndex.price,
      change: liveSetIndex.change,
      changePercent: liveSetIndex.changePercent,
      meta: 'อัปเดตจาก market provider',
      tone: liveSetIndex.change >= 0 ? 'up' as const : 'down' as const,
    },
    ...rest,
  ]
}

function IntradayChartPanel({ market }: { market: MarketTileData }) {
  const [range, setRange] = useState<ChartRange>('1D')
  const [chartMode, setChartMode] = useState<ChartMode>('area')
  const [chartPoints, setChartPoints] = useState<LiveChartPoint[]>(() => buildSeedIntradayPoints(market))
  const [lastUpdated, setLastUpdated] = useState('รอซิงก์')
  const providerPrice = market.price

  useEffect(() => {
    setChartPoints(buildSeedIntradayPoints(market))
    setLastUpdated(formatClockTime())
  }, [market])

  useEffect(() => {
    if (!providerPrice || providerPrice <= 0) return
    setChartPoints((previous) => {
      const last = previous[previous.length - 1]
      const nextPrice = Number(providerPrice.toFixed(2))
      if (!last || Math.abs(last.price - nextPrice) < 0.01) return previous
      const delta = nextPrice - last.price
      if (Math.abs(delta / last.price) > 0.025) {
        const bounds = getLiveTickBounds(nextPrice)
        const rebased = previous.map((point) => ({
          ...point,
          price: Number(clamp(point.price + delta, bounds.lower, bounds.upper).toFixed(2)),
        }))
        const volume = clamp(Math.round(last.volume * 0.7 + 24), 8, 58)
        return [...rebased.slice(1), { price: nextPrice, volume, time: formatClockTime() }]
      }

      const nextVolume = clamp(Math.round(last.volume * 0.7 + Math.abs(delta) * 24 + 16), 8, 58)
      return [...previous.slice(1), { price: nextPrice, volume: nextVolume, time: formatClockTime() }]
    })
    setLastUpdated(formatClockTime())
  }, [providerPrice])

  useEffect(() => {
    setLastUpdated(formatClockTime())
    const intervalId = window.setInterval(() => {
      setChartPoints((previous) => {
        const last = previous[previous.length - 1]
        if (!last) return previous
        const now = Date.now()
        const referencePrice = providerPrice && providerPrice > 0 ? providerPrice : last.price
        const { lower, upper } = getLiveTickBounds(referencePrice)
        const drift = Math.sin(now / 5200) * 0.28 + Math.cos(now / 7100) * 0.18
        const noise = (Math.random() - 0.47) * 0.38
        const nextPrice = Number(clamp(last.price + drift + noise, lower, upper).toFixed(2))
        const nextVolume = clamp(Math.round(20 + Math.abs(nextPrice - last.price) * 22 + Math.random() * 20), 8, 58)
        return [...previous.slice(1), { price: nextPrice, volume: nextVolume, time: formatClockTime() }]
      })
      setLastUpdated(formatClockTime())
    }, 2500)

    return () => window.clearInterval(intervalId)
  }, [providerPrice])

  const geometry = useMemo(() => createChartGeometry(chartPoints), [chartPoints])
  const stats = useMemo(() => {
    const current = chartPoints[chartPoints.length - 1]?.price ?? seedPrices[seedPrices.length - 1]
    const previousClose = market.price - market.change || previousSetClose
    const change = current - previousClose
    const changePercent = previousClose ? (change / previousClose) * 100 : 0
    const prices = chartPoints.map((point) => point.price)
    const volumeShares = 12_600_000_000 + Math.round(chartPoints.reduce((sum, point) => sum + point.volume, 0) * 8_500_000)
    return {
      current,
      open: chartPoints[0]?.price ?? 1380.21,
      high: Math.max(...prices),
      low: Math.min(...prices),
      change,
      changePercent,
      valueMillion: Math.max(1_000, 28_345 + Math.round((current - 1387.45) * 80)),
      volumeShares,
      foreignNet: 1_234 + Math.round((current - 1387.45) * 96),
    }
  }, [chartPoints, market.change, market.price])
  const isPositive = stats.change >= 0
  const chartColor = '#34D399'
  const toneClass = isPositive ? 'text-brand-primary' : 'text-brand-danger'
  const priceMarkerTop = clamp(geometry.lastY - 11, 42, 180)
  const chartAreaId = `chart-area-${market.id}`
  const chartGlowId = `chart-glow-${market.id}`

  return (
    <section className="market-frame min-h-[332px] rounded-xl p-4 lg:p-5">
      <div className="relative z-10 flex h-full min-h-[292px] flex-col">
        <div className="flex flex-col gap-3 border-b border-brand-border/65 pb-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="font-semibold text-brand-text-primary">{market.name} • {range} • {market.label}</span>
            <span className="font-mono-nums text-brand-primary">O {formatDashboardNumber(stats.open)}</span>
            <span className="font-mono-nums text-brand-primary">H {formatDashboardNumber(stats.high)}</span>
            <span className="font-mono-nums text-brand-primary">L {formatDashboardNumber(stats.low)}</span>
            <span className="font-mono-nums text-brand-primary">C {formatDashboardNumber(stats.current)}</span>
            <span className={cn('font-mono-nums', toneClass)}>
              {formatSignedNumber(stats.change)} ({formatSignedPercent(stats.changePercent)})
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary/10 px-2 py-0.5 font-mono-nums text-[11px] text-brand-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
              Live {lastUpdated}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              {chartRanges.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={range === t}
                  onClick={() => setRange(t)}
                  className={cn('min-h-9 rounded-md px-3 text-xs font-medium transition-colors', range === t ? 'bg-brand-primary/15 text-brand-primary' : 'text-brand-text-secondary hover:text-brand-text-primary')}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-brand-border/65 bg-brand-bg-secondary/45 p-1">
              {chartModes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  title={`ดูกราฟแบบ${label}`}
                  aria-pressed={chartMode === id}
                  onClick={() => setChartMode(id)}
                  className={cn(
                    'inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors',
                    chartMode === id ? 'bg-brand-primary/15 text-brand-primary' : 'text-brand-text-secondary hover:text-brand-text-primary'
                  )}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-3 min-h-[238px] flex-1 overflow-hidden">
          <div className="absolute inset-x-0 top-2 bottom-10">
            <div className="flex h-full flex-col justify-between">
              {geometry.yLabels.map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-brand-border/25" />
                  <span className="w-14 text-right font-mono text-[10px] text-brand-text-muted">{formatAxisNumber(p, geometry.axisDecimals)}</span>
                </div>
              ))}
            </div>
          </div>

          <svg viewBox="0 0 720 238" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id={chartAreaId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity="0.28" />
                <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
              </linearGradient>
              <filter id={chartGlowId} x="-10%" y="-20%" width="120%" height="140%">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {chartMode === 'bars' ? (
              geometry.xy.map((point, index) => {
                const previous = geometry.xy[index - 1] ?? point
                const barWidth = 720 / chartPoints.length * 0.48
                return (
                  <rect
                    key={`${market.id}-${index}`}
                    x={point.x - barWidth / 2}
                    y={point.y}
                    width={barWidth}
                    height={geometry.plotBottom - point.y}
                    rx="2"
                    fill={point.y <= previous.y ? 'rgba(52,211,153,0.72)' : 'rgba(244,63,94,0.54)'}
                  />
                )
              })
            ) : (
              <>
                {chartMode === 'area' && (
                  <path
                    d={geometry.areaPath}
                    fill={`url(#${chartAreaId})`}
                  />
                )}
                <path
                  d={geometry.linePath}
                  fill="none"
                  stroke={chartColor}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={chartMode === 'line' ? '2.6' : '2.4'}
                  filter={`url(#${chartGlowId})`}
                />
              </>
            )}
          </svg>

          <div aria-live="polite" className="absolute left-0 top-4 z-10 w-[230px] bg-gradient-to-r from-brand-bg/85 via-brand-bg/60 to-transparent p-2.5">
            <p className="font-mono-nums text-2xl font-semibold leading-none text-brand-text-primary sm:text-3xl">{formatDashboardNumber(stats.current)}</p>
            <p className={cn('mt-1 font-mono-nums text-lg font-medium leading-none', toneClass)}>{formatSignedPercent(stats.changePercent)}</p>
            <dl className="mt-4 space-y-2 text-xs">
              <div>
                <dt className="text-brand-text-secondary">มูลค่าซื้อขาย</dt>
                <dd className="font-mono-nums font-semibold text-brand-text-primary">{formatCompactMillion(stats.valueMillion)} ลบ.</dd>
              </div>
              <div>
                <dt className="text-brand-text-secondary">ปริมาณการซื้อขาย</dt>
                <dd className="font-mono-nums font-semibold text-brand-text-primary">{formatCompactShares(stats.volumeShares)} หุ้น</dd>
              </div>
              <div>
                <dt className="text-brand-text-secondary">ต่างชาติ (สุทธิ)</dt>
                <dd className={cn('font-mono-nums font-semibold', stats.foreignNet >= 0 ? 'text-brand-primary' : 'text-brand-danger')}>
                  {formatSignedInteger(stats.foreignNet)} ลบ.
                </dd>
              </div>
            </dl>
          </div>

          <span className={cn('absolute right-4 z-10 rounded px-1.5 py-0.5 font-mono-nums text-[11px] font-semibold text-brand-bg')} style={{ top: `${priceMarkerTop}px`, backgroundColor: chartColor }}>
            {formatDashboardNumber(stats.current)}
          </span>

          <div className="absolute bottom-7 left-24 right-8 flex h-12 items-end gap-[2px] sm:left-32">
            {chartPoints.map((point, i) => {
              const previous = chartPoints[i - 1]?.price ?? point.price
              const barHeight = Math.max(3, (point.volume / geometry.maxVolume) * 42)
              return (
              <div key={i} className="flex-1">
                <div
                  className={cn('rounded-t-[1px]', point.price >= previous ? 'bg-brand-primary/65' : 'bg-brand-danger/45')}
                  style={{ height: `${barHeight}px` }}
                />
              </div>
            )})}
          </div>

          <div className="absolute inset-x-24 bottom-0 hidden justify-between font-mono text-[10px] text-brand-text-muted sm:flex">
            {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time) => (
              <span key={time}>{time}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function RiskPanel({ market }: { market: MarketTileData }) {
  const checks = useMemo(() => buildRiskChecks(market), [market])

  return (
    <div className="market-panel rounded-xl p-4 lg:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-brand-text-primary">
          <Shield size={17} className="text-brand-primary" />
          ก่อนตัดสินใจ
        </h2>
        <span className="rounded-full bg-brand-bg-secondary px-2 py-0.5 text-[11px] font-medium text-brand-text-muted">
          Risk first · {market.label}
        </span>
      </div>
      <div className="divide-y divide-brand-border/35">
        {checks.map((item, index) => {
          const iconColor = item.tone === 'good' ? 'text-brand-primary' : item.tone === 'warn' ? 'text-brand-warning' : 'text-brand-danger'
          return (
            <div key={`${market.id}-${index}`} className="flex items-start gap-2.5 py-2.5">
              <CheckCircle2 size={16} className={cn('mt-0.5 shrink-0', iconColor)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-snug text-brand-text-primary">{item.label}</p>
                  <span className={cn('shrink-0 text-xs font-semibold', iconColor)}>{item.status}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-brand-text-secondary">{item.detail}</p>
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
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  }
  return (
    <Link href={preset.href} className="scan-card card-modern-hover flex flex-col rounded-xl border border-brand-border bg-brand-bg-secondary/40 p-4 transition-colors hover:border-brand-primary/35 hover:bg-brand-surface-hover">
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
    <div className="market-panel rounded-xl p-4 lg:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-brand-text-primary">
          <Target size={17} className="text-brand-primary" />
          Opportunity Queue
          <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-xs font-bold text-brand-primary">{opportunityRows.length}</span>
        </h2>
        <Link href="/opportunities" className="text-xs font-medium text-brand-primary hover:text-emerald-300">ดูทั้งหมด</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-compact">
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
            {opportunityRows.slice(0, 5).map((row) => (
              <tr key={row.rank} className="opp-row border-b border-brand-border/30">
                <td className="py-2.5 text-sm font-mono-nums text-brand-text-secondary">{row.rank}</td>
                <td className="py-2.5 text-sm font-semibold text-brand-text-primary">
                  <Link href={stockHrefFromDeskSymbol(row.symbol)} className="transition-colors hover:text-brand-primary">
                    {row.symbol}
                  </Link>
                </td>
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

function WatchlistPreview({ stocks, empty = false }: { stocks: TrendingStock[]; empty?: boolean }) {
  return (
    <div className="market-panel rounded-xl p-4 lg:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-brand-text-primary">
            <Star size={17} className="text-brand-warning" /> หุ้นที่ต้องดูต่อ
          </h2>
          {empty && <p className="mt-0.5 text-[11px] text-brand-text-muted">ยังไม่มีรายการโปรด — แสดงตัวอย่างจากตลาด</p>}
        </div>
        <Link href="/watchlist" className="text-xs text-brand-primary hover:text-emerald-300">ดูทั้งหมด</Link>
      </div>
      {stocks.length > 0 ? (
        <div className="divide-y divide-brand-border/30">
          {stocks.slice(0, 6).map((stock) => (
            <div key={stock.symbol} className="watchlist-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
              <div className="min-w-0">
                <Link href={`/stock/${stock.symbol}`} className="text-sm font-semibold text-brand-text-primary hover:text-brand-primary">
                  {stock.symbol.replace('.BK', '')}
                </Link>
                <p className="truncate text-[11px] text-brand-text-muted">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono-nums text-sm font-semibold text-brand-text-primary">{formatDashboardNumber(stock.price)}</p>
                <p className={cn('mt-0.5 whitespace-nowrap font-mono-nums text-xs', getPriceColor(stock.changePercent))}>
                  {formatSignedNumber(stock.change)} <span className="ml-1">{formatPercent(stock.changePercent)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-brand-border/50 bg-brand-bg-secondary/40 p-4 text-center">
          <p className="text-sm text-brand-text-secondary">ยังไม่มีหุ้นในรายการโปรด</p>
          <Link href="/screener" className="mt-2 inline-flex text-xs text-brand-primary hover:text-emerald-300">ไปสแกนหุ้น</Link>
        </div>
      )}
    </div>
  )
}

function ScanPresetSection() {
  return (
    <div className="market-panel rounded-xl p-4 lg:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-brand-text-primary">เริ่มลงทุนหุ้น</h2>
          <p className="mt-0.5 text-xs text-brand-text-muted">คัดจากสัญญาณ Screener</p>
        </div>
        <Link href="/screener" className="text-xs text-brand-primary hover:text-emerald-300">Screener ทั้งหมด</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {scanPresets.map((preset) => <ScanPresetCard key={preset.title} preset={preset} />)}
      </div>
    </div>
  )
}

function VolumeLeaderTable({ stocks, title, icon: Icon }: { stocks: string[][]; title: string; icon: any }) {
  return (
    <div className="market-panel rounded-xl p-4 lg:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
        <Icon size={17} className="text-brand-primary" />
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
        </div>
        <Link href="/screener" className="text-xs text-brand-text-muted hover:text-brand-primary">ดูทั้งหมด</Link>
      </div>
      <div className="divide-y divide-brand-border/30">
        {stocks.map(([symbol, price, change, changePct]) => (
          <Link key={symbol} href={stockHrefFromDeskSymbol(symbol)} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2 transition-colors hover:bg-brand-surface-hover/50 hover:text-brand-primary">
            <span className="truncate text-sm font-semibold text-brand-text-primary">{symbol}</span>
            <div className="text-right">
              <p className="font-mono-nums text-sm font-semibold text-brand-text-primary">{price}</p>
              <p className={cn('mt-0.5 whitespace-nowrap font-mono-nums text-[11px]', change.startsWith('-') ? 'text-brand-danger' : 'text-brand-primary')}>
                {change} <span className="ml-1">{changePct}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { data: stocks = [] } = useTrending()
  const { data: marketIndices } = useMarketIndices()
  const { isInWatchlist } = useWatchlist()
  const chartPanelRef = useRef<HTMLDivElement>(null)
  const marketMenuRef = useRef<HTMLDivElement>(null)
  const briefNextRefreshRef = useRef(Date.now() + AI_MARKET_BRIEF_REFRESH_MS)
  const [activeMarketId, setActiveMarketId] = useState('SET')
  const [marketMenuOpen, setMarketMenuOpen] = useState(false)
  const [briefCountdownSeconds, setBriefCountdownSeconds] = useState(AI_MARKET_BRIEF_REFRESH_SECONDS)
  const [briefLastUpdated, setBriefLastUpdated] = useState('รอซิงก์')
  const displayStocks = stocks.length > 0 ? stocks : fallbackStocks
  const liveSetIndex = useMemo(() => findSetIndex(marketIndices), [marketIndices])
  const dashboardTiles = useMemo(() => buildDashboardTiles(liveSetIndex), [liveSetIndex])
  const activeMarket = useMemo(
    () => dashboardTiles.find((tile) => tile.id === activeMarketId) ?? dashboardTiles[0],
    [activeMarketId, dashboardTiles]
  )
  const watchlistPreview = displayStocks.filter((s) => isInWatchlist(s.symbol)).slice(0, 6)
  const watchlistRows = watchlistPreview.length > 0 ? watchlistPreview : displayStocks.slice(0, 6)

  const selectMarket = (marketId: string) => {
    setActiveMarketId(marketId)
    window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      chartPanelRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
      window.scrollTo({ left: 0, top: window.scrollY, behavior: 'auto' })
    })
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (marketMenuRef.current && !marketMenuRef.current.contains(event.target as Node)) {
        setMarketMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function tickBriefCountdown() {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((briefNextRefreshRef.current - now) / 1000))

      if (remaining <= 0) {
        briefNextRefreshRef.current = now + AI_MARKET_BRIEF_REFRESH_MS
        setBriefLastUpdated(formatClockTime(new Date(now)))
        setBriefCountdownSeconds(AI_MARKET_BRIEF_REFRESH_SECONDS)
        return
      }

      setBriefCountdownSeconds(remaining)
    }

    tickBriefCountdown()
    const intervalId = window.setInterval(tickBriefCountdown, 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div className="dashboard-shell min-w-0 space-y-4 pb-8">
      {/* Market Overview */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h1 className="dashboard-title text-2xl font-bold text-brand-text-primary sm:text-[1.8rem]">Market desk วันนี้</h1>
            <p className="mt-1 text-sm text-brand-text-secondary">สแกนตลาดไทยและต่างประเทศ พร้อมระบบประเมินความเสี่ยง</p>
          </div>
          <div ref={marketMenuRef} className="relative hidden sm:block">
            <button
              type="button"
              aria-label="เลือกตลาด"
              aria-expanded={marketMenuOpen}
              onClick={() => setMarketMenuOpen((open) => !open)}
              className="flex items-center gap-1 rounded-lg border border-brand-border bg-brand-card px-3 py-1.5 text-xs text-brand-text-secondary transition-colors hover:border-brand-primary/40 hover:text-brand-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
            >
              <Globe2 size={14} /> {activeMarket.label} <ChevronDown size={14} className={cn('transition-transform', marketMenuOpen && 'rotate-180')} />
            </button>
            {marketMenuOpen && (
              <div className="absolute right-0 top-full z-dropdown mt-2 w-52 overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                {dashboardTiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => {
                      selectMarket(tile.id)
                      setMarketMenuOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-xs transition-colors hover:bg-brand-card',
                      tile.id === activeMarket.id ? 'text-brand-primary' : 'text-brand-text-secondary'
                    )}
                  >
                    <span className="font-semibold">{tile.label}</span>
                    <span className={cn('font-mono-nums', tile.change >= 0 ? 'text-brand-primary' : 'text-brand-danger')}>
                      {formatSignedPercent(tile.changePercent)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {dashboardTiles.map((tile, i) => (
            <MarketTile
              key={tile.id}
              tile={tile}
              index={i}
              selected={tile.id === activeMarket.id}
              onSelect={() => selectMarket(tile.id)}
            />
          ))}
        </div>
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div ref={chartPanelRef}>
            <IntradayChartPanel market={activeMarket} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.95fr_0.95fr]">
          <div className="market-panel rounded-xl p-4 lg:p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Brain size={17} className="text-brand-accent" />
              <h2 className="text-base font-semibold text-brand-text-primary">AI Market Brief</h2>
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2 text-[11px]">
                <span className="text-brand-text-muted">อัปเดตล่าสุด {briefLastUpdated}</span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-brand-accent/25 bg-brand-accent/10 px-2 py-1 font-mono-nums font-semibold text-brand-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                  รีเฟรชใน {formatCountdown(briefCountdownSeconds)}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-brand-text-secondary">
                ตลาดหุ้นไทยเช้านี้เปิดบวกตามแรงซื้อจากต่างชาติ นักลงทุนให้ความสนใจกลุ่มพลังงานและแบงก์
                หลังราคาน้ำมันดิบเวสต์เท็กซ์ฟื้นตัว 1,395 ดอลลาร์ และสัญญาณเงินเฟ้อสหรัฐชะลอตัว
                มองแนวรับสำคัญ 1,375 จุด
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary">Energy, Bank, Commerce</span>
                <span className="rounded-md bg-brand-accent/10 px-2.5 py-1 text-xs font-medium text-brand-accent">US CPI, Fed policy</span>
                <span className="rounded-md bg-brand-bg-secondary px-2.5 py-1 text-xs text-brand-text-secondary">Fund flow, OPEC+</span>
              </div>
            </div>
          </div>

            <VolumeLeaderTable stocks={[['PTT', '33.75', '+0.50', '+1.51%'], ['ADVANC', '245.00', '-1.00', '-0.41%'], ['KBANK', '133.50', '+2.00', '+1.52%'], ['CPALL', '57.25', '+0.50', '+0.88%'], ['BBL', '153.00', '+1.50', '+0.99%']]} title="Volume leader" icon={BarChart3} />
            <VolumeLeaderTable stocks={usLeaders} title="US leaders" icon={TrendingUp} />
          </div>
        </div>

        <aside className="space-y-4">
          <WatchlistPreview stocks={watchlistRows} empty={watchlistPreview.length === 0} />
          <RiskPanel market={activeMarket} />
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <ScanPresetSection />
        <OpportunityQueue />
      </section>
    </div>
  )
}

function formatDashboardNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatSignedNumber(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatDashboardNumber(value)}`
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatSignedInteger(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${new Intl.NumberFormat('en-US').format(Math.round(value))}`
}

function formatCompactMillion(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value))
}

function formatCompactShares(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}
