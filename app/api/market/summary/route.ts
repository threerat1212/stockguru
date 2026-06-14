import { NextResponse } from 'next/server'
import { activeMarketDataProvider } from '@/lib/market-data/client'
import { fetchSiamchartStockRows } from '@/lib/market-data/providers/set-provider'
import type { MarketDataMeta } from '@/lib/market-data/types'
import type { SiamchartStockRow } from '@/lib/market-data/providers/set-provider'
import {
  addMetaWarning,
  buildMarketSummary,
  createMarketSummaryMeta,
} from './summarize'

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
    const updatedAt = Date.now()
    const baseStocksMeta: MarketDataMeta = { source: 'siamchart', isDemo: false, provider: 'SiamChart', updatedAt }
    const stocksMeta = stockRows.length
      ? baseStocksMeta
      : addMetaWarning(baseStocksMeta, { type: 'missing', message: 'ไม่พบข้อมูลหุ้น SET/mai', field: 'stocks' })
    const summary = buildMarketSummary({ indices, trending, stockRows, updatedAt: new Date(updatedAt).toISOString() })
    const meta = createMarketSummaryMeta({
      indices: indicesResult.meta,
      trending: trendingResult.meta,
      stocks: stocksMeta,
      indicesCount: indices.length,
      trendingCount: trending.length,
      stockCount: stockRows.length,
      breadthTotal: summary.breadth.total,
      now: updatedAt,
    })

    return NextResponse.json({
      success: true,
      data: summary,
      meta,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลตลาดได้'
    return NextResponse.json({ success: false, error: message }, { status: 503 })
  }
}
