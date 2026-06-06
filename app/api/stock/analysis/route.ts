import { NextRequest } from 'next/server'
import { getQuote, getHistory } from '@/lib/services/stock-service'
import { analyzeStock } from '@/lib/services/ai-service'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'

/**
 * GET /api/stock/analysis?symbol=AAPL
 * Generate AI-powered stock analysis using DeepSeek
 */
export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')

  if (!symbol || symbol.trim().length === 0) {
    return apiBadRequest('Missing required parameter: symbol')
  }

  const upperSymbol = symbol.trim().toUpperCase()

  try {
    // Fetch quote and history in parallel
    const [quote, candles] = await Promise.all([
      getQuote(upperSymbol),
      getHistory(upperSymbol, '3M'),
    ])

    if (!candles.length) {
      return apiBadRequest(`No historical data available for ${upperSymbol}`)
    }

    const analysis = await analyzeStock(upperSymbol, quote, candles)
    return apiSuccess(analysis)
  } catch (error) {
    return apiError((error as Error).message)
  }
}
