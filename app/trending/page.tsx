'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react'
import { useTrending } from '@/lib/hooks/use-stock'
import { formatCurrency, formatPercent, formatVolume, getPriceColor, cn } from '@/lib/utils/format'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { LoadingPage } from '@/components/ui/Loading'
import DataSourceBadge, { DataHonestyBanner } from '@/components/market/DataSourceBadge'

type SortField = 'symbol' | 'price' | 'changePercent' | 'volume'
type SortDir = 'asc' | 'desc'

function getCurrency(symbol: string, currency?: string) {
  return currency ?? (symbol.endsWith('.BK') ? 'THB' : 'USD')
}

function getExchange(symbol: string, exchange?: string) {
  return exchange ?? (symbol.endsWith('.BK') ? 'SET' : 'US')
}

export default function TrendingPage() {
  const { data: trending, meta, isLoading, refetch, isFetching } = useTrending()
  const [sortField, setSortField] = useState<SortField>('changePercent')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    if (!trending) return []
    const copy = [...trending]
    copy.sort((a, b) => {
      let va = 0
      let vb = 0
      switch (sortField) {
        case 'symbol':
          return sortDir === 'asc'
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol)
        case 'price':
          va = a.price; vb = b.price; break
        case 'changePercent':
          va = a.changePercent; vb = b.changePercent; break
        case 'volume':
          va = a.volume; vb = b.volume; break
      }
      return sortDir === 'asc' ? va - vb : vb - va
    })
    return copy
  }, [trending, sortField, sortDir])

  const topGainers = useMemo(() => {
    if (!trending) return []
    return [...trending].sort((a, b) => b.changePercent - a.changePercent).slice(0, 10)
  }, [trending])

  const topLosers = useMemo(() => {
    if (!trending) return []
    return [...trending].sort((a, b) => a.changePercent - b.changePercent).slice(0, 10)
  }, [trending])

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'changePercent' ? 'desc' : 'asc')
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-brand-text-secondary" />
    return sortDir === 'asc'
      ? <ArrowUp size={14} className="text-brand-primary" />
      : <ArrowDown size={14} className="text-brand-primary" />
  }

  if (isLoading) return <LoadingPage />

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
            <ArrowUpDown size={20} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">หุ้นเคลื่อนไหวสูง</h1>
            <p className="text-sm text-brand-text-secondary">เรียงตาม % เปลี่ยนแปลงและ volume ล่าสุด</p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          isLoading={isFetching}
        >
          <RefreshCw size={14} />
          รีเฟรช
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DataHonestyBanner meta={meta} />
        <DataSourceBadge meta={meta} />
      </div>

      {/* Top Gainers / Losers Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-success" />
              หุ้นขึ้นแรง Top 10
            </CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {topGainers.map((stock, i) => {
              const currency = getCurrency(stock.symbol, stock.currency)
              const exchange = getExchange(stock.symbol, stock.exchange)

              return (
              <Link
                key={stock.symbol}
                href={`/stock/${encodeURIComponent(stock.symbol)}`}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-brand-bg-secondary transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-brand-success/10 rounded-md flex items-center justify-center text-xs font-bold text-brand-success">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-brand-text-primary group-hover:text-brand-primary transition-colors">
                      {stock.symbol.replace('.BK', '')}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-brand-text-secondary truncate max-w-[140px]">{stock.name}</p>
                      <Badge variant="info" size="sm">{exchange}</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono-nums text-brand-text-primary">{formatCurrency(stock.price, currency)}</p>
                  <p className={cn('text-xs font-mono-nums font-semibold', getPriceColor(stock.changePercent))}>
                    {formatPercent(stock.changePercent)}
                  </p>
                </div>
              </Link>
              )
            })}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown size={18} className="text-brand-danger" />
              หุ้นลงแรง Top 10
            </CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {topLosers.map((stock, i) => {
              const currency = getCurrency(stock.symbol, stock.currency)
              const exchange = getExchange(stock.symbol, stock.exchange)

              return (
              <Link
                key={stock.symbol}
                href={`/stock/${encodeURIComponent(stock.symbol)}`}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-brand-bg-secondary transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-brand-danger/10 rounded-md flex items-center justify-center text-xs font-bold text-brand-danger">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-brand-text-primary group-hover:text-brand-primary transition-colors">
                      {stock.symbol.replace('.BK', '')}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-brand-text-secondary truncate max-w-[140px]">{stock.name}</p>
                      <Badge variant="info" size="sm">{exchange}</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono-nums text-brand-text-primary">{formatCurrency(stock.price, currency)}</p>
                  <p className={cn('text-xs font-mono-nums font-semibold', getPriceColor(stock.changePercent))}>
                    {formatPercent(stock.changePercent)}
                  </p>
                </div>
              </Link>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Full Sortable Table */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-brand-border">
          <CardHeader className="mb-0">
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown size={18} className="text-brand-primary" />
              ตารางหุ้นทั้งหมด (เรียงลำดับได้)
            </CardTitle>
          </CardHeader>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="text-left p-3 sm:p-4">
                  <button
                    onClick={() => handleSort('symbol')}
                    className="flex items-center gap-1 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                  >
                    หุ้น <SortIcon field="symbol" />
                  </button>
                </th>
                <th className="text-right p-3 sm:p-4">
                  <button
                    onClick={() => handleSort('price')}
                    className="flex items-center gap-1 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors ml-auto"
                  >
                    ราคา <SortIcon field="price" />
                  </button>
                </th>
                <th className="text-right p-3 sm:p-4">
                  <button
                    onClick={() => handleSort('changePercent')}
                    className="flex items-center gap-1 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors ml-auto"
                  >
                    เปลี่ยนแปลง <SortIcon field="changePercent" />
                  </button>
                </th>
                <th className="text-right p-3 sm:p-4 hidden sm:table-cell">
                  <button
                    onClick={() => handleSort('volume')}
                    className="flex items-center gap-1 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors ml-auto"
                  >
                    Volume <SortIcon field="volume" />
                  </button>
                </th>
                <th className="text-center p-3 sm:p-4 hidden md:table-cell">
                  <span className="text-xs font-medium text-brand-text-secondary">Sector</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((stock) => {
                const currency = getCurrency(stock.symbol, stock.currency)
                const exchange = getExchange(stock.symbol, stock.exchange)

                return (
                  <tr
                    key={stock.symbol}
                    className="border-b border-brand-border/50 hover:bg-brand-bg-secondary/50 transition-colors"
                  >
                  <td className="p-3 sm:p-4">
                    <Link href={`/stock/${encodeURIComponent(stock.symbol)}`} className="group">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-brand-text-primary group-hover:text-brand-primary transition-colors">
                          {stock.symbol.replace('.BK', '')}
                        </p>
                        <Badge variant="info" size="sm">{exchange}</Badge>
                      </div>
                      <p className="text-xs text-brand-text-secondary truncate max-w-[180px]">{stock.name}</p>
                    </Link>
                  </td>
                  <td className="p-3 sm:p-4 text-right">
                    <span className="text-sm font-mono-nums font-semibold text-brand-text-primary">
                      {formatCurrency(stock.price, currency)}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {stock.changePercent >= 0
                        ? <TrendingUp size={14} className={getPriceColor(stock.changePercent)} />
                        : <TrendingDown size={14} className={getPriceColor(stock.changePercent)} />
                      }
                      <span className={cn('text-sm font-mono-nums font-semibold', getPriceColor(stock.changePercent))}>
                        {formatPercent(stock.changePercent)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 sm:p-4 text-right hidden sm:table-cell">
                    <span className="text-sm font-mono-nums text-brand-text-secondary">
                      {formatVolume(stock.volume)}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-center hidden md:table-cell">
                    {stock.sector ? (
                      <Badge variant="outline" size="sm">{stock.sector}</Badge>
                    ) : (
                      <span className="text-xs text-brand-text-secondary">—</span>
                    )}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && (
          <div className="p-8 text-center text-brand-text-secondary">
            ไม่พบข้อมูลหุ้น
          </div>
        )}
      </Card>
    </div>
  )
}
