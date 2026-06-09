'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, ColorType, Time } from 'lightweight-charts'

interface TradingViewWidgetProps {
  symbol: string
  exchange?: string
  height?: number
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

export default function TradingViewWidget({ symbol, exchange, height = 420 }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const tradingViewSymbol = useMemo(() => normalizeTradingViewSymbol(symbol, exchange), [symbol, exchange])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    container.innerHTML = ''
    setIsLoading(true)
    setHasError(false)

    try {
      // Create chart
      const chart = createChart(container, {
        width: container.clientWidth,
        height: height,
        layout: {
          background: { type: ColorType.Solid, color: '#0f172a' },
          textColor: '#94a3b8',
        },
        grid: {
          vertLines: { color: 'rgba(51, 65, 85, 0.35)' },
          horzLines: { color: 'rgba(51, 65, 85, 0.35)' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: 'rgba(51, 65, 85, 0.35)',
        },
        crosshair: {
          mode: 1,
        },
      })

      chartRef.current = chart

      // Create area series
      const areaSeries = chart.addAreaSeries({
        lineColor: '#3b82f6',
        topColor: 'rgba(59, 130, 246, 0.4)',
        bottomColor: 'rgba(59, 130, 246, 0.0)',
        lineWidth: 2,
      })

      seriesRef.current = areaSeries

      // Generate mock data (in real app, fetch from API)
      const generateMockData = () => {
        const data: { time: Time; value: number }[] = []
        let basePrice = 100
        const now = Math.floor(Date.now() / 1000)
        const dayInSeconds = 86400

        for (let i = 100; i >= 0; i--) {
          const time = (now - i * dayInSeconds) as Time
          const change = (Math.random() - 0.5) * 5
          basePrice += change
          data.push({ time, value: basePrice })
        }
        return data
      }

      const data = generateMockData()
      areaSeries.setData(data)

      chart.timeScale().fitContent()

      setIsLoading(false)

      // Handle resize
      const handleResize = () => {
        if (chartRef.current && container) {
          chartRef.current.applyOptions({
            width: container.clientWidth,
          })
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (chartRef.current) {
          chartRef.current.remove()
          chartRef.current = null
        }
      }
    } catch (error) {
      console.error('Error initializing chart:', error)
      setIsLoading(false)
      setHasError(true)
    }
  }, [tradingViewSymbol, height])

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-brand-border bg-brand-bg-secondary"
      style={{ height: `${height}px` }}
    >
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
        className="h-full w-full"
      />
    </div>
  )
}
