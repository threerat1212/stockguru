import type { AgentLoopMode, AgentLoopRequest, AgentStatus, Timeframe } from '../types'

export type DebateIntent = 'impact' | 'technical' | 'fundamental' | 'news' | 'risk' | 'portfolio' | 'general'

export interface DebateSeed {
  question: string
  symbols: string[]
  scenario: string
  timeframe: Timeframe
  mode: AgentLoopMode
  intent: DebateIntent
  intentLabel: string
}

export interface DebateGraphEdge {
  from: string
  to: string
  label: string
}

export interface DebateGraphNode {
  id: string
  label: string
  role: 'seed' | 'agent' | 'synthesis' | 'gate'
}

export interface DebateGraph {
  nodes: DebateGraphNode[]
  edges: DebateGraphEdge[]
}

export interface DebatePersona {
  id: string
  role: string
  label: string
  description: string
}

export interface DebateMessage {
  id: string
  round: number
  phase: 'seed' | 'observation' | 'challenge' | 'synthesis' | 'verification'
  agentId: string
  agentLabel: string
  message: string
  status: AgentStatus
  confidence: number
  evidenceCount: number
}

export interface DebateRound {
  round: number
  label: string
  description: string
  messages: DebateMessage[]
}

export interface MiroFishDebateRequest {
  question: string
  symbols?: AgentLoopRequest['symbols']
  scenario?: string
  timeframe?: Timeframe
  mode?: AgentLoopMode
  holdings?: AgentLoopRequest['holdings']
}

export interface MiroFishDebateRunResult {
  runId: string
  seed: DebateSeed
  graph: DebateGraph
  summary: string
  thesis: string
  risks: string[]
  suggestedChecks: string[]
  confidence: number
  rounds: DebateRound[]
  transcript: DebateMessage[]
  agents: import('../types').AgentResult[]
  verifier: import('../types').VerificationResult
  dataSources: import('../types').AgentEvidence[]
  modelPlan: import('../providers/model-router').WarRoomModelSelection[]
  disclaimer: string
  isDemo: boolean
  updatedAt: string
  latencyMs: number
}

export interface PersistWarRoomDebateInput {
  userId: string
  result: MiroFishDebateRunResult
}
