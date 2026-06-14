import { z } from 'zod'
import type { AgentLoopMode, Timeframe } from '../types'

const FOREIGN_SYMBOLS = new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'JPM', 'BABA'])

function normalizeSymbolInput(symbol: string) {
  const clean = symbol.trim().toUpperCase().replace(/^@/, '').replace(/\s+/g, '')
  if (!clean) return clean
  if (clean.includes('.')) return clean
  return FOREIGN_SYMBOLS.has(clean) ? clean : `${clean}.BK`
}

const symbolsSchema = z
  .array(z.string().trim().min(1).max(20))
  .min(1, 'ต้องมีสัญลักษณ์อย่างน้อย 1 รายการ')
  .max(8, 'SEGA MVP รองรับสูงสุด 8 สัญลักษณ์ต่อรอบ')
  .transform((symbols) => Array.from(new Set(symbols.map(normalizeSymbolInput))).filter(Boolean))

const downsideSchema = z
  .object({
    description: z.string().trim().min(1).max(500).optional(),
    maxLossPercent: z.number().min(0).max(100).optional(),
    maxLossAmount: z.number().nonnegative().optional(),
  })
  .optional()
  .default({})

const exitPlanSchema = z
  .object({
    invalidation: z.string().trim().min(1).max(500).optional(),
    stopCondition: z.string().trim().min(1).max(500).optional(),
    reviewAt: z.array(z.string().trim().min(1)).max(5).optional(),
  })
  .optional()
  .default({})

const allocationEnvelopeSchema = z
  .object({
    maxPositionPercent: z.number().min(0).max(100).optional(),
    maxPortfolioRiskPercent: z.number().min(0).max(100).optional(),
    maxNotional: z.number().nonnegative().optional(),
  })
  .optional()

export const proposalEvidenceSchema = z.object({
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(500),
  source: z.string().trim().min(1).max(80),
})

export const segaProposalSchema = z.object({
  proposalId: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  intent: z.enum(['research', 'paper_trade', 'trade_plan', 'execution']).default('research'),
  symbols: symbolsSchema,
  timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']).default('1W'),
  scenario: z.string().trim().max(500, 'scenario ต้องไม่เกิน 500 ตัวอักษร').optional(),
  thesis: z.string().trim().min(1).max(1000, 'thesis ต้องไม่เกิน 1000 ตัวอักษร'),
  downside: downsideSchema,
  exitPlan: exitPlanSchema,
  mitigations: z.array(z.string().trim().min(1)).max(10).optional().default([]),
  killCriteria: z.array(z.string().trim().min(1)).max(10).optional().default([]),
  monitoringTriggers: z.array(z.string().trim().min(1)).max(10).optional().default([]),
  allocationEnvelope: allocationEnvelopeSchema,
  allowDemo: z.boolean().default(false),
  maxRiskScore: z.number().min(0).max(100).default(70),
})

export type SegaProposal = z.infer<typeof segaProposalSchema>
export type SegaProposalIntent = z.infer<typeof segaProposalSchema>['intent']
export type SegaTimeframe = Timeframe
export type SegaAgentLoopMode = AgentLoopMode
