import { NextRequest } from 'next/server'
import { getTrending } from '@/lib/services/stock-service'
import { apiSuccess, apiError } from '@/lib/api/response'
import { rateLimit } from '@/lib/middleware/rate-limit'

/**
 * GET /api/stock/trending
 * Get trending / popular stocks
 */
export async function GET(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const rate = rateLimit(`trending:${ip}`, { limit: 120, windowMs: 60_000 })
  if (!rate.allowed) {
    return apiError('Rate limit exceeded', 429)
  }

  try {
    const result = await getTrending()
    return apiSuccess(result.data, { meta: result.meta, cached: result.meta.source === 'cache' })
  } catch (error) {
    return apiError((error as Error).message)
  }
}
