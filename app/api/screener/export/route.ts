import { z } from 'zod'
import { NextResponse } from 'next/server'
import { fetchSiamchartStockRows } from '@/lib/market-data/providers/set-provider'
import { normalizeSiamchartStockRows, screenStocks } from '@/lib/screener/utils'
import { requireFeature } from '@/lib/subscription/server'

const screenerFiltersSchema = z.object({
  query: z.string().optional(),
  market: z.string().optional(),
  sector: z.string().optional(),
  minMarketCap: z.number().optional(),
  maxMarketCap: z.number().optional(),
  minPe: z.number().optional(),
  maxPe: z.number().optional(),
  minVolume: z.number().optional(),
  maxVolume: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minChange: z.number().optional(),
  maxChange: z.number().optional(),
  minDividendYield: z.number().optional(),
  sortBy: z.enum(['volume', 'change', 'marketCap', 'pe', 'dividendYield', 'price']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

function csvEscape(value: unknown) {
  const text = value === undefined || value === null ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await requireFeature('exportCsv')

    const body = await request.json().catch(() => ({}))
    const parsed = screenerFiltersSchema.parse(body?.filters ?? {})
    const rows = await fetchSiamchartStockRows()
    const universe = normalizeSiamchartStockRows(rows)
    const stocks = screenStocks(universe, parsed)
    const headers = [
      'symbol',
      'name',
      'exchange',
      'sector',
      'price',
      'change',
      'changePercent',
      'volume',
      'marketCap',
      'pe',
      'pb',
      'de',
      'dividendYield',
      'freeFloat',
    ]
    const csv = [
      headers.join(','),
      ...stocks.map((stock) => headers.map((header) => csvEscape(stock[header as keyof typeof stock])).join(',')),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="stockguru-screener-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.csv"`,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid screener filters' }, { status: 400 })
    }
    const isUpgrade = error instanceof Error && error.message === 'UPGRADE_REQUIRED'
    const isUnauthorized = error instanceof Error && error.message === 'UNAUTHORIZED'
    const message = isUpgrade ? 'Export CSV requires a paid plan' : isUnauthorized ? 'กรุณาเข้าสู่ระบบก่อน export CSV' : 'Export failed'
    return NextResponse.json({ success: false, error: message }, { status: isUpgrade ? 403 : isUnauthorized ? 401 : 503 })
  }
}
