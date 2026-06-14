import { NextRequest } from 'next/server'
import { agentLoopRequestSchema } from '@/lib/agent-loop/schema'
import { runAgentLoop } from '@/lib/agent-loop/orchestrator'
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'
import { requireFeature } from '@/lib/subscription/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  let userPrompt = ''
  let aiResponse = ''

  try {
    const { userId } = await requireFeature('agentLoop')
    const body = await request.json()
    const parse = agentLoopRequestSchema.safeParse(body)

    if (!parse.success) {
      return apiBadRequest(parse.error.issues.map((issue) => issue.message).join('; '))
    }

    const result = await runAgentLoop(parse.data)
    userPrompt = result.scenario || `Agent loop: ${result.symbols.join(', ')}`
    aiResponse = JSON.stringify({
      summary: result.summary,
      thesis: result.thesis,
      risks: result.risks,
      suggestedChecks: result.suggestedChecks,
      confidence: result.confidence,
    })

    const supabase = createClient()
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      feature: 'agent_loop',
      prompt: userPrompt,
      response: aiResponse,
      prompt_length: userPrompt.length,
      response_length: aiResponse.length,
      latency_ms: Date.now() - startedAt,
    })

    return apiSuccess(result)
  } catch (error) {
    const message = (error as Error).message
    if (message === 'UNAUTHORIZED') return apiError('กรุณาเข้าสู่ระบบก่อนใช้ Agent Looping', 401)
    if (message === 'UPGRADE_REQUIRED') return apiError('Agent Looping ต้องการแผน Pro ขึ้นไป', 403)
    return apiError(message)
  }
}
