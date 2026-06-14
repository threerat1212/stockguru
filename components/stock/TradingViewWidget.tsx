'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts'
import type { ApiResponse, Indicator, StockCandle, Timeframe } from '@/types/stock'
import {
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
} from '@/lib/utils/technical-indicators'
import { cn } from '@/lib/utils/format'

interface TradingViewWidgetProps {
  symbol: string
  exchange?: string
  height?: number
  timeframe?: Timeframe
  indicators?: Indicator[]
  realtime?: boolean
}

type IndicatorSummary = {
  key: string
  label: string
  value: string
  tone: 'primary' | 'warning' | 'danger' | 'muted'
}

export function normalizeTradingViewSymbol(symbol: string, exchange?: string) {
  const cleanSymbol = symbol.trim().toUpperCase()
  const cleanExchange = exchange?.trim().toUpperCase()

  if (cleanSymbol.includes(':')) return cleanSymbol
  if (cleanSymbol.endsWith('.BK')) return `SET:${cleanSymbol.replace(/\.BK$/, '')}`
  if (cleanExchange === 'SET') return `SET:${cleanSymbol.replace(/\.BK$/, '')}`
  if (cleanExchange === 'NYSE') return `NYSE:${cleanSymbol}`
  if (cleanExchange === 'NASDAQ') return `NASDAQ:${cleanSymbol}`
  if (cleanExchange) return `${cleanExchange}:${cleanSymbol}`
  return `NASDAQ:${cleanSymbol}`
}

function normalizeHistorySymbol(symbol: string, exchange?: string) {
  const cleanSymbol = symbol.trim().toUpperCase()
  const cleanExchange = exchange?.trim().toUpperCase()

  if (cleanSymbol.includes(':')) {
    const [prefix, ...rest] = cleanSymbol.split(':')
    const ticker = rest.join(':').trim()
    if (!ticker) return cleanSymbol
    if (prefix === 'SET') return `${ticker.replace(/\.BK$/, '')}.BK`
    return ticker
  }

  if (cleanSymbol.endsWith('.BK')) return cleanSymbol
  if (cleanExchange === 'SET') return `${cleanSymbol.replace(/\.BK$/, '')}.BK`
  return cleanSymbol
}

function toChartTime(time: string): Time {
  if (/^\d{4}-\d{2}-\d{2}$/.test(time)) return time as Time
  const timestamp = Math.floor(new Date(time).getTime() / 1000)
  return (Number.isFinite(timestamp) ? timestamp : time) as Time
}

