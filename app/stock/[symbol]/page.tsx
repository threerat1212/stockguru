'use client'

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Brain,
  Building2,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle2,
  Star,
  StarOff,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { useQuote, useAnalysis, useFundamentals } from '@/lib/hooks/use-stock'
import DataSourceBadge, { DataHonestyBanner } from '@/components/market/DataSourceBadge'
import { useWatchlist } from '@/lib/hooks/use-watchlist'
import {
  formatNumber,
  formatCurrency,
  formatVolume,
  formatMarketCapUsd,
  cn,
} from '@/lib/utils/format'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import PriceDisplay, { PriceStats } from '@/components/stock/PriceDisplay'
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

export default function StockDetailPage({ params }: { params: { symbol: string } }) {
  const symbol = normalizeRouteSymbol(decodeURIComponent(params.symbol))
  const quoteLookupSymbol = toQuoteLookupSymbol(symbol)

  const { isInWatchlist, addWatchlistItem, removeWatchlistItem } = useWatchlist()
  const inWatchlist = isInWatchlist(symbol)

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

  function toggleWatchlist() {
    if (inWatchlist) {
      removeWatchlistItem(symbol)
    } else {
      addWatchlistItem(symbol)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-brand-card border border-brand-border hover:bg-brand-bg-secondary transition-colors"
          >
            <ArrowLeft size={18} className="text-brand-text-secondary" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-brand-primary">
                  {displaySymbol.substring(0, 3)}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-brand-text-primary">{displaySymbol}</h1>
                <p className="text-sm text-brand-text-secondary">{quote?.name ?? symbol}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={inWatchlist ? 'success' : 'secondary'}
            size="sm"
            onClick={toggleWatchlist}
          >
            {inWatchlist ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
            {inWatchlist ? 'ในรายการโปรด' : 'เพิ่มรายการโปรด'}
          </Button>
        </div>
      </div>

      <DataHonestyBanner meta={quoteMeta} />

      {/* Price & Quote Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div className="space-y-2">
                {quote ? (
                  <>
                  <PriceDisplay quote={quote} size="lg" />
                  <DataSourceBadge meta={quoteMeta} />
                  </>
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-brand-text-primary sm:text-4xl">{displaySymbol}</p>
                    <p className="mt-1 text-sm text-brand-text-secondary">
                      {quoteLoading ? 'กำลังโหลดข้อมูลราคา...' : 'กราฟจาก TradingView'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                {quote ? (
                  <>
                  <div className="text-right">
                    <p className="text-xs text-brand-text-secondary">Volume</p>
                    <p className="text-lg font-mono-nums font-semibold text-brand-text-primary">
                      {formatVolume(quote.volume)}
                    </p>
                  </div>
                  {quote.marketCap && (
                    <div className="text-right">
                      <p className="text-xs text-brand-text-secondary">มูลค่าตลาด</p>
                      <p className="text-lg font-mono-nums font-semibold text-brand-text-primary">
                        {formatMarketCapUsd(quote.marketCap, quote.currency)}
                      </p>
                    </div>
                  )}
                  {quote.pe && (
                    <div className="text-right">
                      <p className="text-xs text-brand-text-secondary">P/E</p>
                      <p className="text-lg font-mono-nums font-semibold text-brand-text-primary">
                        {formatNumber(quote.pe)}
                      </p>
                    </div>
                  )}
                  </>
                ) : (
                  <Badge variant="info" size="sm">{displayExchange}</Badge>
                )}
              </div>
            </div>

            {/* Chart */}
            {investingChart ? (
              <InvestingChartWidget
                symbol={quote?.symbol ?? symbol}
                exchange={quote?.exchange}
                height={520}
              />
            ) : (
              <TradingViewWidget symbol={symbol} exchange={quote?.exchange} height={520} />
            )}
          </Card>
        </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Price Stats */}
            {quote ? (
              <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 size={16} className="text-brand-primary" />
                  ข้อมูลราคา
                </CardTitle>
              </CardHeader>
              <PriceStats quote={quote} />
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 size={16} className="text-brand-primary" />
                    ข้อมูลราคา
                  </CardTitle>
                </CardHeader>
                <p className="text-sm text-brand-text-secondary">
                  {quoteLoading ? 'กำลังโหลดข้อมูลราคา...' : 'ไม่มีข้อมูลราคาจาก Yahoo สำหรับ symbol นี้'}
                </p>
              </Card>
            )}

            {/* AI Analysis Button */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
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
                <div className="text-center py-4">
                  <p className="text-sm text-brand-text-secondary mb-4">
                    ให้ AI วิเคราะห์หุ้น {displaySymbol} ด้วยเทคนิค AI
                  </p>
                  <Button onClick={() => setShowAnalysis(true)}>
                    <Brain size={16} />
                    วิเคราะห์ด้วย AI
                  </Button>
                </div>
              ) : analysisLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <LoadingSpinner size="md" />
                  <p className="text-sm text-brand-text-secondary">AI กำลังวิเคราะห์...</p>
                </div>
              ) : analysis ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className={cn('flex flex-col items-center p-2 rounded-lg', trendConfig[analysis.trend].bg)}>
                      {(() => {
                        const TrendIcon = trendConfig[analysis.trend].icon
                        return <TrendIcon size={16} className={trendConfig[analysis.trend].color} />
                      })()}
                      <span className="text-xs text-brand-text-secondary mt-1">แนวโน้ม</span>
                      <span className={cn('text-xs font-semibold', trendConfig[analysis.trend].color)}>
                        {trendConfig[analysis.trend].label}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-brand-card">
                      <Target size={16} className={viewConfig[analysis.view].color} />
                      <span className="text-xs text-brand-text-secondary mt-1">สภาวะตลาด</span>
                      <span className={cn('text-xs font-semibold', viewConfig[analysis.view].color)}>
                        {viewConfig[analysis.view].label}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-brand-card">
                      <Shield size={16} className="text-brand-primary" />
                      <span className="text-xs text-brand-text-secondary mt-1">ความมั่นใจ</span>
                      <span className="text-xs font-semibold text-brand-primary">{analysis.confidence}%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-brand-bg-secondary rounded-lg">
                    <p className="text-xs text-brand-text-secondary leading-relaxed">{analysis.summary}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-brand-success/5 border border-brand-success/20 rounded-lg">
                      <span className="text-xs text-brand-text-secondary">แนวรับ</span>
                      {analysis.support.map((price, i) => (
                        <p key={i} className="text-xs font-mono-nums text-brand-success">{formatCurrency(price, quote.currency)}</p>
                      ))}
                    </div>
                    <div className="p-2 bg-brand-danger/5 border border-brand-danger/20 rounded-lg">
                      <span className="text-xs text-brand-text-secondary">แนวต้าน</span>
                      {analysis.resistance.map((price, i) => (
                        <p key={i} className="text-xs font-mono-nums text-brand-danger">{formatCurrency(price, quote.currency)}</p>
                      ))}
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-brand-primary mt-0.5 shrink-0" />
                        <span className="text-xs text-brand-text-secondary">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : analysisError ? (
                <div className="text-center py-4 space-y-3">
                  <AlertTriangle size={22} className="text-brand-warning mx-auto" />
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

            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 size={16} className="text-brand-primary" />
                  ข้อมูลบริษัท
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-text-secondary">ชื่อย่อ</span>
                  <span className="text-sm font-medium text-brand-text-primary">{displaySymbol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-text-secondary">ตลาด</span>
                  <Badge variant="info" size="sm">{displayExchange}</Badge>
                </div>
                {quote && (
                  <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-text-secondary">สกุลเงิน</span>
                  <span className="text-sm font-medium text-brand-text-primary">{quote.currency}</span>
                  </div>
                )}
                {(fundamentals?.sector || fundamentals?.industry) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-text-secondary">กลุ่มอุตสาหกรรม</span>
                    <span className="text-sm font-medium text-brand-text-primary text-right">
                      {[fundamentals.sector, fundamentals.industry].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                )}
                {peRatio != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-text-secondary">P/E Ratio</span>
                    <span className="text-sm font-mono-nums font-medium text-brand-text-primary">
                      {formatNumber(peRatio)}
                    </span>
                  </div>
                )}
                {fundamentals?.returnOnEquity != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-text-secondary">ROE</span>
                    <span className="text-sm font-mono-nums font-medium text-brand-text-primary">
                      {formatNumber(fundamentals.returnOnEquity * 100)}%
                    </span>
                  </div>
                )}
                {fundamentals?.debtToEquity != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-text-secondary">Debt/Equity</span>
                    <span className="text-sm font-mono-nums font-medium text-brand-text-primary">
                      {formatNumber(fundamentals.debtToEquity)}
                    </span>
                  </div>
                )}
                {fundamentals?.dividendYield != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-text-secondary">Dividend Yield</span>
                    <span className="text-sm font-mono-nums font-medium text-brand-text-primary">
                      {formatNumber(fundamentals.dividendYield * 100)}%
                    </span>
                  </div>
                )}
                {quote?.week52High && (
                  <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-text-secondary">52W สูงสุด</span>
                  <span className="text-sm font-mono-nums font-medium text-brand-success">
                      {formatCurrency(quote.week52High, quote.currency)}
                  </span>
                </div>
              )}
                {quote?.week52Low && (
                  <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-text-secondary">52W ต่ำสุด</span>
                  <span className="text-sm font-mono-nums font-medium text-brand-danger">
                      {formatCurrency(quote.week52Low, quote.currency)}
                  </span>
                </div>
              )}
              </div>
            </Card>

            {/* Disclaimer */}
            <div className="p-3 bg-brand-warning/5 border border-brand-warning/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-brand-warning mt-0.5 shrink-0" />
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  ข้อมูลนี้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำในการลงทุน ควรศึกษาข้อมูลเพิ่มเติมก่อนตัดสินใจ
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
