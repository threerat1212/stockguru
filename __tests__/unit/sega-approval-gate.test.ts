import { describe, expect, it } from 'vitest'
import { AGENT_LOOP_DISCLAIMER, type AgentLoopRunResult, type VerificationResult } from '@/lib/agent-loop/types'
import { approveSegaProposal, segaProposalSchema, type SegaProposal } from '@/lib/agent-loop/sega/approval'

function agent(overrides: Partial<AgentLoopRunResult['agents'][number]> = {}) {
  return {
    id: 'data',
    role: 'data' as const,
    label: 'Data Agent',
    status: 'pass' as const,
    confidence: 80,
    summary: 'ดึงข้อมูลสำเร็จ',
    findings: ['price history พร้อม'],
    risks: [],
    evidence: [{ label: 'price', value: '38.50', source: 'market_data' as const }],
    ...overrides,
  }
}

function verifier(overrides: Partial<VerificationResult> = {}): VerificationResult {
  return {
    status: 'pass',
    confidence: 100,
    checks: [],
    issues: [],
    ...overrides,
  }
}

function agentLoopResult(overrides: Partial<AgentLoopRunResult> = {}): AgentLoopRunResult {
  return {
    runId: 'al-1',
    mode: 'custom',
    symbols: ['PTT.BK'],
    scenario: 'เช็กความเสี่ยงจาก oil price และบาทแข็ง',
    timeframe: '3M',
    summary: 'Closed Loop วิเคราะห์ PTT.BK แบบ decision support',
    thesis: 'PTT มี upside จากน้ำมันและงบ แต่ต้องรอแนวรับ',
    risks: ['น้ำมันผันผวน'],
    suggestedChecks: ['ตรวจสอบงบ', 'เช็กข่าวประกาศล่าสุด'],
    confidence: 82,
    agents: [agent()],
    verifier: verifier(),
    dataSources: [{ label: 'price', value: '38.50', source: 'market_data' }],
    iterations: [{ phase: 'verification', message: 'pass', passed: true }],
    disclaimer: AGENT_LOOP_DISCLAIMER,
    isDemo: false,
    updatedAt: '2026-06-13T00:00:00.000Z',
    latencyMs: 100,
    ...overrides,
  }
}

function proposal(overrides: Partial<SegaProposal> = {}): SegaProposal {
  return segaProposalSchema.parse({
    proposalId: 'proposal-1',
    title: 'PTT research gate',
    intent: 'research',
    symbols: ['PTT.BK'],
    timeframe: '3M',
    thesis: 'PTT มี upside จากน้ำมันและงบ แต่ต้องรอแนวรับ',
    downside: {
      description: 'ถ้าราคาน้ำมันลงแรงและบาทแข็ง PTT อาจเสีย margin',
      maxLossPercent: 2,
    },
    exitPlan: {
      invalidation: 'ราคาปิดหลุดแนวรับหลัก',
      stopCondition: 'verifier ไม่ผ่านหรือ news ใหม่ขัด thesis',
      reviewAt: ['หลังประกาศงบ', 'เมื่อราคาน้ำมันเปลี่ยน > 10%'],
    },
    allocationEnvelope: {
      maxPositionPercent: 10,
      maxPortfolioRiskPercent: 1,
    },
    allowDemo: false,
    maxRiskScore: 70,
    ...overrides,
  }) as SegaProposal
}

describe('sega approval gate', () => {
  it('returns Go for a clear bounded proposal backed by passing context', () => {
    const result = approveSegaProposal(proposal(), agentLoopResult())

    expect(result.decision).toBe('Go')
    expect(result.reasons[0]).toContain('gate-pass')
    expect(result.riskScore).toBeLessThan(35)
    expect(result.allocationEnvelope).toMatchObject({
      maxPositionPercent: 10,
      maxPortfolioRiskPercent: 1,
    })
  })

  it('returns Conditional Go when confidence or verifier needs review', () => {
    const result = approveSegaProposal(proposal(), agentLoopResult({ confidence: 62 }))

    expect(result.decision).toBe('Conditional Go')
    expect(result.reasons.some((reason) => reason.includes('low-confidence'))).toBe(true)
    expect(result.mitigations.some((mitigation) => mitigation.includes('ลด sizing'))).toBe(true)
    expect(result.allocationEnvelope.maxPositionPercent).toBeLessThanOrEqual(7.5)
  })

  it('returns No-Go for blocked verifier', () => {
    const result = approveSegaProposal(proposal(), agentLoopResult({ verifier: verifier({ status: 'blocked', issues: ['no-buy-sell-advice'] }) }))

    expect(result.decision).toBe('No-Go')
    expect(result.reasons.some((reason) => reason.includes('blocked-verifier'))).toBe(true)
    expect(result.allocationEnvelope.maxPositionPercent).toBe(0)
  })

  it('returns No-Go for unsafe buy/sell language when threshold is strict', () => {
    const result = approveSegaProposal(
      proposal({ suggestedChecks: ['ซื้อ PTT.BK เลย'], maxRiskScore: 20 }),
      agentLoopResult(),
    )

    expect(result.decision).toBe('No-Go')
    expect(result.reasons.some((reason) => reason.includes('risk-score-too-high'))).toBe(true)
  })
})
