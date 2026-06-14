import {
  runDataAgent,
  runFundamentalAgent,
  runNewsAgent,
  runPortfolioAgent,
  runReportAgent,
  runRiskAgent,
  runTechnicalAgent,
} from '../agents'
import { collectAgentLoopContext } from '../data'
import { applyVerification, enforceStrictVerifier, verifyAgentLoopRun } from '../verifier'
import { AGENT_LOOP_DISCLAIMER, type AgentLoopRequest, type AgentLoopRunResult, type AgentResult, type VerificationResult } from '../types'
import { applyWarRoomModelAssist } from '../providers/debate-assist'
import { buildWarRoomReporterDraft, getWarRoomModelPlan } from '../providers/reporter-draft'
import { buildDebateGraph } from './graph'
import { buildDebateReport } from './reporter'
import { extractDebateSeed } from './seed'
import type { DebateMessage, DebateRound, MiroFishDebateRequest, MiroFishDebateRunResult } from './types'

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function agentToMessage(agent: AgentResult, round: number, phase: DebateMessage['phase']): DebateMessage {
  return {
    id: makeId(`msg-${agent.id}`),
    round,
    phase,
    agentId: agent.id,
    agentLabel: agent.label,
    message: agent.summary,
    status: agent.status,
    confidence: agent.confidence,
    evidenceCount: agent.evidence.length,
  }
}

function buildModeratorMessage(seed: MiroFishDebateRunResult['seed']): DebateMessage {
  return {
    id: makeId('msg-moderator'),
    round: 1,
    phase: 'seed',
    agentId: 'moderator',
    agentLabel: 'Moderator Agent',
    message: `แปลงคำถามเป็น debate brief: ${seed.intentLabel}; symbols ${seed.symbols.join(', ')}; timeframe ${seed.timeframe}`,
    status: 'pass',
    confidence: 86,
    evidenceCount: 1,
  }
}

function buildContrarianAgent(seed: MiroFishDebateRunResult['seed'], agents: AgentResult[]): AgentResult {
  const reviewAgents = agents.filter((agent) => agent.status === 'needs_review')
  const weakPoints = reviewAgents.map((agent) => agent.summary).slice(0, 3)
  const scenarioRisk = seed.scenario.length > 80 ? 'scenario ค่อนข้างกว้าง ต้องแยก assumption ให้ชัด' : 'scenario อยู่ในขอบเขตที่พอวิเคราะห์ได้'
  const message = reviewAgents.length
    ? `พบ ${reviewAgents.length} agent ที่ต้อง review: ${weakPoints.join(' / ')}`
    : `ไม่มี signal ชัดเจนให้แย้ง แต่ต้องเช็กว่า ${scenarioRisk}`

  return {
    id: 'contrarian',
    role: 'risk',
    label: 'Contrarian Agent',
    status: reviewAgents.length ? 'needs_review' : 'pass',
    confidence: reviewAgents.length ? 61 : 70,
    summary: message,
    findings: [
      'ตั้งคำถามสวนเพื่อลด confirmation bias',
      seed.scenario ? `scenario: ${seed.scenario}` : 'scenario ไม่ชัดเจน ต้องระบุ assumption เพิ่ม',
    ],
    risks: [
      'อย่าสรุปจาก consensus อย่างเดียว ต้องดู counter-argument ด้วย',
      'ถ้า evidence ไม่ครบ ให้เน้น checklist แทนการฟันธง',
    ],
    evidence: [
      { label: 'review agent count', value: String(reviewAgents.length), source: 'heuristic' },
      { label: 'scenario length', value: String(seed.scenario.length), source: 'user_input' },
    ],
  }
}

function buildRounds(seed: MiroFishDebateRunResult['seed'], agents: AgentResult[], reporter: AgentResult, verifier: VerificationResult): DebateRound[] {
  const moderator = buildModeratorMessage(seed)
  const round1Messages = agents.slice(0, 6).map((agent) => agentToMessage(agent, 1, 'observation'))
  const riskAgent = agents.find((agent) => agent.id === 'risk')
  const contrarian = agents.find((agent) => agent.id === 'contrarian')
  const round2Messages = [riskAgent, contrarian].filter(Boolean).map((agent) => agentToMessage(agent as AgentResult, 2, 'challenge'))
  const round3Messages = [reporter, { ...reporter, id: 'verifier', label: 'Verifier Gate', status: verifier.status, confidence: verifier.confidence, summary: verifier.status === 'pass' ? 'ผ่าน safety gate' : 'มีประเด็นที่ต้อง review', evidence: verifier.checks.map((check) => ({ label: check.label, value: check.message, source: 'heuristic' as const })) } as AgentResult].map((agent) => agentToMessage(agent, 3, 'synthesis'))

  return [
    {
      round: 1,
      label: 'Observation Round',
      description: 'แต่ละ agent ให้ observation + evidence',
      messages: [moderator, ...round1Messages],
    },
    {
      round: 2,
      label: 'Challenge Round',
      description: 'Risk + Contrarian ท้าทายสมมติฐานและหา gap',
      messages: round2Messages,
    },
    {
      round: 3,
      label: 'Synthesis + Gate',
      description: 'Reporter สรุป แล้ว Verifier ตรวจ safety/evidence',
      messages: round3Messages,
    },
  ]
}

