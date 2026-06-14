import { z } from 'zod'
import type { AgentLoopRunResult } from '../types'
import type { MiroFishDebateRunResult } from '../mirofish/types'
import { segaProposalSchema as baseSegaProposalSchema } from './schema'
import type { SegaAllocationEnvelope, SegaApprovalDecision, SegaApprovalResult } from './types'

const UNCLEAR_TERMS = /ไม่ทราบ|ไม่แน่ใจ|ไม่มีข้อมูล|unknown|unclear|not enough|insufficient|unverified|unclear thesis/i
const HIGH_RISK_TERMS = /ไม่ทราบ|ไม่แน่ใจ|ไม่มีข้อมูล|unknown|unclear|not enough|insufficient|unverified|unclear thesis|unbounded|ไม่มีขอบเขต|ไม่จำกัด|guaranteed|การันตี|กำไรแน่นอน|ปลอดภัย 100%|all-in|full margin|ต้องซื้อ|ต้องขาย|ควรซื้อ|ควรขาย|ซื้อ(?:\s|[\w.ก-๙])*เลย|ขาย(?:\s|[\w.ก-๙])*เลย|ซื้อเลย|ขายเลย/i

const proposalEvidenceSourceSchema = z.enum(['market_data', 'history', 'news', 'user_input', 'heuristic', 'proposal'])
const proposalEvidenceSchema = z.object({
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(500),
  source: proposalEvidenceSourceSchema.default('user_input'),
})

export const segaProposalSchema = baseSegaProposalSchema.extend({
  contextId: z.string().trim().max(80).optional(),
  contextType: z.enum(['agent_loop', 'mirofish_debate', 'proposal']).default('proposal'),
  evidence: z.array(proposalEvidenceSchema).max(20).default([]),
  risks: z.array(z.string().trim().min(1).max(500)).max(12).optional().default([]),
  assumptions: z.array(z.string().trim().min(1).max(500)).max(12).optional().default([]),
  suggestedChecks: z.array(z.string().trim().min(1).max(500)).max(12).optional().default([]),
  confidence: z.number().min(0).max(100).optional(),
  verifierStatus: z.enum(['pass', 'needs_review', 'blocked']).optional(),
  isDemo: z.boolean().optional(),
})

export type SegaProposal = z.infer<typeof segaProposalSchema>
export type SegaProposalSchema = z.ZodType<unknown>
export type SegaApprovalContext = AgentLoopRunResult | MiroFishDebateRunResult

export function parseSegaProposal(proposal: unknown, schema: SegaProposalSchema = segaProposalSchema): SegaProposal {
  return schema.parse(proposal) as SegaProposal
}

export function approveSegaProposal(
  proposal: unknown,
  context: SegaApprovalContext,
  schema: SegaProposalSchema = segaProposalSchema,
): SegaApprovalResult {
  let parsed: SegaProposal

  try {
    parsed = parseSegaProposal(proposal, schema)
  } catch (error) {
    return schemaRejectionResult(error)
  }

  return buildSegaApproval(parsed, context)
}

export function buildSegaApproval(proposal: SegaProposal, context: SegaApprovalContext): SegaApprovalResult {
  const riskScore = calculateRiskScore(proposal, context)
  const reasons: string[] = []
  const mitigations: string[] = []
  const hardNoGo: string[] = []

  if (isUnclearThesis(proposal, context)) {
    hardNoGo.push('unclear-thesis: thesis ต้องระบุสมมติฐาน ขอบเขต และเหตุผลที่ตรวจสอบได้')
  }

  if (!hasBoundedDownside(proposal)) {
    hardNoGo.push('unbounded-downside: ต้องระบุ downside scenario หรือ max loss bound')
  }

  if (!hasExitPlan(proposal)) {
    hardNoGo.push('no-exit-plan: ต้องมี invalidation, stop condition หรือ review trigger')
  }

  if (context.verifier.status === 'blocked') {
    hardNoGo.push('blocked-verifier: verifier ไม่ผ่าน จึงห้ามเดินต่อ')
  }

  if (context.isDemo && !proposal.allowDemo) {
    hardNoGo.push('demo-without-allowance: demo data ต้องมี allowDemo โดยชัด')
  }

  if (riskScore > proposal.maxRiskScore) {
    hardNoGo.push(`risk-score-too-high: risk score ${riskScore} สูงกว่า threshold ${proposal.maxRiskScore}`)
  }

  reasons.push(...hardNoGo)

  if (hardNoGo.length > 0) {
    return approvalResult(proposal, context, 'No-Go', reasons, mitigations, riskScore)
  }

  if (needsConditionalGo(proposal, context, riskScore)) {
    const conditionalReasons = buildConditionalReasons(proposal, context, riskScore)
    const conditionalMitigations = buildMitigations(proposal, context, riskScore)

    return approvalResult(proposal, context, 'Conditional Go', [...reasons, ...conditionalReasons], conditionalMitigations, riskScore)
  }

  return approvalResult(proposal, context, 'Go', ['gate-pass: thesis, downside, exit plan, verifier และ risk score ผ่าน conservative rule-based gate'], ['รักษา sizing cap ตาม allocation envelope และหยุดเมื่อ kill criteria เกิดขึ้น'], riskScore)
}

