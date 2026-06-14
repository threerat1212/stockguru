import { NextRequest } from 'next/server'
import { warRoomDebateRequestSchema } from '@/lib/agent-loop/mirofish/schema'
import { runMiroFishDebate } from '@/lib/agent-loop/mirofish/debate'
import { persistWarRoomDebate } from '@/lib/agent-loop/mirofish/persistence'
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/response'
import { requireFeature } from '@/lib/subscription/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  let userPrompt = ''
  let aiResponse = ''

  try {
    const { userId } = await requireFeature('agentLoop')
    const body = await request.json()
    const parse = warRoomDebateRequestSchema.safeParse(body)

    if (!parse.success) {
      return apiBadRequest(parse.error.issues.map((issue) => issue.message).join('; '))
    }

    const result = await runMiroFishDebate(parse.data)
    userPrompt = result.seed.question
    aiResponse = JSON.stringify({
      summary: result.summary,
      thesis: result.thesis,
      risks: result.risks,
      suggestedChecks: result.suggestedChecks,
      confidence: result.confidence,
    })

    await persistWarRoomDebate({ userId, result })

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      feature: 'war_room_debate',
      prompt: userPrompt,
      response: aiResponse,
      prompt_length: userPrompt.length,
      response_length: aiResponse.length,
      latency_ms: Date.now() - startedAt,
    })

    return apiSuccess(result)
  } catch (error) {
    const message = (error as Error).message
    if (message === 'UNAUTHORIZED') return apiError('กรุณาเข้าสู่ระบบก่อนใช้ MiroFish Debate', 401)
    if (message === 'UPGRADE_REQUIRED') return apiError('MiroFish Debate ต้องการแผน Pro ขึ้นไป', 403)
    if (message === 'VERIFIER_BLOCKED') return apiError('MiroFish Debate ถูก block โดย safety verifier', 422)
    return apiError(message)
  }
}
