import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getHistory } from '@/lib/services/stock-service'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'
import { rateLimit } from '@/lib/middleware/rate-limit'
import type { Timeframe } from '@/types/stock'

const VALID_TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']

const querySchema = z.object({
  symbol: z.string().min(1).max(20),
  timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']).default('3M'),
})

/**
 * GET /api/stock/history?symbol=AAPL&timeframe=3M
 * Fetch OHLCV historical data for charts
 */
export async function GET(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const rate = rateLimit(`history:${ip}`, { limit: 60, windowMs: 60_000 })
  if (!rate.allowed) {
    return apiError('Rate limit exceeded', 429)
  }

  const symbol = request.nextUrl.searchParams.get('symbol')
  const timeframe = (request.nextUrl.searchParams.get('timeframe') || '3M') as Timeframe

  const parse = querySchema.safeParse({ symbol, timeframe })
  if (!parse.success) {
    return apiBadRequest('Missing or invalid parameters')
  }

  try {
    const candles = await getHistory(parse.data.symbol.trim().toUpperCase(), parse.data.timeframe)
    return apiSuccess(candles)
  } catch (error) {
    return apiError((error as Error).message)
  }
}