function approvalResult(
  proposal: SegaProposal,
  context: SegaApprovalContext,
  decision: SegaApprovalDecision,
  reasons: string[],
  mitigations: string[],
  riskScore: number,
): SegaApprovalResult {
  return {
    id: proposal.proposalId,
    decision,
    reasons: unique(reasons),
    mitigations: unique(mitigations),
    killCriteria: buildKillCriteria(proposal, context, riskScore),
    monitoringTriggers: buildMonitoringTriggers(proposal, context),
    allocationEnvelope: decision === 'No-Go' ? zeroAllocationEnvelope() : buildAllocationEnvelope(proposal, context, riskScore),
    riskScore,
    confidence: proposal.confidence ?? context.confidence,
    summary: context.summary,
    thesis: context.thesis,
    scenario: contextScenario(context),
    symbols: contextSymbols(context),
    timeframe: contextTimeframe(context),
    risks: context.risks,
    suggestedChecks: context.suggestedChecks,
    issues: context.verifier.issues,
    verifierStatus: context.verifier.status,
    updatedAt: context.updatedAt,
  }
}

function schemaRejectionResult(error: unknown): SegaApprovalResult {
  const message = error instanceof Error ? error.message : 'proposal schema ไม่ผ่าน'

  return {
    decision: 'No-Go',
    reasons: [`proposal-schema: ${message}`],
    mitigations: ['แก้ไข proposal ให้ตรงกับ schema ก่อนส่งเข้า gate'],
    killCriteria: ['proposal schema ไม่ผ่าน'],
    monitoringTriggers: [],
    allocationEnvelope: {
      maxPositionPercent: 0,
      maxPortfolioRiskPercent: 0,
      rationale: 'proposal ไม่ผ่าน schema จึงไม่อนุญาตให้ใช้งาน',
    },
    riskScore: 100,
  }
}

function calculateRiskScore(proposal: SegaProposal, context: SegaApprovalContext): number {
  let score = 0
  const evidenceCount = proposal.evidence.length + context.dataSources.length + context.agents.reduce((sum, agent) => sum + agent.evidence.length, 0)

  score += context.confidence < 50 ? 25 : context.confidence < 65 ? 15 : context.confidence < 75 ? 8 : 0
  score += context.verifier.status === 'blocked' ? 35 : context.verifier.status === 'needs_review' ? 20 : 0
  score += context.agents.filter((agent) => agent.status === 'blocked').length * 15
  score += context.agents.filter((agent) => agent.status === 'needs_review').length * 7
  score += context.agents.some((agent) => agent.evidence.length === 0) ? 12 : 0
  score += evidenceCount === 0 ? 18 : 0
  score += context.risks.length === 0 || context.suggestedChecks.length === 0 ? 12 : 0
  score += !hasBoundedDownside(proposal) ? 25 : 0
  score += !hasExitPlan(proposal) ? 25 : 0
  score += !proposal.allocationEnvelope ? 8 : 0
  score += context.isDemo ? 8 : 0
  score += hasUnsafeLanguage(proposal, context) ? 20 : 0
  score += hasHighRiskTerms(contextualText(proposal, context)) ? 10 : 0

  return clampScore(Math.round(score))
}

