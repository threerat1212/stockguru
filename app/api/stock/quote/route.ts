import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getQuote } from '@/lib/services/stock-service'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'
import { rateLimit } from '@/lib/middleware/rate-limit'

const querySchema = z.object({
  symbol: z.string().min(1).max(20),
})

/**
 * GET /api/stock/quote?symbol=AAPL
 * Fetch real-time quote for a single stock
 */
export async function GET(request: NextRequest) {
  // Rate limit by IP
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const rate = rateLimit(`quote:${ip}`, { limit: 120, windowMs: 60_000 })
  if (!rate.allowed) {
    return apiError('Rate limit exceeded', 429)
  }

  const symbol = request.nextUrl.searchParams.get('symbol')

  const parse = querySchema.safeParse({ symbol })
  if (!parse.success) {
    return apiBadRequest('Missing or invalid parameter: symbol')
  }

  try {
    const result = await getQuote(parse.data.symbol.trim().toUpperCase())
    return apiSuccess(result.data, { meta: result.meta, cached: result.meta.source === 'cache' })
  } catch (error) {
    return apiError((error as Error).message)
  }
}
