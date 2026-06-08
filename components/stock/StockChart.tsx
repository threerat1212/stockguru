'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CrosshairMode, type IChartApi, type ISeriesApi, type Time } from 'lightweight-charts'
import type { StockCandle, Timeframe, Indicator } from '@/types/stock'
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD } from '@/lib/utils/technical-indicators'
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
  const { timeframe, setTimeframe, indicators, toggleIndicator } = useAppStore()

  const timeframes: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']
  const indicatorOptions: { value: Indicator; label: string }[] = [
    { value: 'SMA', label: 'SMA 20' },
    { value: 'EMA', label: 'EMA 20' },
    { value: 'RSI', label: 'RSI' },
    { value: 'MACD', label: 'MACD' },
    { value: 'BB', label: 'Bollinger' },
  ]

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    // Clear existing chart
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
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
      height,
    })

    chartRef.current = chart

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#F43F5E',
      borderUpColor: '#10B981',
      borderDownColor: '#F43F5E',
      wickUpColor: '#10B981',
      wickDownColor: '#F43F5E',
    })

    candleSeries.setData(
      data.map(d => ({
        time: d.time as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    )

    // Volume series
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    volumeSeries.setData(
      data.map(d => ({
        time: d.time as Time,
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
      smaSeries.setData(smaData.map(d => ({ time: d.time as Time, value: d.value })))
    }

    if (indicators.includes('EMA')) {
      const emaData = calculateEMA(data, 20)
      const emaSeries = chart.addLineSeries({
        color: '#8B5CF6',
        lineWidth: 1,
        title: 'EMA 20',
      })
      emaSeries.setData(emaData.map(d => ({ time: d.time as Time, value: d.value })))
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
        upperBB.push({ time: smaData[i].time as Time, value: mean + 2 * stdDev })
        lowerBB.push({ time: smaData[i].time as Time, value: mean - 2 * stdDev })
      }

      const upperSeries = chart.addLineSeries({ color: 'rgba(139, 92, 246, 0.4)', lineWidth: 1, lineStyle: 2, title: 'BB Upper' })
      const lowerSeries = chart.addLineSeries({ color: 'rgba(139, 92, 246, 0.4)', lineWidth: 1, lineStyle: 2, title: 'BB Lower' })
      upperSeries.setData(upperBB)
      lowerSeries.setData(lowerBB)
    }

    chart.timeScale().fitContent()

    // Resize handler
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
    }
  }, [data, height, indicators])

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
