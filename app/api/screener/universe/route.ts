import { NextResponse } from 'next/server'
import { fetchSiamchartStockRows } from '@/lib/market-data/providers/set-provider'
import { normalizeSiamchartStockRows, parseScreenerFilters, screenStocks } from '@/lib/screener/utils'
import { requireFeature } from '@/lib/subscription/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireFeature('advancedScreener')

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
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, error: 'กรุณาเข้าสู่ระบบก่อนใช้ Advanced Screener' }, { status: 401 })
    }
    if (message === 'UPGRADE_REQUIRED') {
      return NextResponse.json({ success: false, error: 'Advanced Screener ต้องการแผน Pro ขึ้นไป' }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: message }, { status: 503 })
  }
}
