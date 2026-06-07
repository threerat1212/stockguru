'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CrosshairMode, type IChartApi } from 'lightweight-charts'
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
import { useQuote, useHistory, useAnalysis } from '@/lib/hooks/use-stock'
import { useWatchlist } from '@/lib/hooks/use-watchlist'
import type { StockCandle } from '@/types/stock'
import {
  formatNumber,
  formatCurrency,
  formatVolume,
  formatMarketCapUsd,
  cn,
} from '@/lib/utils/format'
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD } from '@/lib/utils/technical-indicators'
import { useAppStore } from '@/lib/store/stockStore'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { LoadingSpinner, LoadingPage } from '@/components/ui/Loading'
import PriceDisplay, { PriceStats } from '@/components/stock/PriceDisplay'

export default function StockDetailPage({ params }: { params: { symbol: string } }) {
  const symbol = decodeURIComponent(params.symbol)
  const displaySymbol = symbol.replace('.BK', '')

  const { isInWatchlist, addWatchlistItem, removeWatchlistItem } = useWatchlist()
  const inWatchlist = isInWatchlist(symbol)

  const { data: quote, isLoading: quoteLoading } = useQuote(symbol)
  const { data: historyData, isLoading: historyLoading } = useHistory(symbol)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const { data: analysis, isLoading: analysisLoading } = useAnalysis(showAnalysis ? symbol : null)

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)

  // Normalize & deduplicate history data for lightweight-charts
  const chartData: StockCandle[] = historyData
    ? Array.from(
        historyData
          .map(d => {
            const timeStr =
              typeof d.time === 'number'
                ? new Date(d.time * 1000).toISOString().slice(0, 10)
                : d.time.includes('T')
                  ? d.time.slice(0, 10)
                  : d.time
            return { ...d, time: timeStr }
          })
          .reduce((map, d) => map.set(d.time, d), new Map<string, StockCandle>())
          .values()
      ).sort((a, b) => (a.time > b.time ? 1 : -1))
    : []

  // Build chart once when data is ready
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
    }

    const container = chartContainerRef.current
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94A3B8',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(51, 65, 85, 0.3)' },
        horzLines: { color: 'rgba(51, 65, 85, 0.3)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(59, 130, 246, 0.4)', width: 1, style: 2 },
        horzLine: { color: 'rgba(59, 130, 246, 0.4)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: '#334155',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: 420,
    })

    chartRef.current = chart

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#F43F5E',
      borderUpColor: '#10B981',
      borderDownColor: '#F43F5E',
      wickUpColor: '#10B981',
      wickDownColor: '#F43F5E',
    })
    candleSeriesRef.current = candleSeries

    candleSeries.setData(
      chartData.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    )

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    volumeSeriesRef.current = volumeSeries

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    volumeSeries.setData(
      chartData.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
      }))
    )

    const smaData = calculateSMA(chartData, 20)
    const smaSeries = chart.addLineSeries({ color: '#F59E0B', lineWidth: 1, title: 'SMA 20' })
    smaSeries.setData(smaData.map(d => ({ time: d.time, value: d.value })))

    const emaData = calculateEMA(chartData, 20)
    const emaSeries = chart.addLineSeries({ color: '#8B5CF6', lineWidth: 1, title: 'EMA 20' })
    emaSeries.setData(emaData.map(d => ({ time: d.time, value: d.value })))

    const { macd, signal } = calculateMACD(chartData)
    const macdSeries = chart.addLineSeries({ color: '#3B82F6', lineWidth: 1, title: 'MACD', priceScaleId: 'macd' })
    const signalSeries = chart.addLineSeries({ color: '#F97316', lineWidth: 1, title: 'Signal', priceScaleId: 'macd' })
    chart.priceScale('macd').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
    macdSeries.setData(macd.map(d => ({ time: d.time, value: d.value })))
    signalSeries.setData(signal.map(d => ({ time: d.time, value: d.value })))

    const rsiData = calculateRSI(chartData)
    const rsiSeries = chart.addLineSeries({ color: '#06B6D4', lineWidth: 1, title: 'RSI', priceScaleId: 'rsi' })
    chart.priceScale('rsi').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
    rsiSeries.setData(rsiData.map(d => ({ time: d.time, value: d.value })))

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
    }
  }, [chartData])

  // Live price update on last candle
  useEffect(() => {
    if (!quote || !candleSeriesRef.current || chartData.length === 0) return
    const last = chartData[chartData.length - 1]
    candleSeriesRef.current.update({
      time: last.time,
      open: last.open,
      high: Math.max(last.high, quote.price),
      low: Math.min(last.low, quote.price),
      close: quote.price,
    })
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.update({
        time: last.time,
        value: last.volume,
        color: quote.price >= last.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
      })
    }
  }, [quote, chartData])

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

  if (quoteLoading) {
    return <LoadingPage />
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

      {/* Price & Quote Info */}
      {quote && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <PriceDisplay quote={quote} size="lg" />
                <div className="flex items-center gap-4">
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
                </div>
              </div>

              {/* Chart */}
              {historyLoading ? (
                <div className="flex items-center justify-center h-[420px]">
                  <LoadingSpinner size="lg" />
                </div>
              ) : chartData.length > 0 ? (
                <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden" style={{ height: '420px' }} />
              ) : (
                <div className="flex items-center justify-center h-[420px] text-brand-text-secondary">
                  ไม่มีข้อมูลกราฟ
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Price Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 size={16} className="text-brand-primary" />
                  ข้อมูลราคา
                </CardTitle>
              </CardHeader>
              <PriceStats quote={quote} />
            </Card>

            {/* AI Analysis Button */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain size={16} className="text-brand-accent" />
                  AI วิเคราะห์
                </CardTitle>
              </CardHeader>
              {!showAnalysis ? (
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
              ) : null}
            </Card>

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
                  <Badge variant="info" size="sm">{quote.exchange}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-text-secondary">สกุลเงิน</span>
                  <span className="text-sm font-medium text-brand-text-primary">{quote.currency}</span>
                </div>
                {quote.pe && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-text-secondary">P/E Ratio</span>
                    <span className="text-sm font-mono-nums font-medium text-brand-text-primary">
                      {formatNumber(quote.pe)}
                    </span>
                  </div>
                )}
                {quote.week52High && (
                  <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-text-secondary">52W สูงสุด</span>
                  <span className="text-sm font-mono-nums font-medium text-brand-success">
                      {formatCurrency(quote.week52High, quote.currency)}
                  </span>
                </div>
              )}
                {quote.week52Low && (
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
      )}

      {/* No quote data */}
      {!quoteLoading && !quote && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-brand-text-secondary">ไม่พบข้อมูลหุ้น {displaySymbol}</p>
          </div>
        </Card>
      )}
    </div>
  )
}
