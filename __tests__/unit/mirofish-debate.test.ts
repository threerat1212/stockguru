import { describe, expect, it } from 'vitest'
import { extractDebateSeed } from '@/lib/agent-loop/mirofish/seed'
import { runMiroFishDebate } from '@/lib/agent-loop/mirofish/debate'
import { getWarRoomModelPlan } from '@/lib/agent-loop/providers/model-router'

describe('mirofish debate seed extraction', () => {
  it('maps risk debate to model routing plan', () => {
    const seed = extractDebateSeed({
      question: 'PTT ถ้ามูลค่าน้ำมันลงและบาทแข็ง จะกระทบอะไร',
      timeframe: '1W',
    })

    const plan = getWarRoomModelPlan(seed)
    expect(plan.some((item) => item.phase === 'quant' && item.modelId.includes('deepseek-chat'))).toBe(true)
    expect(plan.some((item) => item.phase === 'thai' && item.provider === 'mimo')).toBe(true)
    expect(plan.some((item) => item.phase === 'research' && item.modelId.includes('nemotron-3-ultra'))).toBe(true)
  })

  it('extracts Thai company names and scenario intent', () => {
    const seed = extractDebateSeed({
      question: 'PTT ถ้ามูลค่าน้ำมันลงและบาทแข็ง จะกระทบอะไร',
      timeframe: '1W',
    })

    expect(seed.symbols).toEqual(['PTT.BK'])
    expect(seed.intent).toBe('risk')
    expect(seed.timeframe).toBe('1W')
    expect(seed.mode).toBe('custom')
  })

  it('extracts explicit foreign symbols without forcing .BK', () => {
    const seed = extractDebateSeed({
      question: 'NVDA ถ้า AI bubble แตก จะกระทบอะไร',
      timeframe: '1M',
    })

    expect(seed.symbols).toEqual(['NVDA'])
    expect(seed.intent).toBe('risk')
    expect(seed.mode).toBe('custom')
  })

  it('does not turn scenario finance words into BK symbols', () => {
    const seed = extractDebateSeed({
      question: 'PTT จะโดน margin กดแค่ไหน และ thesis นี้จะเริ่มผิดตรงไหน ถ้า ARPU, capex, NPL และ yield ไม่ดี',
      symbols: ['PTT.BK'],
      timeframe: '1M',
    })

    expect(seed.symbols).toEqual(['PTT.BK'])
    expect(seed.symbols.some((symbol) => /MARGIN|THESIS|ARPU|NPL|YIELD/.test(symbol))).toBe(false)
  })

  it('does not turn English scenario nouns into BK symbols', () => {
    const seed = extractDebateSeed({
      question: 'PTT.BK ถ้าน้ำมันโลกอ่อน 10-15%, บาทแข็งเร็ว, PTT มี exposure ปิโตรเคมีและโรงกลั่น แต่ตลาดยังรอตัวเลขสต็อกน้ำมัน margin thesis',
      scenario: 'ราคาน้ำมันโลกอ่อน 10-15%, บาทแข็งเร็ว, PTT มี exposure ปิโตรเคมีและโรงกลั่น แต่ตลาดยังรอตัวเลขสต็อกน้ำมัน',
      timeframe: '1M',
    })

    expect(seed.symbols).toEqual(['PTT.BK'])
    expect(seed.symbols).not.toContain('MARGIN.BK')
    expect(seed.symbols).not.toContain('THESIS.BK')
    expect(seed.mode).toBe('custom')
  })

  it('falls back to market preset when no symbol is provided', () => {
    const seed = extractDebateSeed({
      question: 'ภาพรวม SET สัปดาห์หน้ามีอะไรต้องระวัง',
    })

    expect(seed.mode).toBe('market')
    expect(seed.intent).toBe('risk')
    expect(seed.timeframe).toBe('1W')
  })
})

describe('mirofish debate orchestrator', () => {
  it('returns structured debate rounds and verifier result', async () => {
    const originalDebateAssist = process.env.AGENT_LOOP_LLM_DEBATE_ASSIST
    process.env.AGENT_LOOP_LLM_DEBATE_ASSIST = 'false'

    try {
      const result = await runMiroFishDebate({
        question: 'PTT ถ้ามูลค่าน้ำมันลงและบาทแข็ง จะกระทบอะไร',
        symbols: ['PTT'],
        timeframe: '1W',
      })

      expect(result.seed.symbols).toEqual(['PTT.BK'])
      expect(result.summary).toContain('MiroFish Debate')
      expect(result.graph.nodes).toHaveLength(11)
      expect(result.rounds).toHaveLength(3)
      expect(result.transcript.length).toBeGreaterThan(5)
      expect(result.verifier.status).not.toBe('blocked')
      expect(result.verifier.checks.some((check) => check.passed)).toBe(true)
      expect(result.disclaimer).toContain('ไม่ใช่คำแนะนำซื้อขาย')
    } finally {
      if (originalDebateAssist === undefined) {
        delete process.env.AGENT_LOOP_LLM_DEBATE_ASSIST
      } else {
        process.env.AGENT_LOOP_LLM_DEBATE_ASSIST = originalDebateAssist
      }
    }
  }, 12000)
})