function buildTranscript(rounds: DebateRound[]) {
  return rounds.flatMap((round) => round.messages)
}

function toAgentLoopRunResult(result: MiroFishDebateRunResult): AgentLoopRunResult {
  return {
    runId: result.runId,
    mode: result.seed.mode,
    symbols: result.seed.symbols,
    scenario: result.seed.scenario,
    timeframe: result.seed.timeframe,
    summary: result.summary,
    thesis: result.thesis,
    risks: result.risks,
    suggestedChecks: result.suggestedChecks,
    confidence: result.confidence,
    agents: result.agents,
    verifier: result.verifier,
    dataSources: result.dataSources,
    iterations: [],
    disclaimer: result.disclaimer,
    isDemo: result.isDemo,
    updatedAt: result.updatedAt,
    latencyMs: result.latencyMs,
  }
}

export async function runMiroFishDebate(input: MiroFishDebateRequest): Promise<MiroFishDebateRunResult> {
  const startedAt = Date.now()
  const seed = extractDebateSeed(input)
  const request: AgentLoopRequest = {
    mode: seed.mode,
    symbols: seed.symbols,
    scenario: seed.scenario,
    timeframe: seed.timeframe,
    holdings: input.holdings,
  }

  const context = await collectAgentLoopContext(request)
  const dataAgent = runDataAgent(context)
  const technicalAgent = runTechnicalAgent(context)
  const fundamentalAgent = runFundamentalAgent(context)
  const newsAgent = runNewsAgent(context)
  const portfolioAgent = runPortfolioAgent(context)
  const riskAgent = runRiskAgent(context, technicalAgent, fundamentalAgent, newsAgent)
  const contrarianAgent = buildContrarianAgent(seed, [dataAgent, technicalAgent, fundamentalAgent, newsAgent, portfolioAgent, riskAgent])
  const assistedAgents = await applyWarRoomModelAssist(seed, [dataAgent, technicalAgent, fundamentalAgent, newsAgent, portfolioAgent, riskAgent, contrarianAgent])
  const modelPlan = getWarRoomModelPlan(seed)
  const openRouterDraft = await buildWarRoomReporterDraft(seed, assistedAgents)
  const report = openRouterDraft ?? buildDebateReport(seed, assistedAgents)
  const reportAgent: AgentResult = {
    id: 'report',
    role: 'report' as const,
    label: 'Reporter Agent',
    status: 'pass' as const,
    confidence: report.confidence,
    summary: report.summary,
    findings: [report.thesis, ...report.suggestedChecks.slice(0, 2)],
    risks: [riskAgent.risks[0] ?? 'ไม่มี risk ที่ชัดเจนในรอบนี้', ...report.suggestedChecks.slice(0, 2)],
    evidence: [
      { label: 'debate summary', value: report.summary, source: 'heuristic' as const },
      { label: 'debate thesis', value: report.thesis, source: 'heuristic' as const },
      ...report.suggestedChecks.map((item, index) => ({ label: `check ${index + 1}`, value: item, source: 'heuristic' as const })),
    ],
  }
  const agents = [dataAgent, technicalAgent, fundamentalAgent, newsAgent, portfolioAgent, riskAgent, contrarianAgent, reportAgent]
  const baseResult: MiroFishDebateRunResult = {
    runId: makeId('debate'),
    seed,
    graph: buildDebateGraph(),
    summary: report.summary,
    thesis: report.thesis,
    risks: riskAgent.risks,
    suggestedChecks: report.suggestedChecks,
    confidence: report.confidence,
    rounds: [],
    transcript: [],
    agents,
    verifier: {
      status: 'needs_review',
      confidence: 0,
      checks: [],
      issues: ['รอ verifier'],
    },
    dataSources: dataAgent.evidence,
    modelPlan,
    disclaimer: AGENT_LOOP_DISCLAIMER,
    isDemo: context.isDemo,
    updatedAt: new Date(startedAt).toISOString(),
    latencyMs: Date.now() - startedAt,
  }

  const verificationInput = toAgentLoopRunResult(baseResult)
  const verification = verifyAgentLoopRun(verificationInput)
  enforceStrictVerifier(verificationInput, verification)
  const finalVerification = applyVerification(verificationInput, verification)
  const rounds = buildRounds(seed, agents, reportAgent, finalVerification.verifier)
  const transcript = buildTranscript(rounds)

  return {
    ...baseResult,
    rounds,
    transcript,
    verifier: finalVerification.verifier,
    summary: finalVerification.summary,
    suggestedChecks: finalVerification.suggestedChecks,
    updatedAt: new Date(Date.now()).toISOString(),
    latencyMs: Date.now() - startedAt,
  }
}
