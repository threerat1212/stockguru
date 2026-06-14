import { AGENT_LOOP_DISCLAIMER } from '../types'
import type { SegaApprovalResult, SegaStorycraftNarrative } from './types'

const UNSAFE_PATTERNS: Array<[RegExp, string]> = [
  [/ซื้อเลย|ขายเลย|ต้องซื้อ|ต้องขาย|ควรซื้อ|ควรขาย/g, 'ต้องตรวจ evidence และ risk ก่อนใช้ต่อ'],
  [/ถือแน่นอน/g, 'ยังต้องมีเงื่อนไขที่ต้องตรวจต่อ'],
  [/การันตี|กำไรแน่นอน|กำไรชัวร์|ไม่มีความเสี่ยง|ปลอดภัย 100%/g, 'ยังมีข้อจำกัดด้านความเสี่ยง'],
  [/all-in|full margin/gi, 'ใช้ขนาดความเสี่ยงแบบระวัง'],
]

function sanitizeText(value: string) {
  return UNSAFE_PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value).replace(/\s+/g, ' ').trim()
}

function clean(items: Array<string | undefined | null>) {
  return Array.from(new Set(items.map((item) => sanitizeText(item ?? '')).filter(Boolean))).slice(0, 4)
}

function firstNonEmpty(items: Array<string | undefined | null>, fallback: string) {
  return clean(items)[0] ?? fallback
}

function formatConfidence(confidence: number | undefined) {
  if (confidence === undefined) return 'ยังไม่ระบุ'
  return `${Math.round(confidence)}%`
}

function statusLabel(result: SegaApprovalResult) {
  if (result.decision === 'Go') return 'ผ่าน SEGA gate'
  if (result.decision === 'No-Go') return 'SEGA ยังไม่อนุมัติให้ใช้สรุปนี้ต่อ'
  return 'SEGA อนุมัติแบบต้อง review เพิ่มเติม'
}

function scopeLine(result: SegaApprovalResult) {
  const symbols = result.symbols?.length ? result.symbols.join(', ') : 'scope ที่กำหนด'
  const timeframe = result.timeframe ? `${result.timeframe}` : 'timeframe ปัจจุบัน'
  const scenario = result.scenario ? `ภายใต้ scenario "${truncate(result.scenario, 90)}"` : 'ภายใต้กรอบ risk checklist มาตรฐาน'
  return `${symbols} · ${timeframe} · ${scenario}`
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

function passedChecks(result: SegaApprovalResult) {
  const checks = result.checks?.filter((check) => check.passed).map((check) => check.message || check.label) ?? []
  return clean(checks)
}

function failedChecks(result: SegaApprovalResult) {
  const checks = result.checks?.filter((check) => !check.passed).map((check) => check.message || check.label) ?? []
  return clean(checks)
}

function riskSignals(result: SegaApprovalResult) {
  return clean([...(result.risks ?? []), ...(result.issues ?? []), ...failedChecks(result)])
}

function renderSituation(result: SegaApprovalResult) {
  const summary = firstNonEmpty(
    [result.summary, result.thesis],
    statusLabel(result)
  )
  return sanitizeText(`สถานะ: ${statusLabel(result)}. War Room กำลังดู ${scopeLine(result)} สรุปจาก SEGA ว่า ${summary}`)
}

function renderWhyItMatters(result: SegaApprovalResult) {
  const risks = riskSignals(result)
  const reason = risks.length ? risks.slice(0, 2).join(' ; ') : 'ประเด็นยังอยู่ในระดับที่ต้องดู evidence และสมมติฐานให้ครบ'
  return sanitizeText(`เรื่องนี้สำคัญเพราะ ${reason} confidence อยู่ที่ ${formatConfidence(result.confidence)} จึงเหมาะใช้เป็น checkpoint ของทีม ไม่ใช่ข้อสรุปสุดท้าย`)
}

function renderMustBeTrue(result: SegaApprovalResult) {
  const mustBeTrue = passedChecks(result)
  const fallback = result.suggestedChecks?.[0] ?? 'evidence ยังต้องครบ assumption ยังไม่ขัดกัน และ risk checklist ยังต้องเปิดไว้'
  return sanitizeText(`สิ่งที่ต้องเป็นจริงคือ ${mustBeTrue.length ? mustBeTrue.join(' ; ') : fallback}`)
}

function renderProtectsAgainst(result: SegaApprovalResult) {
  const protectedAgainst = clean([...(result.protectedAgainst ?? []), ...failedChecks(result), ...result.issues ?? []])
  const fallback = 'การสรุปเกินหลักฐาน คำแนะนำซื้อขายทันที และการอ้างผลตอบแทนแบบการันตี'
  const hasBuyingAdviceGuard = protectedAgainst.some((item) => item.includes('คำแนะนำซื้อขายทันที'))
  const content = hasBuyingAdviceGuard ? protectedAgainst.slice(0, 3).join(' ; ') : `${protectedAgainst.length ? protectedAgainst.slice(0, 3).join(' ; ') + ' ; ' : ''}คำแนะนำซื้อขายทันที`
  return sanitizeText(`SEGA กำลังป้องกันไม่ให้ War Room หลุดไปใช้ ${content}${protectedAgainst.length >= 3 && !hasBuyingAdviceGuard ? '' : ` และ${fallback.includes('การอ้างผลตอบแทน') ? 'การอ้างผลตอบแทนแบบการันตี' : ''}`}`)
}

function renderNextCheckpoint(result: SegaApprovalResult) {
  const next = firstNonEmpty(
    [result.nextCheckpoint, ...(result.suggestedChecks ?? []), ...failedChecks(result), ...result.issues ?? []],
    'เช็ก evidence ที่ขาด หรือรอข้อมูลรอบถัดไปก่อนใช้สรุปนี้ต่อ'
  )
  return sanitizeText(`checkpoint ถัดไป: เช็ก evidence — ${next}`)
}

export function renderSegaStorycraft(result: SegaApprovalResult): SegaStorycraftNarrative {
  const narrative = {
    title: 'SEGA Storycraft Brief',
    situation: renderSituation(result),
    whyItMatters: renderWhyItMatters(result),
    mustBeTrue: renderMustBeTrue(result),
    protectsAgainst: renderProtectsAgainst(result),
    nextCheckpoint: renderNextCheckpoint(result),
    disclaimer: AGENT_LOOP_DISCLAIMER,
  }

  return {
    ...narrative,
    text: sanitizeText([
      narrative.situation,
      narrative.whyItMatters,
      narrative.mustBeTrue,
      narrative.protectsAgainst,
      narrative.nextCheckpoint,
      narrative.disclaimer,
    ].join(' ')),
  }
}
