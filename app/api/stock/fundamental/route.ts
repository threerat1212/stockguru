import { NextRequest } from 'next/server'
import { getFundamentalData } from '@/lib/services/fundamental-service'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'

/**
 * GET /api/stock/fundamental?symbol=AAPL
 * Returns fundamental data: P/E, EPS, ROE, debt/equity, revenue,
 * net income, dividend yield, book value, sector, industry, etc.
 */
export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')

  if (!symbol || symbol.trim().length === 0) {
    return apiBadRequest('Missing required parameter: symbol')
  }

  try {
    const result = await getFundamentalData(symbol.trim().toUpperCase())
    return apiSuccess(result.data, { meta: result.meta })
  } catch (error) {
    return apiError((error as Error).message)
  }
}
