'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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
      // Create iframe widget (more reliable than script embedding)
      const iframe = document.createElement('iframe')
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.border = 'none'
      iframe.frameBorder = '0'

      // Build TradingView widget URL
      const widgetUrl = new URL('https://s.tradingview.com/widgetembed/')
      widgetUrl.searchParams.set('symbol', tradingViewSymbol)
      widgetUrl.searchParams.set('interval', 'D')
      widgetUrl.searchParams.set('timezone', 'Asia/Bangkok')
      widgetUrl.searchParams.set('theme', 'dark')
      widgetUrl.searchParams.set('style', '1')
      widgetUrl.searchParams.set('locale', 'th')
      widgetUrl.searchParams.set('toolbar_bg', '#0f172a')
      widgetUrl.searchParams.set('enable_publishing', 'false')
      widgetUrl.searchParams.set('allow_symbol_change', 'true')
      widgetUrl.searchParams.set('details', 'true')
      widgetUrl.searchParams.set('hide_top_toolbar', 'false')
      widgetUrl.searchParams.set('hide_legend', 'false')
      widgetUrl.searchParams.set('hide_volume', 'false')
      widgetUrl.searchParams.set('hide_side_toolbar', 'false')
      widgetUrl.searchParams.set('withdateranges', 'true')
      widgetUrl.searchParams.set('save_image', 'false')
      widgetUrl.searchParams.set('studies', '[]')

      iframe.src = widgetUrl.toString()

      iframe.onload = () => {
        setIsLoading(false)
      }
      iframe.onerror = () => {
        console.error('TradingView widget failed to load')
        setIsLoading(false)
        setHasError(true)
      }

      // Set a timeout
      const timeoutId = setTimeout(() => {
        setIsLoading(false)
        setHasError(true)
      }, 10000)

      container.appendChild(iframe)

      return () => {
        clearTimeout(timeoutId)
        container.innerHTML = ''
      }
    } catch (error) {
      console.error('Error initializing TradingView widget:', error)
      setIsLoading(false)
      setHasError(true)
    }
  }, [tradingViewSymbol]) // Remove isLoading from dependencies to prevent infinite loop

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
