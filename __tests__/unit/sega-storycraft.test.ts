import { describe, expect, it } from 'vitest'
import { AGENT_LOOP_DISCLAIMER, type AgentLoopRunResult, type VerificationResult } from '@/lib/agent-loop/types'
import { approveSegaProposal, segaProposalSchema, type SegaProposal } from '@/lib/agent-loop/sega/approval'
import { renderSegaStorycraft } from '@/lib/agent-loop/sega/storycraft'

function agent(): AgentLoopRunResult['agents'][number] {
  return {
    id: 'data',
    role: 'data',
    label: 'Data Agent',
    status: 'pass',
    confidence: 80,
    summary: 'ดึงข้อมูลสำเร็จ',
    findings: ['price history พร้อม'],
    risks: [],
    evidence: [{ label: 'price', value: '38.50', source: 'market_data' }],
  }
}

function verifier(overrides: Partial<VerificationResult> = {}): VerificationResult {
  return {
    status: 'pass',
    confidence: 100,
    checks: [
      { id: 'no-buy-sell-advice', label: 'ไม่แนะนำซื้อ/ขายทันที', passed: true, message: 'ไม่มีภาษาแบบซื้อเลย/ขายเลย' },
    ],
    issues: [],
    ...overrides,
  }
}

function agentLoopResult(overrides: Partial<AgentLoopRunResult> = {}): AgentLoopRunResult {
  return {
    runId: 'al-story-1',
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
    proposalId: 'proposal-story-1',
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
      reviewAt: ['หลังประกาศงบ'],
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

describe('sega storycraft renderer', () => {
  it('renders a Go verdict as a bounded decision-support brief', () => {
    const approval = approveSegaProposal(proposal(), agentLoopResult())
    const narrative = renderSegaStorycraft(approval)

    expect(narrative.title).toBe('SEGA Storycraft Brief')
    expect(narrative.text).toContain('ผ่าน SEGA gate')
    expect(narrative.disclaimer).toBe(AGENT_LOOP_DISCLAIMER)
  })

  it('renders Conditional Go with review checkpoint language', () => {
    const approval = approveSegaProposal(proposal(), agentLoopResult({ confidence: 62 }))
    const narrative = renderSegaStorycraft(approval)

    expect(narrative.text).toContain('ต้อง review')
    expect(narrative.nextCheckpoint).toContain('เช็ก evidence')
    expect(narrative.whyItMatters).toContain('confidence')
  })

  it('renders No-Go with safety and risk language', () => {
    const approval = approveSegaProposal(proposal(), agentLoopResult({ verifier: verifier({ status: 'blocked', issues: ['no-buy-sell-advice'] }) }))
    const narrative = renderSegaStorycraft(approval)

    expect(narrative.text).toContain('ยังไม่อนุมัติ')
    expect(narrative.protectsAgainst).toContain('คำแนะนำซื้อขายทันที')
    expect(narrative.nextCheckpoint).toContain('เช็ก evidence')
  })
})
