import type { AgentLoopRunResult, AgentEvidence } from '../types'
import type { MiroFishDebateRunResult } from '../mirofish/types'
import type { SegaProposal } from './schema'
import type { SegaReviewInput } from './types'

export function buildSegaReviewInputFromAgentLoop(result: AgentLoopRunResult, overrides: Partial<SegaReviewInput> = {}): SegaReviewInput {
  return {
    ...overrides,
    contextId: result.runId,
    contextType: overrides.contextType ?? 'agent_loop',
    symbols: result.symbols,
    timeframe: result.timeframe,
    scenario: result.scenario,
    thesis: result.thesis,
    evidence: collectEvidence(result.agents.flatMap((agent) => agent.evidence)),
    risks: result.risks,
    assumptions: extractAssumptions(result),
    suggestedChecks: result.suggestedChecks,
    confidence: result.confidence,
    verifierStatus: result.verifier.status,
    isDemo: result.isDemo,
  }
}

export function buildSegaReviewInputFromMiroFish(result: MiroFishDebateRunResult, overrides: Partial<SegaReviewInput> = {}): SegaReviewInput {
  return {
    ...overrides,
    contextId: result.runId,
    contextType: overrides.contextType ?? 'mirofish_debate',
    symbols: result.seed.symbols,
    timeframe: result.seed.timeframe,
    scenario: result.seed.scenario,
    thesis: result.thesis,
    evidence: collectEvidence(result.dataSources),
    risks: result.risks,
    assumptions: extractAssumptionsFromDebate(result),
    suggestedChecks: result.suggestedChecks,
    confidence: result.confidence,
    verifierStatus: result.verifier.status,
    isDemo: result.isDemo,
  }
}

export function buildSegaProposalFromReviewInput(input: SegaReviewInput): SegaProposal {
  return {
    proposalId: input.proposalId,
    title: input.title,
    intent: 'research',
    symbols: input.symbols,
    timeframe: input.timeframe as SegaProposal['timeframe'],
    scenario: input.scenario,
    thesis: input.thesis,
    downside: input.downside ?? {},
    exitPlan: input.exitPlan ?? {},
    mitigations: input.mitigations ?? [],
    killCriteria: input.killCriteria ?? [],
    monitoringTriggers: input.monitoringTriggers ?? [],
    allocationEnvelope: input.allocationEnvelope ?? undefined,
    allowDemo: input.allowDemo ?? false,
    maxRiskScore: input.maxRiskScore ?? 70,
  }
}

function collectEvidence(evidence: AgentEvidence[]) {
  return evidence.map((item) => ({
    label: item.label,
    value: item.value,
    source: item.source,
  }))
}

function extractAssumptions(result: AgentLoopRunResult) {
  return [
    result.scenario ? `scenario: ${result.scenario}` : 'scenario ไม่ได้ระบุชัดเจน',
    ...result.agents.flatMap((agent) => agent.findings.filter((finding) => finding.toLowerCase().includes('scenario') || finding.toLowerCase().includes('สมมติ'))),
    ...result.verifier.issues.map((issue) => `verifier: ${issue}`),
  ].filter(Boolean)
}

function extractAssumptionsFromDebate(result: MiroFishDebateRunResult) {
  return [
    result.seed.scenario ? `scenario: ${result.seed.scenario}` : 'scenario ไม่ได้ระบุชัดเจน',
    ...result.risks.map((risk) => `risk assumption: ${risk}`),
    ...result.verifier.issues.map((issue) => `verifier: ${issue}`),
  ].filter(Boolean)
}
