import { NextRequest } from 'next/server'
import { z } from 'zod'
import { searchStocksWithMeta } from '@/lib/services/stock-service'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'
import { rateLimit } from '@/lib/middleware/rate-limit'

const querySchema = z.object({
  q: z.string().min(1).max(100),
})

/**
 * GET /api/stock/search?q=apple
 * Search stocks by keyword
 */
export async function GET(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const rate = rateLimit(`search:${ip}`, { limit: 60, windowMs: 60_000 })
  if (!rate.allowed) {
    return apiError('Rate limit exceeded', 429)
  }

  const query = request.nextUrl.searchParams.get('q')

  const parse = querySchema.safeParse({ q: query })
  if (!parse.success) {
    return apiBadRequest('Missing or invalid parameter: q (min 1 character)')
  }

  try {
    const result = await searchStocksWithMeta(parse.data.q.trim())
    return apiSuccess(result.data, { meta: result.meta, cached: result.meta.source === 'cache' })
  } catch (error) {
    return apiError((error as Error).message)
  }
}
