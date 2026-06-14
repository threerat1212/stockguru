import type { NewsArticle, StockCandle, StockQuote, Timeframe } from '../../types/stock'

export type { Timeframe } from '../../types/stock'

export type AgentLoopMode = 'watchlist' | 'portfolio' | 'market' | 'custom'

export type AgentRole =
  | 'data'
  | 'technical'
  | 'fundamental'
  | 'news'
  | 'risk'
  | 'portfolio'
  | 'contrarian'
  | 'report'
  | 'verifier'

export type AgentStatus = 'pass' | 'needs_review' | 'blocked'

export interface AgentLoopHoldingInput {
  symbol: string
  quantity?: number
  buyPrice?: number
}

export interface AgentLoopRequest {
  mode: AgentLoopMode
  symbols: string[]
  scenario?: string
  timeframe: Timeframe
  holdings?: AgentLoopHoldingInput[]
}

export interface AgentEvidence {
  label: string
  value: string
  source: 'market_data' | 'history' | 'news' | 'user_input' | 'heuristic'
}

export interface AgentResult {
  id: string
  role: AgentRole
  label: string
  status: AgentStatus
  confidence: number
  summary: string
  findings: string[]
  risks: string[]
  evidence: AgentEvidence[]
}

export interface VerificationCheck {
  id: string
  label: string
  passed: boolean
  message: string
}

export interface VerificationResult {
  status: AgentStatus
  confidence: number
  checks: VerificationCheck[]
  issues: string[]
}

export interface AgentLoopIteration {
  phase: 'discovery' | 'planning' | 'execution' | 'verification' | 'iteration'
  message: string
  passed: boolean
}

export interface AgentLoopRunResult {
  runId: string
  mode: AgentLoopMode
  symbols: string[]
  scenario: string
  timeframe: Timeframe
  summary: string
  thesis: string
  risks: string[]
  suggestedChecks: string[]
  confidence: number
  agents: AgentResult[]
  verifier: VerificationResult
  dataSources: AgentEvidence[]
  iterations: AgentLoopIteration[]
  disclaimer: string
  isDemo: boolean
  updatedAt: string
  latencyMs: number
}

export interface AgentLoopContext {
  symbols: string[]
  scenario: string
  timeframe: Timeframe
  mode: AgentLoopMode
  holdings?: AgentLoopHoldingInput[]
  quotes: Array<{ symbol: string; quote: StockQuote | null; error?: string }>
  histories: Array<{ symbol: string; candles: StockCandle[]; error?: string }>
  news: NewsArticle[]
  isDemo: boolean
  updatedAt: string
}

export const DEFAULT_AGENT_LOOP_SYMBOLS = ['PTT.BK', 'SCB.BK', 'CPALL.BK', 'AOT.BK', 'ADVANC.BK']

export const AGENT_LOOP_DISCLAIMER =
  'ผลลัพธ์เป็น decision support เพื่อการศึกษา ไม่ใช่คำแนะนำซื้อขาย ไม่มีการการันตีผลตอบแทน และไม่ใช่ระบบซื้อขายอัตโนมัติ'
