import { getTrending } from '@/lib/services/stock-service'
import { apiSuccess, apiError } from '@/lib/api/response'

/**
 * GET /api/stock/trending
 * Get trending / popular stocks
 */
export async function GET() {
  try {
    const trending = await getTrending()
    return apiSuccess(trending)
  } catch (error) {
    return apiError((error as Error).message)
  }
}