function needsConditionalGo(proposal: SegaProposal, context: SegaApprovalContext, riskScore: number): boolean {
  if (riskScore >= 35) return true
  if (context.verifier.status === 'needs_review') return true
  if ((proposal.confidence ?? context.confidence) < 70) return true
  if (context.agents.some((agent) => agent.status !== 'pass')) return true
  if (!proposal.allocationEnvelope) return true
  if (context.isDemo && proposal.allowDemo) return true

  return false
}

function buildConditionalReasons(proposal: SegaProposal, context: SegaApprovalContext, riskScore: number): string[] {
  const reasons: string[] = []

  if (riskScore >= 35) {
    reasons.push(`risk-score-conditional: risk score ${riskScore} ต้องการ mitigations และ sizing cap`)
  }

  if (context.verifier.status === 'needs_review') {
    reasons.push(`verifier-needs-review: ${context.verifier.issues.join('; ') || 'มีประเด็นต้องทบทวน'}`)
  }

  if ((proposal.confidence ?? context.confidence) < 70) {
    reasons.push(`low-confidence: confidence ${proposal.confidence ?? context.confidence} ต่ำกว่า 70`)
  }

  if (context.agents.some((agent) => agent.status !== 'pass')) {
    reasons.push('agent-review-needed: มี agent ที่ต้อง review ก่อนใช้งานต่อ')
  }

  if (!proposal.allocationEnvelope) {
    reasons.push('allocation-missing: proposal ไม่ได้ระบุ sizing cap จึงต้องใช้ envelope อนุรักษ์นิยม')
  }

  if (context.isDemo && proposal.allowDemo) {
    reasons.push('demo-allowed: อนุญาตเฉพาะ demo/paper review ไม่ใช่ execution')
  }

  return reasons
}

function buildMitigations(proposal: SegaProposal, context: SegaApprovalContext, riskScore: number): string[] {
  const mitigations = [...proposal.mitigations]

  if (!hasBoundedDownside(proposal)) {
    mitigations.push('เพิ่ม downside scenario พร้อม maxLossPercent หรือ maxLossAmount')
  }

  if (!hasExitPlan(proposal)) {
    mitigations.push('เพิ่ม invalidation, stop condition และ review trigger ที่วัดได้')
  }

  if (context.verifier.status !== 'pass') {
    mitigations.push(`แก้ไข verifier ก่อนเดินต่อ: ${context.verifier.issues.join('; ') || 'ไม่มีรายละเอียด'}`)
  }

  if (context.agents.some((agent) => agent.status !== 'pass')) {
    mitigations.push('ให้ agent ที่ไม่ใช่ pass สรุป evidence, risk และสิ่งที่ต้องเช็กต่อ')
  }

  if ((proposal.confidence ?? context.confidence) < 70) {
    mitigations.push('ลด sizing และรอ evidence เพิ่มเติมจน confidence >= 70')
  }

  if (context.isDemo) {
    mitigations.push('ติดป้าย demo data และห้ามใช้กับ execution จริง')
  }

  if (riskScore >= 35 || !proposal.allocationEnvelope) {
    mitigations.push('ใช้ maxPositionPercent <= cap ที่ approval คืน และแบ่ง entry เป็นขั้น')
  }

  if (hasUnsafeLanguage(proposal, context)) {
    mitigations.push('ลบภาษาซื้อ/ขายทันทีหรือการันตีผลตอบแทน แล้วรัน verifier ใหม่')
  }

  return mitigations
}

function buildKillCriteria(proposal: SegaProposal, context: SegaApprovalContext, riskScore: number): string[] {
  return unique([
    ...proposal.killCriteria,
    'verifier.status === blocked',
    `riskScore > ${proposal.maxRiskScore}`,
    'thesis ไม่ชัดหรือ evidence หลักหายไป',
    'downside กลายเป็น unbounded หรือไม่มี max loss bound',
    'exit/invalidation หายหรือไม่สามารถตรวจสอบได้',
    context.isDemo ? 'demo data ยังเป็นแหล่งหลักโดยไม่มี allowDemo' : 'data source เปลี่ยนเป็น demo โดยไม่ได้รับอนุญาต',
    riskScore >= 35 ? 'riskScore เพิ่มจนแตะ Conditional Go threshold' : 'riskScore เพิ่มจนแตะ No-Go threshold',
  ])
}

