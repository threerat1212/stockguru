import { describe, expect, it } from 'vitest'
import { runMiroFishSwarmSimulation } from '@/lib/mirofish-swarm/simulator'

describe('mirofish swarm simulation', () => {
  it('creates a deterministic swarm with personas, social feed and scenarios', () => {
    const result = runMiroFishSwarmSimulation({
      title: 'PTT งบออกดี แต่ราคาน้ำมันโลกอ่อนและบาทแข็ง',
      description: 'จำลองว่าตลาดหุ้นไทยจะตีความข่าวนี้ยังไง และอาจเกิด sell on fact หรือ downside อะไรได้บ้าง',
      domain: 'stock',
      timeframe: '1M',
      actors: ['PTT', 'นักลงทุนรายย่อย', 'นักวิเคราะห์สถาบัน'],
      assumptions: ['ข่าวอาจทำให้คนมองบวกก่อน', 'ตลาดอาจกังวล sell on fact'],
    })

    expect(result.agents).toHaveLength(12)
    expect(result.posts).toHaveLength(36)
    expect(result.rounds).toHaveLength(3)
    expect(result.scenarios).toHaveLength(4)
    expect(result.modelPolicy.paidOpenRouterModelsUsed).toBe(false)
    expect(result.disclaimer).toContain('ไม่ใช่คำแนะนำการลงทุน')
  })

  it('detects marketing campaign risks and customer friction', () => {
    const result = runMiroFishSwarmSimulation({
      title: 'เปิดตัวฟีเจอร์ AI สรุปข่าวหุ้นฟรี',
      description: 'แคมเปญใหม่บอกว่า AI สรุปข่าวหุ้นได้ทันทีฟรี 30 วัน แต่อาจมี claim เกินจริงและลูกค้าไม่เข้าใจขอบเขต',
      domain: 'marketing',
      timeframe: '1W',
      actors: ['ลูกค้ารายย่อย', 'founder', 'support'],
      assumptions: ['คนสนใจของฟรี', 'claim อาจฟังเหมือนการันตีผล'],
    })

    expect(result.event.domain).toBe('marketing')
    expect(result.sentiment.dominant).toBeDefined()
    expect(result.risks.some((risk) => risk.toLowerCase().includes('claim') || risk.toLowerCase().includes('dram'))).toBe(true)
    expect(result.suggestedChecks.some((check) => check.includes('message') || check.includes('evidence'))).toBe(true)
  })
})
