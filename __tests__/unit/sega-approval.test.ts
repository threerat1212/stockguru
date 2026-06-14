import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { AGENT_LOOP_DISCLAIMER, type AgentLoopRunResult, type VerificationResult } from '@/lib/agent-loop/types'
import type { MiroFishDebateRunResult } from '@/lib/agent-loop/mirofish/types'
import { approveSegaProposal, segaProposalSchema, type SegaProposal } from '@/lib/agent-loop/sega/approval'

function agent() {
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
    scenario: 'scenario',
    timeframe: '3M',
    summary: 'Closed Loop วิเคราะห์ PTT.BK แบบ decision support',
    thesis: 'PTT มี upside จากน้ำมันและงบ แต่ต้องรอแนวรับ',
    risks: ['น้ำมันผันผวน'],
    suggestedChecks: ['ตรวจสอบงบ'],
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

function miroFishResult(overrides: Partial<MiroFishDebateRunResult> = {}): MiroFishDebateRunResult {
  return {
    runId: 'mf-1',
    seed: {
      question: 'PTT ถ้ามูลค่าน้ำมันลงและบาทแข็ง จะกระทบอะไร',
      symbols: ['PTT.BK'],
      scenario: 'scenario',
      timeframe: '3M',
      mode: 'custom',
      intent: 'risk',
      intentLabel: 'Risk',
    },
    graph: { nodes: [], edges: [] },
    summary: 'MiroFish Debate สรุป PTT.BK แบบ decision support',
    thesis: 'PTT มี upside จากน้ำมันและงบ แต่ต้องรอแนวรับ',
    risks: ['น้ำมันผันผวน'],
    suggestedChecks: ['ตรวจสอบงบ'],
    confidence: 82,
    rounds: [],
    transcript: [],
    agents: [agent()],
    verifier: verifier(),
    dataSources: [{ label: 'price', value: '38.50', source: 'market_data' }],
    modelPlan: [],
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
  it('returns Go for a clear bounded proposal backed by passing Agent Loop context', () => {
    const result = approveSegaProposal(proposal(), agentLoopResult())

    expect(result.decision).toBe('Go')
    expect(result.reasons[0]).toContain('gate-pass')
    expect(result.riskScore).toBeLessThan(35)
    expect(result.allocationEnvelope).toMatchObject({
      maxPositionPercent: 10,
      maxPortfolioRiskPercent: 1,
    })
  })

  it('accepts MiroFish Debate context', () => {
    const result = approveSegaProposal(proposal(), miroFishResult())

    expect(result.decision).toBe('Go')
    expect(result.allocationEnvelope.maxPositionPercent).toBe(10)
  })

  it('accepts a proposal schema and parses before gating', () => {
    const schema = segaProposalSchema.extend({
      requiredMitigation: z.string().min(1),
    })
    const rawProposal = {
      proposalId: 'proposal-1',
      title: 'PTT research gate',
      intent: 'research',
      symbols: ['PTT.BK'],
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
      requiredMitigation: 'wait for volume confirmation',
    }
    const parsed = schema.parse(rawProposal) as SegaProposal & { requiredMitigation: string }

    const result = approveSegaProposal(parsed, agentLoopResult(), schema)

    expect(result.decision).toBe('Go')
  })

  it('returns No-Go for unclear thesis', () => {
    const result = approveSegaProposal(proposal({ thesis: 'ไม่ทราบ' }), agentLoopResult())

    expect(result.decision).toBe('No-Go')
    expect(result.reasons.some((reason) => reason.includes('unclear-thesis'))).toBe(true)
  })

  it('returns No-Go for unbounded downside', () => {
    const result = approveSegaProposal(
      proposal({ downside: { description: 'downside ไม่จำกัด' } }),
      agentLoopResult(),
    )

    expect(result.decision).toBe('No-Go')
    expect(result.reasons.some((reason) => reason.includes('unbounded-downside'))).toBe(true)
  })

  it('returns No-Go when there is no exit plan', () => {
    const result = approveSegaProposal(
      {
        proposalId: 'proposal-1',
        title: 'PTT research gate',
        intent: 'research',
        symbols: ['PTT.BK'],
        thesis: 'PTT มี upside จากน้ำมันและงบ แต่ต้องรอแนวรับ',
        downside: {
          description: 'ถ้าราคาน้ำมันลงแรงและบาทแข็ง PTT อาจเสีย margin',
          maxLossPercent: 2,
        },
        exitPlan: {},
        allocationEnvelope: {
          maxPositionPercent: 10,
          maxPortfolioRiskPercent: 1,
        },
        allowDemo: false,
        maxRiskScore: 70,
      },
      agentLoopResult(),
    )

    expect(result.decision).toBe('No-Go')
    expect(result.reasons.some((reason) => reason.includes('no-exit-plan'))).toBe(true)
  })

  it('returns No-Go when verifier is blocked', () => {
    const result = approveSegaProposal(proposal(), agentLoopResult({ verifier: verifier({ status: 'blocked', issues: ['no-buy-sell-advice'] }) }))

    expect(result.decision).toBe('No-Go')
    expect(result.reasons.some((reason) => reason.includes('blocked-verifier'))).toBe(true)
  })

  it('returns No-Go for demo context without explicit allowance', () => {
    const result = approveSegaProposal(proposal(), agentLoopResult({ isDemo: true }))

    expect(result.decision).toBe('No-Go')
    expect(result.reasons.some((reason) => reason.includes('demo-without-allowance'))).toBe(true)
  })

  it('returns No-Go when risk score exceeds the proposal threshold', () => {
    const result = approveSegaProposal(
      proposal({ maxRiskScore: 50 }),
      agentLoopResult({
        confidence: 40,
        risks: [],
        suggestedChecks: [],
        verifier: verifier({ status: 'needs_review', issues: ['risk-present'] }),
        agents: [{ ...agent(), status: 'needs_review', evidence: [] }],
      }),
    )

    expect(result.decision).toBe('No-Go')
    expect(result.reasons.some((reason) => reason.includes('risk-score-too-high'))).toBe(true)
  })

  it('returns Conditional Go when mitigations or sizing caps are needed', () => {
    const result = approveSegaProposal(proposal(), agentLoopResult({ confidence: 62 }))

    expect(result.decision).toBe('Conditional Go')
    expect(result.reasons.some((reason) => reason.includes('low-confidence'))).toBe(true)
    expect(result.mitigations.some((mitigation) => mitigation.includes('ลด sizing'))).toBe(true)
    expect(result.allocationEnvelope.maxPositionPercent).toBeLessThanOrEqual(7.5)
  })
})
