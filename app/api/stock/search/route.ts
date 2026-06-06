import { NextRequest } from 'next/server'
import { searchStocks } from '@/lib/services/stock-service'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'

/**
 * GET /api/stock/search?q=apple
 * Search stocks by keyword
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')

  if (!query || query.trim().length < 1) {
    return apiBadRequest('Missing required parameter: q (min 1 character)')
  }

  try {
    const results = await searchStocks(query.trim())
    return apiSuccess(results)
  } catch (error) {
    return apiError((error as Error).message)
  }
}
