import type { DebatePersona } from './types'

export const DEBATE_PERSONAS: DebatePersona[] = [
  {
    id: 'moderator',
    role: 'moderator',
    label: 'Moderator Agent',
    description: 'แปลคำถามเป็น debate brief และคุมขอบเขตไม่ให้ agents ออกทะเล',
  },
  {
    id: 'data',
    role: 'market_data',
    label: 'Market Data Agent',
    description: 'ดู quote, volume, market coverage และ data gaps',
  },
  {
    id: 'technical',
    role: 'technical',
    label: 'Technical Agent',
    description: 'ดู trend, SMA, RSI, momentum และ volume confirmation',
  },
  {
    id: 'fundamental',
    role: 'fundamental',
    label: 'Fundamental Agent',
    description: 'ดู valuation proxy, market cap, liquidity และ business sensitivity',
  },
  {
    id: 'news',
    role: 'news',
    label: 'News Agent',
    description: 'ดูข่าว, catalyst, narrative และ news coverage gap',
  },
  {
    id: 'portfolio',
    role: 'portfolio',
    label: 'Portfolio Agent',
    description: 'ดู holding coverage, portfolio context และข้อจำกัดของข้อมูลพอร์ต',
  },
  {
    id: 'risk',
    role: 'risk',
    label: 'Risk Agent',
    description: 'รวม risk checklist จากทุกมุมมองและชี้ data gap',
  },
  {
    id: 'contrarian',
    role: 'contrarian',
    label: 'Contrarian Agent',
    description: 'ตั้งคำถามสวนเพื่อลด confirmation bias',
  },
  {
    id: 'reporter',
    role: 'report',
    label: 'Reporter Agent',
    description: 'สรุปสิ่งที่เห็นตรงกัน สิ่งที่ขัดแย้ง และสิ่งที่ต้องเช็กต่อ',
  },
  {
    id: 'verifier',
    role: 'verifier',
    label: 'Verifier Gate',
    description: 'ตรวจ safety, disclaimer, evidence และขอบเขต decision support',
  },
]

export function personaLabel(agentId: string) {
  return DEBATE_PERSONAS.find((persona) => persona.id === agentId)?.label ?? agentId
}
