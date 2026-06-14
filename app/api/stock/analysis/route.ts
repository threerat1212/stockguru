import { NextRequest } from 'next/server'
import { getQuote, getHistory } from '@/lib/services/stock-service'
import { analyzeStock } from '@/lib/services/ai-service'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'
import { effectivePlan } from '@/lib/subscription/plan-utils'
import { getLifetimePlanForEmail } from '@/lib/subscription/lifetime'
import { rateLimit } from '@/lib/middleware/rate-limit'

const ANALYSIS_MONTHLY_LIMIT: Record<string, number> = {
  free: 5,
  pro: 100,
  founding_pro: 100,
  trader: 999999,
}

/**
 * GET /api/stock/analysis?symbol=AAPL
 * AI stock analysis — requires auth and counts toward monthly analysis quota
 */
export async function GET(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const rate = rateLimit(`analysis:${ip}`, { limit: 20, windowMs: 60_000 })
  if (!rate.allowed) {
    return apiError('Rate limit exceeded', 429)
  }

  const symbol = request.nextUrl.searchParams.get('symbol')

  if (!symbol || symbol.trim().length === 0) {
    return apiBadRequest('Missing required parameter: symbol')
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return apiError('กรุณาเข้าสู่ระบบก่อนใช้ AI วิเคราะห์', 401)
  }

  const { data: subData } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single()

  const plan = getLifetimePlanForEmail(user.email) ?? effectivePlan(subData?.plan, subData?.status)
  const monthlyLimit = ANALYSIS_MONTHLY_LIMIT[plan] ?? 5

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('feature', 'analysis')
    .gte('created_at', monthStart.toISOString())

  if ((count ?? 0) >= monthlyLimit) {
    return apiError('ถึงขีดจำกัด AI วิเคราะห์รายเดือนแล้ว กรุณาอัพเกรดแผน', 429)
  }

  const upperSymbol = symbol.trim().toUpperCase()

  try {
    const [quoteResult, historyResult] = await Promise.all([
      getQuote(upperSymbol),
      getHistory(upperSymbol, '3M'),
    ])

    const candles = historyResult.data
    if (!candles.length) {
      return apiBadRequest(`No historical data available for ${upperSymbol}`)
    }

    const analysis = await analyzeStock(upperSymbol, quoteResult.data, candles)

    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'analysis',
      prompt: upperSymbol,
      response: analysis.summary?.slice(0, 500) ?? '',
    })

    return apiSuccess(analysis, { meta: quoteResult.meta })
  } catch (error) {
    return apiError((error as Error).message)
  }
}
