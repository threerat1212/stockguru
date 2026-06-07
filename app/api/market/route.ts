import { getMarketIndices } from '@/lib/services/stock-service'
import { apiSuccess, apiError } from '@/lib/api/response'

/**
 * GET /api/market
 * Get market indices overview (S&P500, Dow, NASDAQ, Russell, SET)
 */
export async function GET() {
  try {
    const result = await getMarketIndices()
    return apiSuccess(result.data, { meta: result.meta, cached: result.meta.source === 'cache' })
  } catch (error) {
    return apiError((error as Error).message)
  }
}
