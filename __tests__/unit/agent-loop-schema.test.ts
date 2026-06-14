import { describe, expect, it } from 'vitest'
import { agentLoopRequestSchema, normalizeAgentLoopSymbol } from '@/lib/agent-loop/schema'

describe('agent-loop schema', () => {
  it('normalizes Thai market symbols by default', () => {
    expect(normalizeAgentLoopSymbol('ptt')).toBe('PTT.BK')
    expect(normalizeAgentLoopSymbol('AAPL')).toBe('AAPL')
    expect(normalizeAgentLoopSymbol('SCB.BK')).toBe('SCB.BK')
  })

  it('deduplicates and caps symbols', () => {
    const parsed = agentLoopRequestSchema.parse({
      symbols: ['PTT', 'ptt', 'SCB', 'CPALL', 'AOT', 'ADVANC', 'TRUE', 'DELTA', 'KBANK'],
      timeframe: '3M',
    })

    expect(parsed.symbols).toEqual(['PTT.BK', 'SCB.BK', 'CPALL.BK', 'AOT.BK', 'ADVANC.BK', 'TRUE.BK', 'DELTA.BK', 'KBANK.BK'])
    expect(parsed.mode).toBe('custom')
    expect(parsed.timeframe).toBe('3M')
  })

  it('rejects oversized requests', () => {
    expect(() => agentLoopRequestSchema.parse({ symbols: ['PTT', 'SCB', 'CPALL', 'AOT', 'ADVANC', 'TRUE', 'DELTA', 'KBANK', 'BBL'] })).toThrow()
  })
})
