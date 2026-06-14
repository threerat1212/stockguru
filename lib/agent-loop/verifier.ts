import { AGENT_LOOP_DISCLAIMER, type AgentLoopRunResult, type VerificationCheck, type VerificationResult } from './types'

function hasUnsafeAdvice(text: string) {
  return /(ควรซื้อ|ควรขาย|ซื้อเลย|ขายเลย|ต้องซื้อ|ต้องขาย|ถือแน่นอน|การันตี|กำไรแน่นอน|กำไรชัวร์|ไม่มีความเสี่ยง|ปลอดภัย 100%|all-in|full margin)/i.test(text)
}

function hasBuySellAdvice(result: AgentLoopRunResult) {
  const haystack = [
    result.summary,
    result.thesis,
    ...result.risks,
    ...result.suggestedChecks,
    ...result.agents.flatMap((agent) => [...agent.findings, ...agent.risks, agent.summary]),
  ].join('\n')
  return hasUnsafeAdvice(haystack)
}

export function isStrictVerifierEnabled() {
  return ['true', '1', 'yes', 'y'].includes((process.env.AGENT_LOOP_STRICT_VERIFIER ?? '').toLowerCase())
}

export function shouldBlockStrictVerification(verification: VerificationResult) {
  return isStrictVerifierEnabled() && verification.status === 'blocked'
}

export function enforceStrictVerifier(result: AgentLoopRunResult, verification: VerificationResult): AgentLoopRunResult {
  if (shouldBlockStrictVerification(verification)) {
    throw new Error('VERIFIER_BLOCKED')
  }
  return result
}

export function verifyAgentLoopRun(result: AgentLoopRunResult): VerificationResult {
  const hasUnsafe = hasBuySellAdvice(result)
  const checks: VerificationCheck[] = [
    {
      id: 'no-buy-sell-advice',
      label: 'ไม่แนะนำซื้อ/ขายทันที',
      passed: !hasBuySellAdvice(result),
      message: 'ไม่มีภาษาแบบซื้อเลย/ขายเลย/การันตีผลตอบแทน',
    },
    {
      id: 'disclaimer-present',
      label: 'มี risk disclaimer',
      passed: result.disclaimer.includes('ไม่ใช่คำแนะนำ') && result.disclaimer.includes('ไม่มีการการันตี'),
      message: 'ผลลัพธ์มี disclaimer ชัดเจน',
    },
    {
      id: 'evidence-present',
      label: 'มี evidence จาก agent',
      passed: result.agents.every((agent) => agent.evidence.length > 0),
      message: 'ทุก agent มี evidence อย่างน้อย 1 รายการ',
    },
    {
      id: 'risk-present',
      label: 'มี risk checklist',
      passed: result.risks.length > 0 && result.suggestedChecks.length > 0,
      message: 'มีทั้งความเสี่ยงและสิ่งที่ต้องเช็กต่อ',
    },
    {
      id: 'bounded-scope',
      label: 'ขอบเขตไม่อ้างเกินข้อมูล',
      passed: result.summary.includes('decision support') && !result.summary.includes('ทำนาย'),
      message: 'สรุปอยู่ในขอบเขตช่วยตัดสินใจ ไม่ใช่ prediction machine',
    },
  ]

  const issues = checks.filter((check) => !check.passed).map((check) => `${check.id}: ${check.message}`)
  const passedCount = checks.filter((check) => check.passed).length
  const confidence = Math.round((passedCount / checks.length) * 100)

  return {
    status: hasUnsafe ? 'blocked' : issues.length ? 'needs_review' : 'pass',
    confidence,
    checks,
    issues,
  }
}

export function applyVerification(result: AgentLoopRunResult, verification: VerificationResult): AgentLoopRunResult {
  if (verification.status === 'pass') return result

  return {
    ...result,
    verifier: verification,
    summary: `${result.summary} Verifier ตรวจพบ ${verification.issues.length} ประเด็น จึงเน้นการเช็ก evidence/risk ก่อนใช้งานต่อ`,
    suggestedChecks: [
      ...verification.issues,
      ...result.suggestedChecks.filter((item) => !verification.issues.includes(item)),
    ],
    iterations: [
      ...result.iterations,
      {
        phase: 'iteration',
        message: `เพิ่ม risk/evidence checklist จาก verifier: ${verification.issues.join('; ')}`,
        passed: false,
      },
    ],
  }
}

export const DEFAULT_VERIFICATION_RESULT: VerificationResult = {
  status: 'needs_review',
  confidence: 0,
  checks: [],
  issues: ['ยังไม่ผ่าน verifier'],
}

export { AGENT_LOOP_DISCLAIMER }
