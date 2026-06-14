import type { AgentResult } from '../types'
import type { DebateSeed } from '../mirofish/types'
import type { DebateReport } from '../mirofish/reporter'
import { buildDeepSeekReporterDraft } from './deepseek-provider'
import { buildMimoReporterDraft } from './mimo-provider'
import { buildOpenRouterReporterDraft } from './openrouter-provider'
import { getReporterModel, getWarRoomModelPlan, type WarRoomModelSelection } from './model-router'

export { getWarRoomModelPlan }

export async function buildWarRoomReporterDraft(
  seed: DebateSeed,
  agents: AgentResult[]
): Promise<DebateReport | null> {
  const selected = getReporterModel(seed)

  if (selected.provider === 'mimo') {
    return buildMimoReporterDraft(seed, agents)
  }

  if (selected.provider === 'deepseek') {
    return buildDeepSeekReporterDraft(seed, agents)
  }

  if (selected.provider === 'openrouter') {
    return buildOpenRouterReporterDraft(seed, agents, selected.id)
  }

  return null
}

export function getWarRoomReporterModel(seed: DebateSeed): WarRoomModelSelection {
  const plan = getWarRoomModelPlan(seed)
  return plan.find((item) => item.phase === 'reporter') ?? plan[plan.length - 1]
}
