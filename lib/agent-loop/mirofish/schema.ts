import { z } from 'zod'
import type { AgentLoopHoldingInput, AgentLoopMode, Timeframe } from '../types'

const FOREIGN_SYMBOLS = new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'JPM', 'BABA'])

function normalizeSymbolInput(symbol: string) {
  const clean = symbol.trim().toUpperCase().replace(/^@/, '').replace(/\s+/g, '')
  if (!clean) return clean
  if (clean.includes('.')) return clean
  return FOREIGN_SYMBOLS.has(clean) ? clean : `${clean}.BK`
}

const symbolsSchema = z
  .array(z.string().trim().min(1).max(20))
  .max(8, 'MVP นี้รองรับสูงสุด 8 สัญลักษณ์ต่อรอบ')
  .transform((symbols) => Array.from(new Set(symbols.map(normalizeSymbolInput))).filter(Boolean))

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

export const warRoomDebateRequestSchema = z.object({
  question: z.string().trim().min(1, 'ต้องมีคำถาม').max(1000, 'คำถามต้องไม่เกิน 1000 ตัวอักษร'),
  symbols: symbolsSchema.optional(),
  scenario: z.string().trim().max(500, 'scenario ต้องไม่เกิน 500 ตัวอักษร').optional(),
  timeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL']).optional(),
  mode: z.enum(['watchlist', 'portfolio', 'market', 'custom']).optional(),
  holdings: holdingsSchema.optional(),
})

export type WarRoomDebateRequest = z.infer<typeof warRoomDebateRequestSchema> & {
  symbols?: string[]
  timeframe?: Timeframe
  mode?: AgentLoopMode
  holdings?: AgentLoopHoldingInput[]
}
