'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  GitCompareArrows,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Search,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import { createChart, ColorType, type Time } from 'lightweight-charts'
import { useQuote, useSearch, useHistory } from '@/lib/hooks/use-stock'
import { formatNumber, formatPercent, formatVolume, formatCurrency, formatMarketCapUsd, getPriceColor, cn } from '@/lib/utils/format'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import FeatureGate from '@/components/auth/FeatureGate'
import type { StockQuote } from '@/types/stock'

const MAX_COMPARE = 3
const FOREIGN_SYMBOLS = new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'JPM', 'BABA'])
const COMPARE_CHART_COLORS = ['#3b82f6', '#22c55e', '#f97316']

interface CompareRow {
  label: string
  key: keyof StockQuote
  format: 'number' | 'percent' | 'volume' | 'currency' | 'raw'
  highlight?: 'highest' | 'lowest'
}

const COMPARE_ROWS: CompareRow[] = [
  { label: 'ราคา', key: 'price', format: 'currency' },
  { label: 'เปลี่ยนแปลง', key: 'change', format: 'currency' },
  { label: '% เปลี่ยนแปลง', key: 'changePercent', format: 'percent', highlight: 'highest' },
  { label: 'Volume', key: 'volume', format: 'volume' },
  { label: 'P/E Ratio', key: 'pe', format: 'number', highlight: 'lowest' },
  { label: 'Market Cap', key: 'marketCap', format: 'currency' },
  { label: '52W สูงสุด', key: 'week52High', format: 'currency' },
  { label: '52W ต่ำสุด', key: 'week52Low', format: 'currency' },
  { label: 'ราคาเปิด', key: 'open', format: 'currency' },
  { label: 'ราคาสูงสุด', key: 'high', format: 'currency' },
  { label: 'ราคาต่ำสุด', key: 'low', format: 'currency' },
  { label: 'ราคาปิดก่อนหน้า', key: 'previousClose', format: 'currency' },
]

function formatValue(val: unknown, format: CompareRow['format'], currency?: string, key?: keyof StockQuote): string {
  if (val === undefined || val === null) return '—'
  const num = val as number
  if (key === 'marketCap') return formatMarketCapUsd(num, currency)
  switch (format) {
    case 'number': return formatNumber(num)
    case 'percent': return formatPercent(num)
    case 'volume': return formatVolume(num)
    case 'currency': return formatCurrency(num, currency)
    case 'raw': return String(num)
  }
}

function normalizeSymbol(symbol: string, exchange?: string) {
  const upper = symbol.trim().toUpperCase()
  if (!upper) return ''
  if (upper.includes('.')) return upper

  const normalizedExchange = exchange?.toUpperCase() ?? ''
  if (FOREIGN_SYMBOLS.has(upper) || (normalizedExchange && normalizedExchange !== 'SET')) return upper

  return `${upper}.BK`
}

function getHighlightValue(quotes: (StockQuote | undefined)[], key: keyof StockQuote, type: 'highest' | 'lowest'): number | null {
  const values = quotes
    .filter((q): q is StockQuote => q !== undefined)
    .map(q => q[key] as number)
    .filter(v => v !== undefined && v !== null)

  if (values.length < 2) return null
  return type === 'highest' ? Math.max(...values) : Math.min(...values)
}


function CompareChart({ symbols }: { symbols: string[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)

  const h1 = useHistory(symbols[0] ?? null, '3M')
  const h2 = useHistory(symbols[1] ?? null, '3M')
  const h3 = useHistory(symbols[2] ?? null, '3M')

  const histories = useMemo(() => [h1.data, h2.data, h3.data], [h1.data, h2.data, h3.data])
  const isLoading = h1.isLoading || h2.isLoading || h3.isLoading

  useEffect(() => {
    if (!chartContainerRef.current || symbols.length < 2) return

    const validHistories = histories.filter((h): h is NonNullable<typeof h> => !!h && h.length > 0)
    if (validHistories.length < 2) return

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
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155', timeVisible: false },
      width: container.clientWidth,
      height: 320,
    })
    chartRef.current = chart

    validHistories.forEach((history, idx) => {
      const firstClose = history[0].close
      const normalized = history.map((c) => ({
        time: c.time as Time,
        value: +((c.close / firstClose) * 100).toFixed(2),
      }))

      const lineSeries = chart.addLineSeries({
        color: COMPARE_CHART_COLORS[idx],
        lineWidth: 2,
        title: symbols[idx].replace('.BK', ''),
      })
      lineSeries.setData(normalized)
    })

    chart.timeScale().fitContent()

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
  }, [histories, symbols])

  if (symbols.length < 2) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 size={18} className="text-brand-primary" />
          กราฟเปรียบเทียบผลตอบแทน (Normalized)
        </CardTitle>
      </CardHeader>
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex h-[320px] items-center justify-center rounded-xl border border-brand-border bg-brand-bg-secondary">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div ref={chartContainerRef} className="h-[320px] w-full rounded-xl overflow-hidden" />
        )}
        <div className="flex flex-wrap gap-3">
          {symbols.map((sym, i) => (
            <div key={sym} className="flex items-center gap-2 text-xs text-brand-text-secondary">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COMPARE_CHART_COLORS[i] }} />
              <span className="font-semibold text-brand-text-primary">{sym.replace('.BK', '')}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-brand-text-secondary">กราฟ normalize ราคาปิดให้เริ่มที่ 100 เพื่อเปรียบเทียบ momentum ระหว่างหุ้น</p>
      </div>
    </Card>
  )
}

