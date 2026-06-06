import { getMarketIndices } from '@/lib/services/stock-service'
import { apiSuccess, apiError } from '@/lib/api/response'

/**
 * GET /api/market
 * Get market indices overview (S&P500, Dow, NASDAQ, Russell, SET)
 */
export async function GET() {
  try {
    const indices = await getMarketIndices()
    return apiSuccess(indices)
  } catch (error) {
    return apiError((error as Error).message)
  }
}
