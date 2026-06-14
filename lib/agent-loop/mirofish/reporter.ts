import type { AgentResult } from '../types'
import type { DebateSeed } from './types'

export type DebateReport = ReturnType<typeof buildDebateReport>

function topItems(values: string[], fallback: string) {
  const unique = Array.from(new Set(values.filter(Boolean)))
  return unique.length ? unique.slice(0, 4) : [fallback]
}

export function buildDebateReport(seed: DebateSeed, agents: AgentResult[]) {
  const passCount = agents.filter((agent) => agent.status === 'pass').length
  const reviewCount = agents.filter((agent) => agent.status === 'needs_review').length
  const allFindings = agents.flatMap((agent) => agent.findings)
  const allRisks = agents.flatMap((agent) => agent.risks)
  const evidenceCount = agents.reduce((sum, agent) => sum + agent.evidence.length, 0)

  const consensus = reviewCount === 0
    ? 'agents เห็นตรงกันว่าข้อมูลรอบนี้พอใช้ทำ scenario review ได้ แต่ยังคงเป็น decision support'
    : 'agents มีทั้งข้อมูลที่ใช้ได้และประเด็นที่ต้อง review ก่อนสรุปต่อ'

  const confidence = Math.max(42, Math.min(84, 68 + passCount * 2 - reviewCount * 4 + Math.min(evidenceCount, 20) - (seed.intent === 'risk' ? 2 : 0)))
  const suggestedChecks = topItems(
    [
      ...allRisks.slice(0, 4),
      'เช็กข่าวประกาศล่าสุดจากแหล่งข้อมูลหลักก่อนใช้ข้อมูลต่อ',
      'เทียบกับกราฟ แนวรับ/แนวต้าน และ volume ด้วยตนเอง',
      'ตรวจสอบ valuation/liquidity และ data freshness ก่อนใช้ต่อ',
      'บันทึกสมมติฐานและเหตุผลลงใน journal',
    ],
    'เช็ก evidence, risk และ source ก่อนใช้ผลลัพธ์ต่อ'
  )

  return {
    summary: `MiroFish Debate วิเคราะห์ ${seed.symbols.length} สัญลักษณ์ด้วย Moderator → Specialist Agents → Risk → Contrarian → Reporter → Verifier โดยเน้น scenario, evidence และสิ่งที่ต้องเช็กต่อ`,
    thesis: `${consensus}; intent ของคำถามคือ ${seed.intentLabel}`,
    suggestedChecks,
    confidence,
  }
}
