import { NextRequest } from 'next/server'
import { miroFishSwarmRequestSchema } from '@/lib/mirofish-swarm/schema'
import { runMiroFishSwarmSimulation } from '@/lib/mirofish-swarm/simulator'
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
    const parse = miroFishSwarmRequestSchema.safeParse(body)

    if (!parse.success) {
      return apiBadRequest(parse.error.issues.map((issue) => issue.message).join('; '))
    }

    const result = runMiroFishSwarmSimulation(parse.data)
    userPrompt = `${result.event.title} ${result.event.description}`
    aiResponse = JSON.stringify({
      sentiment: result.sentiment,
      scenarios: result.scenarios.map((scenario) => scenario.label),
      risks: result.risks,
      suggestedChecks: result.suggestedChecks,
    })

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      feature: 'mirofish_swarm_simulation',
      prompt: userPrompt,
      response: aiResponse,
      prompt_length: userPrompt.length,
      response_length: aiResponse.length,
      latency_ms: Date.now() - startedAt,
    })

    return apiSuccess(result)
  } catch (error) {
    const message = (error as Error).message
    if (message === 'UNAUTHORIZED') return apiError('กรุณาเข้าสู่ระบบก่อนใช้ MiroFish Swarm', 401)
    if (message === 'UPGRADE_REQUIRED') return apiError('MiroFish Swarm ต้องการแผน Pro ขึ้นไป', 403)
    return apiError(message)
  }
}
