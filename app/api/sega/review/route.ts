import { NextRequest } from 'next/server'
import { z } from 'zod'
import { approveSegaProposal, type SegaApprovalContext } from '@/lib/agent-loop/sega/approval'
import { buildSegaProposalFromReviewInput, buildSegaReviewInputFromAgentLoop, buildSegaReviewInputFromMiroFish } from '@/lib/agent-loop/sega/adapters'
import { segaProposalSchema } from '@/lib/agent-loop/sega/schema'
import { renderSegaStorycraft } from '@/lib/agent-loop/sega/storycraft'
import { SEGA_PERSONA_REGISTRY } from '@/lib/agent-loop/sega/persona'
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/response'
import { requireFeature } from '@/lib/subscription/server'

const segaReviewRequestSchema = z.object({
  proposal: segaProposalSchema.optional(),
  agentLoopResult: z.any().optional(),
  miroFishResult: z.any().optional(),
  miroFishDebateResult: z.any().optional(),
  symbols: z.array(z.string()).min(1).max(8).optional(),
  timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']).optional(),
  scenario: z.string().max(500).optional(),
  thesis: z.string().min(1).max(1000).optional(),
  downside: z.object({
    description: z.string().max(500).optional(),
    maxLossPercent: z.number().min(0).max(100).optional(),
    maxLossAmount: z.number().nonnegative().optional(),
  }).optional(),
  exitPlan: z.object({
    invalidation: z.string().max(500).optional(),
    stopCondition: z.string().max(500).optional(),
    reviewAt: z.array(z.string()).max(5).optional(),
  }).optional(),
  allowDemo: z.boolean().optional(),
})

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const startedAt = Date.now()

  try {
    const { userId } = await requireFeature('agentLoop')
    const body = await request.json()
    const parse = segaReviewRequestSchema.safeParse(body)

    if (!parse.success) {
      return apiBadRequest(parse.error.issues.map((issue) => issue.message).join('; '))
    }

    const miroFishResult = parse.data.miroFishResult ?? parse.data.miroFishDebateResult
    const context = parse.data.agentLoopResult ?? miroFishResult
    const proposal = parse.data.proposal ?? buildProposalFromContext(context, parse.data)

    if (!proposal) {
      return apiBadRequest('ต้องมี proposal หรือ agentLoopResult/miroFishResult')
    }

    if (!context) {
      return apiBadRequest('ต้องมี agentLoopResult หรือ miroFishResult เพื่อใช้เป็น review context')
    }

    const approval = approveSegaProposal(proposal, context as SegaApprovalContext)
    const story = renderSegaStorycraft({
      ...approval,
      proposalId: proposal.proposalId,
      title: proposal.title,
      protectedAgainst: [...SEGA_PERSONA_REGISTRY.failureModes],
      nextCheckpoint: approval.mitigations[0] ?? approval.monitoringTriggers[0],
    })

    const aiResponse = JSON.stringify({
      decision: approval.decision,
      riskScore: approval.riskScore,
      reasons: approval.reasons,
      mitigations: approval.mitigations,
    })

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      feature: 'sega_review',
      prompt: JSON.stringify({ proposal, contextType: miroFishResult ? 'mirofish_debate' : 'agent_loop' }),
      response: aiResponse,
      prompt_length: JSON.stringify(proposal).length,
      response_length: aiResponse.length,
      latency_ms: Date.now() - startedAt,
    })

    return apiSuccess({ approval, story, persona: SEGA_PERSONA_REGISTRY })
  } catch (error) {
    const message = (error as Error).message
    if (message === 'UNAUTHORIZED') return apiError('กรุณาเข้าสู่ระบบก่อนใช้ SEGA Review', 401)
    if (message === 'UPGRADE_REQUIRED') return apiError('SEGA Review ต้องการแผน Pro ขึ้นไป', 403)
    return apiError(message)
  }
}

function buildProposalFromContext(context: unknown, request: z.infer<typeof segaReviewRequestSchema>) {
  if (context && 'agents' in (context as { agents?: unknown })) {
    const input = buildSegaReviewInputFromAgentLoop(context as any, {
      symbols: request.symbols,
      timeframe: request.timeframe,
      scenario: request.scenario,
      thesis: request.thesis,
      downside: request.downside,
      exitPlan: request.exitPlan,
      allowDemo: request.allowDemo,
    })
    return buildSegaProposalFromReviewInput(input)
  }

  if (context && 'seed' in (context as { seed?: unknown })) {
    const input = buildSegaReviewInputFromMiroFish(context as any, {
      symbols: request.symbols,
      timeframe: request.timeframe,
      scenario: request.scenario,
      thesis: request.thesis,
      downside: request.downside,
      exitPlan: request.exitPlan,
      allowDemo: request.allowDemo,
    })
    return buildSegaProposalFromReviewInput(input)
  }

  return undefined
}
