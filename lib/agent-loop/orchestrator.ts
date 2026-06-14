import {
  runDataAgent,
  runFundamentalAgent,
  runNewsAgent,
  runPortfolioAgent,
  runReportAgent,
  runRiskAgent,
  runTechnicalAgent,
} from './agents'
import { collectAgentLoopContext } from './data'
import { applyVerification, verifyAgentLoopRun } from './verifier'
import type { AgentLoopIteration, AgentLoopRequest, AgentLoopRunResult } from './types'

function makeIteration(phase: AgentLoopIteration['phase'], message: string, passed = true): AgentLoopIteration {
  return { phase, message, passed }
}

export async function runAgentLoop(input: AgentLoopRequest): Promise<AgentLoopRunResult> {
  const startedAt = Date.now()
  const iterations: AgentLoopIteration[] = [
    makeIteration('discovery', 'เลือก symbols, timeframe, scenario และ source ที่ต้องใช้'),
    makeIteration('planning', 'แบ่งงานให้ Data, Technical, Fundamental, News, Risk, Portfolio, Report และ Verifier'),
  ]

  const context = await collectAgentLoopContext(input)
  iterations.push(makeIteration('execution', `ดึง quote/history/news สำหรับ ${context.symbols.length} สัญลักษณ์`))

  const dataAgent = runDataAgent(context)
  const technicalAgent = runTechnicalAgent(context)
  const fundamentalAgent = runFundamentalAgent(context)
  const newsAgent = runNewsAgent(context)
  const portfolioAgent = runPortfolioAgent(context)
  const riskAgent = runRiskAgent(context, technicalAgent, fundamentalAgent, newsAgent)
  const agentsBeforeReport = [dataAgent, technicalAgent, fundamentalAgent, newsAgent, riskAgent, portfolioAgent]
  const report = runReportAgent(context, agentsBeforeReport, riskAgent)

  const result: AgentLoopRunResult = {
    runId: `loop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode: context.mode,
    symbols: context.symbols,
    scenario: context.scenario,
    timeframe: context.timeframe,
    summary: report.summary,
    thesis: report.thesis,
    risks: riskAgent.risks,
    suggestedChecks: report.suggestedChecks,
    confidence: report.confidence,
    agents: [...agentsBeforeReport],
    verifier: {
      status: 'needs_review',
      confidence: 0,
      checks: [],
      issues: ['รอ verifier'],
    },
    dataSources: dataAgent.evidence,
    iterations,
    disclaimer: 'ผลลัพธ์เป็น decision support เพื่อการศึกษา ไม่ใช่คำแนะนำซื้อขาย ไม่มีการการันตีผลตอบแทน และไม่ใช่ระบบซื้อขายอัตโนมัติ',
    isDemo: context.isDemo,
    updatedAt: new Date(startedAt).toISOString(),
    latencyMs: Date.now() - startedAt,
  }

  const reportAgent = {
    id: 'report',
    role: 'report' as const,
    label: 'Report Agent',
    status: 'pass' as const,
    confidence: report.confidence,
    summary: result.summary,
    findings: [result.thesis, ...result.suggestedChecks.slice(0, 2)],
    risks: result.risks.slice(0, 2),
    evidence: [
      { label: 'loop summary', value: result.summary, source: 'heuristic' as const },
      { label: 'thesis', value: result.thesis, source: 'heuristic' as const },
    ],
  }

  const withReport = {
    ...result,
    agents: [...result.agents, reportAgent],
    latencyMs: Date.now() - startedAt,
  }

  const verification = verifyAgentLoopRun(withReport)
  const finalResult = applyVerification(withReport, verification)
  finalResult.iterations.push(
    makeIteration('verification', `verifier ${finalResult.verifier.status}; confidence ${finalResult.verifier.confidence}%`, finalResult.verifier.status === 'pass'),
    makeIteration('iteration', finalResult.verifier.status === 'pass' ? 'ปิด loop ด้วย evidence/risk checklist' : 'เพิ่ม checklist จาก verifier ก่อนส่งผู้ใช้')
  )
  finalResult.latencyMs = Date.now() - startedAt

  return finalResult
}
