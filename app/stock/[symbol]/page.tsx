'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Brain,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  LineChart,
  Lock,
  Maximize2,
  Minus,
  Newspaper,
  Shield,
  Star,
  StarOff,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useAnalysis, useFundamentals, useQuote } from '@/lib/hooks/use-stock'
import DataSourceBadge, { DataHonestyBanner } from '@/components/market/DataSourceBadge'
import { useWatchlist } from '@/lib/hooks/use-watchlist'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { NEWS_ARTICLES } from '@/lib/news/news-data'
import {
  cn,
  formatCurrency,
  formatMarketCapUsd,
  formatNumber,
  timeAgo,
  formatVolume,
} from '@/lib/utils/format'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { PriceStats } from '@/components/stock/PriceDisplay'
import type { FundamentalData, Indicator, NewsArticle, StockQuote, Timeframe } from '@/types/stock'
import TradingViewWidget from '@/components/stock/TradingViewWidget'
import AuthModal from '@/components/auth/AuthModal'

const timeframeOptions: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']

const indicatorOptions: Array<{ value: Indicator; label: string; detail: string }> = [
  { value: 'SMA', label: 'SMA 20', detail: 'ค่าเฉลี่ยเรียบง่าย ใช้ดูแนวโน้มหลัก' },
  { value: 'EMA', label: 'EMA 20', detail: 'ให้น้ำหนักราคาล่าสุดมากกว่า SMA' },
  { value: 'BB', label: 'Bollinger', detail: 'กรอบความผันผวนจาก SMA และส่วนเบี่ยงเบน' },
  { value: 'RSI', label: 'RSI 14', detail: 'โมเมนตัม 0-100 เพื่อดูแรงซื้อขาย' },
  { value: 'MACD', label: 'MACD', detail: 'โมเมนตัมจากส่วนต่าง EMA 12/26' },
]

function normalizeRouteSymbol(value: string) {
  return value.trim().toUpperCase()
}

function toQuoteLookupSymbol(value: string) {
  const symbol = normalizeRouteSymbol(value)
  if (!symbol) return null

  if (symbol.includes(':')) {
    const [exchange, ...rest] = symbol.split(':')
    const ticker = rest.join(':').trim()
    if (!ticker) return null
    if (exchange === 'SET') return `${ticker.replace(/\.BK$/, '')}.BK`
    if (['NASDAQ', 'NYSE', 'AMEX', 'ARCA', 'OTC'].includes(exchange)) return ticker
    return null
  }

  return symbol
}

function getDisplaySymbol(symbol: string, quote?: StockQuote | null) {
  if (quote) return quote.symbol.replace('.BK', '')
  if (symbol.includes(':')) return symbol.split(':').slice(1).join(':')
  return symbol.replace('.BK', '')
}

function getDisplayExchange(symbol: string, quote?: StockQuote | null) {
  if (quote) return quote.exchange
  if (symbol.includes(':')) return symbol.split(':')[0]
  if (symbol.endsWith('.BK')) return 'SET'
  return 'TradingView'
}

function QuoteMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'success' | 'danger' | 'accent'
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-bg/55 p-3">
      <p className="text-xs text-brand-text-secondary">{label}</p>
      <p
        className={cn(
          'mt-1 truncate font-mono-nums text-lg font-semibold',
          tone === 'default' && 'text-brand-text-primary',
          tone === 'success' && 'text-brand-primary',
          tone === 'danger' && 'text-brand-danger',
          tone === 'accent' && 'text-brand-accent'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function formatNullablePercent(value: number | undefined | null) {
  if (value == null) return 'รอข้อมูล'
  return `${formatNumber(value * 100)}%`
}

function formatNullableNumber(value: number | undefined | null, decimals = 2) {
  if (value == null) return 'รอข้อมูล'
  return formatNumber(value, decimals)
}

function formatNullableCompactMoney(value: number | undefined | null, currency = 'USD') {
  if (value == null) return 'รอข้อมูล'
  return formatMarketCapUsd(value, currency)
}

function assessFinancialHealth(fundamentals?: FundamentalData | null, quote?: StockQuote | null) {
  let score = 50
  const points: Array<{ label: string; tone: 'success' | 'warning' | 'danger' | 'muted' }> = []

  if (fundamentals?.profitMargin != null) {
    if (fundamentals.profitMargin >= 0.12) {
      score += 12
      points.push({ label: `Margin ${formatNullablePercent(fundamentals.profitMargin)} แข็งแรง`, tone: 'success' })
    } else if (fundamentals.profitMargin > 0) {
      score += 4
      points.push({ label: `Margin ${formatNullablePercent(fundamentals.profitMargin)} ยังเป็นบวก`, tone: 'warning' })
    } else {
      score -= 12
      points.push({ label: 'Margin ติดลบ ต้องดูงบละเอียด', tone: 'danger' })
    }
  }

  if (fundamentals?.returnOnEquity != null) {
    if (fundamentals.returnOnEquity >= 0.12) {
      score += 12
      points.push({ label: `ROE ${formatNullablePercent(fundamentals.returnOnEquity)} ดี`, tone: 'success' })
    } else if (fundamentals.returnOnEquity > 0) {
      score += 3
      points.push({ label: `ROE ${formatNullablePercent(fundamentals.returnOnEquity)} ปานกลาง`, tone: 'warning' })
    } else {
      score -= 10
      points.push({ label: 'ROE ต่ำหรือติดลบ', tone: 'danger' })
    }
  }

  if (fundamentals?.debtToEquity != null) {
    if (fundamentals.debtToEquity <= 100) {
      score += 10
      points.push({ label: `D/E ${formatNullableNumber(fundamentals.debtToEquity)} คุมได้`, tone: 'success' })
    } else if (fundamentals.debtToEquity <= 200) {
      score -= 2
      points.push({ label: `D/E ${formatNullableNumber(fundamentals.debtToEquity)} ต้องติดตาม`, tone: 'warning' })
    } else {
      score -= 12
      points.push({ label: `D/E ${formatNullableNumber(fundamentals.debtToEquity)} สูง`, tone: 'danger' })
    }
  }

  if (fundamentals?.revenueGrowth != null) {
    if (fundamentals.revenueGrowth > 0.05) {
      score += 8
      points.push({ label: `รายได้โต ${formatNullablePercent(fundamentals.revenueGrowth)}`, tone: 'success' })
    } else if (fundamentals.revenueGrowth < 0) {
      score -= 8
      points.push({ label: `รายได้หด ${formatNullablePercent(fundamentals.revenueGrowth)}`, tone: 'danger' })
    }
  }

  if (quote?.marketCap) {
    score += quote.marketCap > 1_000_000_000 ? 4 : 0
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)))
  const label = normalizedScore >= 75 ? 'แข็งแรง' : normalizedScore >= 55 ? 'พอใช้' : normalizedScore >= 40 ? 'ต้องเฝ้าดู' : 'เสี่ยงสูง'
  const tone = normalizedScore >= 75 ? 'success' : normalizedScore >= 55 ? 'warning' : 'danger'

  return {
    score: normalizedScore,
    label,
    tone,
    points: points.length ? points.slice(0, 4) : [{ label: 'ข้อมูลยังไม่พอสำหรับประเมินเต็มรูปแบบ', tone: 'muted' as const }],
  }
}

function getRelatedNews(displaySymbol: string, quoteSymbol?: string | null): NewsArticle[] {
  const normalized = new Set(
    [displaySymbol, quoteSymbol, `${displaySymbol}.BK`]
      .filter((item): item is string => Boolean(item))
      .map((item) => item.toUpperCase())
  )

  const related = NEWS_ARTICLES.filter((article) =>
    article.relatedSymbols?.some((symbol) => {
      const clean = symbol.toUpperCase()
      return normalized.has(clean) || normalized.has(clean.replace(/\.BK$/, ''))
    })
  )

  if (related.length > 0) return related
  return NEWS_ARTICLES.filter((article) => article.category === 'market' || article.category === 'global')
}

