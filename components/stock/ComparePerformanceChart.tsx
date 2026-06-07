'use client'

import { useEffect, useMemo, useRef } from 'react'
import { createChart, ColorType, CrosshairMode, type IChartApi, type Time } from 'lightweight-charts'
import type { StockCandle } from '@/types/stock'
import { cn } from '@/lib/utils/format'

interface CompareSeries {
  symbol: string
  data: StockCandle[]
  color: string
}

interface ComparePerformanceChartProps {
  series: CompareSeries[]
  height?: number
}

function normalizePerformance(data: StockCandle[]) {
  if (data.length === 0) return []
  const firstClose = data[0].close
  if (!firstClose) return []
  return data.map((point) => ({
    time: point.time as Time,
    value: +(((point.close / firstClose) - 1) * 100).toFixed(2),
  }))
}

export default function ComparePerformanceChart({ series, height = 320 }: ComparePerformanceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  const normalizedSeries = useMemo(() => series.map((item) => ({
    ...item,
    performance: normalizePerformance(item.data),
  })).filter((item) => item.performance.length > 0), [series])

  useEffect(() => {
    if (!containerRef.current || normalizedSeries.length === 0) return

    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const container = containerRef.current
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
      },
      localization: {
        priceFormatter: (price: number) => `${price.toFixed(2)}%`,
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

    normalizedSeries.forEach((item) => {
      const lineSeries = chart.addLineSeries({
        color: item.color,
        lineWidth: 2,
        title: item.symbol.replace('.BK', ''),
      })
      lineSeries.setData(item.performance)
    })

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
    }
  }, [normalizedSeries, height])

  if (normalizedSeries.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-brand-border bg-brand-bg-secondary" style={{ height }}>
        <p className="text-sm text-brand-text-secondary">ไม่มีข้อมูลกราฟสำหรับเปรียบเทียบ</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {normalizedSeries.map((item) => {
          const latest = item.performance[item.performance.length - 1]?.value ?? 0
          return (
            <div key={item.symbol} className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-bg-secondary px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-semibold text-brand-text-primary">{item.symbol.replace('.BK', '')}</span>
              <span className={cn('text-xs font-mono-nums', latest >= 0 ? 'text-brand-success' : 'text-brand-danger')}>
                {latest >= 0 ? '+' : ''}{latest.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
      <div ref={containerRef} className="w-full overflow-hidden rounded-lg" style={{ height }} />
    </div>
  )
}
