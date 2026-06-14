import type { AgentStatus } from '../types'
import type { SegaProposal } from './schema'

export type { SegaProposal } from './schema'

export type SegaApprovalDecision = 'Go' | 'Conditional Go' | 'No-Go'

export interface SegaDownside {
  description?: string
  maxLossPercent?: number
  maxLossAmount?: number
}

export interface SegaExitPlan {
  invalidation?: string
  stopCondition?: string
  reviewAt?: string[]
}

export interface SegaAllocationEnvelope {
  maxPositionPercent: number
  maxPortfolioRiskPercent: number
  maxNotional?: number
  rationale: string
}

export interface SegaApprovalCheck {
  id?: string
  label: string
  passed: boolean
  message: string
}

export interface SegaApprovalResult {
  id?: string
  proposalId?: string
  title?: string
  decision: SegaApprovalDecision
  reasons: string[]
  mitigations: string[]
  killCriteria: string[]
  monitoringTriggers: string[]
  allocationEnvelope: SegaAllocationEnvelope
  riskScore: number
  confidence?: number
  summary?: string
  thesis?: string
  scenario?: string
  symbols?: string[]
  timeframe?: string
  risks?: string[]
  suggestedChecks?: string[]
  issues?: string[]
  checks?: SegaApprovalCheck[]
  protectedAgainst?: string[]
  nextCheckpoint?: string
  verifierStatus?: AgentStatus
  updatedAt?: string
}

export interface SegaStorycraftNarrative {
  title: string
  situation: string
  whyItMatters: string
  mustBeTrue: string
  protectsAgainst: string
  nextCheckpoint: string
  disclaimer: string
  text: string
}

export interface SegaEvidenceItem {
  label: string
  value: string
  source: string
}

export interface SegaReviewInput {
  proposalId?: string
  title?: string
  contextId?: string
  contextType: 'agent_loop' | 'mirofish_debate' | 'proposal'
  symbols: string[]
  timeframe: string
  scenario?: string
  thesis: string
  evidence: SegaEvidenceItem[]
  risks: string[]
  assumptions: string[]
  suggestedChecks: string[]
  downside?: SegaDownside
  exitPlan?: SegaExitPlan
  mitigations?: string[]
  killCriteria?: string[]
  monitoringTriggers?: string[]
  allocationEnvelope?: {
    maxPositionPercent?: number
    maxPortfolioRiskPercent?: number
    maxNotional?: number
  }
  allowDemo?: boolean
  maxRiskScore?: number
  confidence?: number
  verifierStatus?: AgentStatus
  isDemo?: boolean
}
