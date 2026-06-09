'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

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
  const reactId = useId()
  const widgetId = useMemo(() => `tradingview-${reactId.replace(/:/g, '')}`, [reactId])
  const tradingViewSymbol = useMemo(() => normalizeTradingViewSymbol(symbol, exchange), [symbol, exchange])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    container.innerHTML = ''
    setIsLoading(true)

    const widgetDiv = document.createElement('div')
    widgetDiv.id = widgetId
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.width = '100%'
    widgetDiv.style.height = '100%'
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tradingViewSymbol,
      container_id: widgetId,
      interval: 'D',
      timezone: 'Asia/Bangkok',
      theme: 'dark',
      style: '1',
      locale: 'th',
      allow_symbol_change: true,
      withdateranges: true,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      details: true,
      hotlist: false,
      calendar: false,
      save_image: false,
      backgroundColor: '#0f172a',
      gridColor: 'rgba(51, 65, 85, 0.35)',
      studies: [],
      support_host: 'https://www.tradingview.com',
    })
    script.onload = () => setIsLoading(false)
    script.onerror = () => {
      setIsLoading(false)
    }

    container.appendChild(script)

    return () => {
      container.innerHTML = ''
    }
  }, [height, tradingViewSymbol, widgetId])

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-brand-border bg-brand-bg-secondary"
      style={{ height: `${height}px` }}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-brand-text-secondary">
          กำลังโหลดกราฟจาก TradingView...
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
