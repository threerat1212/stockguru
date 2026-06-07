'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => void
    }
  }
}

interface TradingViewWidgetProps {
  symbol: string
  exchange?: string
  height?: number
}

export default function TradingViewWidget({ symbol, exchange = 'SET', height = 420 }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptLoaded = useRef(false)

  const isSupported = exchange === 'NASDAQ' || exchange === 'NYSE'

  useEffect(() => {
    if (!isSupported || !containerRef.current || scriptLoaded.current) return

    const container = containerRef.current
    container.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.id = `tv-widget-${symbol}`
    widgetDiv.style.width = '100%'
    widgetDiv.style.height = `${height}px`
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          container_id: widgetDiv.id,
          symbol: `${exchange}:${symbol}`,
          interval: 'D',
          timezone: 'Asia/Bangkok',
          theme: 'dark',
          style: '1',
          locale: 'th',
          toolbar_bg: '#0f172a',
          enable_publishing: false,
          withdateranges: true,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          details: true,
          hotlist: false,
          calendar: false,
          studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies'],
          show_popup_button: false,
          width: '100%',
          height: height,
          backgroundColor: '#0f172a',
          gridColor: '#1e293b',
          textColor: '#94a3b8',
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
        })
        scriptLoaded.current = true
      }
    }

    container.appendChild(script)

    return () => {
      container.innerHTML = ''
      scriptLoaded.current = false
    }
  }, [symbol, exchange, height, isSupported])

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center h-[420px] rounded-lg border border-brand-border bg-brand-bg-secondary">
        <div className="text-center">
          <p className="text-sm text-brand-text-secondary mb-2">TradingView widget รองรับเฉพาะตลาดหลัก</p>
          <p className="text-xs text-brand-text-muted">หุ้นไทย (SET) ใช้กราฟเดิมที่ดึงจาก Yahoo Finance</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full rounded-lg overflow-hidden border border-brand-border"
      style={{ height: `${height}px` }}
    />
  )
}
