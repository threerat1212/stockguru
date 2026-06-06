import { NextRequest } from 'next/server'
import { getQuote } from '@/lib/services/stock-service'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'

/**
 * GET /api/stock/quote?symbol=AAPL
 * Fetch real-time quote for a single stock
 */
export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')

  if (!symbol || symbol.trim().length === 0) {
    return apiBadRequest('Missing required parameter: symbol')
  }

  try {
    const quote = await getQuote(symbol.trim().toUpperCase())
    return apiSuccess(quote)
  } catch (error) {
    return apiError((error as Error).message)
  }
}