function formatClockTime(date = new Date()) {
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

function formatChartNumber(value: number) {
  const digits = Math.abs(value) >= 1000 ? 2 : Math.abs(value) >= 10 ? 2 : 3
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function timeframePointCount(timeframe: Timeframe) {
  switch (timeframe) {
    case '1D': return 78
    case '1W': return 96
    case '1M': return 30
    case '3M': return 90
    case '6M': return 120
    case '1Y': return 52
    case 'ALL': return 96
    default: return 90
  }
}

function timeframeStepMs(timeframe: Timeframe) {
  const minute = 60_000
  const day = 86_400_000
  switch (timeframe) {
    case '1D': return 5 * minute
    case '1W': return 45 * minute
    case '1Y': return 7 * day
    case 'ALL': return 30 * day
    default: return day
  }
}

function generateFallbackCandles(symbol: string, timeframe: Timeframe): StockCandle[] {
  const count = timeframePointCount(timeframe)
  const step = timeframeStepMs(timeframe)
  const seed = symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const base = symbol.endsWith('.BK') ? 35 + (seed % 120) : 95 + (seed % 240)
  const candles: StockCandle[] = []
  let close = base
  const start = Date.now() - count * step

  for (let i = 0; i < count; i++) {
    const wave = Math.sin((i + seed) / 5) * 0.9 + Math.cos((i + seed) / 13) * 0.55
    const drift = ((seed % 9) - 4) * 0.015
    const open = close
    close = Math.max(1, open + wave + drift)
    const high = Math.max(open, close) + Math.abs(Math.sin(i / 3)) * 0.8
    const low = Math.min(open, close) - Math.abs(Math.cos(i / 4)) * 0.8
    const date = new Date(start + i * step)

    candles.push({
      time: timeframe === '1D' || timeframe === '1W' ? date.toISOString() : date.toISOString().split('T')[0],
      open: Number(open.toFixed(3)),
      high: Number(high.toFixed(3)),
      low: Number(low.toFixed(3)),
      close: Number(close.toFixed(3)),
      volume: Math.round(700_000 + Math.abs(wave) * 1_800_000 + (seed % 19) * 90_000),
    })
  }

  return candles
}

function toCandleSeriesData(candles: StockCandle[]) {
  return candles.map((candle) => ({
    time: toChartTime(candle.time),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  }))
}

function toVolumeSeriesData(candles: StockCandle[]) {
  return candles.map((candle) => ({
    time: toChartTime(candle.time),
    value: candle.volume,
    color: candle.close >= candle.open ? 'rgba(16,185,129,0.42)' : 'rgba(244,63,94,0.38)',
  }))
}

function toLineSeriesData(points: { time: string; value: number }[]) {
  return points.map((point) => ({ time: toChartTime(point.time), value: point.value }))
}

function buildIndicatorSummaries(candles: StockCandle[], indicators: Indicator[]): IndicatorSummary[] {
  if (!candles.length) return []

  const summaries: IndicatorSummary[] = []

  if (indicators.includes('SMA')) {
    const latest = calculateSMA(candles, 20).at(-1)
    if (latest) summaries.push({ key: 'SMA', label: 'SMA20', value: formatChartNumber(latest.value), tone: 'primary' })
  }

  if (indicators.includes('EMA')) {
    const latest = calculateEMA(candles, 20).at(-1)
    if (latest) summaries.push({ key: 'EMA', label: 'EMA20', value: formatChartNumber(latest.value), tone: 'primary' })
  }

  if (indicators.includes('BB')) {
    const bands = calculateBollingerBands(candles, 20, 2)
    const upper = bands.upper.at(-1)
    const lower = bands.lower.at(-1)
    if (upper && lower) {
      summaries.push({
        key: 'BB',
        label: 'BB20',
        value: `${formatChartNumber(lower.value)}-${formatChartNumber(upper.value)}`,
        tone: 'muted',
      })
    }
  }

  if (indicators.includes('RSI')) {
    const latest = calculateRSI(candles, 14).at(-1)
    if (latest) {
      const tone = latest.value >= 70 ? 'warning' : latest.value <= 30 ? 'danger' : 'primary'
      summaries.push({ key: 'RSI', label: 'RSI14', value: formatChartNumber(latest.value), tone })
    }
  }

  if (indicators.includes('MACD')) {
    const macd = calculateMACD(candles)
    const latest = macd.histogram.at(-1)
    if (latest) {
      summaries.push({
        key: 'MACD',
        label: 'MACD Hist',
        value: `${latest.value >= 0 ? '+' : ''}${formatChartNumber(latest.value)}`,
        tone: latest.value >= 0 ? 'primary' : 'danger',
      })
    }
  }

  return summaries
}

export default function TradingViewWidget({
  symbol,
  exchange,
  height = 420,
  timeframe = '1D',
  indicators = [],
  realtime = true,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const liveCandlesRef = useRef<StockCandle[]>([])
  const liveSeriesRef = useRef<{
    candle: ISeriesApi<'Candlestick'>
    volume: ISeriesApi<'Histogram'>
  } | null>(null)
  const tradingViewSymbol = useMemo(() => normalizeTradingViewSymbol(symbol, exchange), [symbol, exchange])
  const historySymbol = useMemo(() => normalizeHistorySymbol(symbol, exchange), [symbol, exchange])
  const [candles, setCandles] = useState<StockCandle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [sourceLabel, setSourceLabel] = useState('กำลังโหลดข้อมูล')
  const [lastLiveUpdate, setLastLiveUpdate] = useState('รอซิงก์')
  const indicatorSummaries = useMemo(() => buildIndicatorSummaries(candles, indicators), [candles, indicators])

  useEffect(() => {
    const controller = new AbortController()

    async function loadCandles() {
      setIsLoading(true)
      setHasError(false)
      try {
        const res = await fetch(`/api/stock/history?symbol=${encodeURIComponent(historySymbol)}&timeframe=${timeframe}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = (await res.json()) as ApiResponse<StockCandle[]>
        if (!res.ok || !json.success || !json.data?.length) {
          throw new Error(json.error ?? 'ไม่พบข้อมูลกราฟ')
        }
        setCandles(json.data)
        setSourceLabel(json.meta?.source === 'cache' ? 'Cache' : 'Market provider')
      } catch {
        if (controller.signal.aborted) return
        setCandles(generateFallbackCandles(historySymbol, timeframe))
        setSourceLabel('ข้อมูลจำลองสำรอง')
        setHasError(false)
      } finally {
        if (!controller.signal.aborted) {
          setLastLiveUpdate(formatClockTime())
          setIsLoading(false)
        }
      }
    }

    loadCandles()
    return () => controller.abort()
  }, [historySymbol, timeframe])

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return

    const container = containerRef.current
    container.innerHTML = ''
    liveCandlesRef.current = candles.map((candle) => ({ ...candle }))
    liveSeriesRef.current = null

    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#07111d' },
        textColor: '#94A3B8',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(31, 41, 55, 0.38)' },
        horzLines: { color: 'rgba(31, 41, 55, 0.38)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(52,211,153,0.34)', width: 1, style: LineStyle.Dashed },
        horzLine: { color: 'rgba(52,211,153,0.34)', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: 'rgba(51, 65, 85, 0.7)',
        scaleMargins: { top: 0.1, bottom: 0.24 },
      },
      timeScale: {
        borderColor: 'rgba(51, 65, 85, 0.7)',
        timeVisible: timeframe === '1D' || timeframe === '1W',
        secondsVisible: false,
      },
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
    candleSeries.setData(toCandleSeriesData(candles))

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })
    volumeSeries.setData(toVolumeSeriesData(candles))

    liveSeriesRef.current = { candle: candleSeries, volume: volumeSeries }

    if (indicators.includes('SMA')) {
      const smaSeries = chart.addLineSeries({
        color: '#F59E0B',
        lineWidth: 1,
        title: 'SMA 20',
      })
      smaSeries.setData(toLineSeriesData(calculateSMA(candles, 20)))
    }

    if (indicators.includes('EMA')) {
      const emaSeries = chart.addLineSeries({
        color: '#22D3EE',
        lineWidth: 1,
        title: 'EMA 20',
      })
      emaSeries.setData(toLineSeriesData(calculateEMA(candles, 20)))
    }

    if (indicators.includes('BB')) {
      const bands = calculateBollingerBands(candles, 20, 2)
      const upperSeries = chart.addLineSeries({
        color: 'rgba(167,139,250,0.65)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'BB Upper',
      })
      const middleSeries = chart.addLineSeries({
        color: 'rgba(148,163,184,0.45)',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        title: 'BB Mid',
      })
      const lowerSeries = chart.addLineSeries({
        color: 'rgba(167,139,250,0.65)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'BB Lower',
      })
      upperSeries.setData(toLineSeriesData(bands.upper))
      middleSeries.setData(toLineSeriesData(bands.middle))
      lowerSeries.setData(toLineSeriesData(bands.lower))
    }

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      liveSeriesRef.current = null
      chart.remove()
      chartRef.current = null
    }
  }, [candles, height, indicators, timeframe])

  useEffect(() => {
    if (!realtime || candles.length === 0) return

    const intervalId = window.setInterval(() => {
      const series = liveSeriesRef.current
      const liveCandles = liveCandlesRef.current
      const last = liveCandles[liveCandles.length - 1]
      if (!series || !last) return

      const baseMove = Math.max(Math.abs(last.close) * 0.0012, 0.015)
      const wave = Math.sin(Date.now() / 3100) * baseMove
      const noise = (Math.random() - 0.5) * baseMove
      const nextClose = Number(Math.max(0.01, last.close + wave + noise).toFixed(3))
      const nextCandle: StockCandle = {
        ...last,
        high: Math.max(last.high, nextClose),
        low: Math.min(last.low, nextClose),
        close: nextClose,
        volume: Math.round(last.volume * 0.82 + Math.abs(nextClose - last.close) * 450_000 + 60_000),
      }

      liveCandles[liveCandles.length - 1] = nextCandle
      series.candle.update({
        time: toChartTime(nextCandle.time),
        open: nextCandle.open,
        high: nextCandle.high,
        low: nextCandle.low,
        close: nextCandle.close,
      })
      series.volume.update({
        time: toChartTime(nextCandle.time),
        value: nextCandle.volume,
        color: nextCandle.close >= nextCandle.open ? 'rgba(16,185,129,0.48)' : 'rgba(244,63,94,0.42)',
      })
      setLastLiveUpdate(formatClockTime())
    }, 2500)

    return () => window.clearInterval(intervalId)
  }, [candles, realtime, timeframe])

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-brand-border bg-brand-bg-secondary"
      style={{ height: `${height}px` }}
    >
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2 py-1 font-mono text-[11px] text-brand-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
          Live {lastLiveUpdate}
        </span>
        <span className="rounded-md border border-brand-border/70 bg-brand-bg/80 px-2 py-1 text-[11px] text-brand-text-secondary">
          {sourceLabel}
        </span>
        {indicatorSummaries.map((item) => (
          <span
            key={item.key}
            className={cn(
              'rounded-md border px-2 py-1 font-mono text-[11px]',
              item.tone === 'primary' && 'border-brand-primary/20 bg-brand-primary/10 text-brand-primary',
              item.tone === 'warning' && 'border-brand-warning/25 bg-brand-warning/10 text-brand-warning',
              item.tone === 'danger' && 'border-brand-danger/25 bg-brand-danger/10 text-brand-danger',
              item.tone === 'muted' && 'border-brand-border/70 bg-brand-bg/80 text-brand-text-secondary'
            )}
          >
            {item.label} {item.value}
          </span>
        ))}
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-brand-text-secondary">
          กำลังโหลดกราฟ...
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-sm text-red-400">
          <span>ไม่สามารถโหลดกราฟได้</span>
          <span className="text-xs text-brand-text-secondary">Symbol: {tradingViewSymbol}</span>
        </div>
      )}
      <div
        ref={containerRef}
        data-testid="tradingview-chart"
        data-symbol={tradingViewSymbol}
        data-timeframe={timeframe}
        data-indicators={indicators.join(',')}
        className="h-full w-full"
      />
    </div>
  )
}
