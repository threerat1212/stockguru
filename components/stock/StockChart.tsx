'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, CrosshairMode, type IChartApi, type ISeriesApi, type Time } from 'lightweight-charts'
import type { StockCandle, Timeframe, Indicator } from '@/types/stock'
import { calculateSMA, calculateEMA } from '@/lib/utils/technical-indicators'
import { useAppStore } from '@/lib/store/stockStore'
import { cn } from '@/lib/utils/format'

interface StockChartProps {
  data: StockCandle[]
  symbol: string
  height?: number
}

export default function StockChart({ data, symbol, height = 400 }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const indicatorSeriesRefs = useRef<ISeriesApi<'Line'>[]>([])
  const { timeframe, setTimeframe, indicators, toggleIndicator } = useAppStore()

  const timeframes: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']
  const indicatorOptions: { value: Indicator; label: string }[] = [
    { value: 'SMA', label: 'SMA 20' },
    { value: 'EMA', label: 'EMA 20' },
    { value: 'RSI', label: 'RSI' },
    { value: 'MACD', label: 'MACD' },
    { value: 'BB', label: 'Bollinger' },
  ]

  function toChartTime(value: string): Time {
    if (value.includes('T')) return Math.floor(new Date(value).getTime() / 1000) as Time
    return value as Time
  }

  useEffect(() => {
    if (!chartContainerRef.current) return
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
      width: Math.max(container.clientWidth, 320),
      height,
    })

    chartRef.current = chart

    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#F43F5E',
      borderUpColor: '#10B981',
      borderDownColor: '#F43F5E',
      wickUpColor: '#10B981',
      wickDownColor: '#F43F5E',
    })

    volumeSeriesRef.current = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: Math.max(container.clientWidth, 320), height })
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
      indicatorSeriesRefs.current = []
    }
  }, [height])

  useEffect(() => {
    const chart = chartRef.current
    const candleSeries = candleSeriesRef.current
    const volumeSeries = volumeSeriesRef.current
    if (!chart || !candleSeries || !volumeSeries) return

    indicatorSeriesRefs.current.forEach((series) => chart.removeSeries(series))
    indicatorSeriesRefs.current = []

    candleSeries.setData(
      data.map(d => ({
        time: toChartTime(d.time),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    )

    volumeSeries.setData(
      data.map(d => ({
        time: toChartTime(d.time),
        value: d.volume,
        color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
      }))
    )

    // Indicators
    if (indicators.includes('SMA')) {
      const smaData = calculateSMA(data, 20)
      const smaSeries = chart.addLineSeries({
        color: '#F59E0B',
        lineWidth: 1,
        title: 'SMA 20',
      })
      indicatorSeriesRefs.current.push(smaSeries)
      smaSeries.setData(smaData.map(d => ({ time: toChartTime(d.time), value: d.value })))
    }

    if (indicators.includes('EMA')) {
      const emaData = calculateEMA(data, 20)
      const emaSeries = chart.addLineSeries({
        color: '#8B5CF6',
        lineWidth: 1,
        title: 'EMA 20',
      })
      indicatorSeriesRefs.current.push(emaSeries)
      emaSeries.setData(emaData.map(d => ({ time: toChartTime(d.time), value: d.value })))
    }

    if (indicators.includes('BB')) {
      const smaData = calculateSMA(data, 20)
      const upperBB: { time: Time; value: number }[] = []
      const lowerBB: { time: Time; value: number }[] = []

      for (let i = 0; i < smaData.length; i++) {
        const slice = data.slice(i, i + 20)
        const mean = smaData[i].value
        const variance = slice.reduce((sum, d) => sum + Math.pow(d.close - mean, 2), 0) / 20
        const stdDev = Math.sqrt(variance)
        upperBB.push({ time: toChartTime(smaData[i].time), value: mean + 2 * stdDev })
        lowerBB.push({ time: toChartTime(smaData[i].time), value: mean - 2 * stdDev })
      }

      const upperSeries = chart.addLineSeries({ color: 'rgba(139, 92, 246, 0.4)', lineWidth: 1, lineStyle: 2, title: 'BB Upper' })
      const lowerSeries = chart.addLineSeries({ color: 'rgba(139, 92, 246, 0.4)', lineWidth: 1, lineStyle: 2, title: 'BB Lower' })
      indicatorSeriesRefs.current.push(upperSeries, lowerSeries)
      upperSeries.setData(upperBB)
      lowerSeries.setData(lowerBB)
    }

    if (data.length > 0) chart.timeScale().fitContent()
  }, [data, indicators])

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Timeframe buttons */}
        <div className="flex items-center gap-1 bg-brand-bg-secondary rounded-lg p-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                timeframe === tf
                  ? 'bg-brand-card text-brand-text-primary shadow-sm'
                  : 'text-brand-text-secondary hover:text-brand-text-primary'
              )}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicator toggles */}
        <div className="flex items-center gap-1.5">
          {indicatorOptions.map((ind) => (
            <button
              key={ind.value}
              onClick={() => toggleIndicator(ind.value)}
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-md border transition-all',
                indicators.includes(ind.value)
                  ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                  : 'bg-transparent border-brand-border text-brand-text-secondary hover:border-brand-primary/30'
              )}
            >
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div
        ref={chartContainerRef}
        data-testid="stock-price-chart"
        aria-label={`${symbol} price chart`}
        className="w-full rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />

      {data.length === 0 && (
        <div className="flex items-center justify-center h-[400px] text-brand-text-secondary">
          ไม่มีข้อมูลกราฟ
        </div>
      )}
    </div>
  )
}
