import { describe, expect, it } from 'vitest'
import { AGENT_LOOP_DISCLAIMER, type AgentLoopRunResult } from '@/lib/agent-loop/types'
import { verifyAgentLoopRun, enforceStrictVerifier, isStrictVerifierEnabled } from '@/lib/agent-loop/verifier'

const baseResult: AgentLoopRunResult = {
  runId: 'test',
  mode: 'custom',
  symbols: ['PTT.BK'],
  scenario: 'เช็กความเสี่ยง',
  timeframe: '3M',
  summary: 'Closed Loop วิเคราะห์ PTT.BK แบบ decision support',
  thesis: 'ใช้ผลนี้เป็น checklist ไม่ใช่คำแนะนำซื้อขาย',
  risks: ['เช็กข่าวประกาศล่าสุด', 'ดูกราฟแนวรับ/แนวต้านด้วยตนเอง'],
  suggestedChecks: ['ตรวจสอบงบ', 'เทียบกับ peer'],
  confidence: 74,
  agents: [
    {
      id: 'data',
      role: 'data',
      label: 'Data Agent',
      status: 'pass',
      confidence: 80,
      summary: 'ดึงข้อมูลสำเร็จ',
      findings: ['price history พร้อม'],
      risks: [],
      evidence: [{ label: 'price', value: '38.50', source: 'market_data' }],
    },
  ],
  verifier: {
    status: 'needs_review',
    confidence: 0,
    checks: [],
    issues: [],
  },
  dataSources: [{ label: 'price', value: '38.50', source: 'market_data' }],
  iterations: [{ phase: 'verification', message: 'pass', passed: true }],
  disclaimer: AGENT_LOOP_DISCLAIMER,
  isDemo: false,
  updatedAt: new Date().toISOString(),
  latencyMs: 100,
}

describe('agent-loop verifier', () => {
  it('passes when output is evidence-based and safety bounded', () => {
    const result = verifyAgentLoopRun(baseResult)
    expect(result.status).toBe('pass')
    expect(result.issues).toEqual([])
    expect(result.confidence).toBeGreaterThan(80)
  })

  it('blocks when output recommends immediate trading', () => {
    const unsafe = {
      ...baseResult,
      summary: 'ควรซื้อ PTT.BK เลย',
      suggestedChecks: ['ซื้อเลย'],
    }

    const result = verifyAgentLoopRun(unsafe)
    expect(result.status).toBe('blocked')
    expect(result.issues.some((issue) => issue.includes('no-buy-sell-advice'))).toBe(true)
  })

  it('blocks guaranteed return claims', () => {
    const unsafe = {
      ...baseResult,
      summary: 'กำไรแน่นอน ไม่มีความเสี่ยง',
      suggestedChecks: ['ถือยาวได้เลย'],
    }

    const result = verifyAgentLoopRun(unsafe)
    expect(result.status).toBe('blocked')
    expect(result.issues.some((issue) => issue.includes('no-buy-sell-advice'))).toBe(true)
  })

  it('keeps weak evidence as needs_review instead of hard block', () => {
    const weak = {
      ...baseResult,
      risks: [],
      suggestedChecks: [],
    }

    const result = verifyAgentLoopRun(weak)
    expect(result.status).toBe('needs_review')
    expect(result.issues.some((issue) => issue.includes('risk-present'))).toBe(true)
  })

  it('enforces strict verifier by throwing on blocked output', () => {
    const originalStrict = process.env.AGENT_LOOP_STRICT_VERIFIER
    process.env.AGENT_LOOP_STRICT_VERIFIER = 'true'

    try {
      expect(isStrictVerifierEnabled()).toBe(true)
      expect(() => enforceStrictVerifier(baseResult, { status: 'blocked', confidence: 0, checks: [], issues: ['no-buy-sell-advice'] })).toThrow('VERIFIER_BLOCKED')
      expect(() => enforceStrictVerifier(baseResult, { status: 'needs_review', confidence: 60, checks: [], issues: ['risk-present'] })).not.toThrow()
    } finally {
      if (originalStrict === undefined) {
        delete process.env.AGENT_LOOP_STRICT_VERIFIER
      } else {
        process.env.AGENT_LOOP_STRICT_VERIFIER = originalStrict
      }
    }
  })
})
