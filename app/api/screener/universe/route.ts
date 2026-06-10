import { NextResponse } from 'next/server'
import { fetchSiamchartStockRows } from '@/lib/market-data/providers/set-provider'
import { normalizeSiamchartStockRows, parseScreenerFilters, screenStocks } from '@/lib/screener/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = parseScreenerFilters(searchParams)
    const rows = await fetchSiamchartStockRows()
    const universe = normalizeSiamchartStockRows(rows)
    const stocks = screenStocks(universe, filters)

    return NextResponse.json({
      success: true,
      data: {
        stocks,
        total: universe.length,
        filtered: stocks.length,
      },
      meta: {
        source: 'siamchart',
        provider: 'SiamChart',
        freshness: 'live',
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ไม่สามารถโหลดรายการหุ้นทั้งหมดได้'
    return NextResponse.json({ success: false, error: message }, { status: 503 })
  }
}
