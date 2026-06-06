import { NextRequest } from 'next/server'
import { getHistory } from '@/lib/services/stock-service'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'
import type { Timeframe } from '@/types/stock'

const VALID_TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']

/**
 * GET /api/stock/history?symbol=AAPL&timeframe=3M
 * Fetch OHLCV historical data for charts
 */
export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')
  const timeframe = (request.nextUrl.searchParams.get('timeframe') || '3M') as Timeframe

  if (!symbol || symbol.trim().length === 0) {
    return apiBadRequest('Missing required parameter: symbol')
  }

  if (!VALID_TIMEFRAMES.includes(timeframe)) {
    return apiBadRequest(`Invalid timeframe. Must be one of: ${VALID_TIMEFRAMES.join(', ')}`)
  }

  try {
    const candles = await getHistory(symbol.trim().toUpperCase(), timeframe)
    return apiSuccess(candles)
  } catch (error) {
    return apiError((error as Error).message)
  }
}
