import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getQuote } from '@/lib/services/stock-service'
import { chatCompletion } from '@/lib/services/ai-service'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/middleware/rate-limit'
import type { ChatMessage } from '@/types/stock'

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(4000),
    })
  ).min(1).max(20),
  symbol: z.string().min(1).max(20).optional(),
})

/**
 * POST /api/chat
 * AI chat with StockGuru (MiMo-powered)
 *
 * Body: { messages: { role: 'user'|'assistant', content: string }[], symbol?: string }
 */
export async function POST(request: NextRequest) {
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const rate = rateLimit(`chat:${ip}`, { limit: 30, windowMs: 60_000 })
  if (!rate.allowed) {
    return apiError('Rate limit exceeded', 429)
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return apiError('กรุณาเข้าสู่ระบบก่อนใช้ AI', 401)
  }

  if (!process.env.MIMO_API_KEY) {
    return apiError('AI provider is not configured. Please set MIMO_API_KEY.', 503)
  }

  const startedAt = Date.now()
  let userPrompt = ''
  let aiResponse = ''
  let loggedError: string | null = null

  try {
    const body = await request.json()
    const parse = chatSchema.safeParse(body)

    if (!parse.success) {
      return apiBadRequest(parse.error.issues.map((i) => i.message).join('; '))
    }

    const { messages, symbol } = parse.data

    const validMessages: ChatMessage[] = messages.map((m, i) => ({
      id: `msg-${i}`,
      role: m.role,
      content: m.content,
      timestamp: Date.now(),
    }))

    userPrompt = validMessages.filter((m) => m.role === 'user').slice(-1)[0]?.content ?? ''

    const { data: subData } = await supabase
      .from('subscriptions')
      .select('plan,status')
      .eq('user_id', user.id)
      .single()

    const effectivePlan = subData?.status === 'active' ? (subData.plan as string) : 'free'
    const monthlyLimit = effectivePlan === 'trader' ? 500 : effectivePlan === 'pro' || effectivePlan === 'founding_pro' ? 300 : 90
    const dailyLimit = effectivePlan === 'free' ? 3 : 9999

    const { data: usageData } = await supabase
      .from('usage_counters')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const today = new Date().toISOString().slice(0, 10)
    const monthStart = today.slice(0, 8) + '01'
    const resetDay = usageData?.ai_questions_reset_date !== today
    const resetMonth = usageData?.ai_questions_reset_month !== monthStart
    const aiToday = resetDay ? 0 : (usageData?.ai_questions_today ?? 0)
    const aiMonth = resetMonth ? 0 : (usageData?.ai_questions_month ?? 0)

    if (aiToday >= dailyLimit || aiMonth >= monthlyLimit) {
      return apiError('AI usage limit reached. Please upgrade your plan.', 429)
    }

    // Get optional stock context
    let context: { symbol?: string; quote?: Awaited<ReturnType<typeof getQuote>> } | undefined
    if (symbol) {
      try {
        const quote = await getQuote(symbol.toUpperCase())
        context = { symbol: symbol.toUpperCase(), quote }
      } catch {
        // Quote fetch failed; continue without context
        context = { symbol: symbol.toUpperCase() }
      }
    }

    aiResponse = await chatCompletion(validMessages, context)

    await supabase.from('usage_counters').upsert({
      user_id: user.id,
      ai_questions_today: aiToday + 1,
      ai_questions_month: aiMonth + 1,
      ai_questions_reset_date: today,
      ai_questions_reset_month: monthStart,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'chat',
      prompt: userPrompt,
      response: aiResponse,
      prompt_length: userPrompt.length,
      response_length: aiResponse.length,
      latency_ms: Date.now() - startedAt,
    })

    return apiSuccess({
      response: aiResponse,
      usage: {
        plan: effectivePlan,
        aiQuestionsToday: aiToday + 1,
        aiQuestionsMonth: aiMonth + 1,
        dailyLimit,
        monthlyLimit,
      },
    })
  } catch (error) {
    loggedError = (error as Error).message
    if (userPrompt) {
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        feature: 'chat',
        prompt: userPrompt,
        response: aiResponse || null,
        prompt_length: userPrompt.length,
        response_length: aiResponse.length,
        latency_ms: Date.now() - startedAt,
        error: loggedError,
      })
    }
    return apiError(loggedError)
  }
}