function buildMonitoringTriggers(proposal: SegaProposal, context: SegaApprovalContext): string[] {
  return unique([
    ...proposal.monitoringTriggers,
    'verifier.status !== pass',
    'confidence < 70',
    'agent.status !== pass',
    'news/evidence ใหม่ขัดกับ thesis',
    'price/volume ทำลาย invalidation หรือ stop condition',
    context.isDemo ? 'demo data ยังคงถูกใช้ต่อ' : 'data source เปลี่ยนเป็น demo หรือขาด freshness',
  ])
}

function zeroAllocationEnvelope(): SegaAllocationEnvelope {
  return {
    maxPositionPercent: 0,
    maxPortfolioRiskPercent: 0,
    rationale: 'No-Go จึงไม่อนุญาตให้ใช้งาน proposal นี้ต่อ',
  }
}

function buildAllocationEnvelope(proposal: SegaProposal, context: SegaApprovalContext, riskScore: number): SegaAllocationEnvelope {
  const input = proposal.allocationEnvelope
  const requiresTightCap = riskScore >= 35 || (proposal.confidence ?? context.confidence) < 70 || context.verifier.status !== 'pass'
  const defaultPositionPercent = riskScore >= 50 ? 5 : requiresTightCap ? 7.5 : 10
  const defaultPortfolioRiskPercent = riskScore >= 50 ? 0.5 : requiresTightCap ? 0.5 : 1

  return {
    maxPositionPercent: input?.maxPositionPercent === undefined ? defaultPositionPercent : Math.min(input.maxPositionPercent, defaultPositionPercent),
    maxPortfolioRiskPercent:
      input?.maxPortfolioRiskPercent === undefined ? defaultPortfolioRiskPercent : Math.min(input.maxPortfolioRiskPercent, defaultPortfolioRiskPercent),
    maxNotional: input?.maxNotional,
    rationale: input ? 'proposal ระบุ envelope แต่ gate ปรับ cap ให้ไม่หลวมกว่า conservative default' : 'proposal ไม่ได้ระบุ envelope จึงใช้ conservative default',
  }
}

function isUnclearThesis(proposal: SegaProposal, context: SegaApprovalContext): boolean {
  const thesis = `${proposal.thesis} ${context.thesis}`.trim()
  return thesis.length < 20 || UNCLEAR_TERMS.test(thesis)
}

function hasBoundedDownside(proposal: SegaProposal): boolean {
  const downside = proposal.downside
  const description = downside.description?.trim() ?? ''
  const hasLossBound = downside.maxLossPercent !== undefined || downside.maxLossAmount !== undefined
  return Boolean(description && !UNCLEAR_TERMS.test(description) && !HIGH_RISK_TERMS.test(description)) || hasLossBound
}

function hasExitPlan(proposal: SegaProposal): boolean {
  return Boolean(proposal.exitPlan.invalidation || proposal.exitPlan.stopCondition || proposal.exitPlan.reviewAt?.length)
}

function hasUnsafeLanguage(proposal: SegaProposal, context: SegaApprovalContext): boolean {
  return HIGH_RISK_TERMS.test(contextualText(proposal, context))
}

function hasHighRiskTerms(text: string): boolean {
  return HIGH_RISK_TERMS.test(text)
}

function contextualText(proposal: SegaProposal, context: SegaApprovalContext): string {
  return [
    proposal.thesis,
    ...proposal.assumptions,
    ...proposal.risks,
    ...proposal.suggestedChecks,
    context.summary,
    context.thesis,
    ...context.risks,
    ...context.suggestedChecks,
    ...context.agents.flatMap((agent) => [agent.summary, ...agent.findings, ...agent.risks]),
    ...context.verifier.issues,
  ].join('\n')
}

function contextScenario(context: SegaApprovalContext): string {
  return isMiroFishContext(context) ? context.seed.scenario : context.scenario
}

function contextSymbols(context: SegaApprovalContext): string[] {
  return isMiroFishContext(context) ? context.seed.symbols : context.symbols
}

function contextTimeframe(context: SegaApprovalContext): string {
  return isMiroFishContext(context) ? context.seed.timeframe : context.timeframe
}

function isMiroFishContext(context: SegaApprovalContext): context is MiroFishDebateRunResult {
  return 'seed' in context
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score))
}
