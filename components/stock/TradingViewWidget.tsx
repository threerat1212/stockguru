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
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    container.innerHTML = ''
    setIsLoading(true)
    setHasError(false)

    try {
      // Create widget container
      const widgetDiv = document.createElement('div')
      widgetDiv.id = widgetId
      widgetDiv.className = 'tradingview-widget-container__widget'
      widgetDiv.style.width = '100%'
      widgetDiv.style.height = '100%'
      container.appendChild(widgetDiv)

      // Create script with data attributes (correct TradingView embedding method)
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
      script.async = true

      // TradingView uses data-* attributes for config, not innerHTML
      script.setAttribute('data-symbol', tradingViewSymbol)
      script.setAttribute('data-interval', 'D')
      script.setAttribute('data-timezone', 'Asia/Bangkok')
      script.setAttribute('data-theme', 'dark')
      script.setAttribute('data-style', '1')
      script.setAttribute('data-locale', 'th')
      script.setAttribute('data-autosize', 'true')
      script.setAttribute('data-container_id', widgetId)
      script.setAttribute('data-allow_symbol_change', 'true')
      script.setAttribute('data-withdateranges', 'true')
      script.setAttribute('data-hide_side_toolbar', 'false')
      script.setAttribute('data-hide_top_toolbar', 'false')
      script.setAttribute('data-hide_legend', 'false')
      script.setAttribute('data-hide_volume', 'false')
      script.setAttribute('data-details', 'true')
      script.setAttribute('data-hotlist', 'false')
      script.setAttribute('data-calendar', 'false')
      script.setAttribute('data-save_image', 'false')
      script.setAttribute('data-backgroundColor', '#0f172a')
      script.setAttribute('data-gridColor', 'rgba(51, 65, 85, 0.35)')
      script.setAttribute('data-support_host', 'https://www.tradingview.com')

      script.onload = () => {
        setIsLoading(false)
      }
      script.onerror = () => {
        console.error('TradingView widget failed to load')
        setIsLoading(false)
        setHasError(true)
      }

      // Set a timeout in case onload/onerror never fires
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false)
          setHasError(true)
        }
      }, 10000)

      container.appendChild(script)

      return () => {
        clearTimeout(timeoutId)
        container.innerHTML = ''
      }
    } catch (error) {
      console.error('Error initializing TradingView widget:', error)
      setIsLoading(false)
      setHasError(true)
    }
  }, [tradingViewSymbol, widgetId, isLoading])

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