export default function StockDetailPage({ params }: { params: { symbol: string } }) {
  const symbol = normalizeRouteSymbol(decodeURIComponent(params.symbol))
  const quoteLookupSymbol = toQuoteLookupSymbol(symbol)

  const { isInWatchlist, addWatchlistItem, removeWatchlistItem } = useWatchlist()
  const { plan, isPro, isTrader } = useSubscription()
  const { data: quote, meta: quoteMeta, isLoading: quoteLoading } = useQuote(quoteLookupSymbol)
  const { data: fundamentals } = useFundamentals(quote?.symbol ?? null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [timeframe, setTimeframe] = useState<Timeframe>('1D')
  const [indicatorMenuOpen, setIndicatorMenuOpen] = useState(false)
  const [selectedIndicators, setSelectedIndicators] = useState<Indicator[]>(['SMA'])
  const indicatorMenuRef = useRef<HTMLDivElement>(null)
  const {
    data: analysis,
    isLoading: analysisLoading,
    error: analysisError,
    refetch: refetchAnalysis,
  } = useAnalysis(showAnalysis && quote ? quote.symbol : null)
  const analysisAuthRequired = /เข้าสู่ระบบ|sign in|log in|login|unauthor/i.test(
    (analysisError as Error | null)?.message ?? ''
  )
  const displaySymbol = getDisplaySymbol(symbol, quote)
  const displayExchange = getDisplayExchange(symbol, quote)
  const peRatio = fundamentals?.trailingPE ?? quote?.pe
  const chartSymbol = quote?.symbol ?? quoteLookupSymbol ?? symbol
  const watchlistSymbol = quote?.symbol ?? symbol
  const inWatchlist = isInWatchlist(watchlistSymbol)
  const quoteTone = quote ? (quote.change >= 0 ? 'success' : 'danger') : 'default'
  const financialHealth = useMemo(() => assessFinancialHealth(fundamentals, quote), [fundamentals, quote])
  const relatedNews = useMemo(() => getRelatedNews(displaySymbol, quote?.symbol), [displaySymbol, quote?.symbol])
  const visibleNews = isTrader ? relatedNews.slice(0, 4) : isPro ? relatedNews.slice(0, 2) : relatedNews.slice(0, 1)
  const planDetailLabel = isTrader ? 'Trader: เห็น metric และข่าวครบ' : isPro ? 'Pro: เห็นข่าวและ metric เพิ่ม' : 'Free: แสดงข้อมูลหลัก'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (indicatorMenuRef.current && !indicatorMenuRef.current.contains(event.target as Node)) {
        setIndicatorMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleWatchlist() {
    if (inWatchlist) {
      removeWatchlistItem(watchlistSymbol)
    } else {
      addWatchlistItem(watchlistSymbol)
    }
  }

  function toggleIndicator(indicator: Indicator) {
    setSelectedIndicators((current) =>
      current.includes(indicator)
        ? current.filter((item) => item !== indicator)
        : [...current, indicator]
    )
  }

  const trendConfig = {
    bullish: { label: 'ขาขึ้น', icon: TrendingUp, color: 'text-brand-success', bg: 'bg-brand-success/10', variant: 'success' as const },
    bearish: { label: 'ขาลง', icon: TrendingDown, color: 'text-brand-danger', bg: 'bg-brand-danger/10', variant: 'danger' as const },
    neutral: { label: 'ไซด์เวย์', icon: Minus, color: 'text-brand-warning', bg: 'bg-brand-warning/10', variant: 'warning' as const },
  }

  const viewConfig = {
    bullish_momentum: { label: 'แรงซื้อสะสม', color: 'text-brand-success', variant: 'success' as const },
    bearish_momentum: { label: 'แรงขายกดดัน', color: 'text-brand-danger', variant: 'danger' as const },
    neutral_consolidation: { label: 'สร้างฐาน', color: 'text-brand-warning', variant: 'warning' as const },
  }

  return (
    <div className="space-y-4 fade-in">
      <section className="market-frame rounded-xl border border-brand-border p-4 lg:p-5">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Link
                href="/"
                className="mt-1 rounded-lg border border-brand-border bg-brand-bg/70 p-2 transition-colors hover:border-brand-primary/50 hover:bg-brand-card"
              >
                <ArrowLeft size={18} className="text-brand-text-secondary" />
              </Link>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-brand-text-secondary">
                  <span className="pulse-glow h-2 w-2 rounded-full bg-brand-primary" />
                  {displayExchange} quote desk
                  <span>•</span>
                  <Clock size={13} />
                  {quoteLoading ? 'กำลังโหลดข้อมูลราคา' : 'อัปเดตตามแหล่งข้อมูล'}
                </div>
                <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                  <h1 className="text-3xl font-bold tracking-[-0.02em] text-brand-text-primary sm:text-4xl">{displaySymbol}</h1>
                  {quote ? (
                    <>
                      <p className="font-mono-nums text-3xl font-semibold text-brand-text-primary">
                        {formatCurrency(quote.price, quote.currency)}
                      </p>
                      <p
                        className={cn(
                          'font-mono-nums text-lg font-semibold',
                          quote.change >= 0 ? 'text-brand-primary' : 'text-brand-danger'
                        )}
                      >
                        {quote.change >= 0 ? '+' : ''}
                        {formatCurrency(quote.change, quote.currency)} ({quote.changePercent >= 0 ? '+' : ''}
                        {formatNumber(quote.changePercent)}%)
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-brand-text-secondary">{quoteLoading ? 'กำลังโหลดข้อมูลราคา...' : 'ใช้กราฟจาก TradingView เป็นหลัก'}</p>
                  )}
                </div>
                <p className="mt-2 max-w-3xl truncate text-sm text-brand-text-secondary">{quote?.name ?? symbol}</p>
                <div className="mt-3">
                  <DataSourceBadge meta={quoteMeta} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={inWatchlist ? 'success' : 'secondary'}
                size="sm"
                onClick={toggleWatchlist}
              >
                {inWatchlist ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                {inWatchlist ? 'อยู่ในวอตช์ลิสต์' : 'เพิ่มวอตช์ลิสต์'}
              </Button>
              <Link href={`/ai?symbol=${encodeURIComponent(watchlistSymbol)}`}>
                <Button size="sm" variant="secondary">
                  <Brain size={16} />
                  ถาม AI
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <QuoteMetric
              label="ราคา"
              value={quote ? formatCurrency(quote.price, quote.currency) : displaySymbol}
            />
            <QuoteMetric
              label="เปลี่ยนแปลง"
              value={quote ? `${quote.change >= 0 ? '+' : ''}${formatNumber(quote.changePercent)}%` : quoteLoading ? 'กำลังโหลด' : displayExchange}
              tone={quoteTone}
            />
            <QuoteMetric
              label="Volume"
              value={quote ? formatVolume(quote.volume) : 'TradingView'}
              tone="accent"
            />
            <QuoteMetric
              label="Market Cap"
              value={quote?.marketCap ? formatMarketCapUsd(quote.marketCap, quote.currency) : 'รอข้อมูล'}
            />
            <QuoteMetric
              label="P/E"
              value={peRatio != null ? formatNumber(peRatio) : 'รอข้อมูล'}
            />
          </div>
        </div>
      </section>

      <DataHonestyBanner meta={quoteMeta} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
        <section className="card-modern rounded-xl p-4 lg:p-5">
          <div className="mb-4 flex flex-col gap-3 border-b border-brand-border pb-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-text-primary">
                <Activity size={18} className="text-brand-primary" />
                {displaySymbol} Chart • {displayExchange}
              </h2>
              <p className="mt-1 text-sm text-brand-text-secondary">กราฟ realtime ภายในแอป พร้อม timeframe และ indicator ที่เลือกได้</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-brand-border bg-brand-bg/70 p-1 text-xs text-brand-text-secondary">
                {timeframeOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={timeframe === item}
                    onClick={() => setTimeframe(item)}
                    className={cn(
                      'min-h-9 rounded-md px-3 transition-colors hover:bg-brand-card hover:text-brand-text-primary',
                      timeframe === item && 'bg-brand-card text-brand-text-primary'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div ref={indicatorMenuRef} className="relative">
                <button
                  type="button"
                  aria-expanded={indicatorMenuOpen}
                  onClick={() => setIndicatorMenuOpen((open) => !open)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-brand-border bg-brand-bg/70 px-3 text-xs text-brand-text-secondary transition-colors hover:border-brand-primary/40 hover:text-brand-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45"
                >
                  <LineChart size={14} />
                  Indicators
                  {selectedIndicators.length > 0 && (
                    <span className="rounded bg-brand-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-brand-primary">
                      {selectedIndicators.length}
                    </span>
                  )}
                  <ChevronDown size={14} className={cn('transition-transform', indicatorMenuOpen && 'rotate-180')} />
                </button>
                {indicatorMenuOpen && (
                  <div className="absolute right-0 top-full z-dropdown mt-2 w-72 overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                    <div className="border-b border-brand-border px-3 py-2">
                      <p className="text-xs font-semibold text-brand-text-primary">Technical indicators</p>
                      <p className="mt-0.5 text-[11px] text-brand-text-muted">เลือก overlay/summary ที่ต้องการดูบนกราฟ</p>
                    </div>
                    <div className="p-1.5">
                      {indicatorOptions.map((option) => {
                        const checked = selectedIndicators.includes(option.value)
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleIndicator(option.value)}
                            className={cn(
                              'flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-brand-card',
                              checked && 'bg-brand-primary/10'
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                                checked ? 'border-brand-primary bg-brand-primary text-brand-bg' : 'border-brand-border'
                              )}
                            >
                              {checked && <CheckCircle2 size={12} />}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold text-brand-text-primary">{option.label}</span>
                              <span className="mt-0.5 block text-[11px] leading-relaxed text-brand-text-secondary">{option.detail}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <button aria-label="ขยายกราฟ" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-bg/70 text-brand-text-secondary transition-colors hover:border-brand-primary/40 hover:text-brand-text-primary">
                <Maximize2 size={15} />
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-bg">
            <TradingViewWidget
              symbol={chartSymbol}
              exchange={quote?.exchange}
              height={560}
              timeframe={timeframe}
              indicators={selectedIndicators}
              realtime
            />
          </div>
        </section>

        <aside className="space-y-4">
          {quote ? (
            <Card className="card-modern-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 size={16} className="text-brand-primary" />
                  ข้อมูลราคา
                </CardTitle>
              </CardHeader>
              <PriceStats quote={quote} />
            </Card>
          ) : (
            <Card className="card-modern-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 size={16} className="text-brand-primary" />
                  ข้อมูลราคา
                </CardTitle>
              </CardHeader>
              <p className="text-sm text-brand-text-secondary">
                {quoteLoading ? 'กำลังโหลดข้อมูลราคา...' : 'ไม่มีข้อมูลราคาจาก Yahoo สำหรับ symbol นี้'}
              </p>
            </Card>
          )}

          <Card className="card-modern-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain size={16} className="text-brand-accent" />
                AI วิเคราะห์
                {analysis?.isDemo && (
                  <Badge variant="warning" size="sm" className="ml-auto">ผลจำลอง (Demo)</Badge>
                )}
              </CardTitle>
            </CardHeader>
            {!quote ? (
              <div className="py-4 text-center">
                <p className="text-sm text-brand-text-secondary">
                  AI ต้องใช้ข้อมูลราคาจากระบบก่อน
                </p>
              </div>
            ) : !showAnalysis ? (
              <div className="py-4 text-center">
                <p className="mb-4 text-sm text-brand-text-secondary">
                  ให้ AI ช่วยสรุป {displaySymbol} ในกรอบ risk first
                </p>
                <Button onClick={() => setShowAnalysis(true)}>
                  <Brain size={16} />
                  วิเคราะห์ด้วย AI
                </Button>
              </div>
            ) : analysisLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8">
                <LoadingSpinner size="md" />
                <p className="text-sm text-brand-text-secondary">AI กำลังวิเคราะห์...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className={cn('flex flex-col items-center rounded-lg p-2', trendConfig[analysis.trend].bg)}>
                    {(() => {
                      const TrendIcon = trendConfig[analysis.trend].icon
                      return <TrendIcon size={16} className={trendConfig[analysis.trend].color} />
                    })()}
                    <span className="mt-1 text-xs text-brand-text-secondary">แนวโน้ม</span>
                    <span className={cn('text-xs font-semibold', trendConfig[analysis.trend].color)}>
                      {trendConfig[analysis.trend].label}
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg bg-brand-bg-secondary p-2">
                    <Target size={16} className={viewConfig[analysis.view].color} />
                    <span className="mt-1 text-xs text-brand-text-secondary">สภาวะตลาด</span>
                    <span className={cn('text-xs font-semibold', viewConfig[analysis.view].color)}>
                      {viewConfig[analysis.view].label}
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg bg-brand-bg-secondary p-2">
                    <Shield size={16} className="text-brand-primary" />
                    <span className="mt-1 text-xs text-brand-text-secondary">ความมั่นใจ</span>
                    <span className="text-xs font-semibold text-brand-primary">{analysis.confidence}%</span>
                  </div>
                </div>
                <div className="rounded-lg bg-brand-bg-secondary p-3">
                  <p className="text-xs leading-relaxed text-brand-text-secondary">{analysis.summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-brand-success/20 bg-brand-success/5 p-2">
                    <span className="text-xs text-brand-text-secondary">แนวรับ</span>
                    {analysis.support.map((price, i) => (
                      <p key={i} className="font-mono-nums text-xs text-brand-success">{formatCurrency(price, quote.currency)}</p>
                    ))}
                  </div>
                  <div className="rounded-lg border border-brand-danger/20 bg-brand-danger/5 p-2">
                    <span className="text-xs text-brand-text-secondary">แนวต้าน</span>
                    {analysis.resistance.map((price, i) => (
                      <p key={i} className="font-mono-nums text-xs text-brand-danger">{formatCurrency(price, quote.currency)}</p>
                    ))}
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {analysis.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand-primary" />
                      <span className="text-xs text-brand-text-secondary">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : analysisError ? (
              <div className="space-y-3 py-4 text-center">
                <AlertTriangle size={22} className="mx-auto text-brand-warning" />
                <p className="text-sm text-brand-text-secondary">
                  {(analysisError as Error).message || 'ไม่สามารถวิเคราะห์ได้ในขณะนี้'}
                </p>
                {analysisAuthRequired ? (
                  <Button size="sm" onClick={() => setAuthModalOpen(true)}>
                    <Brain size={16} />
                    เข้าสู่ระบบเพื่อใช้ AI
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => refetchAnalysis()}>
                    ลองใหม่อีกครั้ง
                  </Button>
                )}
              </div>
            ) : null}
          </Card>

          <Card className="card-modern-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 size={16} className="text-brand-primary" />
                ข้อมูลบริษัท
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-brand-text-secondary">ชื่อย่อ</span>
                <span className="text-sm font-medium text-brand-text-primary">{displaySymbol}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-brand-text-secondary">ตลาด</span>
                <Badge variant="info" size="sm">{displayExchange}</Badge>
              </div>
              {quote && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-brand-text-secondary">สกุลเงิน</span>
                  <span className="text-sm font-medium text-brand-text-primary">{quote.currency}</span>
                </div>
              )}
              {(fundamentals?.sector || fundamentals?.industry) && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-brand-text-secondary">กลุ่มอุตสาหกรรม</span>
                  <span className="text-right text-sm font-medium text-brand-text-primary">
                    {[fundamentals.sector, fundamentals.industry].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}
              {peRatio != null && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-brand-text-secondary">P/E Ratio</span>
                  <span className="font-mono-nums text-sm font-medium text-brand-text-primary">
                    {formatNumber(peRatio)}
                  </span>
                </div>
              )}
              {fundamentals?.returnOnEquity != null && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-brand-text-secondary">ROE</span>
                  <span className="font-mono-nums text-sm font-medium text-brand-text-primary">
                    {formatNumber(fundamentals.returnOnEquity * 100)}%
                  </span>
                </div>
              )}
              {fundamentals?.debtToEquity != null && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-brand-text-secondary">Debt/Equity</span>
                  <span className="font-mono-nums text-sm font-medium text-brand-text-primary">
                    {formatNumber(fundamentals.debtToEquity)}
                  </span>
                </div>
              )}
              {fundamentals?.dividendYield != null && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-brand-text-secondary">Dividend Yield</span>
                  <span className="font-mono-nums text-sm font-medium text-brand-text-primary">
                    {formatNumber(fundamentals.dividendYield * 100)}%
                  </span>
                </div>
              )}
              {quote?.week52High && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-brand-text-secondary">52W สูงสุด</span>
                  <span className="font-mono-nums text-sm font-medium text-brand-success">
                    {formatCurrency(quote.week52High, quote.currency)}
                  </span>
                </div>
              )}
              {quote?.week52Low && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-brand-text-secondary">52W ต่ำสุด</span>
                  <span className="font-mono-nums text-sm font-medium text-brand-danger">
                    {formatCurrency(quote.week52Low, quote.currency)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <div className="rounded-lg border border-brand-warning/20 bg-brand-warning/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-brand-warning" />
              <p className="text-xs leading-relaxed text-brand-text-secondary">
                ข้อมูลนี้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำในการลงทุน ควรศึกษาข้อมูลเพิ่มเติมก่อนตัดสินใจ
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="card-modern-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 size={16} className="text-brand-primary" />
              บริษัทจดทะเบียน
            </CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-brand-text-secondary">
              {fundamentals?.description
                ?? `${quote?.name ?? displaySymbol} อยู่ในตลาด ${displayExchange} ข้อมูลบริษัทและคำอธิบายธุรกิจจะอัปเดตเมื่อ provider ส่ง fundamental profile กลับมา`}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-brand-border bg-brand-bg/55 p-3">
                <p className="text-xs text-brand-text-muted">ชื่อบริษัท</p>
                <p className="mt-1 truncate text-sm font-semibold text-brand-text-primary">{fundamentals?.name ?? quote?.name ?? displaySymbol}</p>
              </div>
              <div className="rounded-lg border border-brand-border bg-brand-bg/55 p-3">
                <p className="text-xs text-brand-text-muted">กลุ่มธุรกิจ</p>
                <p className="mt-1 truncate text-sm font-semibold text-brand-text-primary">
                  {[fundamentals?.sector, fundamentals?.industry].filter(Boolean).join(' · ') || 'รอข้อมูล'}
                </p>
              </div>
              <div className="rounded-lg border border-brand-border bg-brand-bg/55 p-3">
                <p className="text-xs text-brand-text-muted">ตลาด</p>
                <p className="mt-1 text-sm font-semibold text-brand-text-primary">{displayExchange}</p>
              </div>
              <div className="rounded-lg border border-brand-border bg-brand-bg/55 p-3">
                <p className="text-xs text-brand-text-muted">แผนการเข้าถึง</p>
                <p className="mt-1 text-sm font-semibold text-brand-primary">{planDetailLabel}</p>
              </div>
            </div>
            {fundamentals?.website && (
              <a
                href={fundamentals.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary transition-colors hover:text-emerald-300"
              >
                เว็บไซต์บริษัท <ExternalLink size={13} />
              </a>
            )}
          </div>
        </Card>

        <Card className="card-modern-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield size={16} className="text-brand-primary" />
              สุขภาพการเงิน
              <span
                className={cn(
                  'ml-auto rounded-full px-2 py-0.5 text-xs font-semibold',
                  financialHealth.tone === 'success' && 'bg-brand-success/10 text-brand-success',
                  financialHealth.tone === 'warning' && 'bg-brand-warning/10 text-brand-warning',
                  financialHealth.tone === 'danger' && 'bg-brand-danger/10 text-brand-danger'
                )}
              >
                {financialHealth.label}
              </span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-brand-text-secondary">คะแนนประเมิน</span>
                <span className="font-mono-nums font-semibold text-brand-text-primary">{financialHealth.score}/100</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-brand-bg-secondary">
                <div
                  className={cn(
                    'h-full rounded-full',
                    financialHealth.tone === 'success' && 'bg-brand-success',
                    financialHealth.tone === 'warning' && 'bg-brand-warning',
                    financialHealth.tone === 'danger' && 'bg-brand-danger'
                  )}
                  style={{ width: `${financialHealth.score}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              {financialHealth.points.map((point) => (
                <div key={point.label} className="flex items-start gap-2">
                  <CheckCircle2
                    size={14}
                    className={cn(
                      'mt-0.5 shrink-0',
                      point.tone === 'success' && 'text-brand-success',
                      point.tone === 'warning' && 'text-brand-warning',
                      point.tone === 'danger' && 'text-brand-danger',
                      point.tone === 'muted' && 'text-brand-text-muted'
                    )}
                  />
                  <p className="text-xs leading-relaxed text-brand-text-secondary">{point.label}</p>
                </div>
              ))}
            </div>
            {!isTrader && (
              <div className="rounded-lg border border-brand-border bg-brand-bg/55 p-3">
                <div className="flex items-start gap-2">
                  <Lock size={14} className="mt-0.5 shrink-0 text-brand-warning" />
                  <p className="text-xs leading-relaxed text-brand-text-secondary">
                    แผน Trader จะแสดง metric เชิงลึกเพิ่ม เช่น cash flow, target price และ analyst view
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="card-modern-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 size={16} className="text-brand-primary" />
              งบล่าสุดและ valuation
              <span className="ml-auto rounded-full bg-brand-bg-secondary px-2 py-0.5 text-[11px] text-brand-text-muted">
                แผน {plan}
              </span>
            </CardTitle>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Revenue', formatNullableCompactMoney(fundamentals?.totalRevenue, quote?.currency ?? 'USD')],
              ['Net margin', formatNullablePercent(fundamentals?.profitMargin)],
              ['EPS', formatNullableNumber(fundamentals?.trailingEps)],
              ['P/BV', formatNullableNumber(fundamentals?.priceToBook)],
              ['Total debt', isTrader ? formatNullableCompactMoney(fundamentals?.totalDebt, quote?.currency ?? 'USD') : 'Trader'],
              ['Free cash flow', isTrader ? formatNullableCompactMoney(fundamentals?.freeCashflow, quote?.currency ?? 'USD') : 'Trader'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-brand-border bg-brand-bg/55 p-3">
                <p className="text-xs text-brand-text-muted">{label}</p>
                <p className={cn('mt-1 font-mono-nums text-sm font-semibold', value === 'Trader' ? 'text-brand-warning' : 'text-brand-text-primary')}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-modern-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Newspaper size={16} className="text-brand-primary" />
              ข่าวล่าสุดที่เกี่ยวข้อง
              <span className="ml-auto rounded-full bg-brand-primary/15 px-2 py-0.5 text-xs font-semibold text-brand-primary">
                {visibleNews.length}
              </span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {visibleNews.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug ?? article.id}`}
                className="block rounded-lg border border-brand-border bg-brand-bg/55 p-3 transition-colors hover:border-brand-primary/35 hover:bg-brand-surface-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-brand-text-primary">{article.title}</p>
                  <span className="shrink-0 rounded bg-brand-bg-secondary px-1.5 py-0.5 text-[10px] text-brand-text-muted">{article.source}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-brand-text-secondary">{article.summary}</p>
                <p className="mt-2 text-[11px] text-brand-text-muted">{timeAgo(article.publishedAt)}</p>
              </Link>
            ))}
            {relatedNews.length > visibleNews.length && (
              <div className="rounded-lg border border-brand-border bg-brand-bg/55 p-3">
                <div className="flex items-start gap-2">
                  <Lock size={14} className="mt-0.5 shrink-0 text-brand-warning" />
                  <p className="text-xs leading-relaxed text-brand-text-secondary">
                    มีข่าวและ impact detail เพิ่มอีก {relatedNews.length - visibleNews.length} รายการสำหรับแผนที่สูงกว่า
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </section>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
