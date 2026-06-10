'use client'

import { useState } from 'react'
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
  Maximize2,
  Minus,
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
import {
  cn,
  formatCurrency,
  formatMarketCapUsd,
  formatNumber,
  formatVolume,
} from '@/lib/utils/format'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { PriceStats } from '@/components/stock/PriceDisplay'
import type { StockQuote } from '@/types/stock'
import TradingViewWidget from '@/components/stock/TradingViewWidget'
import InvestingChartWidget, {
  getInvestingSetChart,
} from '@/components/stock/InvestingChartWidget'
import AuthModal from '@/components/auth/AuthModal'

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

export default function StockDetailPage({ params }: { params: { symbol: string } }) {
  const symbol = normalizeRouteSymbol(decodeURIComponent(params.symbol))
  const quoteLookupSymbol = toQuoteLookupSymbol(symbol)

  const { isInWatchlist, addWatchlistItem, removeWatchlistItem } = useWatchlist()
  const { data: quote, meta: quoteMeta, isLoading: quoteLoading } = useQuote(quoteLookupSymbol)
  const { data: fundamentals } = useFundamentals(quote?.symbol ?? null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
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
  const investingChart = getInvestingSetChart(quote?.symbol ?? symbol, quote?.exchange)
  const watchlistSymbol = quote?.symbol ?? symbol
  const inWatchlist = isInWatchlist(watchlistSymbol)
  const quoteTone = quote ? (quote.change >= 0 ? 'success' : 'danger') : 'default'

  function toggleWatchlist() {
    if (inWatchlist) {
      removeWatchlistItem(watchlistSymbol)
    } else {
      addWatchlistItem(watchlistSymbol)
    }
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
              <p className="mt-1 text-sm text-brand-text-secondary">ใช้กราฟหลักเป็นพื้นที่ตัดสินใจ แล้วค่อยดู AI/risk rail ด้านขวา</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-brand-border bg-brand-bg/70 p-1 text-xs text-brand-text-secondary">
                {['1D', '1W', '1M', '3M', '1Y'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={cn(
                      'h-7 rounded-md px-2.5 transition-colors hover:bg-brand-card hover:text-brand-text-primary',
                      item === '1D' && 'bg-brand-card text-brand-text-primary'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand-border bg-brand-bg/70 px-3 text-xs text-brand-text-secondary transition-colors hover:border-brand-primary/40 hover:text-brand-text-primary">
                Indicators <ChevronDown size={14} />
              </button>
              <button aria-label="ขยายกราฟ" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-bg/70 text-brand-text-secondary transition-colors hover:border-brand-primary/40 hover:text-brand-text-primary">
                <Maximize2 size={15} />
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-bg">
            {investingChart ? (
              <InvestingChartWidget
                symbol={quote?.symbol ?? symbol}
                exchange={quote?.exchange}
                height={560}
              />
            ) : (
              <TradingViewWidget symbol={symbol} exchange={quote?.exchange} height={560} />
            )}
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

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
