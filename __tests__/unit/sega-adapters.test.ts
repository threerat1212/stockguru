import { describe, expect, it } from 'vitest'
import { AGENT_LOOP_DISCLAIMER, type AgentLoopRunResult } from '@/lib/agent-loop/types'
import type { MiroFishDebateRunResult } from '@/lib/agent-loop/mirofish/types'
import {
  buildSegaProposalFromReviewInput,
  buildSegaReviewInputFromAgentLoop,
  buildSegaReviewInputFromMiroFish,
} from '@/lib/agent-loop/sega/adapters'
import type { SegaReviewInput } from '@/lib/agent-loop/sega/types'

const agentLoopResult = {
  runId: 'loop-test',
  mode: 'custom' as const,
  symbols: ['PTT.BK'],
  scenario: 'เช็กความเสี่ยงจาก oil price และบาทแข็ง',
  timeframe: '3M' as const,
  summary: 'Closed Loop วิเคราะห์ PTT.BK แบบ decision support',
  thesis: 'ใช้ผลนี้เป็น checklist ไม่ใช่คำแนะนำซื้อขาย',
  risks: ['ข้อมูลตลาดหุ้นมีความล่าช้า/คลาดเคลื่อนได้'],
  suggestedChecks: ['เช็กข่าวประกาศล่าสุด', 'เทียบกับกราฟและ volume'],
  confidence: 78,
  agents: [
    {
      id: 'data',
      role: 'data' as const,
      label: 'Data Agent',
      status: 'pass' as const,
      confidence: 82,
      summary: 'Data Agent ดึง quote/history ได้ครบ',
      findings: ['quote พร้อม', 'history พร้อม'],
      risks: [],
      evidence: [{ label: 'price', value: '38.50', source: 'market_data' as const }],
    },
    {
      id: 'technical',
      role: 'technical' as const,
      label: 'Technical Agent',
      status: 'pass' as const,
      confidence: 76,
      summary: 'Technical Agent ดู trend และ volume proxy',
      findings: ['trend proxy พร้อม'],
      risks: ['กราฟอาจ lag'],
      evidence: [{ label: 'SMA20', value: '37.80', source: 'heuristic' as const }],
    },
  ],
  verifier: {
    status: 'pass' as const,
    confidence: 100,
    checks: [
      { id: 'no-buy-sell-advice', label: 'ไม่แนะนำซื้อ/ขายทันที', passed: true, message: 'ไม่มีภาษาแบบซื้อเลย/ขายเลย' },
    ],
    issues: [],
  },
  dataSources: [{ label: 'price', value: '38.50', source: 'market_data' as const }],
  iterations: [{ phase: 'verification' as const, message: 'pass', passed: true }],
  disclaimer: AGENT_LOOP_DISCLAIMER,
  isDemo: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
  latencyMs: 1,
} satisfies AgentLoopRunResult

const miroFishDebateResult = {
  runId: 'debate-test',
  seed: {
    question: 'PTT ถ้ามูลค่าน้ำมันลงและบาทแข็ง จะกระทบอะไร',
    symbols: ['PTT.BK'],
    scenario: 'เช็กความเสี่ยงจาก oil price และบาทแข็ง',
    timeframe: '3M' as const,
    mode: 'custom' as const,
    intent: 'risk' as const,
    intentLabel: 'Risk Review',
  },
  graph: { nodes: [], edges: [] },
  summary: 'MiroFish Debate วิเคราะห์ PTT.BK แบบ decision support',
  thesis: 'ใช้ผลนี้เป็น checklist ไม่ใช่คำแนะนำซื้อขาย',
  risks: ['ต้องเช็กข่าวประกาศล่าสุด', 'oil price และ FX เป็นสมมติฐานหลัก'],
  suggestedChecks: ['เช็กข่าวประกาศล่าสุด', 'เทียบกับกราฟและ volume'],
  confidence: 74,
  rounds: [],
  transcript: [],
  agents: [
    {
      id: 'data',
      role: 'data' as const,
      label: 'Data Agent',
      status: 'pass' as const,
      confidence: 82,
      summary: 'Data Agent ดึง quote/history ได้ครบ',
      findings: ['quote พร้อม'],
      risks: [],
      evidence: [{ label: 'price', value: '38.50', source: 'market_data' as const }],
    },
    {
      id: 'risk',
      role: 'risk' as const,
      label: 'Risk Agent',
      status: 'pass' as const,
      confidence: 78,
      summary: 'Risk Agent รวม downside case',
      findings: ['downside case พร้อม'],
      risks: ['oil price และ FX เป็นสมมติฐานหลัก'],
      evidence: [{ label: 'risk', value: 'downside case', source: 'heuristic' as const }],
    },
  ],
  verifier: {
    status: 'needs_review' as const,
    confidence: 80,
    checks: [
      { id: 'evidence-present', label: 'มี evidence', passed: false, message: 'news source ยังไม่ครบ' },
    ],
    issues: ['evidence-present: news source ยังไม่ครบ'],
  },
  dataSources: [{ label: 'price', value: '38.50', source: 'market_data' as const }],
  modelPlan: [],
  disclaimer: AGENT_LOOP_DISCLAIMER,
  isDemo: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
  latencyMs: 1,
} satisfies MiroFishDebateRunResult

describe('sega adapters', () => {
  it('adapts Agent Loop output to deterministic review input', () => {
    const input = buildSegaReviewInputFromAgentLoop(agentLoopResult)

    expect(input.contextId).toBe('loop-test')
    expect(input.contextType).toBe('agent_loop')
    expect(input.symbols).toEqual(['PTT.BK'])
    expect(input.timeframe).toBe('3M')
    expect(input.evidence.some((item) => item.label === 'price')).toBe(true)
    expect(input.suggestedChecks).toEqual(['เช็กข่าวประกาศล่าสุด', 'เทียบกับกราฟและ volume'])
  })

  it('adapts MiroFish Debate output to deterministic review input', () => {
    const input = buildSegaReviewInputFromMiroFish(miroFishDebateResult)

    expect(input.contextId).toBe('debate-test')
    expect(input.contextType).toBe('mirofish_debate')
    expect(input.symbols).toEqual(['PTT.BK'])
    expect(input.assumptions.some((item) => item.includes('scenario'))).toBe(true)
    expect(input.verifierStatus).toBe('needs_review')
    expect(input.risks).toContain('oil price และ FX เป็นสมมติฐานหลัก')
  })

  it('builds a schema-valid proposal from review input', () => {
    const reviewInput: SegaReviewInput = {
      proposalId: 'proposal-1',
      title: 'PTT research gate',
      contextType: 'agent_loop',
      symbols: ['PTT.BK'],
      timeframe: '3M',
      thesis: 'PTT มี upside จากน้ำมันและงบ แต่ต้องรอแนวรับ',
      evidence: [{ label: 'price', value: '38.50', source: 'market_data' }],
      risks: ['น้ำมันผันผวน'],
      assumptions: ['scenario: เช็กความเสี่ยง'],
      suggestedChecks: ['เช็กข่าวประกาศล่าสุด'],
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
    }

    const proposal = buildSegaProposalFromReviewInput(reviewInput)

    expect(proposal.intent).toBe('research')
    expect(proposal.symbols).toEqual(['PTT.BK'])
    expect(proposal.downside.maxLossPercent).toBe(2)
    expect(proposal.allocationEnvelope?.maxPositionPercent).toBe(10)
  })
})
