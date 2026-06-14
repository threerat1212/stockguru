import { z } from 'zod'
import type { AgentLoopHoldingInput, AgentLoopRequest } from './types'

const FOREIGN_SYMBOLS = new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'JPM', 'BABA'])

function normalizeSymbolInput(symbol: string) {
  const clean = symbol.trim().toUpperCase().replace(/^@/, '').replace(/\s+/g, '')
  if (!clean) return clean
  if (clean.includes('.')) return clean
  return FOREIGN_SYMBOLS.has(clean) ? clean : `${clean}.BK`
}

const normalizedSymbolsSchema = z
  .array(z.string().min(1))
  .min(1, 'ต้องมีหุ้นอย่างน้อย 1 ตัว')
  .max(8, 'MVP นี้รองรับสูงสุด 8 สัญลักษณ์ต่อรอบ')

const symbolsSchema = z
  .array(z.string().trim().min(1).max(20))
  .min(1, 'ต้องมีหุ้นอย่างน้อย 1 ตัว')
  .transform((symbols) => Array.from(new Set(symbols.map(normalizeSymbolInput))).filter(Boolean))
  .pipe(normalizedSymbolsSchema)

const holdingsSchema = z
  .array(
    z.object({
      symbol: z.string().trim().min(1).max(20),
      quantity: z.number().nonnegative().optional(),
      buyPrice: z.number().nonnegative().optional(),
    })
  )
  .max(20, 'MVP นี้รองรับสูงสุด 20 holding ต่อรอบ')
  .transform((holdings) =>
    holdings.map((holding) => ({
      ...holding,
      symbol: normalizeSymbolInput(holding.symbol),
    })) as AgentLoopHoldingInput[]
  )

export const agentLoopRequestSchema = z.object({
  mode: z.enum(['watchlist', 'portfolio', 'market', 'custom']).default('custom'),
  symbols: symbolsSchema,
  scenario: z.string().trim().max(500, 'scenario ต้องไม่เกิน 500 ตัวอักษร').default(''),
  timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']).default('3M'),
  holdings: holdingsSchema.optional(),
})

export function normalizeAgentLoopSymbol(symbol: string) {
  return normalizeSymbolInput(symbol)
}

export function parseAgentLoopRequest(input: unknown): AgentLoopRequest {
  return agentLoopRequestSchema.parse(input) as AgentLoopRequest
}
