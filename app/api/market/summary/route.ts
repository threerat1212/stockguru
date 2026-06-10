import { NextResponse } from 'next/server'
import { activeMarketDataProvider } from '@/lib/market-data/client'
import { fetchSiamchartStockRows } from '@/lib/market-data/providers/set-provider'
import type { SiamchartStockRow } from '@/lib/market-data/providers/set-provider'
import type { MarketBreadth, MarketMover, MarketSectorSummary, MarketSummary, TrendingStock } from '@/types/stock'

function summarizeBreadth(rows: SiamchartStockRow[]): MarketBreadth {
  const total = rows.filter((row) => row.close > 0).length
  const advancing = rows.filter((row) => row.changePercent > 0).length
  const declining = rows.filter((row) => row.changePercent < 0).length
  return {
    advancing,
    declining,
    unchanged: Math.max(total - advancing - declining, 0),
    total,
    volume: rows.reduce((sum, row) => sum + (row.volume ?? 0), 0),
    value: rows.reduce((sum, row) => sum + (row.value ?? 0), 0),
  }
}

function summarizeSectors(rows: SiamchartStockRow[]): MarketSectorSummary[] {
  const bySector = new Map<string, SiamchartStockRow[]>()

  for (const row of rows) {
    const sector = row.sector ?? 'ไม่ระบุกลุ่ม'
    const bucket = bySector.get(sector) ?? []
    bucket.push(row)
    bySector.set(sector, bucket)
  }

  return Array.from(bySector.entries())
    .map(([sector, sectorRows]) => {
      const activeRows = sectorRows.filter((row) => row.close > 0)
      const advancing = activeRows.filter((row) => row.changePercent > 0).length
      const declining = activeRows.filter((row) => row.changePercent < 0).length
      const avgChangePercent = activeRows.length
        ? activeRows.reduce((sum, row) => sum + row.changePercent, 0) / activeRows.length
        : 0
      const avgChange = activeRows.length
        ? activeRows.reduce((sum, row) => sum + row.close * (row.changePercent / 100), 0) / activeRows.length
        : 0
      const top = activeRows.slice().sort((a, b) => b.changePercent - a.changePercent)[0]

      return {
        sector,
        count: activeRows.length,
        advancing,
        declining,
        avgChangePercent,
        avgChange,
        topSymbol: top?.symbol ?? '—',
        topChangePercent: top?.changePercent ?? 0,
      }
    })
    .sort((a, b) => b.avgChangePercent - a.avgChangePercent)
}

function summarizeMovers(rows: TrendingStock[]) {
  const activeRows = rows
    .filter((row) => row.price > 0)
    .map((row) => ({
      symbol: row.symbol,
      name: row.name,
      sector: row.sector,
      exchange: row.exchange,
      price: row.price,
      change: row.change,
      changePercent: row.changePercent,
      volume: row.volume,
    }))
    .filter((row: MarketMover) => Number.isFinite(row.price) && Number.isFinite(row.changePercent))

  const gainers = activeRows.slice().sort((a, b) => b.changePercent - a.changePercent).slice(0, 10)
  const losers = activeRows.slice().sort((a, b) => a.changePercent - b.changePercent).slice(0, 10)
  const active = activeRows.slice().sort((a, b) => b.volume - a.volume).slice(0, 10)

  return { gainers, losers, active }
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [indicesResult, trendingResult, stockRows] = await Promise.all([
      activeMarketDataProvider.getMarketIndices(),
      activeMarketDataProvider.getTrending(),
      fetchSiamchartStockRows(),
    ])

    const indices = indicesResult.data
    const trending = trendingResult.data
    const breadth = summarizeBreadth(stockRows)
    const sectors = summarizeSectors(stockRows)
    const movers = summarizeMovers(trending)

    const summary: MarketSummary = {
      indices,
      breadth,
      sectors,
      movers,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: summary,
      meta: {
        indices: indicesResult.meta,
        trending: trendingResult.meta,
        stocks: { source: 'siamchart', provider: 'SiamChart', freshness: 'live' },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลตลาดได้'
    return NextResponse.json({ success: false, error: message }, { status: 503 })
  }
}
