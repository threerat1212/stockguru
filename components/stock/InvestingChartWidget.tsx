'use client'

import { useMemo, useState } from 'react'

interface InvestingChartWidgetProps {
  symbol: string
  exchange?: string
  height?: number
}

const SET_INVESTING_CHARTS: Record<string, { pairId: string }> = {
  ADVANC: { pairId: '102396' },
  AOT: { pairId: '102401' },
  BA: { pairId: '942605' },
  BANPU: { pairId: '102439' },
  BBL: { pairId: '102427' },
  BDMS: { pairId: '102447' },
  BEM: { pairId: '986147' },
  BJC: { pairId: '102442' },
  CHG: { pairId: '102467' },
  CPALL: { pairId: '102475' },
  CPF: { pairId: '102461' },
  CPN: { pairId: '102455' },
  DELTA: { pairId: '102484' },
  EGCO: { pairId: '102499' },
  GULF: { pairId: '1229046' },
  HMPRO: { pairId: '102535' },
  INTUCH: { pairId: '965376' },
  IVL: { pairId: '102540' },
  KBANK: { pairId: '102560' },
  KCE: { pairId: '102561' },
  MINT: { pairId: '102616' },
  PSH: { pairId: '994065' },
  PTT: { pairId: '102672' },
  SCB: { pairId: '1192265' },
  SCC: { pairId: '102725' },
  SCCC: { pairId: '102726' },
  TISCO: { pairId: '102835' },
  TMB: { pairId: '996219' },
  TOP: { pairId: '102790' },
  TRUE: { pairId: '102846' },
  TU: { pairId: '986220' },
}

export function normalizeInvestingSetSymbol(symbol: string, exchange?: string) {
  const cleanSymbol = symbol.trim().toUpperCase()
  const cleanExchange = exchange?.trim().toUpperCase()

  if (cleanSymbol.includes(':')) {
    const [prefix, ...rest] = cleanSymbol.split(':')
    if (prefix !== 'SET') return null
    return rest.join(':').replace(/\.BK$/, '') || null
  }

  if (cleanSymbol.endsWith('.BK')) return cleanSymbol.replace(/\.BK$/, '')
  if (cleanExchange === 'SET') return cleanSymbol.replace(/\.BK$/, '')
  return null
}

export function getInvestingSetChart(symbol: string, exchange?: string) {
  const normalized = normalizeInvestingSetSymbol(symbol, exchange)
  if (!normalized) return null

  const chart = SET_INVESTING_CHARTS[normalized]
  if (!chart) return null
  return { symbol: normalized, ...chart }
}

export default function InvestingChartWidget({ symbol, exchange, height = 520 }: InvestingChartWidgetProps) {
  const [isLoading, setIsLoading] = useState(true)
  const chart = useMemo(() => getInvestingSetChart(symbol, exchange), [symbol, exchange])

  if (!chart) return null

  const params = new URLSearchParams({
    pair_ID: chart.pairId,
    height: String(height),
    width: '980',
    interval: '86400',
    plotStyle: 'candles',
    domain_ID: '1',
    lang_ID: '1',
    timezone_ID: '21',
  })

  const src = `https://ssltvc.investing.com/?${params.toString()}`

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-brand-border bg-brand-bg-secondary"
      style={{ height: `${height}px` }}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-brand-text-secondary">
          กำลังโหลดกราฟจาก Investing.com...
        </div>
      )}
      <iframe
        src={src}
        title={`${chart.symbol} chart from Investing.com`}
        data-testid="investing-chart"
        data-symbol={chart.symbol}
        data-pair-id={chart.pairId}
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  )
}