function CompareColumn({
  quote,
  isLoading,
  onRemove,
}: {
  quote: StockQuote | undefined
  isLoading: boolean
  onRemove: () => void
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <LoadingSpinner size="md" />
        <p className="text-sm text-brand-text-secondary">กำลังโหลด...</p>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-brand-text-secondary">
        <p className="text-sm">ไม่พบข้อมูล</p>
      </div>
    )
  }

  const displaySym = quote.symbol.replace('.BK', '')
  const isPositive = quote.change >= 0

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/stock/${encodeURIComponent(quote.symbol)}`} className="group">
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
              isPositive ? 'bg-brand-success/10' : 'bg-brand-danger/10'
            )}>
              <span className="text-xs font-bold text-brand-primary">{displaySym.substring(0, 2)}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-brand-text-primary group-hover:text-brand-primary transition-colors">
                {displaySym}
              </p>
              <p className="text-xs text-brand-text-secondary truncate max-w-[100px]">{quote.name}</p>
            </div>
          </div>
        </Link>
        <button
          onClick={onRemove}
          className="p-1.5 text-brand-text-secondary hover:text-brand-danger rounded-lg hover:bg-brand-danger/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Price */}
      <div className="text-center p-3 bg-brand-bg-secondary rounded-lg">
        <p className="text-xl font-bold font-mono-nums text-brand-text-primary">{formatCurrency(quote.price, quote.currency)}</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          {isPositive ? <TrendingUp size={14} className="text-brand-success" /> : <TrendingDown size={14} className="text-brand-danger" />}
          <span className={cn('text-sm font-mono-nums font-semibold', getPriceColor(quote.change))}>
            {formatPercent(quote.changePercent)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ComparePage() {
  const [symbols, setSymbols] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const { data: searchResults } = useSearch(showSearch ? searchQuery : '')

  const quote1 = useQuote(symbols[0] ?? null)
  const quote2 = useQuote(symbols[1] ?? null)
  const quote3 = useQuote(symbols[2] ?? null)

  const quotes = [quote1.data, quote2.data, quote3.data]
  const isLoadingArr = [quote1.isLoading, quote2.isLoading, quote3.isLoading]

  function addSymbol(sym: string, exchange?: string) {
    const full = normalizeSymbol(sym, exchange)
    if (symbols.length >= MAX_COMPARE) return
    if (symbols.includes(full)) return
    setSymbols(prev => [...prev, full])
    setSearchQuery('')
    setShowSearch(false)
  }

  function removeSymbol(index: number) {
    setSymbols(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <FeatureGate feature="compare">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-accent/10 rounded-lg flex items-center justify-center">
            <GitCompareArrows size={20} className="text-brand-accent" />
          </div>
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">เปรียบเทียบหุ้น</h1>
            <p className="text-sm text-brand-text-secondary">เลือก 2-3 หุ้นเพื่อเปรียบเทียบข้อมูลแบบเคียงข้างกัน</p>
          </div>
        </div>
      </div>

      {/* Add Stock */}
      {symbols.length < MAX_COMPARE && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus size={18} className="text-brand-primary" />
              เพิ่มหุ้น ({symbols.length}/{MAX_COMPARE})
            </CardTitle>
          </CardHeader>
          <div className="relative">
            <Input
              placeholder="ค้นหาชื่อหุ้น (เช่น PTT, AAPL, NVDA)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearch(true)
              }}
              onFocus={() => setShowSearch(true)}
              icon={<Search size={16} />}
            />
            {showSearch && searchResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-brand-card border border-brand-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {searchResults.map(result => {
                  const fullSym = result.symbol
                  const alreadyAdded = symbols.includes(fullSym)
                  return (
                    <button
                      key={fullSym}
                      onClick={() => !alreadyAdded && addSymbol(fullSym, result.exchange)}
                      disabled={alreadyAdded}
                      className={cn(
                        'w-full flex items-center justify-between p-3 text-left hover:bg-brand-bg-secondary transition-colors',
                        alreadyAdded && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold text-brand-text-primary">{fullSym.replace('.BK', '')}</p>
                        <p className="text-xs text-brand-text-secondary">{result.name}</p>
                      </div>
                      {alreadyAdded ? (
                        <Badge variant="default" size="sm">เพิ่มแล้ว</Badge>
                      ) : (
                        <Plus size={16} className="text-brand-text-secondary" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
            {showSearch && searchQuery && (!searchResults || searchResults.length === 0) && (
              <div className="absolute z-10 w-full mt-1 bg-brand-card border border-brand-border rounded-lg shadow-xl p-4 text-center">
                <p className="text-sm text-brand-text-secondary">ไม่พบหุ้น &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Quick Add Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {['PTT.BK', 'AAPL', 'NVDA', 'MSFT', 'TSLA', 'CPALL.BK', 'KBANK.BK'].map(sym => {
              const full = sym
              const added = symbols.includes(full)
              return (
                <button
                  key={sym}
                  onClick={() => !added && addSymbol(sym)}
                  disabled={added}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                    added
                      ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                      : 'bg-brand-card border-brand-border text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-primary/30'
                  )}
                >
                  {sym.replace('.BK', '')}
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {/* Comparison Table */}
      {symbols.length >= 2 ? (
        <>
        <CompareChart symbols={symbols} />
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left p-3 sm:p-4 text-xs font-medium text-brand-text-secondary w-[140px] min-w-[140px]">
                    รายการ
                  </th>
                  {symbols.map((sym, i) => (
                    <th key={sym} className="p-3 sm:p-4 text-center min-w-[140px]">
                      <CompareColumn
                        quote={quotes[i]}
                        isLoading={isLoadingArr[i]}
                        onRemove={() => removeSymbol(i)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map(row => {
                  const highlightVal = row.highlight
                    ? getHighlightValue(quotes, row.key, row.highlight)
                    : null

                  return (
                    <tr key={row.key} className="border-b border-brand-border/50 hover:bg-brand-bg-secondary/30 transition-colors">
                      <td className="p-3 sm:p-4">
                        <span className="text-sm font-medium text-brand-text-secondary">{row.label}</span>
                      </td>
                      {symbols.map((sym, i) => {
                        const quote = quotes[i]
                        const val = quote?.[row.key]
                        const numVal = val as number
                        const isHighlight = highlightVal !== null && numVal === highlightVal

                        return (
                          <td key={sym} className="p-3 sm:p-4 text-center">
                            {quote ? (
                              <span className={cn(
                                'text-sm font-mono-nums',
                                row.key === 'change' || row.key === 'changePercent'
                                  ? getPriceColor(numVal)
                                  : isHighlight
                                    ? 'text-brand-success font-bold'
                                    : 'text-brand-text-primary'
                              )}>
                                {formatValue(val, row.format, quote.currency, row.key)}
                                {isHighlight && row.highlight === 'highest' && (
                                  <span className="ml-1 text-brand-success">★</span>
                                )}
                                {isHighlight && row.highlight === 'lowest' && (
                                  <span className="ml-1 text-brand-success">★</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-sm text-brand-text-secondary">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center">
              <GitCompareArrows size={28} className="text-brand-accent" />
            </div>
            <div className="text-center">
              <p className="text-brand-text-primary font-medium mb-1">เลือกหุ้นอย่างน้อย 2 ตัว</p>
              <p className="text-sm text-brand-text-secondary">
                ใช้ช่องค้นหาด้านบนหรือกดปุ่มด่วนเพื่อเพิ่มหุ้นที่ต้องการเปรียบเทียบ
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tips */}
      {symbols.length >= 2 && (
        <Card className="border-brand-primary/20 bg-brand-primary/5">
          <div className="flex items-start gap-3">
            <BarChart3 size={18} className="text-brand-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-brand-text-secondary space-y-1">
              <p className="font-medium text-brand-text-primary">💡 วิธีอ่านตารางเปรียบเทียบ</p>
              <p>★ = ค่าที่ดีที่สุดในแต่ละรายการ (% เปลี่ยนแปลง สูงสุดดี, P/E ต่ำสุดดี)</p>
              <p>เปรียบเทียบหุ้นในอุตสาหกรรมเดียวกันเพื่อหาหุ้นที่มี valuation ดีกว่า</p>
            </div>
          </div>
        </Card>
      )}
    </div>
    </FeatureGate>
  )
}
