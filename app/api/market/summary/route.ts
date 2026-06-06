import { generateMarketSummary } from '@/lib/services/ai-service'
import { apiSuccess, apiError } from '@/lib/api/response'
import { newsCache } from '@/lib/cache'

/**
 * GET /api/market/summary
 * AI-generated market summary
 */
export async function GET() {
  const cacheKey = 'market:summary'
  const cached = newsCache.get<string>(cacheKey)
  if (cached) return apiSuccess({ summary: cached.data }, true)

  try {
    const summary = await generateMarketSummary()
    newsCache.set(cacheKey, summary)
    return apiSuccess({ summary })
  } catch (error) {
    return apiError((error as Error).message)
  }
}
